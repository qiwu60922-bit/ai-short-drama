/**
 * V12 Dialogue-After-Hook — 钩后对白闸, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateDialogueAfterHook } from '@/agents/assembly/dialogue-after-hook-gate';

type S = {
  durSec: number;
  beatRole?: string;
  action?: string;
  dialogue?: string;
  hookKind?: string;
};
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

const good = (): S[] => [
  { durSec: 2, beatRole: 'hook', action: '黑羽使徒破窗闯入', hookKind: 'situation' },
  {
    durSec: 4,
    beatRole: 'increment',
    action: '剑尖指向齐耶，齐耶抬腕格开',
    dialogue: '你归我带',
  },
  {
    durSec: 5,
    beatRole: 'reversal',
    action: '齐耶抬腕，刻印亮起，反手格开一剑',
    dialogue: '怎么会在你身上？',
  },
  { durSec: 4, beatRole: 'cliffhanger', action: '门外脚步未解' },
];

const failCodes = (r: ReturnType<typeof evaluateDialogueAfterHook>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateDialogueAfterHook', () => {
  it('dialogue after hook with action → PASS', () => {
    const r = evaluateDialogueAfterHook(spec(good()));
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.dialogueBeforeHookShots).toBe(0);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('dialogue before first hook → DIALOGUE_BEFORE_HOOK FAIL', () => {
    expect(
      failCodes(
        evaluateDialogueAfterHook(
          spec([
            { durSec: 3, beatRole: 'setup', dialogue: '我们明天再谈离婚的事吧你听我说完' },
            { durSec: 2, beatRole: 'hook', action: '危机开场' },
            { durSec: 4, beatRole: 'increment', action: '追问对峙甩账本' },
            { durSec: 4, beatRole: 'reversal', action: '反转证据' },
            { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
          ]),
        ),
      ),
    ).toContain('DIALOGUE_BEFORE_HOOK');
  });

  it('dialogue-only plot after hook → DIALOGUE_ONLY_PLOT FAIL', () => {
    expect(
      failCodes(
        evaluateDialogueAfterHook(
          spec([
            { durSec: 2, beatRole: 'hook', action: '危机' },
            {
              durSec: 5,
              beatRole: 'increment',
              dialogue: '然后她穿越时空救下了女主，一切都变了',
            },
            { durSec: 4, beatRole: 'reversal', action: '反转动作完整可见' },
            { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
          ]),
        ),
      ),
    ).toContain('DIALOGUE_ONLY_PLOT');
  });
});
