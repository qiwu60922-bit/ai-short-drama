/**
 * V12 ColdOpen×DetailHook — 冷开+细节钩双闸, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateColdOpenDetailHook } from '@/agents/assembly/cold-open-detail-hook-gate';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

describe('evaluateColdOpenDetailHook', () => {
  it('cold open + detail_cu → PASS', () => {
    const r = evaluateColdOpenDetailHook(
      spec([
        { durSec: 2, beatRole: 'hook', action: '细节冷开', hookKind: 'detail_cu' },
        { durSec: 4, beatRole: 'increment', action: '追问' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.detailHookCount).toBeGreaterThanOrEqual(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('missing detail_cu → FAIL', () => {
    const r = evaluateColdOpenDetailHook(
      spec([
        { durSec: 2, beatRole: 'hook', action: '冷开', hookKind: 'situation' },
        { durSec: 4, beatRole: 'increment', action: '追问' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
      ]),
    );
    expect(r.verdict).toBe('FAIL');
    expect(r.findings.some((f) => f.code === 'DETAIL_HOOK_MISSING')).toBe(true);
  });
});
