/**
 * V12 Stage-Goal × Conflict Link — 季目标 × 冲突快兑现, offline, ≠Final ≠G3.
 * 《公路求生榜一…》《持械入宋》《帐中香》结构层对照.
 */
import { describe, expect, it } from 'vitest';
import { evaluateStageGoalConflictLink } from '@/agents/assembly/stage-goal-conflict-link-gate';

const goalOpen = {
  id: 'road-end',
  label: '走到公路尽头',
  destination: '公路尽头',
  startEp: 1,
  dueEp: 20,
  status: 'open' as const,
};

const pack = (
  extra: {
    goals?: Array<Record<string, unknown>>;
    progress?: Array<Record<string, unknown>>;
    conflicts?: Array<Record<string, unknown>>;
    links?: Array<Record<string, unknown>>;
    latestEp?: number;
    seasonId?: string;
  } = {},
) => ({
  series: '公路求生',
  seasonId: extra.seasonId ?? 'S1',
  latestEp: extra.latestEp ?? 6,
  goals: extra.goals ?? [goalOpen],
  progress: extra.progress ?? [
    { goalId: 'road-end', ep: 1, advances: true, note: '上路' },
    { goalId: 'road-end', ep: 3, advances: true, note: '过卡' },
    { goalId: 'road-end', ep: 6, advances: true, note: '近了' },
  ],
  conflicts: extra.conflicts ?? [
    { id: 'C1', name: '首杀', openEp: 1, openAtSec: 10, payoffEp: 1, payoffAtSec: 40 },
  ],
  links: extra.links ?? [{ id: 'L1', goalId: 'road-end', conflictId: 'C1' }],
});

const failCodes = (r: ReturnType<typeof evaluateStageGoalConflictLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateStageGoalConflictLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateStageGoalConflictLink', () => {
  it('goal advancing + conflict paid same-ep → PASS; gates untouched', () => {
    const r = evaluateStageGoalConflictLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics).toMatchObject({ links: 1, aligned: 1, pending: 0 });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
    expect(failCodes(r)).toEqual([]);
  });

  it('bad schema → SCHEMA FAIL', () => {
    expect(failCodes(evaluateStageGoalConflictLink({ series: 'T' }))).toContain('SCHEMA');
  });

  it('dup link → DUP_ID FAIL', () => {
    const r = evaluateStageGoalConflictLink(
      pack({
        links: [
          { id: 'dup', goalId: 'road-end', conflictId: 'C1' },
          { id: 'dup', goalId: 'road-end', conflictId: 'C1' },
        ],
      }),
    );
    expect(failCodes(r)).toContain('DUP_ID');
  });

  it('unknown goal/conflict → UNKNOWN_* FAIL', () => {
    const r = evaluateStageGoalConflictLink(
      pack({
        links: [
          { id: 'a', goalId: 'ghost', conflictId: 'C1' },
          { id: 'b', goalId: 'road-end', conflictId: 'ghost' },
        ],
      }),
    );
    expect(failCodes(r)).toEqual(expect.arrayContaining(['UNKNOWN_GOAL', 'UNKNOWN_CONFLICT']));
  });

  it('conflict.openEp < goal.startEp → CONFLICT_BEFORE_START FAIL', () => {
    const r = evaluateStageGoalConflictLink(
      pack({
        goals: [{ ...goalOpen, startEp: 5 }],
        progress: [
          { goalId: 'road-end', ep: 5, advances: true },
          { goalId: 'road-end', ep: 6, advances: true },
        ],
        conflicts: [{ id: 'C1', openEp: 2, payoffEp: 2 }],
      }),
    );
    expect(failCodes(r)).toContain('CONFLICT_BEFORE_START');
  });

  it('payoff without advancing progress → PAYOFF_WITHOUT_PROGRESS FAIL', () => {
    const r = evaluateStageGoalConflictLink(
      pack({
        // keep stage child green: progress at ep6 advances, but NONE at/before payoff ep2
        // Wait — need advances at some point for stall, but none ≤ payoffEp=2
        progress: [
          { goalId: 'road-end', ep: 5, advances: true },
          { goalId: 'road-end', ep: 6, advances: true },
        ],
        conflicts: [{ id: 'C1', openEp: 1, payoffEp: 2 }],
        latestEp: 6,
      }),
    );
    expect(failCodes(r)).toContain('PAYOFF_WITHOUT_PROGRESS');
  });

  it('goal met with open conflict (season still has active goal) → GOAL_MET_WITH_OPEN_CONFLICT', () => {
    const r = evaluateStageGoalConflictLink(
      pack({
        goals: [
          { ...goalOpen, id: 'done', status: 'met', startEp: 1, dueEp: 4 },
          {
            id: 'next',
            label: '下一站',
            destination: '军火库',
            startEp: 1,
            status: 'open',
            dueEp: 20,
          },
        ],
        progress: [
          { goalId: 'done', ep: 1, advances: true },
          { goalId: 'done', ep: 3, advances: true },
          { goalId: 'next', ep: 1, advances: true },
          { goalId: 'next', ep: 6, advances: true },
        ],
        // conflict open at ep6, gap=0 from openEp=6 → within window (OPEN_PENDING WARN on child, not FAIL)
        conflicts: [{ id: 'C1', openEp: 6 }],
        links: [{ id: 'L1', goalId: 'done', conflictId: 'C1' }],
        latestEp: 6,
      }),
    );
    expect(failCodes(r)).toContain('GOAL_MET_WITH_OPEN_CONFLICT');
  });

  it('open goal + unpaid conflict in window → PENDING_PAIR WARN + PASS', () => {
    const r = evaluateStageGoalConflictLink(
      pack({
        conflicts: [{ id: 'C1', openEp: 6 }],
        latestEp: 6,
      }),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('PENDING_PAIR');
    expect(r.metrics.pending).toBe(1);
  });

  it('stalled stage child → CHILD_STAGE_FAIL', () => {
    const r = evaluateStageGoalConflictLink(
      pack({
        progress: [{ goalId: 'road-end', ep: 1, advances: true }],
        conflicts: [{ id: 'C1', openEp: 1, payoffEp: 1 }],
        latestEp: 10, // stall > 5 from last advance at 1
      }),
    );
    expect(failCodes(r)).toContain('CHILD_STAGE_FAIL');
  });
});
