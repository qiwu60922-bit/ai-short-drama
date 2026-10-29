/**
 * V12 Foreshadow×Countdown×Peak Ternary — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateForeshadowCountdownPeakBridge } from '@/agents/assembly/foreshadow-countdown-peak-bridge-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '天幕直播',
  latestEp: 20,
  items: [{ id: 'FS1', name: '预言家真伪', priority: 'S', plantEp: 1, status: 'closed', payoffEp: 10, lastAdvancedEp: 4 }],
  countdowns: [{ id: '直播时限', label: '终局倒计时', startEp: 1, deadlineEp: 10, status: 'open' as const }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', foreshadowId: 'FS1', countdownId: '直播时限', peakId: '对峙峰值', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateForeshadowCountdownPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateForeshadowCountdownPeakBridge', () => {
  it('foreshadow + countdown + peak → PASS', () => {
    const r = evaluateForeshadowCountdownPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateForeshadowCountdownPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateForeshadowCountdownPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
