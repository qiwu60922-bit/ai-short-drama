/**
 * V12 CliffTail×DialogueBan — 尾窗紧+禁对白双闸, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateCliffTailDialogueBan } from '@/agents/assembly/cliff-tail-dialogue-ban-gate';

type S = {
  durSec: number;
  beatRole?: string;
  action?: string;
  dialogue?: string | null;
};
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

describe('evaluateCliffTailDialogueBan', () => {
  it('tight cliff + no pre-cliff dialogue → PASS', () => {
    const r = evaluateCliffTailDialogueBan(
      spec([
        { durSec: 2, beatRole: 'hook', action: '开场' },
        { durSec: 4, beatRole: 'increment', action: '追问' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 3, beatRole: 'reaction', action: '脸色煞白' },
        { durSec: 1, beatRole: 'cliffhanger', action: '门外脚步' },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('dialogue before cliff → FAIL', () => {
    const r = evaluateCliffTailDialogueBan(
      spec([
        { durSec: 2, beatRole: 'hook', action: '开场' },
        { durSec: 4, beatRole: 'increment', action: '追问' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 3, beatRole: 'reaction', action: '解释', dialogue: '不是这样的' },
        { durSec: 1, beatRole: 'cliffhanger', action: '门外脚步' },
      ]),
    );
    expect(r.verdict).toBe('FAIL');
    expect(r.findings.some((f) => f.code === 'DIALOGUE_BEFORE_CLIFF')).toBe(true);
  });
});
