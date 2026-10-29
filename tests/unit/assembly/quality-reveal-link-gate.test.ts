/**
 * V12 Quality×Reveal Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateQualityRevealLink } from '@/agents/assembly/quality-reveal-link-gate';

const qualityLeap = {
  style: 'live_action' as const,
  shots: [{
    id: 'S01', scriptBeat: '对峙兑现。', durationSec: 4, dramaPurpose: '揭穿可见表演',
    characterIntent: '撕开伪装',
    performance: { emotion: 'anger', intensity: 5, face: '眉峰拧紧', gaze: '钉住对方', posture: '前倾' },
    camera: { shotSize: '中近景', primaryMove: '固定', moveDetail: '机位固定' },
    dialogue: null, mouthResting: '嘴唇自然闭合',
    fullPrompt: '中近景固定，眉峰拧紧，嘴部闭合。',
  }],
};
const pack = (extra: Record<string, unknown> = {}) => ({
  series: '面具崩塌',
  latestEp: 20,
  reveals: [{
    id: 'mask-b148',
    wearer: '苏见晴',
    plantEp: 1,
    maintainEps: [3, 5],
    revealEp: 10,
    revealLabel: '当场抓包',
  }],
  links: [{ id: 'L1', revealId: 'mask-b148', ep: 10, qualityLeap }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateQualityRevealLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateQualityRevealLink', () => {
  it('quality + reveal → PASS', () => {
    const r = evaluateQualityRevealLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / REVEAL_WITHOUT_QUALITY', () => {
    expect(failCodes(evaluateQualityRevealLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateQualityRevealLink(pack({ links: [] })))).toContain('REVEAL_WITHOUT_QUALITY');
  });
});
