/**
 * V12 Handoff×Ability Link — 承接×金手指 (invert abilityHandoff), offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateHandoffAbilityLink } from '@/agents/assembly/handoff-ability-link-gate';

const cliffPrev = {
  episode: 'EP08',
  shots: [
    { shotId: 'EP08-H0', cast: [], durSec: 4, beatRole: 'hook', action: '开场' },
    { shotId: 'EP08-H1', cast: [], durSec: 8, beatRole: 'increment', action: '追问' },
    { shotId: 'EP08-H2', cast: [], durSec: 8, beatRole: 'reversal', action: '反转' },
    { shotId: 'EP08-H3', cast: [], durSec: 10, beatRole: 'cliffhanger', action: '悬念' },
  ],
};
const cliffNext = {
  episode: 'EP09',
  shots: [
    { shotId: 'EP09-H0', cast: [], durSec: 3, beatRole: 'hook', action: '承接' },
    { shotId: 'EP09-H1', cast: [], durSec: 8, beatRole: 'increment', action: '加压' },
    { shotId: 'EP09-H2', cast: [], durSec: 8, beatRole: 'reversal', action: '反转' },
    { shotId: 'EP09-H3', cast: [], durSec: 6, beatRole: 'cliffhanger', action: '悬念' },
  ],
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
  ],
  handoffs: [{ id: 'H8-9', prevEp: 8, nextEp: 9, prev: cliffPrev, next: cliffNext }],
  links: [{ id: 'L1', abilityId: 'seer', handoffId: 'H8-9' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateHandoffAbilityLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateHandoffAbilityLink', () => {
  it('use @ handoff prev → PASS', () => {
    const r = evaluateHandoffAbilityLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / empty links FAIL', () => {
    expect(failCodes(evaluateHandoffAbilityLink({ series: 'T' }))).toContain('SCHEMA');
    const empty = failCodes(evaluateHandoffAbilityLink(pack({ links: [] })));
    expect(empty.length).toBeGreaterThan(0);
  });
});
