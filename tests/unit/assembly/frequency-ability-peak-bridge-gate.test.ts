/**
 * V12 Frequency×Ability×Peak Ternary — tipping×金手指×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateFrequencyAbilityPeakBridge } from '@/agents/assembly/frequency-ability-peak-bridge-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '机长先生',
  latestEp: 20,
  frequencies: [{
    id: '离婚要挟',
    actor: '丈夫',
    motif: '离婚要挟',
    unit: 'count' as const,
    threshold: 99,
    plantEp: 1,
    ticks: [
      { ep: 3, n: 10 },
      { ep: 5, n: 50 },
      { ep: 10, n: 99, label: '第99次' },
    ],
    tipEp: 10,
    tipLabel: '接受第99次离婚彻底离开',
    tipAtSec: 10,
    plantAtSec: 0,
  }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateFrequencyAbilityPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateFrequencyAbilityPeakBridge', () => {
  it('tip + ability use + peak @ep → PASS', () => {
    const r = evaluateFrequencyAbilityPeakBridge(pack({
      abilities: [{
        id: 'seer', holder: 'linyang', acquiredEp: 1, exclusive: true,
        rule: { cycle: 'day', maxUsesPerCycle: 1, options: ['查验身份', '生存情报'] },
      }],
      uses: [
        { abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '查验身份' },
        { abilityId: 'seer', by: 'linyang', ep: 10, day: 10, option: '查验身份' },
      ],
      links: [{ id: 'L1', frequencyId: '离婚要挟', abilityId: 'seer', peakId: '对峙峰值', ep: 10 }],
    }));
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / TIP_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateFrequencyAbilityPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateFrequencyAbilityPeakBridge(pack({
      abilities: [], uses: [], links: [],
    })))).toContain('TIP_WITHOUT_BRIDGE');
  });
});
