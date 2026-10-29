/**
 * V12 Ability×PeakBeforePayoff Link — 金手指 × 巅峰兑现, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAbilityPeakLink } from '@/agents/assembly/ability-peak-link-gate';

const seer = {
  id: 'seer',
  holder: 'linyang',
  acquiredEp: 1,
  exclusive: true,
  rule: { cycle: 'day' as const, maxUsesPerCycle: 1, options: ['查验身份', '生存情报'] },
};

const peak = {
  id: '预言家对峙',
  openEp: 1,
  peakEp: 8,
  peakLabel: '全场唯一对决',
  payoffEp: 8,
};

const uses = [
  { abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '查验身份' },
  { abilityId: 'seer', by: 'linyang', ep: 2, day: 2, option: '生存情报' },
  { abilityId: 'seer', by: 'linyang', ep: 8, day: 8, option: '查验身份' },
];

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '伪人降临',
  latestEp: 10,
  abilities: [seer],
  uses,
  peaks: [peak],
  links: [{ id: 'L1', abilityId: 'seer', peakId: '预言家对峙' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateAbilityPeakLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateAbilityPeakLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateAbilityPeakLink', () => {
  it('use at peak → PASS', () => {
    const r = evaluateAbilityPeakLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / DUP / UNKNOWN / no use at peak', () => {
    expect(failCodes(evaluateAbilityPeakLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateAbilityPeakLink(
          pack({
            links: [
              { id: 'd', abilityId: 'seer', peakId: '预言家对峙' },
              { id: 'd', abilityId: 'seer', peakId: '预言家对峙' },
            ],
          }),
        ),
      ),
    ).toContain('DUP_ID');
    expect(
      failCodes(
        evaluateAbilityPeakLink(
          pack({
            uses: [
              { abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '查验身份' },
              { abilityId: 'seer', by: 'linyang', ep: 2, day: 2, option: '生存情报' },
              { abilityId: 'seer', by: 'linyang', ep: 3, day: 3, option: '查验身份' },
            ],
          }),
        ),
      ),
    ).toContain('NO_USE_AT_PEAK_OR_PAYOFF');
  });

  it('peak without link → PEAK_WITHOUT_ABILITY', () => {
    expect(failCodes(evaluateAbilityPeakLink(pack({ links: [] })))).toContain(
      'PEAK_WITHOUT_ABILITY',
    );
  });

  it('unlinked ability → PENDING_ABILITY WARN', () => {
    const r = evaluateAbilityPeakLink(
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
        uses: [...uses, { abilityId: 'extra', by: 'linyang', ep: 2, option: '旁路' }],
      }),
    );
    expect(warnCodes(r)).toContain('PENDING_ABILITY');
    expect(r.verdict).toBe('PASS');
  });
});
