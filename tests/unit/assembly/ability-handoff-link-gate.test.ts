/**
 * V12 Ability×Handoff Link — 金手指×集间承接, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAbilityHandoffLink } from '@/agents/assembly/ability-handoff-link-gate';

type S = { durSec: number; beatRole?: string; action?: string };
const spec = (episode: string, shots: S[]) => ({
  episode,
  shots: shots.map((s, i) => ({ shotId: `${episode}-S${i}`, cast: [], ...s })),
});
const prevGood = (): S[] => [
  { durSec: 4, beatRole: 'hook', action: '能力兑现开场' },
  { durSec: 8, beatRole: 'increment', action: '对峙' },
  { durSec: 8, beatRole: 'reversal', action: '证据甩出' },
  { durSec: 10, beatRole: 'cliffhanger', action: '门外未解' },
];
const nextGood = (): S[] => [
  { durSec: 2, beatRole: 'hook', action: '门外脚步' },
  { durSec: 2, beatRole: 'increment', action: '追问' },
  { durSec: 10, beatRole: 'reversal', action: '新证' },
  { durSec: 8, beatRole: 'cliffhanger', action: '更大危机' },
];

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
  { abilityId: 'seer', by: 'linyang', ep: 8, day: 8, option: '查验身份' },
];
const handoff = {
  id: 'H8-9',
  prevEp: 8,
  nextEp: 9,
  prev: spec('EP08', prevGood()),
  next: spec('EP09', nextGood()),
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '伪人降临',
  latestEp: 20,
  abilities: [ability],
  uses,
  handoffs: [handoff],
  links: [{ id: 'L1', abilityId: 'seer', handoffId: 'H8-9' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateAbilityHandoffLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAbilityHandoffLink', () => {
  it('use at handoff.prevEp → PASS', () => {
    const r = evaluateAbilityHandoffLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / NO_USE / HANDOFF_WITHOUT_ABILITY', () => {
    expect(failCodes(evaluateAbilityHandoffLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateAbilityHandoffLink(
          pack({
            uses: [
              { abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '查验身份' },
              { abilityId: 'seer', by: 'linyang', ep: 2, day: 2, option: '生存情报' },
            ],
          }),
        ),
      ),
    ).toContain('NO_USE_AT_HANDOFF');
    expect(failCodes(evaluateAbilityHandoffLink(pack({ links: [] })))).toContain(
      'HANDOFF_WITHOUT_ABILITY',
    );
  });
});
