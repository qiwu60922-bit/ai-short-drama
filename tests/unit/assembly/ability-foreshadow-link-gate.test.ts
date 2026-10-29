/**
 * V12 Ability×Foreshadow Link — 金手指×伏笔, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAbilityForeshadowLink } from '@/agents/assembly/ability-foreshadow-link-gate';

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
  items: [{
    id: '机长身份',
    name: '机长马甲伏笔',
    priority: 'S' as const,
    plantEp: 1,
    status: 'closed' as const,
    payoffEp: 10,
    lastAdvancedEp: 5,
  }],
  links: [{ id: 'L1', abilityId: 'seer', foreshadowId: '机长身份', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateAbilityForeshadowLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAbilityForeshadowLink', () => {
  it('use @ payoff → PASS', () => {
    const r = evaluateAbilityForeshadowLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_PAYOFF / PAYOFF_WITHOUT_ABILITY', () => {
    expect(failCodes(evaluateAbilityForeshadowLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateAbilityForeshadowLink(
          pack({
            links: [{ id: 'L1', abilityId: 'seer', foreshadowId: '机长身份', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_PAYOFF');
    expect(failCodes(evaluateAbilityForeshadowLink(pack({ links: [] })))).toContain(
      'PAYOFF_WITHOUT_ABILITY',
    );
  });
});
