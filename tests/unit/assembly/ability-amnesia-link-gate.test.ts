/**
 * V12 Ability×Amnesia Link — 金手指×失忆唤回, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAbilityAmnesiaLink } from '@/agents/assembly/ability-amnesia-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '伪人降临',
  latestEp: 20,
  abilities: [{
  id: 'seer', holder: 'linyang', acquiredEp: 1, exclusive: true,
  rule: { cycle: 'day' as const, maxUsesPerCycle: 1, options: ['查验身份', '生存情报'] },
}],
  uses: [
  { abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '查验身份' },
  { abilityId: 'seer', by: 'linyang', ep: 10, day: 10, option: '查验身份' },
],
  amnesias: [{
  id: '祁南失忆',
  actor: '祁南',
  plantEp: 1,
  plantCause: '爆炸',
  companionEps: [2, 4, 6],
  recoverEp: 10,
  recoverLabel: '圣诞摩天轮对视唤回',
  recoverTrigger: '圣诞摩天轮',
}],
  links: [{ id: 'L1', abilityId: 'seer', amnesiaId: '祁南失忆' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateAbilityAmnesiaLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAbilityAmnesiaLink', () => {
  it('ability use @ recover → PASS', () => {
    const r = evaluateAbilityAmnesiaLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / ABILITY_WITHOUT_AMNESIA', () => {
    expect(failCodes(evaluateAbilityAmnesiaLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateAbilityAmnesiaLink(pack({ links: [] })))).toContain('ABILITY_WITHOUT_AMNESIA');
  });
});
