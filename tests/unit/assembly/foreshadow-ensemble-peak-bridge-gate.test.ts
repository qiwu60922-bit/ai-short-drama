/**
 * V12 Foreshadow×Ensemble×Peak Ternary — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateForeshadowEnsemblePeakBridge } from '@/agents/assembly/foreshadow-ensemble-peak-bridge-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '天幕直播',
  latestEp: 20,
  items: [{ id: 'FS1', name: '预言家真伪', priority: 'S', plantEp: 1, status: 'closed', payoffEp: 10, lastAdvancedEp: 4 }],
  members: [
    { id: '太奶奶', name: '顾晚晴', roleSlot: 'matriarch', functionTag: '温情重整', lookTag: '少女皮囊', voiceTag: '大佬口吻', spotlightEps: [10] },
    { id: '七十岁儿子', name: '顾成', roleSlot: 'heir', functionTag: '赡养线', lookTag: '花甲', voiceTag: '絮叨', spotlightEps: [5] },
    { id: '老三', name: '顾老三', roleSlot: 'grandchild', functionTag: '失智恢复', lookTag: '傻笑', voiceTag: '童声', spotlightEps: [10] },
  ],
  units: [{ id: 'U1', ep: 10, leadIds: ['太奶奶'], supportIds: ['七十岁儿子', '老三'], warmth: false }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', foreshadowId: 'FS1', unitId: 'U1', peakId: '对峙峰值', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateForeshadowEnsemblePeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateForeshadowEnsemblePeakBridge', () => {
  it('foreshadow + ensemble + peak → PASS', () => {
    const r = evaluateForeshadowEnsemblePeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateForeshadowEnsemblePeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateForeshadowEnsemblePeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
