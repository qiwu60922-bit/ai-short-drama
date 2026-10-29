/**
 * V12 Countdown×Bond×Peak Ternary — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateCountdownBondPeakBridge } from '@/agents/assembly/countdown-bond-peak-bridge-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '盛夏芬德拉',
  latestEp: 20,
  countdowns: [{ id: 'CD1', label: '终局倒计时', startEp: 1, deadlineEp: 10, status: 'open' }],
  bonds: [{
    id: 'B1', partyA: '苏见晴', partyB: '傅司宴', contractEp: 1, contractLabel: '契约联姻',
    companionEps: [2, 3, 5], upgradeEp: 10, upgradeLabel: '真心升级',
  }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', countdownId: 'CD1', bondId: 'B1', peakId: '对峙峰值', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateCountdownBondPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateCountdownBondPeakBridge', () => {
  it('countdown + bond + peak → PASS', () => {
    const r = evaluateCountdownBondPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateCountdownBondPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateCountdownBondPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
