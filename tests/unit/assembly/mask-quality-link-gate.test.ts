/**
 * V12 Mask×Quality Link — 伪装×表演门, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMaskQualityLink } from '@/agents/assembly/mask-quality-link-gate';

const qualityLeap = {
  style: 'live_action' as const,
  shots: [{
    id: 'S01',
    scriptBeat: '表演兑现。',
    durationSec: 4,
    dramaPurpose: '可见表演',
    characterIntent: '撕开伪装',
    performance: { emotion: 'anger' as const, intensity: 5, face: '眉峰拧紧', gaze: '钉住对方', posture: '前倾' },
    camera: { shotSize: '中近景', primaryMove: '固定', moveDetail: '机位固定' },
    dialogue: null,
    mouthResting: '嘴唇自然闭合',
    fullPrompt: '中近景固定，眉峰拧紧，嘴部闭合。',
  }],
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '逃婚三年',
  latestEp: 20,
  masks: [{
    id: '花心纨绔',
    wearer: '江少',
    plantEp: 1,
    maintainEps: [2, 3],
    revealEp: 8,
    revealLabel: '真心崩塌',
  }],
  links: [{ id: 'L1', maskId: '花心纨绔', ep: 8, qualityLeap }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateMaskQualityLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateMaskQualityLink', () => {
  it('reveal + quality → PASS', () => {
    const r = evaluateMaskQualityLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / MASK_WITHOUT_QUALITY', () => {
    expect(failCodes(evaluateMaskQualityLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateMaskQualityLink(pack({ links: [] })))).toContain('MASK_WITHOUT_QUALITY');
  });
});
