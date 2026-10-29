/**
 * V12 Vest×Countdown×Peak Ternary — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateVestCountdownPeakBridge } from '@/agents/assembly/vest-countdown-peak-bridge-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '天幕直播',
  latestEp: 20,
  countdowns: [{ id: '直播时限', label: '天幕直播 24h', startEp: 1, deadlineEp: 10, status: 'met' as const }],
  vests: [{ id: '机长马甲', wearer: '苏见晴', vestLabel: '机长', plantEp: 1, teaseEps: [3, 5], dropEp: 10, dropLabel: '公开机长身份' }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', countdownId: '直播时限', vestId: '机长马甲', peakId: '对峙峰值', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateVestCountdownPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateVestCountdownPeakBridge', () => {
  it('vest + countdown + peak → PASS', () => {
    const r = evaluateVestCountdownPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateVestCountdownPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateVestCountdownPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
