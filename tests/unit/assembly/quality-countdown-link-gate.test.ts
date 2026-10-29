/**
 * V12 Quality×Countdown Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateQualityCountdownLink } from '@/agents/assembly/quality-countdown-link-gate';

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
  countdowns: [{ id: '直播时限', label: '终局倒计时', startEp: 1, deadlineEp: 10, status: 'open' as const }],
  links: [{ id: 'L1', countdownId: '直播时限', ep: 10, qualityLeap }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateQualityCountdownLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateQualityCountdownLink', () => {
  it('quality + countdown → PASS', () => {
    const r = evaluateQualityCountdownLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / DEADLINE_WITHOUT_QUALITY', () => {
    expect(failCodes(evaluateQualityCountdownLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateQualityCountdownLink(pack({ links: [] })))).toContain('DEADLINE_WITHOUT_QUALITY');
  });
});
