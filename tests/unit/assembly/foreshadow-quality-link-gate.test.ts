/**
 * V12 Foreshadow×Quality Link — 伏笔回收×表演门, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateForeshadowQualityLink } from '@/agents/assembly/foreshadow-quality-link-gate';

const item = {
  id: '伪人身份',
  name: '预言家真伪',
  priority: 'S' as const,
  plantEp: 1,
  status: 'closed' as const,
  payoffEp: 8,
  lastAdvancedEp: 4,
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
  series: '伪人降临',
  latestEp: 20,
  items: [item],
  links: [{ id: 'L1', foreshadowId: '伪人身份', ep: 8, qualityLeap }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateForeshadowQualityLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateForeshadowQualityLink', () => {
  it('payoff + quality → PASS', () => {
    const r = evaluateForeshadowQualityLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_PAYOFF / PAYOFF_WITHOUT_QUALITY', () => {
    expect(failCodes(evaluateForeshadowQualityLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateForeshadowQualityLink(
          pack({ links: [{ id: 'L1', foreshadowId: '伪人身份', ep: 3, qualityLeap }] }),
        ),
      ),
    ).toContain('EP_NOT_PAYOFF');
    expect(failCodes(evaluateForeshadowQualityLink(pack({ links: [] })))).toContain(
      'PAYOFF_WITHOUT_QUALITY',
    );
  });
});
