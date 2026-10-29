/**
 * V12 Countdown×Quality×Peak Ternary — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateCountdownQualityPeakBridge } from '@/agents/assembly/countdown-quality-peak-bridge-gate';

const qualityLeap = {
  style: 'live_action',
  shots: [{
    id: 'S01', scriptBeat: '对峙兑现。', durationSec: 4,
    dramaPurpose: '揭穿可见表演', characterIntent: '撕开伪装',
    performance: { emotion: 'anger', intensity: 5, face: '眉峰拧紧', gaze: '钉住对方', posture: '前倾' },
    camera: { shotSize: '中近景', primaryMove: '固定', moveDetail: '机位固定' },
    dialogue: null, mouthResting: '嘴唇自然闭合',
    fullPrompt: '中近景固定，眉峰拧紧，嘴部闭合。',
  }],
} as const;

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '天幕直播',
  latestEp: 20,
  countdowns: [{ id: '终局', label: '终局倒计时', startEp: 1, deadlineEp: 10, status: 'open' as const }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', countdownId: '终局', peakId: '对峙峰值', ep: 10, qualityLeap }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateCountdownQualityPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateCountdownQualityPeakBridge', () => {
  it('countdown + peak + quality @deadline → PASS', () => {
    const r = evaluateCountdownQualityPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateCountdownQualityPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateCountdownQualityPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
