/**
 * V12 Quality×Peak Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateQualityPeakLink } from '@/agents/assembly/quality-peak-link-gate';

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
  series: '对峙峰值',
  latestEp: 20,
  peaks: [{ id: 'peak-b149', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', peakId: 'peak-b149', ep: 10, qualityLeap }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateQualityPeakLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateQualityPeakLink', () => {
  it('quality + peak → PASS', () => {
    const r = evaluateQualityPeakLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_QUALITY', () => {
    expect(failCodes(evaluateQualityPeakLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateQualityPeakLink(pack({ links: [] })))).toContain('PEAK_WITHOUT_QUALITY');
  });
});
