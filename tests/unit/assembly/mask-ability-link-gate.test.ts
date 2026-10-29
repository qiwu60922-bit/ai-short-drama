/**
 * V12 Mask×Ability Link — 伪装×金手指 (invert abilityMask), offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMaskAbilityLink } from '@/agents/assembly/mask-ability-link-gate';

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
  masks: [{
    id: '花心纨绔',
    wearer: 'linyang',
    plantEp: 1,
    maintainEps: [2, 3],
    revealEp: 10,
    revealLabel: '真心崩塌',
  }],
  links: [{ id: 'L1', abilityId: 'seer', maskId: '花心纨绔' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateMaskAbilityLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateMaskAbilityLink', () => {
  it('holder=wearer + use after reveal → PASS', () => {
    const r = evaluateMaskAbilityLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / HOLDER_WEARER_MISMATCH', () => {
    expect(failCodes(evaluateMaskAbilityLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateMaskAbilityLink(
          pack({
            masks: [{
              id: '花心纨绔',
              wearer: 'other',
              plantEp: 1,
              maintainEps: [2, 3],
              revealEp: 10,
              revealLabel: '崩',
            }],
          }),
        ),
      ),
    ).toContain('HOLDER_WEARER_MISMATCH');
  });
});
