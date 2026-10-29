/**
 * V12 Quality×Motif Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateQualityMotifLink } from '@/agents/assembly/quality-motif-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '盛夏芬德拉',
  latestEp: 20,
  motifs: [{ id: 'white-rose', label: '白玫瑰', kind: 'prop' }],
  appearances: [
    { motifId: 'white-rose', ep: 1, role: 'seed', visualState: '含苞' },
    { motifId: 'white-rose', ep: 5, role: 'echo', visualState: '半开' },
    { motifId: 'white-rose', ep: 10, role: 'payoff', visualState: '盛放' },
  ],
  links: [{ id: 'L1', motifId: 'white-rose', ep: 10, qualityLeap: {
          style: 'live_action',
          shots: [{
            id: 'S01', scriptBeat: '对峙兑现。', durationSec: 4, dramaPurpose: '揭穿可见表演',
            characterIntent: '撕开伪装',
            performance: { emotion: 'anger', intensity: 5, face: '眉峰拧紧', gaze: '钉住对方', posture: '前倾' },
            camera: { shotSize: '中近景', primaryMove: '固定', moveDetail: '机位固定' },
            dialogue: null, mouthResting: '嘴唇自然闭合',
            fullPrompt: '中近景固定，眉峰拧紧，嘴部闭合。',
          }],
        } }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateQualityMotifLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateQualityMotifLink', () => {
  it('quality + motif → PASS', () => {
    const r = evaluateQualityMotifLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / APPEARANCE_UNLINKED', () => {
    expect(failCodes(evaluateQualityMotifLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateQualityMotifLink(pack({ links: [] })))).toContain('APPEARANCE_UNLINKED');
  });
});
