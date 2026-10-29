/**
 * V12 Cliff×Ability Link — 悬念叠钩×金手指 (invert abilityCliff), offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateCliffAbilityLink } from '@/agents/assembly/cliff-ability-link-gate';

const cliffPrev = {
  episode: 'EP08',
  shots: [
    { shotId: 'EP08-S0', cast: [], durSec: 4, beatRole: 'hook', action: '危机开场' },
    { shotId: 'EP08-S1', cast: [], durSec: 8, beatRole: 'increment', action: '追查线索' },
    { shotId: 'EP08-S2', cast: [], durSec: 8, beatRole: 'reversal', action: '身份暴露' },
    { shotId: 'EP08-S3', cast: [], durSec: 10, beatRole: 'cliffhanger', action: '持械闯入皇城大门被围' },
  ],
};
const cliffNext = {
  episode: 'EP09',
  shots: [
    { shotId: 'EP09-S0', cast: [], durSec: 2, beatRole: 'hook', action: '皇城门口持械对峙未解' },
    { shotId: 'EP09-S1', cast: [], durSec: 2, beatRole: 'increment', action: '追兵逼近' },
    { shotId: 'EP09-S2', cast: [], durSec: 10, beatRole: 'reversal', action: '旧友现身' },
    { shotId: 'EP09-S3', cast: [], durSec: 8, beatRole: 'cliffhanger', action: '下一场更大危机' },
  ],
};
const cliffLink = {
  id: 'C8-9',
  prevEp: 8,
  nextEp: 9,
  prev: cliffPrev,
  next: cliffNext,
};

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
    { abilityId: 'seer', by: 'linyang', ep: 8, day: 8, option: '生存情报' },
    { abilityId: 'seer', by: 'linyang', ep: 9, day: 9, option: '查验身份' },
  ],
  cliffLinks: [cliffLink],
  links: [{ id: 'L1', abilityId: 'seer', cliffLinkId: 'C8-9' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateCliffAbilityLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateCliffAbilityLink', () => {
  it('use in cliff window → PASS', () => {
    const r = evaluateCliffAbilityLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / CLIFF_WITHOUT_ABILITY', () => {
    expect(failCodes(evaluateCliffAbilityLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateCliffAbilityLink(pack({ links: [] })))).toContain(
      'CLIFF_WITHOUT_ABILITY',
    );
  });
});
