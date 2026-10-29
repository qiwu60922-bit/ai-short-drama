/**
 * V12 Amnesia×Countdown×Peak Ternary — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAmnesiaCountdownPeakBridge } from '@/agents/assembly/amnesia-countdown-peak-bridge-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '天幕直播',
  latestEp: 20,
  amnesias: [{ id: '祁南失忆', actor: '祁南', plantEp: 1, plantCause: '爆炸', companionEps: [2, 4, 6], recoverEp: 10, recoverLabel: '摩天轮唤回', recoverTrigger: '圣诞摩天轮' }],
  countdowns: [{ id: '直播时限', label: '天幕直播 24h', startEp: 1, deadlineEp: 10, status: 'met' as const }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', amnesiaId: '祁南失忆', countdownId: '直播时限', peakId: '对峙峰值', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateAmnesiaCountdownPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAmnesiaCountdownPeakBridge', () => {
  it('amnesia + countdown + peak → PASS', () => {
    const r = evaluateAmnesiaCountdownPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateAmnesiaCountdownPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateAmnesiaCountdownPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
