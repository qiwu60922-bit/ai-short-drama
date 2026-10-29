/**
 * V12 Conflict×Alliance×Peak Ternary — 冲突×同盟×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateConflictAlliancePeakBridge } from '@/agents/assembly/conflict-alliance-peak-bridge-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '帐中香',
  latestEp: 20,
  conflicts: [{ id: '挑衅反噬', name: '配角挑衅', openEp: 9, payoffEp: 10 }],
  alliances: [{ id: 'oni-fang', label: '鬼牙同盟', members: ['chen-haoyu', 'guild'] }],
  events: [
    { allianceId: 'oni-fang', ep: 1, role: 'seed' as const, note: '收留' },
    { allianceId: 'oni-fang', ep: 5, role: 'echo' as const, note: '并肩' },
    { allianceId: 'oni-fang', ep: 10, role: 'payoff' as const, note: '护短' },
  ],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', conflictId: '挑衅反噬', allianceId: 'oni-fang', peakId: '对峙峰值', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateConflictAlliancePeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateConflictAlliancePeakBridge', () => {
  it('payoff + alliance + peak @ep → PASS', () => {
    const r = evaluateConflictAlliancePeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_TERNARY / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateConflictAlliancePeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateConflictAlliancePeakBridge(
          pack({
            links: [{ id: 'L1', conflictId: '挑衅反噬', allianceId: 'oni-fang', peakId: '对峙峰值', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_TERNARY');
    expect(failCodes(evaluateConflictAlliancePeakBridge(pack({ links: [] })))).toContain(
      'PEAK_WITHOUT_BRIDGE',
    );
  });
});
