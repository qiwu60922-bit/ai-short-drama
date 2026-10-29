/**
 * V12 Alliance×Peak Link — 同盟 payoff × 巅峰, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAlliancePeakLink } from '@/agents/assembly/alliance-peak-link-gate';

const alliance = { id: 'oni-fang', label: '鬼牙同盟', members: ['chen-haoyu', 'guild'] };
const events = [
  { allianceId: 'oni-fang', ep: 1, role: 'seed' as const, note: '收留' },
  { allianceId: 'oni-fang', ep: 5, role: 'echo' as const, note: '并肩' },
  { allianceId: 'oni-fang', ep: 8, role: 'payoff' as const, note: '当众护短' },
];
const peak = {
  id: '护短对峙',
  openEp: 1,
  peakEp: 8,
  peakLabel: '当众护短峰值',
  payoffEp: 8,
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '觉醒伪神',
  latestEp: 20,
  alliances: [alliance],
  events,
  peaks: [peak],
  links: [{ id: 'L1', allianceId: 'oni-fang', peakId: '护短对峙' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateAlliancePeakLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAlliancePeakLink', () => {
  it('payoff at peak → PASS', () => {
    const r = evaluateAlliancePeakLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / PAYOFF_NOT_AT_PEAK / PEAK_WITHOUT_ALLIANCE', () => {
    expect(failCodes(evaluateAlliancePeakLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateAlliancePeakLink(
          pack({
            events: [
              { allianceId: 'oni-fang', ep: 1, role: 'seed' as const },
              { allianceId: 'oni-fang', ep: 3, role: 'payoff' as const },
            ],
          }),
        ),
      ),
    ).toContain('PAYOFF_NOT_AT_PEAK');
    expect(failCodes(evaluateAlliancePeakLink(pack({ links: [] })))).toContain(
      'PEAK_WITHOUT_ALLIANCE',
    );
  });
});
