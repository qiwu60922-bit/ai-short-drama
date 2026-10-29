/**
 * V12 Motif×Quality×Rhythm Ternary — 母题×表演×节奏, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMotifQualityRhythmBridge } from '@/agents/assembly/motif-quality-rhythm-bridge-gate';

const motif = { id: 'white-rose', label: '白玫瑰', kind: 'prop' as const };
const appearances = [
  { motifId: 'white-rose', ep: 1, role: 'seed' as const, visualState: '含苞' },
  { motifId: 'white-rose', ep: 8, role: 'echo' as const, visualState: '半开' },
  { motifId: 'white-rose', ep: 20, role: 'payoff' as const, visualState: '盛放' },
];

const qualityLeap = {
  style: 'live_action' as const,
  shots: [
              {
                id: 'S01',
                scriptBeat: '表演兑现。',
                durationSec: 4,
                dramaPurpose: '可见表演',
                characterIntent: '撕开伪装',
                performance: {
                  emotion: 'anger',
                  intensity: 5,
                  face: '眉峰拧紧',
                  gaze: '钉住对方',
                  posture: '前倾',
                },
                camera: { shotSize: '中近景', primaryMove: '固定', moveDetail: '机位固定' },
                dialogue: null,
                mouthResting: '嘴唇自然闭合',
                fullPrompt: '中近景固定，眉峰拧紧，嘴部闭合。',
              },
              {
                id: 'S02',
                scriptBeat: '表演兑现。',
                durationSec: 4,
                dramaPurpose: '可见表演',
                characterIntent: '撕开伪装',
                performance: {
                  emotion: 'anger',
                  intensity: 5,
                  face: '眉峰拧紧',
                  gaze: '钉住对方',
                  posture: '前倾',
                },
                camera: { shotSize: '中近景', primaryMove: '固定', moveDetail: '机位固定' },
                dialogue: null,
                mouthResting: '嘴唇自然闭合',
                fullPrompt: '中近景固定，眉峰拧紧，嘴部闭合。',
              },
              {
                id: 'S03',
                scriptBeat: '表演兑现。',
                durationSec: 4,
                dramaPurpose: '可见表演',
                characterIntent: '撕开伪装',
                performance: {
                  emotion: 'doubt',
                  intensity: 2,
                  face: '眉峰拧紧',
                  gaze: '钉住对方',
                  posture: '前倾',
                },
                camera: { shotSize: '中近景', primaryMove: '固定', moveDetail: '机位固定' },
                dialogue: null,
                mouthResting: '嘴唇自然闭合',
                fullPrompt: '中近景固定，眉峰拧紧，嘴部闭合。',
              },
            ],
};

const shotSpec = {
  episode: 'EP08',
  shots: Array.from({ length: 18 }, (_, i) => ({ shotId: `EP08-S${i}`, cast: [] as string[], durSec: 2, action: 'x·y' })),
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '盛夏芬德拉',
  latestEp: 20,
  profile: 'dense' as const,
  motifs: [motif],
  appearances,
  links: [
    {
      id: 'L1',
      motifId: 'white-rose',
      ep: 8,
      qualityLeap,
      shotSpec,
      profile: 'dense' as const,
    },
  ],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateMotifQualityRhythmBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateMotifQualityRhythmBridge', () => {
  it('motif@ep + quality PASS + rhythm PASS → PASS', () => {
    const r = evaluateMotifQualityRhythmBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / UNKNOWN / NO_MOTIF_AT_EP', () => {
    expect(failCodes(evaluateMotifQualityRhythmBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateMotifQualityRhythmBridge(
          pack({
            links: [
              {
                id: 'L1',
                motifId: 'ghost',
                ep: 8,
                qualityLeap,
                shotSpec,
              },
            ],
          }),
        ),
      ),
    ).toContain('UNKNOWN_MOTIF');
    expect(
      failCodes(
        evaluateMotifQualityRhythmBridge(
          pack({
            links: [
              {
                id: 'L1',
                motifId: 'white-rose',
                ep: 3,
                qualityLeap,
                shotSpec,
              },
            ],
          }),
        ),
      ),
    ).toContain('NO_MOTIF_AT_EP');
  });
});
