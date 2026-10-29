/**
 * V12 Ensemble×Quality×Peak Ternary — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateEnsembleQualityPeakBridge } from '@/agents/assembly/ensemble-quality-peak-bridge-gate';

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
const members = [
  { id: '太奶奶', name: '顾晚晴', roleSlot: 'matriarch' as const, functionTag: '穿越太奶奶温情重整', lookTag: '十八岁少女皮囊', voiceTag: '科学院大佬口吻', spotlightEps: [10] },
  { id: '七十岁儿子', name: '顾成', roleSlot: 'heir' as const, functionTag: '老年儿子赡养线', lookTag: '花甲老人', voiceTag: '无奈絮叨', spotlightEps: [5] },
  { id: '老三', name: '顾老三', roleSlot: 'grandchild' as const, functionTag: '创伤后失智恢复单元', lookTag: '痴呆傻笑', voiceTag: '童声残留', spotlightEps: [10] },
];
const units = [
  { id: '听证重整', ep: 10, leadIds: ['太奶奶'], supportIds: ['七十岁儿子', '老三'], warmth: false },
];

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '太奶奶3',
  latestEp: 20,
  members,
  units,
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', unitId: '听证重整', peakId: '对峙峰值', ep: 10, qualityLeap }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateEnsembleQualityPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateEnsembleQualityPeakBridge', () => {
  it('unit + peak + quality → PASS', () => {
    const r = evaluateEnsembleQualityPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateEnsembleQualityPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateEnsembleQualityPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
