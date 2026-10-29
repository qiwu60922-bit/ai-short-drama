/**
 * V12 Ability×ColdOpen Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAbilityColdOpenLink } from '@/agents/assembly/ability-cold-open-link-gate';

const coldSpec = {
  episode: 'EP10',
  shots: [
    { shotId: 'EP10-S0', durSec: 1.5, cast: [], beatRole: 'hook', action: '冷开危机', hookKind: 'situation' },
    { shotId: 'EP10-S1', durSec: 2, cast: [], beatRole: 'reversal', action: '身份反转' },
    { shotId: 'EP10-S2', durSec: 3, cast: [], beatRole: 'increment', action: '加压' },
    { shotId: 'EP10-S3', durSec: 4, cast: [], beatRole: 'cliffhanger', action: '悬念' },
  ],
};
const pack = (extra: Record<string, unknown> = {}) => ({
  series: '盛夏芬德拉', latestEp: 20,
  abilities: [{
    id: 'seer', holder: 'linyang', acquiredEp: 1, exclusive: true,
    rule: { cycle: 'day', maxUsesPerCycle: 1, options: ['查验身份', '生存情报'] },
  }],
  uses: [
    { abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '查验身份' },
    { abilityId: 'seer', by: 'linyang', ep: 2, day: 2, option: '生存情报' },
    { abilityId: 'seer', by: 'linyang', ep: 10, day: 10, option: '查验身份' },
  ],
  coldOpens: [{ id: 'EP10-cold', ep: 10, shotSpec: coldSpec }],
  links: [{ id: 'L1', abilityId: 'seer', coldOpenId: 'EP10-cold', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateAbilityColdOpenLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAbilityColdOpenLink', () => {
  it('ability + coldOpen → PASS', () => {
    const r = evaluateAbilityColdOpenLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / COLD_OPEN_WITHOUT_ABILITY', () => {
    expect(failCodes(evaluateAbilityColdOpenLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateAbilityColdOpenLink(pack({ links: [] })))).toContain('COLD_OPEN_WITHOUT_ABILITY');
  });
});
