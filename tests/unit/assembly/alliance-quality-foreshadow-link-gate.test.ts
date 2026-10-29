/**
 * V12 Alliance×Quality×Foreshadow Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAllianceQualityForeshadowLink } from '@/agents/assembly/alliance-quality-foreshadow-link-gate';

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

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '盛夏芬德拉',
  latestEp: 10,
  alliances: [{ id: 'A1', label: '鬼牙同盟', members: ['chen-haoyu', 'guild'] }],
  events: [
    { allianceId: 'A1', ep: 1, role: 'seed' as const, note: '结义' },
    { allianceId: 'A1', ep: 5, role: 'echo' as const, note: '试探' },
    { allianceId: 'A1', ep: 10, role: 'payoff' as const, note: '护短' },
  ],
  items: [{ id: 'FS1', name: '预言家真伪', priority: 'S' as const, plantEp: 1, status: 'closed' as const, payoffEp: 10, lastAdvancedEp: 4 }],
  links: [{ id: 'L1', allianceId: 'A1', foreshadowId: 'FS1', ep: 10, qualityLeap }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateAllianceQualityForeshadowLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAllianceQualityForeshadowLink', () => {
  it('alliance + quality + foreshadow → PASS', () => {
    const r = evaluateAllianceQualityForeshadowLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PAYOFF_WITHOUT_LINK', () => {
    expect(failCodes(evaluateAllianceQualityForeshadowLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateAllianceQualityForeshadowLink(pack({ links: [] })))).toContain('PAYOFF_WITHOUT_LINK');
  });
});
