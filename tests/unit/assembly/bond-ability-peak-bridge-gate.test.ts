/**
 * V12 Bond×Ability×Peak Ternary — 契约×金手指×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateBondAbilityPeakBridge } from '@/agents/assembly/bond-ability-peak-bridge-gate';

const ability = {
  id: 'seer',
  holder: 'linyang',
  acquiredEp: 1,
  exclusive: true,
  rule: { cycle: 'day' as const, maxUsesPerCycle: 1, options: ['查验身份', '生存情报'] },
};
const uses = [
  { abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '查验身份' },
  { abilityId: 'seer', by: 'linyang', ep: 2, day: 2, option: '生存情报' },
  { abilityId: 'seer', by: 'linyang', ep: 8, day: 8, option: '查验身份' },
];
const bond = {
  id: '邱秘书契约',
  partyA: '邱秘书',
  partyB: '陆总',
  contractEp: 1,
  contractLabel: '一年契约女友',
  companionEps: [2, 4],
  upgradeEp: 8,
  upgradeLabel: '受伤后真情求婚',
};
const peak = { id: '订婚宴嫌弃', openEp: 1, peakEp: 8, peakLabel: '订婚宴嫌弃峰值', payoffEp: 8 };

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '伪人降临',
  latestEp: 20,
  abilities: [ability],
  uses,
  bonds: [bond],
  peaks: [peak],
  links: [{ id: 'L1', abilityId: 'seer', bondId: '邱秘书契约', peakId: '订婚宴嫌弃', ep: 8 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateBondAbilityPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateBondAbilityPeakBridge', () => {
  it('use + upgrade + peak @ep → PASS', () => {
    const r = evaluateBondAbilityPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_TERNARY / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateBondAbilityPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateBondAbilityPeakBridge(
          pack({
            links: [{ id: 'L1', abilityId: 'seer', bondId: '邱秘书契约', peakId: '订婚宴嫌弃', ep: 7 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_TERNARY');
    expect(failCodes(evaluateBondAbilityPeakBridge(pack({ links: [] })))).toContain(
      'PEAK_WITHOUT_BRIDGE',
    );
  });
});
