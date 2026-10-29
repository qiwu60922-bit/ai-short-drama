/**
 * V12 Ensemble×ColdOpen×Peak Ternary — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateEnsembleColdOpenPeakBridge } from '@/agents/assembly/ensemble-cold-open-peak-bridge-gate';

const coldSpec = {
  episode: 'EP10',
  shots: [
    { shotId: 'EP10-S0', durSec: 1.5, cast: [], beatRole: 'hook', action: '冷开危机', hookKind: 'situation' },
    { shotId: 'EP10-S1', durSec: 2, cast: [], beatRole: 'reversal', action: '身份反转' },
    { shotId: 'EP10-S2', durSec: 3, cast: [], beatRole: 'increment', action: '加压' },
    { shotId: 'EP10-S3', durSec: 4, cast: [], beatRole: 'cliffhanger', action: '悬念' },
  ],
};
const members = [
  { id: '太奶奶-b142', name: '顾晚晴', roleSlot: 'matriarch', functionTag: '穿越太奶奶温情重整-b142', lookTag: '十八岁少女皮囊-b142', voiceTag: '科学院大佬口吻-b142', spotlightEps: [10] },
  { id: '七十岁儿子-b142', name: '顾成', roleSlot: 'heir', functionTag: '老年儿子赡养线-b142', lookTag: '花甲老人-b142', voiceTag: '无奈絮叨-b142', spotlightEps: [5] },
  { id: '老三-b142', name: '顾老三', roleSlot: 'grandchild', functionTag: '创伤后失智恢复单元-b142', lookTag: '痴呆傻笑-b142', voiceTag: '童声残留-b142', spotlightEps: [10] },
];
const pack = (extra: Record<string, unknown> = {}) => ({
  series: '盛夏芬德拉', latestEp: 20,
  members,
  units: [{ id: '听证重整-b142', ep: 10, leadIds: ['太奶奶-b142'], supportIds: ['七十岁儿子-b142', '老三-b142'], warmth: false }],
  coldOpens: [{ id: 'EP10-cold', ep: 10, shotSpec: coldSpec }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', unitId: '听证重整-b142', coldOpenId: 'EP10-cold', peakId: '对峙峰值', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateEnsembleColdOpenPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateEnsembleColdOpenPeakBridge', () => {
  it('ensemble + coldOpen + peak → PASS', () => {
    const r = evaluateEnsembleColdOpenPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateEnsembleColdOpenPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateEnsembleColdOpenPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
