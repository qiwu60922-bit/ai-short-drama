/**
 * V12 Ability(seer)×Vest Link — 金手指×马甲掉落, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAbilityVestLink } from '@/agents/assembly/ability-vest-link-gate';

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
  { abilityId: 'seer', by: 'linyang', ep: 10, day: 10, option: '查验身份' },
];
const vest = {
  id: '机长马甲',
  wearer: '苏见晴',
  vestLabel: '机长',
  plantEp: 1,
  teaseEps: [3, 5],
  dropEp: 10,
  dropLabel: '公开机长身份反击',
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '伪人降临',
  latestEp: 20,
  abilities: [ability],
  uses,
  vests: [vest],
  links: [{ id: 'L1', abilityId: 'seer', vestId: '机长马甲', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateAbilityVestLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAbilityVestLink', () => {
  it('use at dropEp → PASS', () => {
    const r = evaluateAbilityVestLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_DROP / DROP_WITHOUT_ABILITY', () => {
    expect(failCodes(evaluateAbilityVestLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateAbilityVestLink(
          pack({
            links: [{ id: 'L1', abilityId: 'seer', vestId: '机长马甲', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_DROP');
    expect(failCodes(evaluateAbilityVestLink(pack({ links: [] })))).toContain(
      'DROP_WITHOUT_ABILITY',
    );
  });
});
