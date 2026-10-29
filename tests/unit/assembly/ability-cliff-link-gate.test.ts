/**
 * V12 Ability×CliffCascade Link — 金手指 × 跨集叠钩, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAbilityCliffLink } from '@/agents/assembly/ability-cliff-link-gate';

type S = { durSec: number; beatRole?: string; action?: string };
const spec = (episode: string, shots: S[]) => ({
  episode,
  shots: shots.map((s, i) => ({ shotId: `${episode}-S${i}`, cast: [], ...s })),
});
const prevGood = (): S[] => [
  { durSec: 4, beatRole: 'hook', action: '危机开场' },
  { durSec: 8, beatRole: 'increment', action: '追查线索' },
  { durSec: 8, beatRole: 'reversal', action: '身份暴露' },
  { durSec: 10, beatRole: 'cliffhanger', action: '持械闯入皇城大门被围' },
];
const nextGood = (): S[] => [
  { durSec: 2, beatRole: 'hook', action: '皇城门口持械对峙未解' },
  { durSec: 2, beatRole: 'increment', action: '追兵逼近' },
  { durSec: 10, beatRole: 'reversal', action: '旧友现身' },
  { durSec: 8, beatRole: 'cliffhanger', action: '下一场更大危机' },
];

const cliff = {
  id: 'C9-10',
  prevEp: 9,
  nextEp: 10,
  prev: spec('EP09', prevGood()),
  next: spec('EP10', nextGood()),
};

const seer = {
  id: 'seer',
  holder: 'linyang',
  acquiredEp: 1,
  exclusive: true,
  rule: { cycle: 'day' as const, maxUsesPerCycle: 1, options: ['查验身份', '生存情报'] },
};

const uses = [
  { abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '查验身份' },
  { abilityId: 'seer', by: 'linyang', ep: 9, day: 9, option: '生存情报' },
  { abilityId: 'seer', by: 'linyang', ep: 10, day: 10, option: '查验身份' },
];

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '伪人降临',
  latestEp: 10,
  abilities: [seer],
  uses,
  cliffLinks: [cliff],
  links: [{ id: 'L1', abilityId: 'seer', cliffLinkId: 'C9-10' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateAbilityCliffLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateAbilityCliffLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateAbilityCliffLink', () => {
  it('use in cliff window → PASS', () => {
    const r = evaluateAbilityCliffLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / DUP / UNKNOWN', () => {
    expect(failCodes(evaluateAbilityCliffLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateAbilityCliffLink(
          pack({
            links: [
              { id: 'd', abilityId: 'seer', cliffLinkId: 'C9-10' },
              { id: 'd', abilityId: 'seer', cliffLinkId: 'C9-10' },
            ],
          }),
        ),
      ),
    ).toContain('DUP_ID');
    const r = evaluateAbilityCliffLink(
      pack({
        links: [
          { id: 'a', abilityId: 'ghost', cliffLinkId: 'C9-10' },
          { id: 'b', abilityId: 'seer', cliffLinkId: 'ghost' },
        ],
      }),
    );
    expect(failCodes(r)).toEqual(expect.arrayContaining(['UNKNOWN_ABILITY', 'UNKNOWN_CLIFF']));
  });

  it('no use in window → NO_USE_IN_WINDOW', () => {
    expect(
      failCodes(
        evaluateAbilityCliffLink(
          pack({
            uses: [
              { abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '查验身份' },
              { abilityId: 'seer', by: 'linyang', ep: 2, day: 2, option: '生存情报' },
              { abilityId: 'seer', by: 'linyang', ep: 3, day: 3, option: '查验身份' },
            ],
          }),
        ),
      ),
    ).toContain('NO_USE_IN_WINDOW');
  });

  it('cliff without link → CLIFF_WITHOUT_ABILITY', () => {
    expect(failCodes(evaluateAbilityCliffLink(pack({ links: [] })))).toContain(
      'CLIFF_WITHOUT_ABILITY',
    );
  });

  it('unlinked ability → PENDING_ABILITY WARN', () => {
    const r = evaluateAbilityCliffLink(
      pack({
        abilities: [
          seer,
          {
            id: 'extra',
            holder: 'linyang',
            acquiredEp: 2,
            rule: { cycle: 'unlimited' as const, options: ['旁路'] },
          },
        ],
        uses: [
          ...uses,
          { abilityId: 'extra', by: 'linyang', ep: 2, option: '旁路' },
        ],
      }),
    );
    expect(warnCodes(r)).toContain('PENDING_ABILITY');
    expect(r.verdict).toBe('PASS');
  });
});
