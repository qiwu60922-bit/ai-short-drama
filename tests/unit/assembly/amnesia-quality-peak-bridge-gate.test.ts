/**
 * V12 Amnesia×Quality×Peak Ternary — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAmnesiaQualityPeakBridge } from '@/agents/assembly/amnesia-quality-peak-bridge-gate';

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
  amnesias: [{ id: '祁南失忆', actor: '祁南', plantEp: 1, plantCause: '爆炸', companionEps: [2, 4, 6], recoverEp: 10, recoverLabel: '摩天轮唤回', recoverTrigger: '圣诞摩天轮' }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', amnesiaId: '祁南失忆', peakId: '对峙峰值', ep: 10, qualityLeap }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateAmnesiaQualityPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAmnesiaQualityPeakBridge', () => {
  it('amnesia + peak + quality → PASS', () => {
    const r = evaluateAmnesiaQualityPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateAmnesiaQualityPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateAmnesiaQualityPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
