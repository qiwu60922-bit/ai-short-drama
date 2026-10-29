/**
 * V12 Quality×Stage Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateQualityStageLink } from '@/agents/assembly/quality-stage-link-gate';

const qualityLeap = {
  style: 'live_action' as const,
  shots: [{
    id: 'S01', scriptBeat: '表演兑现。', durationSec: 4, dramaPurpose: '可见表演',
    characterIntent: '撕开伪装',
    performance: { emotion: 'anger', intensity: 5, face: '眉峰拧紧', gaze: '钉住对方', posture: '前倾' },
    camera: { shotSize: '中近景', primaryMove: '固定', moveDetail: '机位固定' },
    dialogue: null, mouthResting: '嘴唇自然闭合',
    fullPrompt: '中近景固定，眉峰拧紧，嘴部闭合。',
  }],
};
const pack = (extra: Record<string, unknown> = {}) => ({
  series: '阶段目标',
  latestEp: 20,
  goals: [{ id: 'goal-b150', label: '找出伪人', destination: '终局揭穿', startEp: 1, dueEp: 10, status: 'met' as const }],
  links: [{ id: 'L1', goalId: 'goal-b150', ep: 10, qualityLeap }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateQualityStageLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateQualityStageLink', () => {
  it('quality + stage → PASS', () => {
    const r = evaluateQualityStageLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / DUE_WITHOUT_QUALITY', () => {
    expect(failCodes(evaluateQualityStageLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateQualityStageLink(pack({ links: [] })))).toContain('DUE_WITHOUT_QUALITY');
  });
});
