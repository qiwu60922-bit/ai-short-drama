/**
 * V12 Alliance×Quality×Peak Ternary — 同盟×表演×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAllianceQualityPeakBridge } from '@/agents/assembly/alliance-quality-peak-bridge-gate';

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
  series: '反派拿捏',
  latestEp: 20,
  alliances: [{ id: 'oni-fang', label: '鬼牙同盟', members: ['chen-haoyu', 'guild'] }],
  events: [
    { allianceId: 'oni-fang', ep: 1, role: 'seed' as const, note: '结义' },
    { allianceId: 'oni-fang', ep: 5, role: 'echo' as const, note: '试探' },
    { allianceId: 'oni-fang', ep: 10, role: 'payoff' as const, note: '护短' },
  ],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', allianceId: 'oni-fang', peakId: '对峙峰值', ep: 10, qualityLeap }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateAllianceQualityPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAllianceQualityPeakBridge', () => {
  it('payoff + peak + quality @ep → PASS', () => {
    const r = evaluateAllianceQualityPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateAllianceQualityPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateAllianceQualityPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
