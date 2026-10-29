/**
 * V12 Quality×Payoff Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateQualityPayoffLink } from '@/agents/assembly/quality-payoff-link-gate';

const qualityLeap = {
  style: 'live_action' as const,
  shots: [{
    id: 'S01', scriptBeat: '表演兑现。', durationSec: 4, dramaPurpose: '可见表演',
    characterIntent: '撕开伪装',
    performance: { emotion: 'anger', intensity: 5, face: '眉峰拧紧', gaze: '钉住对方', posture: '前倾' },
    camera: { shotSize: '中近景', primaryMove: '固定', moveDetail: '机位固定' },
    dialogue: null, mouthResting: '嘴唇自然闭合',
    fullPrompt: '中近景固定，眉峰拧紧，嘴部闭合。',
  }],
};
const pack = (extra: Record<string, unknown> = {}) => ({
  series: '峰值兑现',
  latestEp: 20,
  peaks: [{ id: 'peak-b150', openEp: 1, peakEp: 9, peakLabel: '对峙升温', payoffEp: 10 }],
  links: [{ id: 'L1', peakId: 'peak-b150', ep: 10, qualityLeap }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateQualityPayoffLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateQualityPayoffLink', () => {
  it('quality + payoff → PASS', () => {
    const r = evaluateQualityPayoffLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PAYOFF_WITHOUT_QUALITY', () => {
    expect(failCodes(evaluateQualityPayoffLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateQualityPayoffLink(pack({ links: [] })))).toContain('PAYOFF_WITHOUT_QUALITY');
  });
});
