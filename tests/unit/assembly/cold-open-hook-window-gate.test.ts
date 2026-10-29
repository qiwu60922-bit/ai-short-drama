/**
 * V12 ColdOpen×HookWindowHard — 冷开+硬钩窗双闸, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateColdOpenHookWindow } from '@/agents/assembly/cold-open-hook-window-gate';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

describe('evaluateColdOpenHookWindow', () => {
  it('cold open within hard window → PASS', () => {
    const r = evaluateColdOpenHookWindow(
      spec([
        { durSec: 2, beatRole: 'hook', action: '危机冷开', hookKind: 'situation' },
        { durSec: 4, beatRole: 'increment', action: '追问' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.hardHookWindowSec).toBe(2);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('late hook → FAIL', () => {
    const r = evaluateColdOpenHookWindow(
      spec([
        { durSec: 4, beatRole: 'setup', action: '铺垫' },
        { durSec: 4, beatRole: 'hook', action: '晚钩', hookKind: 'situation' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
      ]),
    );
    expect(r.verdict).toBe('FAIL');
  });
});
