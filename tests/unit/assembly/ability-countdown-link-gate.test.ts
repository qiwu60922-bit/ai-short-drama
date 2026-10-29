/**
 * V12 Ability×Countdown Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAbilityCountdownLink } from '@/agents/assembly/ability-countdown-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '伪人降临',
  latestEp: 20,
  abilities: [{ id: 'seer', holder: 'linyang', acquiredEp: 1, exclusive: true, rule: { cycle: 'day', maxUsesPerCycle: 1, options: ['查验身份', '生存情报'] } }],
  uses: [
    { abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '查验身份' },
    { abilityId: 'seer', by: 'linyang', ep: 10, day: 10, option: '查验身份' },
  ],
  countdowns: [{ id: '直播时限', label: '终局倒计时', startEp: 1, deadlineEp: 10, status: 'open' as const }],
  links: [{ id: 'L1', abilityId: 'seer', countdownId: '直播时限', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateAbilityCountdownLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAbilityCountdownLink', () => {
  it('ability + countdown → PASS', () => {
    const r = evaluateAbilityCountdownLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / DEADLINE_WITHOUT_ABILITY', () => {
    expect(failCodes(evaluateAbilityCountdownLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateAbilityCountdownLink(pack({ links: [] })))).toContain('DEADLINE_WITHOUT_ABILITY');
  });
});
