/**
 * V12 Ensemble×Ability×Peak Ternary — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateEnsembleAbilityPeakBridge } from '@/agents/assembly/ensemble-ability-peak-bridge-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '盛夏芬德拉',
  latestEp: 20,
  members: [
    { id: '太奶奶', name: '顾晚晴', roleSlot: 'matriarch', functionTag: '温情重整', lookTag: '少女皮囊', voiceTag: '大佬口吻', spotlightEps: [10] },
    { id: '儿子', name: '顾成', roleSlot: 'heir', functionTag: '赡养线', lookTag: '花甲', voiceTag: '絮叨', spotlightEps: [5] },
    { id: '老三', name: '顾三', roleSlot: 'outsider', functionTag: '搅局', lookTag: '中年', voiceTag: '急促', spotlightEps: [8] },
  ],
  units: [{ id: '听证重整', ep: 10, leadIds: ['太奶奶'], supportIds: ['儿子', '老三'], warmth: false }],
  abilities: [{ id: 'seer', holder: 'linyang', acquiredEp: 1, exclusive: true, rule: { cycle: 'day', maxUsesPerCycle: 1, options: ['查验身份', '生存情报'] } }],
  uses: [
    { abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '查验身份' },
    { abilityId: 'seer', by: 'linyang', ep: 10, day: 10, option: '生存情报' },
  ],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', unitId: '听证重整', abilityId: 'seer', peakId: '对峙峰值', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateEnsembleAbilityPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateEnsembleAbilityPeakBridge', () => {
  it('ensemble + ability + peak → PASS', () => {
    const r = evaluateEnsembleAbilityPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateEnsembleAbilityPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateEnsembleAbilityPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
