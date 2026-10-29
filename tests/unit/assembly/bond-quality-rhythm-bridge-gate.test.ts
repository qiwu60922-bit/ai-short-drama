/**
 * V12 Bond×Quality×Rhythm Ternary — 契约×表演×节奏, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateBondQualityRhythmBridge } from '@/agents/assembly/bond-quality-rhythm-bridge-gate';

const bond = {
  id: '江少契约',
  partyA: '江少',
  partyB: '女主',
  contractEp: 1,
  contractLabel: '假面联姻',
  companionEps: [2, 3, 5],
  upgradeEp: 8,
  upgradeLabel: '真心崩塌后真情',
};

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
  series: '逃婚三年',
  latestEp: 20,
  profile: 'dense' as const,
  bonds: [bond],
  links: [{ id: 'L1', bondId: '江少契约', ep: 8, qualityLeap, shotSpec, profile: 'dense' as const }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateBondQualityRhythmBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateBondQualityRhythmBridge', () => {
  it('terminal + quality + rhythm → PASS', () => {
    const r = evaluateBondQualityRhythmBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_TERMINAL / TERMINAL_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateBondQualityRhythmBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateBondQualityRhythmBridge(
          pack({ links: [{ id: 'L1', bondId: '江少契约', ep: 3, qualityLeap, shotSpec }] }),
        ),
      ),
    ).toContain('EP_NOT_TERMINAL');
    expect(failCodes(evaluateBondQualityRhythmBridge(pack({ links: [] })))).toContain(
      'TERMINAL_WITHOUT_BRIDGE',
    );
  });
});
