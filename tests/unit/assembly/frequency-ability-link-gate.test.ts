/** V12 Frequency×Ability Link — tipping × 金手指, offline, ≠Final ≠G3. */
import { describe, expect, it } from 'vitest';
import { evaluateFrequencyAbilityLink } from '@/agents/assembly/frequency-ability-link-gate';

const foresee = {
  id: 'foresee',
  holder: 'linming',
  acquiredEp: 1,
  rule: { cycle: 'episode' as const, maxUsesPerCycle: 1 },
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '一块钱硬币',
  latestEp: 10,
  frequencies: [
    {
      id: '觉醒日',
      actor: '林铭',
      motif: '预知觉醒',
      unit: 'count' as const,
      threshold: 1,
      plantEp: 1,
      ticks: [{ ep: 1, n: 1, label: '离婚关口觉醒' }],
      tipEp: 1,
      tipLabel: '觉醒预知',
    },
  ],
  abilities: [foresee],
  uses: [{ abilityId: 'foresee', by: 'linming', ep: 1 }],
  links: [{ id: 'L1', frequencyId: '觉醒日', abilityId: 'foresee' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateFrequencyAbilityLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateFrequencyAbilityLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateFrequencyAbilityLink', () => {
  it('tipEp has ability use → PASS', () => {
    const r = evaluateFrequencyAbilityLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / DUP / UNKNOWN', () => {
    expect(failCodes(evaluateFrequencyAbilityLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateFrequencyAbilityLink(
          pack({
            links: [
              { id: 'd', frequencyId: '觉醒日', abilityId: 'foresee' },
              { id: 'd', frequencyId: '觉醒日', abilityId: 'foresee' },
            ],
          }),
        ),
      ),
    ).toContain('DUP_ID');
    const r = evaluateFrequencyAbilityLink(
      pack({
        links: [
          { id: 'a', frequencyId: 'ghost', abilityId: 'foresee' },
          { id: 'b', frequencyId: '觉醒日', abilityId: 'ghost' },
        ],
      }),
    );
    expect(failCodes(r)).toEqual(
      expect.arrayContaining(['UNKNOWN_FREQUENCY', 'UNKNOWN_ABILITY']),
    );
  });

  it('tip without use → TIP_WITHOUT_USE', () => {
    // keep ability child green: use on another ep, but not tip ep — wait, maxFirstUseGap and dormant
    // tip at 1, use at 2 only → TIP_WITHOUT_USE; ability still used within gap
    const r = evaluateFrequencyAbilityLink(
      pack({
        uses: [{ abilityId: 'foresee', by: 'linming', ep: 2 }],
        frequencies: [
          {
            id: '觉醒日',
            actor: '林铭',
            motif: '预知觉醒',
            unit: 'count',
            threshold: 1,
            plantEp: 1,
            ticks: [{ ep: 1, n: 1 }],
            tipEp: 1,
            tipLabel: '觉醒预知',
          },
        ],
        latestEp: 2,
      }),
    );
    expect(failCodes(r)).toContain('TIP_WITHOUT_USE');
  });

  it('no tip yet → PENDING_PAIR WARN', () => {
    const r = evaluateFrequencyAbilityLink(
      pack({
        frequencies: [
          {
            id: '觉醒日',
            actor: '林铭',
            motif: '预知觉醒',
            unit: 'count',
            threshold: 3,
            plantEp: 1,
            ticks: [{ ep: 1, n: 1 }],
          },
        ],
        uses: [{ abilityId: 'foresee', by: 'linming', ep: 1 }],
        latestEp: 2,
      }),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('PENDING_PAIR');
  });
});
