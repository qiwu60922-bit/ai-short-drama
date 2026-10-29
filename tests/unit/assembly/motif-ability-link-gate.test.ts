/**
 * V12 Motif×Ability Link — 母题×金手指, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMotifAbilityLink } from '@/agents/assembly/motif-ability-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '伪人降临',
  latestEp: 20,
  motifs: [{ id: 'white-rose', label: '白玫瑰', kind: 'prop' }],
  appearances: [
    { motifId: 'white-rose', ep: 1, role: 'seed', visualState: '含苞' },
    { motifId: 'white-rose', ep: 5, role: 'echo', visualState: '半开' },
    { motifId: 'white-rose', ep: 10, role: 'payoff', visualState: '盛放' },
  ],
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
  links: [{ id: 'L1', motifId: 'white-rose', abilityId: 'seer', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateMotifAbilityLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateMotifAbilityLink', () => {
  it('motif ↔ ability @appearance → PASS', () => {
    const r = evaluateMotifAbilityLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / MOTIF_WITHOUT_ABILITY', () => {
    expect(failCodes(evaluateMotifAbilityLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateMotifAbilityLink(pack({ links: [] })))).toContain(
      'MOTIF_WITHOUT_ABILITY',
    );
  });
});
