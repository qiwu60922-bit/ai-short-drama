/**
 * V12 Quality×Handoff×Rhythm Ternary — 表演×承接×节奏, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateQualityHandoffRhythmBridge } from '@/agents/assembly/quality-handoff-rhythm-bridge-gate';

type S = { durSec: number; beatRole?: string; action?: string };
const spec = (episode: string, shots: S[]) => ({
  episode,
  shots: shots.map((s, i) => ({ shotId: `${episode}-S${i}`, cast: [], ...s })),
});
const prevGood = (): S[] => [
  { durSec: 4, beatRole: 'hook', action: '危机开场' },
  { durSec: 8, beatRole: 'increment', action: '追查线索' },
  { durSec: 8, beatRole: 'reversal', action: '身份暴露' },
  { durSec: 10, beatRole: 'cliffhanger', action: '持械闯入皇城大门被围' },
];
const nextGood = (): S[] => [
  { durSec: 2, beatRole: 'hook', action: '皇城门口持械对峙未解' },
  { durSec: 2, beatRole: 'increment', action: '追兵逼近' },
  { durSec: 10, beatRole: 'reversal', action: '旧友现身' },
  { durSec: 8, beatRole: 'cliffhanger', action: '下一场更大危机' },
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
      performance: { emotion: 'anger', intensity: 5, face: '眉峰拧紧', gaze: '钉住对方', posture: '前倾' },
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
      performance: { emotion: 'anger', intensity: 5, face: '眉峰拧紧', gaze: '钉住对方', posture: '前倾' },
      camera: { shotSize: '中近景', primaryMove: '固定', moveDetail: '机位固定' },
      dialogue: null,
      mouthResting: '嘴唇自然闭合',
      fullPrompt: '中近景固定，眉峰拧紧，嘴部闭合。',
    },
  ],
};
const denseSpec = (ep: string) => ({
  episode: ep,
  shots: Array.from({ length: 20 }, (_, i) => ({
    shotId: `${ep}-S${i}`,
    cast: [],
    durSec: 2,
    action: 'x·y',
  })),
});

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '持械入宋',
  latestEp: 20,
  profile: 'dense' as const,
  handoffs: [{
    id: 'H8-9',
    prevEp: 8,
    nextEp: 9,
    prev: spec('EP08', prevGood()),
    next: spec('EP09', nextGood()),
  }],
  links: [{
    id: 'L1',
    handoffId: 'H8-9',
    ep: 9,
    qualityLeap,
    shotSpec: denseSpec('EP09'),
    profile: 'dense' as const,
  }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateQualityHandoffRhythmBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateQualityHandoffRhythmBridge', () => {
  it('quality + handoff@next + dense rhythm → PASS', () => {
    const r = evaluateQualityHandoffRhythmBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / HANDOFF_NOT_AT_EP', () => {
    expect(failCodes(evaluateQualityHandoffRhythmBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateQualityHandoffRhythmBridge(
          pack({
            links: [{
              id: 'L1',
              handoffId: 'H8-9',
              ep: 8,
              qualityLeap,
              shotSpec: denseSpec('EP08'),
            }],
          }),
        ),
      ),
    ).toContain('HANDOFF_NOT_AT_EP');
  });
});
