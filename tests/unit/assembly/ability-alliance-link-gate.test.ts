/**
 * V12 Ability×Alliance Link — 金手指×同盟, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAbilityAllianceLink } from '@/agents/assembly/ability-alliance-link-gate';

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
  alliances: [{ id: 'oni-fang', label: '鬼牙同盟', members: ['chen-haoyu', 'guild'] }],
  events: [
    { allianceId: 'oni-fang', ep: 1, role: 'seed' as const, note: '收留' },
    { allianceId: 'oni-fang', ep: 5, role: 'echo' as const, note: '并肩' },
    { allianceId: 'oni-fang', ep: 10, role: 'payoff' as const, note: '护短' },
  ],
  links: [{ id: 'L1', abilityId: 'seer', allianceId: 'oni-fang', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateAbilityAllianceLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAbilityAllianceLink', () => {
  it('use @ alliance payoff → PASS', () => {
    const r = evaluateAbilityAllianceLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_PAYOFF / PAYOFF_WITHOUT_ABILITY', () => {
    expect(failCodes(evaluateAbilityAllianceLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateAbilityAllianceLink(
          pack({
            links: [{ id: 'L1', abilityId: 'seer', allianceId: 'oni-fang', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_PAYOFF');
    expect(failCodes(evaluateAbilityAllianceLink(pack({ links: [] })))).toContain(
      'PAYOFF_WITHOUT_ABILITY',
    );
  });
});
