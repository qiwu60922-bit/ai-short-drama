/**
 * V12 Ability×Quality×Rhythm Ternary — 金手指×表演×节奏, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAbilityQualityRhythmBridge } from '@/agents/assembly/ability-quality-rhythm-bridge-gate';

const ability = {
  id: 'seer',
  holder: 'linyang',
  acquiredEp: 1,
  exclusive: true,
  rule: { cycle: 'day' as const, maxUsesPerCycle: 1, options: ['查验身份', '生存情报'] },
};
const uses = [
  { abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '查验身份' },
  { abilityId: 'seer', by: 'linyang', ep: 2, day: 2, option: '生存情报' },
  { abilityId: 'seer', by: 'linyang', ep: 8, day: 8, option: '查验身份' },
];
const qualityLeap = {
  style: 'live_action' as const,
  shots: [
    { id: 'S01', scriptBeat: '表演兑现。', durationSec: 4, dramaPurpose: '可见表演', characterIntent: '撕开伪装',
      performance: { emotion: 'anger' as const, intensity: 5, face: '眉峰拧紧', gaze: '钉住对方', posture: '前倾' },
      camera: { shotSize: '中近景', primaryMove: '固定' as const, moveDetail: '机位固定' },
      dialogue: null, mouthResting: '嘴唇自然闭合', fullPrompt: '中近景固定，眉峰拧紧，嘴部闭合。' },
    { id: 'S02', scriptBeat: '表演兑现。', durationSec: 4, dramaPurpose: '可见表演', characterIntent: '撕开伪装',
      performance: { emotion: 'anger' as const, intensity: 5, face: '眉峰拧紧', gaze: '钉住对方', posture: '前倾' },
      camera: { shotSize: '中近景', primaryMove: '固定' as const, moveDetail: '机位固定' },
      dialogue: null, mouthResting: '嘴唇自然闭合', fullPrompt: '中近景固定，眉峰拧紧，嘴部闭合。' },
    { id: 'S03', scriptBeat: '表演兑现。', durationSec: 4, dramaPurpose: '可见表演', characterIntent: '撕开伪装',
      performance: { emotion: 'doubt' as const, intensity: 2, face: '眉峰拧紧', gaze: '钉住对方', posture: '前倾' },
      camera: { shotSize: '中近景', primaryMove: '固定' as const, moveDetail: '机位固定' },
      dialogue: null, mouthResting: '嘴唇自然闭合', fullPrompt: '中近景固定，眉峰拧紧，嘴部闭合。' },
  ],
};
const shotSpec = {
  episode: 'EP08',
  shots: Array.from({ length: 18 }, (_, i) => ({ shotId: `EP08-S${i}`, cast: [] as string[], durSec: 2, action: 'x·y' })),
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '伪人降临',
  latestEp: 20,
  profile: 'dense' as const,
  abilities: [ability],
  uses,
  links: [{ id: 'L1', abilityId: 'seer', ep: 8, qualityLeap, shotSpec, profile: 'dense' as const }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateAbilityQualityRhythmBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAbilityQualityRhythmBridge', () => {
  it('use + quality + rhythm → PASS', () => {
    const r = evaluateAbilityQualityRhythmBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / NO_USE_AT_EP / USE_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateAbilityQualityRhythmBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateAbilityQualityRhythmBridge(
          pack({ links: [{ id: 'L1', abilityId: 'seer', ep: 3, qualityLeap, shotSpec }] }),
        ),
      ),
    ).toContain('NO_USE_AT_EP');
    expect(failCodes(evaluateAbilityQualityRhythmBridge(pack({ links: [] })))).toContain(
      'USE_WITHOUT_BRIDGE',
    );
  });
});
