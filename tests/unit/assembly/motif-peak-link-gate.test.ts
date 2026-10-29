/**
 * V12 Motif×Peak Link — 母题×巅峰, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMotifPeakLink } from '@/agents/assembly/motif-peak-link-gate';

const motif = { id: 'white-rose', label: '白玫瑰', kind: 'prop' as const };
const appearances = [
  { motifId: 'white-rose', ep: 1, role: 'seed' as const, visualState: '含苞' },
  { motifId: 'white-rose', ep: 8, role: 'echo' as const, visualState: '半开' },
  { motifId: 'white-rose', ep: 20, role: 'payoff' as const, visualState: '盛放' },
];
const peak = {
  id: '订婚宴嫌弃',
  openEp: 1,
  peakEp: 8,
  peakLabel: '订婚宴嫌弃峰值',
  payoffEp: 8,
};
const pack = (extra: Record<string, unknown> = {}) => ({
  series: '盛夏芬德拉',
  latestEp: 20,
  motifs: [motif],
  appearances,
  peaks: [peak],
  links: [{ id: 'L1', motifId: 'white-rose', peakId: '订婚宴嫌弃' }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateMotifPeakLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateMotifPeakLink', () => {
  it('appearance at peakEp → PASS', () => {
    const r = evaluateMotifPeakLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / NO_MOTIF_AT_PEAK / PEAK_WITHOUT_MOTIF', () => {
    expect(failCodes(evaluateMotifPeakLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateMotifPeakLink(
          pack({ appearances: appearances.filter((a) => a.ep !== 8) }),
        ),
      ),
    ).toContain('NO_MOTIF_AT_PEAK');
    expect(failCodes(evaluateMotifPeakLink(pack({ links: [] })))).toContain('PEAK_WITHOUT_MOTIF');
  });
});
