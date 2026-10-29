/**
 * V12 Quality×Foreshadow×Peak Ternary — 表演×伏笔×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateQualityForeshadowPeakBridge } from '@/agents/assembly/quality-foreshadow-peak-bridge-gate';

const qualityLeap = {
  style: 'live_action',
  shots: [{
    id: 'S01', scriptBeat: '伏笔兑现对峙。', durationSec: 4,
    dramaPurpose: '揭穿可见表演', characterIntent: '撕开伪装',
    performance: { emotion: 'anger', intensity: 5, face: '眉峰拧紧', gaze: '钉住对方', posture: '前倾' },
    camera: { shotSize: '中近景', primaryMove: '固定', moveDetail: '机位固定' },
    dialogue: null, mouthResting: '嘴唇自然闭合',
    fullPrompt: '中近景固定，眉峰拧紧，嘴部闭合。',
  }],
} as const;

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '伪人降临',
  latestEp: 20,
  items: [{ id: '伪人身份', name: '预言家真伪', priority: 'S' as const, plantEp: 1, status: 'closed' as const, payoffEp: 10, lastAdvancedEp: 4 }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', foreshadowId: '伪人身份', peakId: '对峙峰值', ep: 10, qualityLeap }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateQualityForeshadowPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateQualityForeshadowPeakBridge', () => {
  it('payoff + peak + quality @ep → PASS', () => {
    const r = evaluateQualityForeshadowPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateQualityForeshadowPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateQualityForeshadowPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
