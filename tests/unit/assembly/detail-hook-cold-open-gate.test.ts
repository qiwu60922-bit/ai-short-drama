/**
 * V12 evaluateDetailHookColdOpen — dual shot gate (invert coldOpen*), offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateDetailHookColdOpen } from '@/agents/assembly/detail-hook-cold-open-gate';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});
const good = () => [
  { durSec: 2, beatRole: 'hook', action: '特写钩', hookKind: 'detail_cu' },
  { durSec: 3, beatRole: 'setup', action: '铺垫' },
  { durSec: 3, beatRole: 'hook', action: '中段钩', hookKind: 'situation' },
  { durSec: 4, beatRole: 'increment', action: '加压' },
  { durSec: 4, beatRole: 'reversal', action: '反转' },
  { durSec: 2, beatRole: 'reaction', action: '反应' },
  { durSec: 1.5, beatRole: 'cliffhanger', action: '悬念' },
];

describe('evaluateDetailHookColdOpen', () => {
  it('good shape → PASS', () => {
    const r = evaluateDetailHookColdOpen(spec(good()), { requireDetailCu: true });
    expect(r.verdict).toBe('PASS');
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('no detail / late cold → FAIL', () => {
    const r = evaluateDetailHookColdOpen(
      spec([
        { durSec: 8, beatRole: 'setup', action: '铺垫' },
        { durSec: 8, beatRole: 'increment', action: '加压' },
        { durSec: 8, beatRole: 'reversal', action: '反转' },
        { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
      ]),
      { requireDetailCu: true },
    );
    expect(r.verdict).toBe('FAIL');
  });
});
