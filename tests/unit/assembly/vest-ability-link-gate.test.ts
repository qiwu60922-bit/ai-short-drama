/**
 * V12 Vest×Ability Link — 马甲×金手指 (invert abilityVest), offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateVestAbilityLink } from '@/agents/assembly/vest-ability-link-gate';

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
    { abilityId: 'seer', by: 'linyang', ep: 10, day: 10, option: '生存情报' },
  ],
  vests: [{
    id: '机长马甲',
    wearer: '苏见晴',
    vestLabel: '机长',
    plantEp: 1,
    teaseEps: [3, 5],
    dropEp: 10,
    dropLabel: '公开机长身份反击',
  }],
  links: [{ id: 'L1', abilityId: 'seer', vestId: '机长马甲', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateVestAbilityLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateVestAbilityLink', () => {
  it('use @ drop → PASS', () => {
    const r = evaluateVestAbilityLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_DROP / ABILITY_WITHOUT_VEST', () => {
    expect(failCodes(evaluateVestAbilityLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateVestAbilityLink(
          pack({
            links: [{ id: 'L1', abilityId: 'seer', vestId: '机长马甲', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_DROP');
    expect(failCodes(evaluateVestAbilityLink(pack({ links: [] })))).toContain(
      'ABILITY_WITHOUT_VEST',
    );
  });
});
