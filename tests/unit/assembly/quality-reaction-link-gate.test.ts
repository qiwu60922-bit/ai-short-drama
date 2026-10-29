/**
 * V12 QualityLeap×ReactionBeat Link — 表演门 × 反应镜, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateQualityReactionLink } from '@/agents/assembly/quality-reaction-link-gate';

type S = { durSec: number; beatRole?: string; action?: string };
const spec = (shots: S[]) => ({
  episode: 'T',
  shots: shots.map((s, i) => ({ shotId: `S${i}`, cast: [], ...s })),
});

const withReaction = spec([
  { durSec: 3, beatRole: 'hook', action: '危机开场' },
  { durSec: 6, beatRole: 'reversal', action: '身份翻牌' },
  { durSec: 3, beatRole: 'reaction', action: '齐耶瞳孔收缩后退' },
  { durSec: 5, beatRole: 'cliffhanger', action: '门外脚步逼近' },
  { durSec: 2, beatRole: 'reaction', action: '众人面面相觑' },
]);

/** No turn roles → reaction gate PASSes with 0 reaction shots. */
const noTurns = spec([
  { durSec: 4, beatRole: 'hook', action: '推门而入' },
  { durSec: 8, beatRole: 'setup', action: '走廊空镜缓慢推进' },
  { durSec: 6, beatRole: 'setup', action: '桌面特写静物' },
]);

const noReactionAfterTurn = spec([
  { durSec: 4, beatRole: 'hook', action: '破门' },
  { durSec: 8, beatRole: 'reversal', action: '伪人纹路翻开' },
  { durSec: 6, beatRole: 'setup', action: '走廊空镜' },
]);

const qlShot = (id: string, intensity: number, over: Record<string, unknown> = {}) => ({
  id,
  scriptBeat: '她看完手机，抬眼说完一句台词。',
  durationSec: 4,
  dramaPurpose: '揭示被隐瞒后的克制反应',
  characterIntent: '压住怒意、确认对方知情',
  performance: {
    emotion: intensity >= 4 ? 'anger' : 'doubt',
    intensity,
    face: '一侧眉微抬',
    gaze: '视线在对方脸上停留',
    posture: '身体稍稍后靠',
  },
  camera: { shotSize: '中景', primaryMove: '固定', moveDetail: '机位固定' },
  dialogue: null,
  mouthResting: '嘴唇自然闭合',
  fullPrompt: '中景固定机位，一侧眉微抬，视线停留；嘴部自然闭合。焦点在眼睛。',
  ...over,
});

const ql = (intensity = 3) => ({
  style: 'live_action' as const,
  shots: [qlShot('S01', intensity), qlShot('S02', intensity), qlShot('S03', 2)],
});

const pack = (links: Array<Record<string, unknown>>, extra: Record<string, unknown> = {}) => ({
  series: '天幕直播',
  latestEp: 10,
  links,
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateQualityReactionLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateQualityReactionLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateQualityReactionLink', () => {
  it('aligned reaction + intense performance → PASS', () => {
    const r = evaluateQualityReactionLink(
      pack([{ id: 'L1', ep: 3, shotSpec: withReaction, qualityLeap: ql(4) }]),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / DUP / FUTURE_EP', () => {
    expect(failCodes(evaluateQualityReactionLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateQualityReactionLink(
          pack([
            { id: 'd', ep: 1, shotSpec: withReaction, qualityLeap: ql() },
            { id: 'd', ep: 1, shotSpec: withReaction, qualityLeap: ql() },
          ]),
        ),
      ),
    ).toContain('DUP_ID');
    expect(
      failCodes(
        evaluateQualityReactionLink(
          pack([{ id: 'L1', ep: 9, shotSpec: withReaction, qualityLeap: ql() }], { latestEp: 3 }),
        ),
      ),
    ).toContain('FUTURE_EP');
  });

  it('missing reaction after turn → CHILD_REACTION_FAIL', () => {
    expect(
      failCodes(
        evaluateQualityReactionLink(
          pack([{ id: 'L1', ep: 1, shotSpec: noReactionAfterTurn, qualityLeap: ql() }]),
        ),
      ),
    ).toContain('CHILD_REACTION_FAIL');
  });

  it('bad qualityLeap → CHILD_QUALITY_FAIL', () => {
    expect(
      failCodes(
        evaluateQualityReactionLink(
          pack([{ id: 'L1', ep: 1, shotSpec: withReaction, qualityLeap: { style: 'live_action', shots: [] } }]),
        ),
      ),
    ).toContain('CHILD_QUALITY_FAIL');
  });

  it('intense performance without reaction shots → INTENSE_WITHOUT_REACTION', () => {
    const r = evaluateQualityReactionLink(
      pack([{ id: 'L1', ep: 1, shotSpec: noTurns, qualityLeap: ql(5) }]),
    );
    expect(failCodes(r)).toContain('INTENSE_WITHOUT_REACTION');
    expect(r.verdict).toBe('FAIL');
  });

  it('reaction + soft performance → REACTION_WITHOUT_PERFORMANCE WARN, PASS', () => {
    const r = evaluateQualityReactionLink(
      pack([{ id: 'L1', ep: 1, shotSpec: withReaction, qualityLeap: ql(2) }]),
    );
    expect(warnCodes(r)).toContain('REACTION_WITHOUT_PERFORMANCE');
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
  });
});
