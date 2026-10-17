/**
 * V12 Stage Goal Gate — 季级阶段目标 / 倒计时账本, offline, ≠Final ≠G3.
 * Reverse-engineered (public text/structure only) from 红果 hits 2026-10-15/16:
 * 《公路求生榜一…》(走到公路尽头 destination + 开场倒计时),
 * 《持械入宋》(每季独立阶段目标), 《天幕直播》(访客时限倒计时).
 */
import { describe, expect, it } from 'vitest';
import { evaluateStageGoals, STAGE_GOAL_DEFAULTS } from '@/agents/assembly/stage-goal-gate';

const base = (over: Record<string, unknown> = {}) => ({
  series: 'T',
  seasonId: 'S1',
  latestEp: 6,
  goals: [
    {
      id: 'road-end',
      label: '走到公路尽头',
      destination: '公路尽头',
      startEp: 1,
      dueEp: 20,
      status: 'open',
    },
  ],
  progress: [
    { goalId: 'road-end', ep: 1, advances: true, note: '上路' },
    { goalId: 'road-end', ep: 3, advances: true, note: '过卡' },
    { goalId: 'road-end', ep: 6, advances: true, note: '近了' },
  ],
  countdowns: [{ id: 'fuel', label: '燃油剩余', startEp: 1, deadlineEp: 10, status: 'open' }],
  ...over,
});

const failCodes = (r: ReturnType<typeof evaluateStageGoals>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateStageGoals>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateStageGoals', () => {
  it('exposes defaults: maxStallEps=5, warnRemainingEps=2', () => {
    expect(STAGE_GOAL_DEFAULTS).toEqual({ maxStallEps: 5, warnRemainingEps: 2 });
  });

  it('open destination goal with advancing progress → PASS; gates untouched', () => {
    const r = evaluateStageGoals(base());
    expect(r.verdict).toBe('PASS');
    expect(r.findings).toEqual([]);
    expect(r.metrics).toMatchObject({ goals: 1, openGoals: 1, stalled: 0, latestEp: 6 });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('bad schema → SCHEMA FAIL', () => {
    const r = evaluateStageGoals({ series: 'T' });
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toEqual(['SCHEMA']);
  });

  it('duplicate goal id → DUP_ID FAIL', () => {
    const r = evaluateStageGoals(
      base({
        goals: [
          { id: 'g', label: 'a', destination: 'x', startEp: 1, status: 'open' },
          { id: 'g', label: 'b', destination: 'y', startEp: 1, status: 'open' },
        ],
        progress: [{ goalId: 'g', ep: 1, advances: true }],
        countdowns: [],
      }),
    );
    expect(failCodes(r)).toContain('DUP_ID');
  });

  it('progress on unknown goal → UNKNOWN_GOAL FAIL', () => {
    const r = evaluateStageGoals(base({ progress: [{ goalId: 'nope', ep: 1, advances: true }] }));
    expect(failCodes(r)).toContain('UNKNOWN_GOAL');
  });

  it('all goals met/failed and none open → NO_ACTIVE_GOAL FAIL', () => {
    const r = evaluateStageGoals(
      base({
        goals: [
          {
            id: 'road-end',
            label: '走到公路尽头',
            destination: '公路尽头',
            startEp: 1,
            status: 'met',
          },
        ],
        progress: [{ goalId: 'road-end', ep: 1, advances: true }],
        countdowns: [],
      }),
    );
    expect(failCodes(r)).toContain('NO_ACTIVE_GOAL');
  });

  it('no advancing progress for > maxStallEps → GOAL_STALLED FAIL', () => {
    const r = evaluateStageGoals(
      base({
        latestEp: 10,
        progress: [{ goalId: 'road-end', ep: 1, advances: true }],
        countdowns: [],
      }),
    );
    expect(failCodes(r)).toContain('GOAL_STALLED');
    expect(r.metrics.stalled).toBe(1);
  });

  it('open past dueEp → DEADLINE_MISSED FAIL', () => {
    const r = evaluateStageGoals(
      base({
        latestEp: 12,
        goals: [
          {
            id: 'road-end',
            label: '走到公路尽头',
            destination: '公路尽头',
            startEp: 1,
            dueEp: 10,
            status: 'open',
          },
        ],
        progress: [
          { goalId: 'road-end', ep: 1, advances: true },
          { goalId: 'road-end', ep: 12, advances: true },
        ],
        countdowns: [],
      }),
    );
    expect(failCodes(r)).toContain('DEADLINE_MISSED');
  });

  it('progress before startEp → PROGRESS_BEFORE_START FAIL', () => {
    const r = evaluateStageGoals(
      base({
        goals: [
          {
            id: 'road-end',
            label: '走到公路尽头',
            destination: '公路尽头',
            startEp: 3,
            status: 'open',
          },
        ],
        progress: [{ goalId: 'road-end', ep: 1, advances: true }],
        countdowns: [],
      }),
    );
    expect(failCodes(r)).toContain('PROGRESS_BEFORE_START');
  });

  it('met without advancing progress → MET_WITHOUT_ADVANCE WARN', () => {
    const r = evaluateStageGoals(
      base({
        goals: [
          {
            id: 'road-end',
            label: '走到公路尽头',
            destination: '公路尽头',
            startEp: 1,
            status: 'met',
          },
          {
            id: 'next',
            label: '下一站',
            destination: '军火库',
            startEp: 5,
            status: 'open',
          },
        ],
        progress: [{ goalId: 'next', ep: 5, advances: true }],
        countdowns: [],
      }),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('MET_WITHOUT_ADVANCE');
  });

  it('countdown nearly due → COUNTDOWN_TIGHT WARN', () => {
    const r = evaluateStageGoals(
      base({
        latestEp: 9,
        progress: [
          { goalId: 'road-end', ep: 1, advances: true },
          { goalId: 'road-end', ep: 9, advances: true },
        ],
        countdowns: [{ id: 'fuel', label: '燃油剩余', startEp: 1, deadlineEp: 10, status: 'open' }],
      }),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('COUNTDOWN_TIGHT');
  });

  it('open countdown past deadline → DEADLINE_MISSED FAIL', () => {
    const r = evaluateStageGoals(
      base({
        latestEp: 12,
        progress: [
          { goalId: 'road-end', ep: 1, advances: true },
          { goalId: 'road-end', ep: 12, advances: true },
        ],
        countdowns: [{ id: 'fuel', label: '燃油剩余', startEp: 1, deadlineEp: 10, status: 'open' }],
        goals: [
          {
            id: 'road-end',
            label: '走到公路尽头',
            destination: '公路尽头',
            startEp: 1,
            status: 'open',
          },
        ],
      }),
    );
    expect(failCodes(r)).toContain('DEADLINE_MISSED');
  });
});
