/**
 * V12 · Stage-Goal × Conflict-Payoff-Gap Link Gate (季级阶段目标 × 冲突快兑现 跨账本联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text breakdowns (structure only, no footage):
 *  - 《公路求生榜一…》: destination goal「走到公路尽头」推进中，绝境冲突当场反噬，
 *    冲突开集 ≥ goal.startEp；兑现集须有 advances 进度。
 *  - 《持械入宋》: 季目标（安村→军火库）闭环时，挂靠冲突不得仍 OPEN。
 *  - 《帐中香》对照：快兑现冲突服务于阶段推进，而非悬空。
 *
 * Embeds child stage-goal + conflict-payoff-gap (CHILD_* bubbles).
 * Link rules:
 *  SCHEMA / DUP_ID / UNKNOWN_GOAL / UNKNOWN_CONFLICT
 *  CHILD_STAGE_FAIL / CHILD_CONFLICT_FAIL
 *  CONFLICT_BEFORE_START — conflict.openEp < goal.startEp
 *  PAYOFF_WITHOUT_PROGRESS — 已兑现但 goal 在 ≤payoffEp 无 advances 进度
 *  GOAL_MET_WITH_OPEN_CONFLICT — goal 已 met 但挂靠冲突仍无 payoff
 *  PENDING_PAIR (WARN) — goal open + conflict 尚无 payoff
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  StageGoalEntrySchema,
  StageProgressSchema,
  StageCountdownSchema,
  evaluateStageGoals,
} from './stage-goal-gate';
import {
  ConflictEntrySchema,
  evaluateConflictPayoffGap,
} from './conflict-payoff-gap-gate';

const Ep = z.number().int().positive();

export const StageGoalConflictLinkEntrySchema = z.object({
  id: z.string().min(1),
  goalId: z.string().min(1),
  conflictId: z.string().min(1),
  note: z.string().optional(),
});

export const StageGoalConflictLinkLedgerSchema = z.object({
  series: z.string().min(1),
  seasonId: z.string().min(1),
  latestEp: Ep,
  goals: z.array(StageGoalEntrySchema).min(1),
  progress: z.array(StageProgressSchema),
  countdowns: z.array(StageCountdownSchema).optional(),
  conflicts: z.array(ConflictEntrySchema),
  links: z.array(StageGoalConflictLinkEntrySchema),
});

export type StageGoalConflictLinkLedger = z.infer<typeof StageGoalConflictLinkLedgerSchema>;

export type StageGoalConflictLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_GOAL'
    | 'UNKNOWN_CONFLICT'
    | 'CHILD_STAGE_FAIL'
    | 'CHILD_CONFLICT_FAIL'
    | 'CONFLICT_BEFORE_START'
    | 'PAYOFF_WITHOUT_PROGRESS'
    | 'GOAL_MET_WITH_OPEN_CONFLICT'
    | 'PENDING_PAIR';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface StageGoalConflictLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    pending: number;
    goals: number;
    conflicts: number;
    latestEp: number;
  };
  findings: StageGoalConflictLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateStageGoalConflictLink(input: unknown): StageGoalConflictLinkReport {
  const parsed = StageGoalConflictLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, pending: 0, goals: 0, conflicts: 0, latestEp: 0 },
      findings: [
        {
          code: 'SCHEMA',
          severity: 'FAIL',
          message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        },
      ],
      gates: GATES,
    };
  }

  const { series, seasonId, latestEp, goals, progress, countdowns, conflicts, links } = parsed.data;
  const findings: StageGoalConflictLinkFinding[] = [];
  const push = (x: StageGoalConflictLinkFinding) => findings.push(x);

  const stageReport = evaluateStageGoals({
    series,
    seasonId,
    latestEp,
    goals,
    progress,
    countdowns,
  });
  if (stageReport.verdict === 'FAIL') {
    const childFails = stageReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_STAGE_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌阶段目标账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 stage-goal-gate（活跃目标/推进/截止）再跑联表',
    });
  }

  const conflictReport = evaluateConflictPayoffGap({ series, latestEp, conflicts });
  if (conflictReport.verdict === 'FAIL') {
    const childFails = conflictReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_CONFLICT_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌冲突兑现账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 conflict-payoff-gap-gate（快兑现/不受隔夜气）再跑联表',
    });
  }

  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const l of links) {
    if (seen.has(l.id)) dups.add(l.id);
    else seen.add(l.id);
  }
  for (const id of dups) {
    push({
      code: 'DUP_ID',
      severity: 'FAIL',
      ids: [id],
      message: `联表ID重复：${id}`,
      fix: '联表 id 须唯一',
    });
  }

  const byGoal = new Map(goals.map((g) => [g.id, g]));
  const byConflict = new Map(conflicts.map((c) => [c.id, c]));
  let aligned = 0;
  let pending = 0;

  for (const link of links) {
    const goal = byGoal.get(link.goalId);
    const conflict = byConflict.get(link.conflictId);
    if (!goal) {
      push({
        code: 'UNKNOWN_GOAL',
        severity: 'FAIL',
        ids: [link.id, link.goalId],
        message: `联表 ${link.id} 引用未知 goal ${link.goalId}`,
        fix: 'goalId 须存在于 goals[]',
      });
      continue;
    }
    if (!conflict) {
      push({
        code: 'UNKNOWN_CONFLICT',
        severity: 'FAIL',
        ids: [link.id, link.conflictId],
        message: `联表 ${link.id} 引用未知 conflict ${link.conflictId}`,
        fix: 'conflictId 须存在于 conflicts[]',
      });
      continue;
    }

    if (conflict.openEp < goal.startEp) {
      push({
        code: 'CONFLICT_BEFORE_START',
        severity: 'FAIL',
        ids: [link.id, goal.id, conflict.id],
        message: `${link.id}: 冲突 ${conflict.id} 开于 E${conflict.openEp} 早于目标 ${goal.id} startEp E${goal.startEp}`,
        fix: '冲突开集须 ≥ 挂靠阶段目标 startEp（服务本阶段推进）',
      });
      continue;
    }

    if (conflict.payoffEp !== undefined) {
      const advancing = progress.filter(
        (p) => p.goalId === goal.id && p.advances && p.ep <= conflict.payoffEp!,
      );
      if (advancing.length === 0) {
        push({
          code: 'PAYOFF_WITHOUT_PROGRESS',
          severity: 'FAIL',
          ids: [link.id, goal.id, conflict.id],
          message: `${link.id}: 冲突 ${conflict.id} 已于 E${conflict.payoffEp} 兑现，但目标 ${goal.id} 在 ≤E${conflict.payoffEp} 无 advances 进度`,
          fix: '兑现集或之前补一条 advances=true 的 progress，证明阶段在推进',
        });
        continue;
      }
      aligned += 1;
      continue;
    }

    // conflict still open
    if (goal.status === 'met') {
      push({
        code: 'GOAL_MET_WITH_OPEN_CONFLICT',
        severity: 'FAIL',
        ids: [link.id, goal.id, conflict.id],
        message: `${link.id}: 目标 ${goal.id} 已 met，但挂靠冲突 ${conflict.id} 仍无 payoff`,
        fix: '目标闭环前须兑现挂靠冲突，或改走失败/拆联表',
      });
      continue;
    }

    pending += 1;
    push({
      code: 'PENDING_PAIR',
      severity: 'WARN',
      ids: [link.id, goal.id, conflict.id],
      message: `${link.id}: 目标 ${goal.id}（${goal.status}）+ 冲突 ${conflict.id} 尚无兑现（窗口内）`,
      fix: '在 maxGap 内写 payoffEp，并确保同窗有 advances 进度',
    });
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      pending,
      goals: goals.length,
      conflicts: conflicts.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
