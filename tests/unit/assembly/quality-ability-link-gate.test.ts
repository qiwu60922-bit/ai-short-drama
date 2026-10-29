/**
 * V12 Quality×Ability Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateQualityAbilityLink } from '@/agents/assembly/quality-ability-link-gate';

const qualityLeap = {
  style: 'live_action' as const,
  shots: [{
    id: 'S01', scriptBeat: '表演兑现。', durationSec: 4, dramaPurpose: '可见表演',
    characterIntent: '撕开伪装',
    performance: { emotion: 'anger' as const, intensity: 5, face: '眉峰拧紧', gaze: '钉住对方', posture: '前倾' },
    camera: { shotSize: '中近景', primaryMove: '固定', moveDetail: '机位固定' },
    dialogue: null, mouthResting: '嘴唇自然闭合',
    fullPrompt: '中近景固定，眉峰拧紧，嘴部闭合。',
  }],
};
const pack = (extra: Record<string, unknown> = {}) => ({
  series: '伪人降临',
  latestEp: 20,
  abilities: [{ id: 'seer', holder: 'linyang', acquiredEp: 1, exclusive: true, rule: { cycle: 'day' as const, maxUsesPerCycle: 1, options: ['查验身份', '生存情报'] } }],
  uses: [
    { abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '查验身份' },
    { abilityId: 'seer', by: 'linyang', ep: 10, day: 10, option: '查验身份' },
  ],
  links: [
    { id: 'L1', abilityId: 'seer', ep: 1, qualityLeap },
    { id: 'L2', abilityId: 'seer', ep: 10, qualityLeap },
  ],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateQualityAbilityLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateQualityAbilityLink', () => {
  it('quality + ability → PASS', () => {
    const r = evaluateQualityAbilityLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(2);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / USE_WITHOUT_QUALITY', () => {
    expect(failCodes(evaluateQualityAbilityLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateQualityAbilityLink(pack({ links: [] })))).toContain('USE_WITHOUT_QUALITY');
  });
});
