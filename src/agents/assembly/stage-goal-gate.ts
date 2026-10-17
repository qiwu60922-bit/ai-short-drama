/**
 * V12 · Stage Goal Gate (季级阶段目标 / 倒计时账本闸门), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (synopses / chart pages, no footage) of 2026-10 红果 hits:
 *  - 《公路求生榜一…》: 标题即终点——「走到公路尽头」是全季可追踪的 destination goal；开场倒计时。
 *  - 《持械入宋》: 每季有独立阶段目标（安村→军火库→朝局→西北），季末开放、下季承接。
 *  - 《天幕直播》: 访客时限倒计时推动节奏。
 *
 * Distinct from cliffhanger-handoff (季间悬念承接) and foreshadow-ledger (伏笔发酵):
 * this gate audits whether the season has a declared destination and keeps advancing it.
 *
 *  SCHEMA (FAIL)            ledger fails StageGoalLedgerSchema
 *  DUP_ID (FAIL)            goal / countdown id duplicated
 *  UNKNOWN_GOAL (FAIL)      progress references an undeclared goal
 *  FUTURE_EP (FAIL)         startEp / dueEp / progress.ep / countdown deadlines beyond latestEp window misuse
 *  NO_ACTIVE_GOAL (FAIL)    season has zero open goals at latestEp
 *  GOAL_STALLED (FAIL)      open goal with no advancing progress for > maxStallEps (default 5)
 *  DEADLINE_MISSED (FAIL)   goal/countdown past dueEp without status=met
 *  PROGRESS_BEFORE_START (FAIL) progress.ep < goal.startEp
 *  MET_WITHOUT_ADVANCE (WARN) status=met but no advancing progress row
 *  COUNTDOWN_TIGHT (WARN)   countdown remainingEps <= warnRemainingEps (default 2) and still open
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';

const Ep = z.number().int().positive();

export const StageGoalEntrySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  destination: z.string().min(1),
  startEp: Ep,
  dueEp: Ep.optional(),
  status: z.enum(['open', 'met', 'failed']),
  note: z.string().optional(),
});

export const StageProgressSchema = z.object({
  goalId: z.string().min(1),
  ep: Ep,
  advances: z.boolean(),
  note: z.string().optional(),
});

export const StageCountdownSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  startEp: Ep,
  deadlineEp: Ep,
  status: z.enum(['open', 'met', 'expired']).optional(),
  note: z.string().optional(),
});

export const StageGoalLedgerSchema = z.object({
  series: z.string().min(1),
  seasonId: z.string().min(1),
  latestEp: Ep,
  goals: z.array(StageGoalEntrySchema).min(1),
  progress: z.array(StageProgressSchema),
  countdowns: z.array(StageCountdownSchema).optional(),
});

export type StageGoalLedger = z.infer<typeof StageGoalLedgerSchema>;

export interface StageGoalOptions {
  maxStallEps?: number;
  warnRemainingEps?: number;
}

export const STAGE_GOAL_DEFAULTS: Required<StageGoalOptions> = {
  maxStallEps: 5,
  warnRemainingEps: 2,
};

export type StageGoalFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_GOAL'
    | 'FUTURE_EP'
    | 'NO_ACTIVE_GOAL'
    | 'GOAL_STALLED'
    | 'DEADLINE_MISSED'
    | 'PROGRESS_BEFORE_START'
    | 'MET_WITHOUT_ADVANCE'
    | 'COUNTDOWN_TIGHT';
  severity: 'FAIL' | 'WARN';
  message: string;
  ids?: string[];
};

export interface StageGoalReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    goals: number;
    openGoals: number;
    stalled: number;
    missedDeadlines: number;
    countdowns: number;
    latestEp: number;
  };
  findings: StageGoalFinding[];
  thresholds: Required<StageGoalOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateStageGoals(input: unknown, opts: StageGoalOptions = {}): StageGoalReport {
  const t: Required<StageGoalOptions> = { ...STAGE_GOAL_DEFAULTS, ...opts };
  const empty = {
    goals: 0,
    openGoals: 0,
    stalled: 0,
    missedDeadlines: 0,
    countdowns: 0,
    latestEp: 0,
  };
  const parsed = StageGoalLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: empty,
      findings: [
        {
          code: 'SCHEMA',
          severity: 'FAIL',
          message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        },
      ],
      thresholds: t,
      gates: GATES,
    };
  }

  const ledger = parsed.data;
  const findings: StageGoalFinding[] = [];
  const goalIds = new Set<string>();
  for (const g of ledger.goals) {
    if (goalIds.has(g.id)) {
      findings.push({ code: 'DUP_ID', severity: 'FAIL', message: `duplicate goal id ${g.id}`, ids: [g.id] });
    }
    goalIds.add(g.id);
    if (g.startEp > ledger.latestEp) {
      findings.push({
        code: 'FUTURE_EP',
        severity: 'FAIL',
        message: `goal ${g.id} startEp ${g.startEp} > latestEp ${ledger.latestEp}`,
        ids: [g.id],
      });
    }
    if (g.dueEp !== undefined && g.dueEp < g.startEp) {
      findings.push({
        code: 'SCHEMA',
        severity: 'FAIL',
        message: `goal ${g.id} dueEp ${g.dueEp} < startEp ${g.startEp}`,
        ids: [g.id],
      });
    }
  }

  const cdIds = new Set<string>();
  for (const c of ledger.countdowns ?? []) {
    if (cdIds.has(c.id)) {
      findings.push({ code: 'DUP_ID', severity: 'FAIL', message: `duplicate countdown id ${c.id}`, ids: [c.id] });
    }
    cdIds.add(c.id);
    if (c.deadlineEp < c.startEp) {
      findings.push({
        code: 'SCHEMA',
        severity: 'FAIL',
        message: `countdown ${c.id} deadlineEp < startEp`,
        ids: [c.id],
      });
    }
  }

  const byGoal = new Map(ledger.goals.map((g) => [g.id, g]));
  for (const p of ledger.progress) {
    const g = byGoal.get(p.goalId);
    if (!g) {
      findings.push({
        code: 'UNKNOWN_GOAL',
        severity: 'FAIL',
        message: `progress references unknown goal ${p.goalId}`,
        ids: [p.goalId],
      });
      continue;
    }
    if (p.ep > ledger.latestEp) {
      findings.push({
        code: 'FUTURE_EP',
        severity: 'FAIL',
        message: `progress for ${p.goalId} at ep ${p.ep} > latestEp ${ledger.latestEp}`,
        ids: [p.goalId],
      });
    }
    if (p.ep < g.startEp) {
      findings.push({
        code: 'PROGRESS_BEFORE_START',
        severity: 'FAIL',
        message: `progress for ${p.goalId} at ep ${p.ep} before startEp ${g.startEp}`,
        ids: [p.goalId],
      });
    }
  }

  const openGoals = ledger.goals.filter((g) => g.status === 'open' && g.startEp <= ledger.latestEp);
  if (openGoals.length === 0) {
    findings.push({
      code: 'NO_ACTIVE_GOAL',
      severity: 'FAIL',
      message: `season ${ledger.seasonId} has no open goal at latestEp ${ledger.latestEp}`,
    });
  }

  let stalled = 0;
  let missed = 0;
  for (const g of ledger.goals) {
    if (g.startEp > ledger.latestEp) continue;
    const advancing = ledger.progress
      .filter((p) => p.goalId === g.id && p.advances)
      .sort((a, b) => a.ep - b.ep);
    if (g.status === 'open') {
      const last = advancing.length ? advancing[advancing.length - 1].ep : g.startEp - 1;
      const gap = ledger.latestEp - last;
      if (gap > t.maxStallEps) {
        stalled += 1;
        findings.push({
          code: 'GOAL_STALLED',
          severity: 'FAIL',
          message: `goal ${g.id} stalled ${gap} eps (max ${t.maxStallEps}); destination「${g.destination}」`,
          ids: [g.id],
        });
      }
      if (g.dueEp !== undefined && ledger.latestEp > g.dueEp) {
        missed += 1;
        findings.push({
          code: 'DEADLINE_MISSED',
          severity: 'FAIL',
          message: `goal ${g.id} still open past dueEp ${g.dueEp}`,
          ids: [g.id],
        });
      }
    }
    if (g.status === 'met' && advancing.length === 0) {
      findings.push({
        code: 'MET_WITHOUT_ADVANCE',
        severity: 'WARN',
        message: `goal ${g.id} marked met without advancing progress`,
        ids: [g.id],
      });
    }
  }

  for (const c of ledger.countdowns ?? []) {
    const status = c.status ?? (ledger.latestEp > c.deadlineEp ? 'expired' : 'open');
    if (status === 'open' && ledger.latestEp > c.deadlineEp) {
      missed += 1;
      findings.push({
        code: 'DEADLINE_MISSED',
        severity: 'FAIL',
        message: `countdown ${c.id}「${c.label}」open past deadlineEp ${c.deadlineEp}`,
        ids: [c.id],
      });
    } else if (status === 'open') {
      const remaining = c.deadlineEp - ledger.latestEp;
      if (remaining <= t.warnRemainingEps) {
        findings.push({
          code: 'COUNTDOWN_TIGHT',
          severity: 'WARN',
          message: `countdown ${c.id} has ${remaining} eps left (≤ ${t.warnRemainingEps})`,
          ids: [c.id],
        });
      }
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      goals: ledger.goals.length,
      openGoals: openGoals.length,
      stalled,
      missedDeadlines: missed,
      countdowns: (ledger.countdowns ?? []).length,
      latestEp: ledger.latestEp,
    },
    findings,
    thresholds: t,
    gates: GATES,
  };
}
