/** V12 Motif×QualityLeap Link — 母题回扣 × 表演门, offline, ≠Final ≠G3. */
import { describe, expect, it } from 'vitest';
import { evaluateMotifQualityLink } from '@/agents/assembly/motif-quality-link-gate';

const qlShot = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  scriptBeat: '她看完手机，抬眼说完一句台词。',
  durationSec: 4,
  dramaPurpose: '母题回扣时的克制反应',
  characterIntent: '确认旧物触动记忆',
  performance: {
    emotion: 'doubt',
    intensity: 2,
    face: '一侧眉微抬',
    gaze: '视线落在白玫瑰上',
    posture: '身体稍稍后靠',
  },
  camera: { shotSize: '中景', primaryMove: '固定', moveDetail: '机位固定' },
  dialogue: null,
  mouthResting: '嘴唇自然闭合',
  fullPrompt: '中景固定机位，一侧眉微抬，视线落在白玫瑰；嘴部自然闭合。焦点在眼睛。',
  ...over,
});

const goldenQl = () => ({
  style: 'live_action' as const,
  shots: [
    qlShot('S01'),
    qlShot('S02', {
      performance: {
        emotion: 'anger',
        intensity: 3,
        face: '眉心轻收，嘴唇抿住',
        gaze: '目光短暂发紧',
        posture: '肩膀紧绷',
      },
      camera: {
        shotSize: '中近景',
        primaryMove: '缓慢推进',
        moveDetail: '推到胸上景',
      },
      dialogue: {
        speaker: '她',
        line: '这朵花…',
        lipsyncNote: '按自然中文节奏',
      },
      fullPrompt:
        '中近景缓慢推进，眉心轻收嘴唇抿住；口型按中文节奏。焦点在眼睛与白玫瑰。',
    }),
    qlShot('S03', {
      performance: {
        emotion: 'relief',
        intensity: 2,
        face: '眉间放松',
        gaze: '目光重新抬起',
        posture: '肩膀落下',
      },
      camera: { shotSize: '近景', primaryMove: '拉远', moveDetail: '缓慢拉远' },
      mouthResting: '嘴角淡淡暖意，自然闭合',
      fullPrompt: '近景，眉间放松肩膀落下；摄影机缓慢拉远，焦点在眼睛。',
    }),
  ],
});

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '盛夏芬德拉',
  latestEp: 80,
  motifs: [{ id: 'white-rose', label: '白玫瑰', kind: 'prop' as const }],
  appearances: [
    { motifId: 'white-rose', ep: 1, role: 'seed', visualState: '含苞' },
    { motifId: 'white-rose', ep: 36, role: 'echo', visualState: '半开' },
    { motifId: 'white-rose', ep: 78, role: 'payoff', visualState: '盛放' },
  ],
  links: [
    { id: 'L1', motifId: 'white-rose', ep: 1, qualityLeap: goldenQl() },
    { id: 'L2', motifId: 'white-rose', ep: 36, qualityLeap: goldenQl() },
    { id: 'L3', motifId: 'white-rose', ep: 78, qualityLeap: goldenQl() },
  ],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateMotifQualityLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateMotifQualityLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateMotifQualityLink', () => {
  it('all appearances linked with quality PASS', () => {
    const r = evaluateMotifQualityLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(3);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / DUP / UNKNOWN / FUTURE', () => {
    expect(failCodes(evaluateMotifQualityLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateMotifQualityLink(
          pack({
            links: [
              { id: 'd', motifId: 'white-rose', ep: 1, qualityLeap: goldenQl() },
              { id: 'd', motifId: 'white-rose', ep: 1, qualityLeap: goldenQl() },
              { id: 'L2', motifId: 'white-rose', ep: 36, qualityLeap: goldenQl() },
              { id: 'L3', motifId: 'white-rose', ep: 78, qualityLeap: goldenQl() },
            ],
          }),
        ),
      ),
    ).toContain('DUP_ID');
    expect(
      failCodes(
        evaluateMotifQualityLink(
          pack({
            links: [
              { id: 'a', motifId: 'ghost', ep: 1, qualityLeap: goldenQl() },
              { id: 'L2', motifId: 'white-rose', ep: 36, qualityLeap: goldenQl() },
              { id: 'L3', motifId: 'white-rose', ep: 78, qualityLeap: goldenQl() },
            ],
          }),
        ),
      ),
    ).toContain('UNKNOWN_MOTIF');
  });

  it('link ep without appearance → NO_APPEARANCE_AT_EP', () => {
    const r = evaluateMotifQualityLink(
      pack({
        links: [
          { id: 'L1', motifId: 'white-rose', ep: 1, qualityLeap: goldenQl() },
          { id: 'L2', motifId: 'white-rose', ep: 36, qualityLeap: goldenQl() },
          { id: 'L3', motifId: 'white-rose', ep: 78, qualityLeap: goldenQl() },
          { id: 'bad', motifId: 'white-rose', ep: 50, qualityLeap: goldenQl() },
        ],
      }),
    );
    expect(failCodes(r)).toContain('NO_APPEARANCE_AT_EP');
  });

  it('payoff unlinked → APPEARANCE_UNLINKED FAIL', () => {
    const r = evaluateMotifQualityLink(
      pack({
        links: [
          { id: 'L1', motifId: 'white-rose', ep: 1, qualityLeap: goldenQl() },
          { id: 'L2', motifId: 'white-rose', ep: 36, qualityLeap: goldenQl() },
        ],
      }),
    );
    expect(failCodes(r)).toContain('APPEARANCE_UNLINKED');
  });

  it('echo unlinked → APPEARANCE_UNLINKED WARN only if payoff linked', () => {
    const r = evaluateMotifQualityLink(
      pack({
        links: [
          { id: 'L1', motifId: 'white-rose', ep: 1, qualityLeap: goldenQl() },
          { id: 'L3', motifId: 'white-rose', ep: 78, qualityLeap: goldenQl() },
        ],
      }),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('APPEARANCE_UNLINKED');
  });

  it('bad qualityLeap → CHILD_QUALITY_FAIL', () => {
    const r = evaluateMotifQualityLink(
      pack({
        links: [
          { id: 'L1', motifId: 'white-rose', ep: 1, qualityLeap: { shots: [] } },
          { id: 'L2', motifId: 'white-rose', ep: 36, qualityLeap: goldenQl() },
          { id: 'L3', motifId: 'white-rose', ep: 78, qualityLeap: goldenQl() },
        ],
      }),
    );
    expect(failCodes(r)).toContain('CHILD_QUALITY_FAIL');
  });
});
