/**
 * V12 ColdOpen×Quality Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateColdOpenQualityLink } from '@/agents/assembly/cold-open-quality-link-gate';

const qualityLeap = {
  style: 'live_action',
  shots: [{
    id: 'S01', scriptBeat: '对峙兑现。', durationSec: 4,
    dramaPurpose: '揭穿可见表演', characterIntent: '撕开伪装',
    performance: { emotion: 'anger', intensity: 5, face: '眉峰拧紧', gaze: '钉住对方', posture: '前倾' },
    camera: { shotSize: '中近景', primaryMove: '固定', moveDetail: '机位固定' },
    dialogue: null, mouthResting: '嘴唇自然闭合',
    fullPrompt: '中近景固定，眉峰拧紧，嘴部闭合。',
  }],
} as const;
const shotSpec = {
  episode: 'EP10',
  shots: [
    { shotId: 'EP10-B139c-0', durSec: 1.5, cast: [], beatRole: 'hook', action: '冷开危机', hookKind: 'situation' },
    { shotId: 'EP10-B139c-1', durSec: 2, cast: [], beatRole: 'reversal', action: '身份反转' },
    { shotId: 'EP10-B139c-2', durSec: 3, cast: [], beatRole: 'increment', action: '加压' },
    { shotId: 'EP10-B139c-3', durSec: 4, cast: [], beatRole: 'cliffhanger', action: '悬念' },
  ],
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '天幕直播',
  latestEp: 10,
  coldOpens: [{ id: 'EP10-cold', ep: 10, shotSpec }],
  links: [{ id: 'L1', coldOpenId: 'EP10-cold', ep: 10, qualityLeap }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateColdOpenQualityLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateColdOpenQualityLink', () => {
  it('coldOpen + quality → PASS', () => {
    const r = evaluateColdOpenQualityLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / COLD_OPEN_WITHOUT_QUALITY', () => {
    expect(failCodes(evaluateColdOpenQualityLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateColdOpenQualityLink(pack({ links: [] })))).toContain('COLD_OPEN_WITHOUT_QUALITY');
  });
});
