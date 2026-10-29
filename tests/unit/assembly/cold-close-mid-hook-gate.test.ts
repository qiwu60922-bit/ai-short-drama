/**
 * V12 ColdClose×MidHook — dual shot gate, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateColdCloseMidHook } from '@/agents/assembly/cold-close-mid-hook-gate';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

describe('evaluateColdCloseMidHook', () => {
  it('good shape → PASS', () => {
    const r = evaluateColdCloseMidHook(
      spec([
        { durSec: 2, beatRole: 'hook', action: '开场钩', hookKind: 'situation' },
        { durSec: 3, beatRole: 'setup', action: '铺垫' },
        { durSec: 3, beatRole: 'hook', action: '中段钩', hookKind: 'situation' },
        { durSec: 4, beatRole: 'increment', action: '加压' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 1.5, beatRole: 'cliffhanger', action: '悬念' },
      ]),
      { coldTailSec: 2, midHookByRatio: 0.55 },
    );
    expect(r.verdict).toBe('PASS');
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('no mid hook / soft tail → FAIL', () => {
    const r = evaluateColdCloseMidHook(
      spec([
        { durSec: 2, beatRole: 'hook', action: '开场钩', hookKind: 'situation' },
        { durSec: 6, beatRole: 'setup', action: '铺垫' },
        { durSec: 6, beatRole: 'increment', action: '加压' },
        { durSec: 4, beatRole: 'setup', action: '尾铺' },
      ]),
      { coldTailSec: 2, midHookByRatio: 0.45 },
    );
    expect(r.verdict).toBe('FAIL');
  });
});
