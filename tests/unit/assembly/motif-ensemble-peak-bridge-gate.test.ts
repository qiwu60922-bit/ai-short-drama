/**
 * V12 Motif×Ensemble×Peak Ternary — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMotifEnsemblePeakBridge } from '@/agents/assembly/motif-ensemble-peak-bridge-gate';

const members = [
  { id: '太奶奶', name: '顾晚晴', roleSlot: 'matriarch', functionTag: '穿越太奶奶温情重整', lookTag: '十八岁少女皮囊', voiceTag: '科学院大佬口吻', spotlightEps: [10] },
  { id: '七十岁儿子', name: '顾成', roleSlot: 'heir', functionTag: '老年儿子赡养线', lookTag: '花甲老人', voiceTag: '无奈絮叨', spotlightEps: [5] },
  { id: '老三', name: '顾老三', roleSlot: 'grandchild', functionTag: '创伤后失智恢复单元', lookTag: '痴呆傻笑', voiceTag: '童声残留', spotlightEps: [10] },
];
const pack = (extra: Record<string, unknown> = {}) => ({
  series: '穿越太奶奶',
  latestEp: 20,
  motifs: [{ id: 'white-rose', label: '白玫瑰', kind: 'prop' }],
  appearances: [
    { motifId: 'white-rose', ep: 1, role: 'seed', visualState: '含苞' },
    { motifId: 'white-rose', ep: 5, role: 'echo', visualState: '半开' },
    { motifId: 'white-rose', ep: 10, role: 'payoff', visualState: '盛放' },
  ],
  members,
  units: [{ id: '听证重整', ep: 10, leadIds: ['太奶奶'], supportIds: ['七十岁儿子', '老三'], warmth: false }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', motifId: 'white-rose', unitId: '听证重整', peakId: '对峙峰值', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateMotifEnsemblePeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateMotifEnsemblePeakBridge', () => {
  it('motif + ensemble + peak → PASS', () => {
    const r = evaluateMotifEnsemblePeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateMotifEnsemblePeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateMotifEnsemblePeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
