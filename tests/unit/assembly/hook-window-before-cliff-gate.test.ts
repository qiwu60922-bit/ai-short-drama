/**
 * V12 HookWindowHard×DialogueBeforeCliffBan — 硬钩窗+悬念前禁对白, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateHookWindowBeforeCliff } from '@/agents/assembly/hook-window-before-cliff-gate';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string; dialogue?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

describe('evaluateHookWindowBeforeCliff', () => {
  it('hard hook + clean cliff → PASS', () => {
    const r = evaluateHookWindowBeforeCliff(
      spec([
        { durSec: 2, beatRole: 'hook', action: '危机', hookKind: 'situation' },
        { durSec: 4, beatRole: 'increment', action: '追问' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 3, beatRole: 'reaction', action: '脸色煞白' },
        { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
      ]),
      { hardHookWindowSec: 2 },
    );
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.hardHookWindowSec).toBe(2);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('late hook → FAIL', () => {
    const r = evaluateHookWindowBeforeCliff(
      spec([
        { durSec: 4, beatRole: 'setup', action: '铺垫' },
        { durSec: 4, beatRole: 'hook', action: '晚钩', hookKind: 'situation' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
      ]),
      { hardHookWindowSec: 2 },
    );
    expect(r.verdict).toBe('FAIL');
  });
});
