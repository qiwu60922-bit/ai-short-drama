/**
 * V12 MidHook×ColdClose — dual shot gate, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMidHookColdClose } from '@/agents/assembly/mid-hook-cold-close-gate';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

describe('evaluateMidHookColdClose', () => {
  it('good shape → PASS', () => {
    const r = evaluateMidHookColdClose(
      spec([
        { durSec: 2, beatRole: 'hook', action: '危机', hookKind: 'situation' },
        { durSec: 3, beatRole: 'setup', action: '铺垫' },
        { durSec: 4, beatRole: 'increment', action: '加压' },
        { durSec: 3, beatRole: 'hook', action: '中段钩', hookKind: 'situation' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 2, beatRole: 'reaction', action: '反应' },
        { durSec: 1.5, beatRole: 'cliffhanger', action: '悬念' },
      ]),
      { midHookByRatio: 0.55, coldTailSec: 2 },
    );
    expect(r.verdict).toBe('PASS');
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('no mid hook → FAIL', () => {
    const r = evaluateMidHookColdClose(
      spec([
        { durSec: 2, beatRole: 'hook', action: '危机', hookKind: 'situation' },
        { durSec: 8, beatRole: 'setup', action: '铺垫' },
        { durSec: 8, beatRole: 'increment', action: '加压' },
        { durSec: 1.5, beatRole: 'cliffhanger', action: '悬念' },
      ]),
      { midHookByRatio: 0.55, coldTailSec: 2 },
    );
    expect(r.verdict).toBe('FAIL');
  });
});
