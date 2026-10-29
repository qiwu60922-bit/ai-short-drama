/**
 * V12 Cliff-Tail Tight — 悬念尾窗紧闸, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateCliffTailTight } from '@/agents/assembly/cliff-tail-tight-gate';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

const tight = (): S[] => [
  { durSec: 2, beatRole: 'hook', action: '危机', hookKind: 'situation' },
  { durSec: 4, beatRole: 'increment', action: '增量' },
  { durSec: 4, beatRole: 'reversal', action: '反转' },
  { durSec: 4, beatRole: 'cliffhanger', action: '悬念收尾' },
];

const failCodes = (r: ReturnType<typeof evaluateCliffTailTight>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateCliffTailTight', () => {
  it('cliff within 1.5s of end → PASS', () => {
    const r = evaluateCliffTailTight(spec(tight()), { hardTailToleranceSec: 1.5 });
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.hardTailToleranceSec).toBe(1.5);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('cliff ends early → CLIFF_TAIL_TIGHT FAIL', () => {
    expect(
      failCodes(
        evaluateCliffTailTight(
          spec([
            { durSec: 2, beatRole: 'hook', action: '危机' },
            { durSec: 4, beatRole: 'increment', action: '增量' },
            { durSec: 4, beatRole: 'reversal', action: '反转' },
            { durSec: 2, beatRole: 'cliffhanger', action: '悬念过早' },
            { durSec: 6, beatRole: 'setup', action: '尾部铺垫稀释' },
          ]),
          { hardTailToleranceSec: 1.5 },
        ),
      ),
    ).toContain('CLIFF_TAIL_TIGHT');
  });
});
