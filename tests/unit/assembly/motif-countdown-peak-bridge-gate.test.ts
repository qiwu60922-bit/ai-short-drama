/**
 * V12 Motif×Countdown×Peak Ternary — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMotifCountdownPeakBridge } from '@/agents/assembly/motif-countdown-peak-bridge-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '天幕直播',
  latestEp: 20,
  motifs: [{ id: 'white-rose', label: '白玫瑰', kind: 'prop' as const }],
  appearances: [
    { motifId: 'white-rose', ep: 1, role: 'seed' as const, visualState: '含苞' },
    { motifId: 'white-rose', ep: 5, role: 'echo' as const, visualState: '半开' },
    { motifId: 'white-rose', ep: 10, role: 'payoff' as const, visualState: '盛放' },
  ],
  countdowns: [{ id: '直播时限', label: '天幕直播 24h', startEp: 1, deadlineEp: 10, status: 'met' as const }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', motifId: 'white-rose', countdownId: '直播时限', peakId: '对峙峰值', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateMotifCountdownPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateMotifCountdownPeakBridge', () => {
  it('motif + countdown + peak → PASS', () => {
    const r = evaluateMotifCountdownPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateMotifCountdownPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateMotifCountdownPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
