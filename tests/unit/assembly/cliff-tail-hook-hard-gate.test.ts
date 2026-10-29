/**
 * V12 CliffTail×HookWindowHard — 紧尾+硬钩窗双闸, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateCliffTailHookHard } from '@/agents/assembly/cliff-tail-hook-hard-gate';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

describe('evaluateCliffTailHookHard', () => {
  it('hard hook + tight cliff → PASS', () => {
    const r = evaluateCliffTailHookHard(
      spec([
        { durSec: 2, beatRole: 'hook', action: '危机', hookKind: 'situation' },
        { durSec: 4, beatRole: 'increment', action: '追问' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 1.5, beatRole: 'cliffhanger', action: '悬念' },
      ]),
      { hardHookWindowSec: 2, hardTailToleranceSec: 1.5 },
    );
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.hardHookWindowSec).toBe(2);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('late hook → FAIL', () => {
    const r = evaluateCliffTailHookHard(
      spec([
        { durSec: 4, beatRole: 'setup', action: '铺垫' },
        { durSec: 4, beatRole: 'hook', action: '晚钩', hookKind: 'situation' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 1.5, beatRole: 'cliffhanger', action: '悬念' },
      ]),
      { hardHookWindowSec: 2, hardTailToleranceSec: 1.5 },
    );
    expect(r.verdict).toBe('FAIL');
  });
});
