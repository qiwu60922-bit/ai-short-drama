/**
 * V12 Alliance×Foreshadow×Peak Ternary — 同盟×伏笔×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAllianceForeshadowPeakBridge } from '@/agents/assembly/alliance-foreshadow-peak-bridge-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '伪人降临',
  latestEp: 20,
  alliances: [{ id: 'oni-fang', label: '鬼牙同盟', members: ['chen-haoyu', 'guild'] }],
  events: [
    { allianceId: 'oni-fang', ep: 1, role: 'seed' as const, note: '收留' },
    { allianceId: 'oni-fang', ep: 5, role: 'echo' as const, note: '并肩' },
    { allianceId: 'oni-fang', ep: 10, role: 'payoff' as const, note: '护短揭穿' },
  ],
  items: [{
    id: '机长身份',
    name: '机长马甲伏笔',
    priority: 'S' as const,
    plantEp: 1,
    status: 'closed' as const,
    payoffEp: 10,
    lastAdvancedEp: 5,
  }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', allianceId: 'oni-fang', foreshadowId: '机长身份', peakId: '对峙峰值', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateAllianceForeshadowPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAllianceForeshadowPeakBridge', () => {
  it('payoff + foreshadow + peak @ep → PASS', () => {
    const r = evaluateAllianceForeshadowPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_TERNARY / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateAllianceForeshadowPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateAllianceForeshadowPeakBridge(
          pack({
            links: [{ id: 'L1', allianceId: 'oni-fang', foreshadowId: '机长身份', peakId: '对峙峰值', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_TERNARY');
    expect(failCodes(evaluateAllianceForeshadowPeakBridge(pack({ links: [] })))).toContain(
      'PEAK_WITHOUT_BRIDGE',
    );
  });
});
