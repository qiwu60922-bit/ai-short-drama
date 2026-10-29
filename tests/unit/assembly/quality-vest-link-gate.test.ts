/**
 * V12 Quality×Vest Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateQualityVestLink } from '@/agents/assembly/quality-vest-link-gate';

const vest = {
  id: '机长马甲',
  wearer: '苏见晴',
  vestLabel: '机长',
  plantEp: 1,
  teaseEps: [3, 5],
  dropEp: 8,
  dropLabel: '公开机长身份反击',
  peakEp: 8,
  peakLabel: '对峙峰值',
};
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
  series: '机长马甲',
  latestEp: 20,
  vests: [vest],
  links: [{ id: 'L1', vestId: '机长马甲', ep: 8, qualityLeap }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateQualityVestLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateQualityVestLink', () => {
  it('quality + vest → PASS', () => {
    const r = evaluateQualityVestLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / DROP_WITHOUT_QUALITY', () => {
    expect(failCodes(evaluateQualityVestLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateQualityVestLink(pack({ links: [] })))).toContain('DROP_WITHOUT_QUALITY');
  });
});
