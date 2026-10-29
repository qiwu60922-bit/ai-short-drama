/**
 * V12 Conflict×Peak Link — 冲突×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateConflictPeakLink } from '@/agents/assembly/conflict-peak-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '帐中香',
  latestEp: 20,
  conflicts: [{ id: '挑衅反噬', name: '配角挑衅', openEp: 9, payoffEp: 10 }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', conflictId: '挑衅反噬', peakId: '对峙峰值', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateConflictPeakLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateConflictPeakLink', () => {
  it('payoff = peak → PASS', () => {
    const r = evaluateConflictPeakLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_PAYOFF_PEAK / PAYOFF_WITHOUT_PEAK', () => {
    expect(failCodes(evaluateConflictPeakLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateConflictPeakLink(
          pack({
            links: [{ id: 'L1', conflictId: '挑衅反噬', peakId: '对峙峰值', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_PAYOFF_PEAK');
    expect(failCodes(evaluateConflictPeakLink(pack({ links: [] })))).toContain('PAYOFF_WITHOUT_PEAK');
  });
});
