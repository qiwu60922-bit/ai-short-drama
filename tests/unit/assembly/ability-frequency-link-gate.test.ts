/**
 * V12 Ability×Frequency Link — 金手指×频率 (invert frequencyAbility), offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAbilityFrequencyLink } from '@/agents/assembly/ability-frequency-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '一块钱硬币',
  latestEp: 20,
  abilities: [{
    id: 'seer',
    holder: 'linyang',
    acquiredEp: 1,
    exclusive: true,
    rule: { cycle: 'day' as const, maxUsesPerCycle: 1, options: ['查验身份', '生存情报'] },
  }],
  uses: [
    { abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '查验身份' },
    { abilityId: 'seer', by: 'linyang', ep: 10, day: 10, option: '生存情报' },
  ],
  frequencies: [{
    id: '离婚要挟',
    actor: '丈夫',
    motif: '离婚要挟',
    unit: 'count' as const,
    threshold: 99,
    plantEp: 1,
    ticks: [{ ep: 3, n: 10 }, { ep: 5, n: 50 }, { ep: 10, n: 99, label: '第99次' }],
    tipEp: 10,
    tipLabel: '接受第99次离婚彻底离开',
  }],
  links: [{ id: 'L1', abilityId: 'seer', frequencyId: '离婚要挟' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateAbilityFrequencyLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAbilityFrequencyLink', () => {
  it('ability use @ tipEp → PASS', () => {
    const r = evaluateAbilityFrequencyLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / TIP_WITHOUT_USE / USE_WITHOUT_TIP', () => {
    expect(failCodes(evaluateAbilityFrequencyLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateAbilityFrequencyLink(
          pack({
            uses: [{ abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '查验身份' }],
          }),
        ),
      ),
    ).toContain('TIP_WITHOUT_USE');
    expect(
      failCodes(
        evaluateAbilityFrequencyLink(
          pack({
            frequencies: [{
              id: '离婚要挟',
              actor: '丈夫',
              motif: '离婚要挟',
              unit: 'count' as const,
              threshold: 99,
              plantEp: 1,
              ticks: [{ ep: 3, n: 10 }],
            }],
          }),
        ),
      ),
    ).toContain('USE_WITHOUT_TIP');
  });
});
