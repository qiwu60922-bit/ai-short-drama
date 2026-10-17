/**
 * V12 Ability Rule Gate — 金手指规则账本（次数/周期/互斥选项/唯一持有/拿到就用）, offline, ≠Final ≠G3.
 * Reverse-engineered (public text/structure only) from 红果 hits 2026-10-16:
 * 《伪人降临！我是全场唯一预言家》(“您每日可查验一人身份，或获得一份生存情报” — 每日 1 次、二选一、全场唯一),
 * 《一块钱硬币，玩出万亿商业帝国》(离婚关口觉醒预知 → 立刻预判车祸救人：拿到就用),
 * 《家有五女，穿越来的他连夜搞事业啦》(天崩开局当集亮出现代知识金手指，1000 集靠它持续推进).
 */
import { describe, expect, it } from 'vitest';
import {
  evaluateAbilityRules,
  ABILITY_RULE_DEFAULTS,
} from '@/agents/assembly/ability-rule-gate';

const seer = {
  id: 'seer',
  holder: 'linyang',
  acquiredEp: 1,
  exclusive: true,
  rule: { cycle: 'day', maxUsesPerCycle: 1, options: ['查验身份', '生存情报'] },
};

const ledger = (
  uses: Array<Record<string, unknown>>,
  opts: { latestEp?: number; abilities?: Array<Record<string, unknown>> } = {},
) => ({
  series: 'T',
  latestEp: opts.latestEp ?? 4,
  abilities: opts.abilities ?? [seer],
  uses,
});

const failCodes = (r: ReturnType<typeof evaluateAbilityRules>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateAbilityRules>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateAbilityRules', () => {
  it('exposes defaults: maxFirstUseGapEps=1 (拿到就用), maxDormantEps=3', () => {
    expect(ABILITY_RULE_DEFAULTS).toEqual({ maxFirstUseGapEps: 1, maxDormantEps: 3 });
  });

  it('one use per story day with a valid option → PASS; gates untouched', () => {
    const r = evaluateAbilityRules(
      ledger([
        { abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '查验身份' },
        { abilityId: 'seer', by: 'linyang', ep: 2, day: 2, option: '生存情报' },
        { abilityId: 'seer', by: 'linyang', ep: 3, day: 3, option: '查验身份' },
        { abilityId: 'seer', by: 'linyang', ep: 4, day: 4, option: '查验身份' },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.findings).toEqual([]);
    expect(r.metrics).toMatchObject({ abilities: 1, uses: 4, overBudget: 0, latestEp: 4 });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('two uses on the same story day (每日仅一次) → OVER_BUDGET FAIL', () => {
    const r = evaluateAbilityRules(
      ledger([
        { abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '查验身份' },
        { abilityId: 'seer', by: 'linyang', ep: 2, day: 1, option: '生存情报' },
      ]),
    );
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('OVER_BUDGET');
    expect(r.metrics.overBudget).toBe(1);
    expect(r.findings.find((f) => f.code === 'OVER_BUDGET')?.ids).toEqual(['seer']);
  });

  it('episode-cycle ability budget counts per episode', () => {
    const r = evaluateAbilityRules(
      ledger(
        [
          { abilityId: 'foresee', by: 'linming', ep: 1 },
          { abilityId: 'foresee', by: 'linming', ep: 1 },
          { abilityId: 'foresee', by: 'linming', ep: 2 },
        ],
        {
          latestEp: 2,
          abilities: [
            { id: 'foresee', holder: 'linming', acquiredEp: 1, rule: { cycle: 'episode', maxUsesPerCycle: 1 } },
          ],
        },
      ),
    );
    expect(failCodes(r)).toEqual(['OVER_BUDGET']);
  });

  it('unlimited ability never hits OVER_BUDGET', () => {
    const r = evaluateAbilityRules(
      ledger(
        [
          { abilityId: 'modern', by: 'qinlang', ep: 1 },
          { abilityId: 'modern', by: 'qinlang', ep: 1 },
          { abilityId: 'modern', by: 'qinlang', ep: 1 },
        ],
        { latestEp: 1, abilities: [{ id: 'modern', holder: 'qinlang', acquiredEp: 1, rule: { cycle: 'unlimited' } }] },
      ),
    );
    expect(r.verdict).toBe('PASS');
  });

  it('option outside the declared either/or set → OPTION_INVALID; missing option → OPTION_MISSING', () => {
    const r = evaluateAbilityRules(
      ledger([
        { abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '复活队友' },
        { abilityId: 'seer', by: 'linyang', ep: 2, day: 2 },
      ]),
    );
    expect(failCodes(r)).toEqual(expect.arrayContaining(['OPTION_INVALID', 'OPTION_MISSING']));
  });

  it('day-cycle use without a story day → DAY_REQUIRED FAIL', () => {
    const r = evaluateAbilityRules(ledger([{ abilityId: 'seer', by: 'linyang', ep: 1, option: '查验身份' }]));
    expect(failCodes(r)).toContain('DAY_REQUIRED');
  });

  it('story day going backwards across episodes → DAY_REGRESSION FAIL', () => {
    const r = evaluateAbilityRules(
      ledger([
        { abilityId: 'seer', by: 'linyang', ep: 1, day: 3, option: '查验身份' },
        { abilityId: 'seer', by: 'linyang', ep: 2, day: 2, option: '查验身份' },
      ]),
    );
    expect(failCodes(r)).toContain('DAY_REGRESSION');
  });

  it('exclusive ability used by someone else (全场唯一) → HOLDER_MISMATCH FAIL', () => {
    const r = evaluateAbilityRules(
      ledger([
        { abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '查验身份' },
        { abilityId: 'seer', by: 'jiangyuan', ep: 2, day: 2, option: '查验身份' },
      ]),
    );
    expect(failCodes(r)).toEqual(['HOLDER_MISMATCH']);
  });

  it('non-exclusive ability may be used by others', () => {
    const r = evaluateAbilityRules(
      ledger(
        [
          { abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '查验身份' },
          { abilityId: 'seer', by: 'jiangyuan', ep: 2, day: 2, option: '查验身份' },
        ],
        { latestEp: 2, abilities: [{ ...seer, exclusive: false }] },
      ),
    );
    expect(r.verdict).toBe('PASS');
  });

  it('use before acquiredEp → USE_BEFORE_ACQUIRED; unknown ability → UNKNOWN_ABILITY', () => {
    const r = evaluateAbilityRules(
      ledger(
        [
          { abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '查验身份' },
          { abilityId: 'seer', by: 'linyang', ep: 2, day: 2, option: '查验身份' },
          { abilityId: 'ghost', by: 'linyang', ep: 2 },
        ],
        { latestEp: 2, abilities: [{ ...seer, acquiredEp: 2 }] },
      ),
    );
    expect(failCodes(r)).toEqual(expect.arrayContaining(['USE_BEFORE_ACQUIRED', 'UNKNOWN_ABILITY']));
  });

  it('first use more than 1 ep after acquisition (拿到不用) → FIRST_USE_LATE FAIL', () => {
    const r = evaluateAbilityRules(
      ledger([{ abilityId: 'seer', by: 'linyang', ep: 3, day: 3, option: '查验身份' }]),
    );
    expect(failCodes(r)).toContain('FIRST_USE_LATE');
  });

  it('acquired but never used past the window → ABILITY_UNUSED FAIL; inside window → WARN UNUSED_PENDING', () => {
    const overdue = evaluateAbilityRules(ledger([], { latestEp: 3 }));
    expect(failCodes(overdue)).toEqual(['ABILITY_UNUSED']);
    const pending = evaluateAbilityRules(ledger([], { latestEp: 2 }));
    expect(pending.verdict).toBe('PASS');
    expect(warnCodes(pending)).toEqual(['UNUSED_PENDING']);
  });

  it('long silence between uses (金手指熄火) → ABILITY_DORMANT WARN only', () => {
    const r = evaluateAbilityRules(
      ledger(
        [
          { abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '查验身份' },
          { abilityId: 'seer', by: 'linyang', ep: 6, day: 6, option: '查验身份' },
        ],
        { latestEp: 6 },
      ),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('ABILITY_DORMANT');
    expect(r.metrics.dormant).toBe(1);
  });

  it('tail silence up to latestEp also counts as dormant; thresholds are overridable', () => {
    const r = evaluateAbilityRules(
      ledger([{ abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '查验身份' }], { latestEp: 5 }),
    );
    expect(warnCodes(r)).toContain('ABILITY_DORMANT');
    const relaxed = evaluateAbilityRules(
      ledger([{ abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '查验身份' }], { latestEp: 5 }),
      { maxDormantEps: 10 },
    );
    expect(relaxed.findings).toEqual([]);
    expect(relaxed.thresholds.maxDormantEps).toBe(10);
  });

  it('future episodes → FUTURE_EP; duplicate ability id → DUP_ID', () => {
    const r = evaluateAbilityRules(
      ledger([{ abilityId: 'seer', by: 'linyang', ep: 9, day: 9, option: '查验身份' }], {
        latestEp: 4,
        abilities: [seer, { ...seer }],
      }),
    );
    expect(failCodes(r)).toEqual(expect.arrayContaining(['FUTURE_EP', 'DUP_ID']));
  });

  it('bad shape → SCHEMA FAIL (maxUsesPerCycle required for bounded cycles)', () => {
    expect(failCodes(evaluateAbilityRules({ series: 'T' }))).toEqual(['SCHEMA']);
    const r = evaluateAbilityRules(
      ledger([], { abilities: [{ id: 'x', holder: 'a', acquiredEp: 1, rule: { cycle: 'day' } }] }),
    );
    expect(failCodes(r)).toEqual(['SCHEMA']);
  });
});
