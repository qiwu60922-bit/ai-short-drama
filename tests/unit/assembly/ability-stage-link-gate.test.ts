/**
 * V12 Ability×Stage Link — 金手指 × 季目标, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAbilityStageLink } from '@/agents/assembly/ability-stage-link-gate';

const seer = {
  id: 'seer',
  holder: 'linyang',
  acquiredEp: 1,
  exclusive: true,
  rule: { cycle: 'day' as const, maxUsesPerCycle: 1, options: ['查验身份', '生存情报'] },
};

const goal = {
  id: 'find-fake',
  label: '找出伪人',
  destination: '全员真身',
  startEp: 1,
  dueEp: 20,
  status: 'open' as const,
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '伪人降临',
  seasonId: 'S1',
  latestEp: 4,
  abilities: [seer],
  uses: [
    { abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '查验身份' },
    { abilityId: 'seer', by: 'linyang', ep: 2, day: 2, option: '生存情报' },
    { abilityId: 'seer', by: 'linyang', ep: 3, day: 3, option: '查验身份' },
    { abilityId: 'seer', by: 'linyang', ep: 4, day: 4, option: '查验身份' },
  ],
  goals: [goal],
  progress: [
    { goalId: 'find-fake', ep: 1, advances: true },
    { goalId: 'find-fake', ep: 2, advances: true },
    { goalId: 'find-fake', ep: 3, advances: true },
    { goalId: 'find-fake', ep: 4, advances: true },
  ],
  links: [{ id: 'L1', abilityId: 'seer', goalId: 'find-fake' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateAbilityStageLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateAbilityStageLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateAbilityStageLink', () => {
  it('ability uses aligned with goal advances → PASS', () => {
    const r = evaluateAbilityStageLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics).toMatchObject({ links: 1, aligned: 1 });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('bad schema → SCHEMA', () => {
    expect(failCodes(evaluateAbilityStageLink({ series: 'T' }))).toContain('SCHEMA');
  });

  it('dup → DUP_ID', () => {
    expect(
      failCodes(
        evaluateAbilityStageLink(
          pack({
            links: [
              { id: 'd', abilityId: 'seer', goalId: 'find-fake' },
              { id: 'd', abilityId: 'seer', goalId: 'find-fake' },
            ],
          }),
        ),
      ),
    ).toContain('DUP_ID');
  });

  it('unknown → UNKNOWN_*', () => {
    const r = evaluateAbilityStageLink(
      pack({
        links: [
          { id: 'a', abilityId: 'ghost', goalId: 'find-fake' },
          { id: 'b', abilityId: 'seer', goalId: 'ghost' },
        ],
      }),
    );
    expect(failCodes(r)).toEqual(expect.arrayContaining(['UNKNOWN_ABILITY', 'UNKNOWN_GOAL']));
  });

  it('use before goal start → USE_BEFORE_GOAL_START', () => {
    const r = evaluateAbilityStageLink(
      pack({
        goals: [{ ...goal, startEp: 3 }],
        progress: [
          { goalId: 'find-fake', ep: 3, advances: true },
          { goalId: 'find-fake', ep: 4, advances: true },
        ],
      }),
    );
    expect(failCodes(r)).toContain('USE_BEFORE_GOAL_START');
  });

  it('use without same-ep progress → USE_WITHOUT_PROGRESS', () => {
    const r = evaluateAbilityStageLink(
      pack({
        progress: [
          { goalId: 'find-fake', ep: 1, advances: true },
          { goalId: 'find-fake', ep: 2, advances: true },
          // ep3/4 uses exist but no advances there — need advances recently to avoid stall
          { goalId: 'find-fake', ep: 4, advances: false },
        ],
        uses: [
          { abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '查验身份' },
          { abilityId: 'seer', by: 'linyang', ep: 2, day: 2, option: '生存情报' },
          { abilityId: 'seer', by: 'linyang', ep: 4, day: 3, option: '查验身份' },
        ],
      }),
    );
    expect(failCodes(r)).toContain('USE_WITHOUT_PROGRESS');
  });

  it('goal met without use → GOAL_MET_WITHOUT_USE', () => {
    const r = evaluateAbilityStageLink(
      pack({
        goals: [
          { ...goal, id: 'done', status: 'met', startEp: 1, dueEp: 3 },
          {
            id: 'next',
            label: '下一阶段',
            destination: '撤离',
            startEp: 1,
            status: 'open',
            dueEp: 20,
          },
        ],
        progress: [
          { goalId: 'done', ep: 1, advances: true },
          { goalId: 'done', ep: 2, advances: true },
          { goalId: 'next', ep: 1, advances: true },
          { goalId: 'next', ep: 4, advances: true },
        ],
        abilities: [{ ...seer, acquiredEp: 1 }],
        uses: [
          // uses only for keeping ability child green — but link goal "done" has no uses if we filter...
          // Actually windowUses for done would include all seer uses since startEp=1.
          // Need ability that was never used: separate ability linked to done.
          { abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '查验身份' },
          { abilityId: 'seer', by: 'linyang', ep: 2, day: 2, option: '生存情报' },
          { abilityId: 'seer', by: 'linyang', ep: 3, day: 3, option: '查验身份' },
          { abilityId: 'seer', by: 'linyang', ep: 4, day: 4, option: '查验身份' },
        ],
        // link done to a never-used ability
        abilitiesExtra: true,
        links: [{ id: 'L1', abilityId: 'unused', goalId: 'done' }],
      }),
    );
    // fix pack - abilities not merged. redo below in dedicated assertion via full object
    void r;
    const r2 = evaluateAbilityStageLink({
      series: '伪人降临',
      seasonId: 'S1',
      latestEp: 4,
      abilities: [
        seer,
        {
          id: 'unused',
          holder: 'linyang',
          acquiredEp: 1,
          rule: { cycle: 'unlimited' as const },
        },
      ],
      uses: [
        { abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '查验身份' },
        { abilityId: 'seer', by: 'linyang', ep: 2, day: 2, option: '生存情报' },
        { abilityId: 'seer', by: 'linyang', ep: 3, day: 3, option: '查验身份' },
        { abilityId: 'seer', by: 'linyang', ep: 4, day: 4, option: '查验身份' },
      ],
      goals: [
        { ...goal, id: 'done', status: 'met', startEp: 1, dueEp: 3 },
        {
          id: 'next',
          label: '下一阶段',
          destination: '撤离',
          startEp: 1,
          status: 'open',
          dueEp: 20,
        },
      ],
      progress: [
        { goalId: 'done', ep: 1, advances: true },
        { goalId: 'done', ep: 2, advances: true },
        { goalId: 'next', ep: 1, advances: true },
        { goalId: 'next', ep: 4, advances: true },
      ],
      links: [{ id: 'L1', abilityId: 'unused', goalId: 'done' }],
    });
    expect(failCodes(r2)).toContain('GOAL_MET_WITHOUT_USE');
  });

  it('open goal no use → PENDING_PAIR WARN', () => {
    const r = evaluateAbilityStageLink({
      series: 'T',
      seasonId: 'S1',
      latestEp: 4,
      abilities: [
        seer,
        { id: 'pending', holder: 'linyang', acquiredEp: 4, rule: { cycle: 'unlimited' as const } },
      ],
      uses: [
        { abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '查验身份' },
        { abilityId: 'seer', by: 'linyang', ep: 2, day: 2, option: '生存情报' },
        { abilityId: 'seer', by: 'linyang', ep: 3, day: 3, option: '查验身份' },
        { abilityId: 'seer', by: 'linyang', ep: 4, day: 4, option: '查验身份' },
      ],
      goals: [goal],
      progress: [
        { goalId: 'find-fake', ep: 1, advances: true },
        { goalId: 'find-fake', ep: 4, advances: true },
      ],
      links: [{ id: 'L1', abilityId: 'pending', goalId: 'find-fake' }],
    });
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('PENDING_PAIR');
  });
});
