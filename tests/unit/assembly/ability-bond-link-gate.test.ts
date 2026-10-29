/**
 * V12 Ability×Bond Link — 金手指×契约, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAbilityBondLink } from '@/agents/assembly/ability-bond-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '伪人降临',
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
    { abilityId: 'seer', by: 'linyang', ep: 2, day: 2, option: '生存情报' },
    { abilityId: 'seer', by: 'linyang', ep: 10, day: 10, option: '查验身份' },
  ],
  bonds: [{
    id: '江少契约',
    partyA: '江少',
    partyB: '女主',
    contractEp: 1,
    contractLabel: '假面联姻',
    companionEps: [2, 3, 5],
    upgradeEp: 10,
    upgradeLabel: '真心升级',
  }],
  links: [{ id: 'L1', abilityId: 'seer', bondId: '江少契约', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateAbilityBondLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAbilityBondLink', () => {
  it('use @ terminal → PASS', () => {
    const r = evaluateAbilityBondLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_TERMINAL / TERMINAL_WITHOUT_ABILITY', () => {
    expect(failCodes(evaluateAbilityBondLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateAbilityBondLink(
          pack({
            links: [{ id: 'L1', abilityId: 'seer', bondId: '江少契约', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_TERMINAL');
    expect(failCodes(evaluateAbilityBondLink(pack({ links: [] })))).toContain(
      'TERMINAL_WITHOUT_ABILITY',
    );
  });
});
