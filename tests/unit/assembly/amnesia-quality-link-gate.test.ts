/**
 * V12 Amnesia×Quality Link — 失忆唤回 × 表演门, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAmnesiaQualityLink } from '@/agents/assembly/amnesia-quality-link-gate';

const amnesia = {
  id: '祁南失忆',
  actor: '祁南',
  plantEp: 1,
  plantCause: '爆炸',
  companionEps: [2, 4, 6],
  recoverEp: 8,
  recoverLabel: '摩天轮唤回',
  recoverTrigger: '圣诞摩天轮',
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
const pack = (extra: Record<string, unknown> = {}) => ({
  series: '反派拿捏',
  latestEp: 20,
  amnesias: [amnesia],
  links: [{ id: 'L1', amnesiaId: '祁南失忆', ep: 8, qualityLeap }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateAmnesiaQualityLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAmnesiaQualityLink', () => {
  it('quality at recoverEp → PASS', () => {
    const r = evaluateAmnesiaQualityLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_RECOVER / RECOVER_WITHOUT_QUALITY', () => {
    expect(failCodes(evaluateAmnesiaQualityLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateAmnesiaQualityLink(
          pack({ links: [{ id: 'L1', amnesiaId: '祁南失忆', ep: 3, qualityLeap }] }),
        ),
      ),
    ).toContain('EP_NOT_RECOVER');
    expect(failCodes(evaluateAmnesiaQualityLink(pack({ links: [] })))).toContain(
      'RECOVER_WITHOUT_QUALITY',
    );
  });
});
