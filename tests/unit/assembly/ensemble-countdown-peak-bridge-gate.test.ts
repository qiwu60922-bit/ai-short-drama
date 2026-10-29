/**
 * V12 Ensemble×Countdown×Peak Ternary — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateEnsembleCountdownPeakBridge } from '@/agents/assembly/ensemble-countdown-peak-bridge-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '穿越太奶奶',
  latestEp: 20,
  members: [
    { id: '太奶奶', name: '顾晚晴', roleSlot: 'matriarch', functionTag: '穿越太奶奶温情重整', lookTag: '十八岁少女皮囊', voiceTag: '科学院大佬口吻', spotlightEps: [10] },
    { id: '七十岁儿子', name: '顾成', roleSlot: 'heir', functionTag: '老年儿子赡养线', lookTag: '花甲老人', voiceTag: '无奈絮叨', spotlightEps: [5] },
    { id: '老三', name: '顾老三', roleSlot: 'grandchild', functionTag: '创伤后失智恢复单元', lookTag: '痴呆傻笑', voiceTag: '童声残留', spotlightEps: [10] },
  ],
  units: [{ id: 'U1', ep: 10, leadIds: ['太奶奶'], supportIds: ['七十岁儿子', '老三'], warmth: false }],
  countdowns: [{ id: 'CD1', label: '终局', startEp: 1, deadlineEp: 10, status: 'open' }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', unitId: 'U1', countdownId: 'CD1', peakId: '对峙峰值', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateEnsembleCountdownPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateEnsembleCountdownPeakBridge', () => {
  it('ensemble + countdown + peak → PASS', () => {
    const r = evaluateEnsembleCountdownPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateEnsembleCountdownPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateEnsembleCountdownPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
