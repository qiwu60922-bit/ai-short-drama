/**
 * V12 · Stage-Goal × Foreshadow Link Gate (阶段目标 × 伏笔兑现 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 闯关向: 阶段目标 due/推进常与 S/A 伏笔 payoff 同集.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_GOAL / UNKNOWN_FORESHADOW / FUTURE_EP
 *  CHILD_STAGE_FAIL / CHILD_FORESHADOW_FAIL
 *  EP_NOT_PAYOFF — link.ep = dueEp|progress = payoffEp
 *  GOAL_WITHOUT_FORESHADOW / PAYOFF_WITHOUT_GOAL
 *  PENDING_GOAL / PENDING_FORESHADOW (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  StageGoalEntrySchema,
  StageProgressSchema,
  evaluateStageGoals,
} from './stage-goal-gate';
import {
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
} from './foreshadow-ledger-gate';

const Ep = z.number().int().positive();

export const StageGoalForeshadowLinkEntrySchema = z.object({
  id: z.string().min(1),
  goalId: z.string().min(1),
  foreshadowId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const StageGoalForeshadowLinkLedgerSchema = z.object({
  series: z.string().min(1),
  seasonId: z.string().min(1).default('S1'),
  latestEp: Ep,
  goals: z.array(StageGoalEntrySchema).min(1),
  progress: z.array(StageProgressSchema),
  items: z.array(ForeshadowItemSchema),
  links: z.array(StageGoalForeshadowLinkEntrySchema),
});

export type StageGoalForeshadowLinkLedger = z.infer<typeof StageGoalForeshadowLinkLedgerSchema>;

export type StageGoalForeshadowLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_GOAL'
    | 'UNKNOWN_FORESHADOW'
    | 'FUTURE_EP'
    | 'CHILD_STAGE_FAIL'
    | 'CHILD_FORESHADOW_FAIL'
    | 'EP_NOT_PAYOFF'
    | 'GOAL_WITHOUT_FORESHADOW'
    | 'PAYOFF_WITHOUT_GOAL'
    | 'PENDING_GOAL'
    | 'PENDING_FORESHADOW';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface StageGoalForeshadowLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    goals: number;
    items: number;
    latestEp: number;
  };
  findings: StageGoalForeshadowLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateStageGoalForeshadowLink(input: unknown): StageGoalForeshadowLinkReport {
  const parsed = StageGoalForeshadowLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, goals: 0, items: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, seasonId, latestEp, goals, progress, items, links } = parsed.data;
  const findings: StageGoalForeshadowLinkFinding[] = [];
  const push = (x: StageGoalForeshadowLinkFinding) => findings.push(x);

  const stageReport = evaluateStageGoals({ series, seasonId, latestEp, goals, progress });
  if (stageReport.verdict === 'FAIL') {
    const childFails = stageReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_STAGE_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌阶段目标 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 stage-goal-gate',
    });
  }

  const fsReport = evaluateForeshadowLedger({ series, latestEp, items });
  if (fsReport.verdict === 'FAIL') {
    const childFails = fsReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_FORESHADOW_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌伏笔账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 foreshadow-ledger-gate',
    });
  }

  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const l of links) {
    if (seen.has(l.id)) dups.add(l.id);
    else seen.add(l.id);
  }
  for (const id of dups) {
    push({ code: 'DUP_ID', severity: 'FAIL', ids: [id], message: `联表ID重复：${id}`, fix: '联表 id 须唯一' });
  }

  const byG = new Map(goals.map((g) => [g.id, g]));
  const byItem = new Map(items.map((it) => [it.id, it]));
  const pairedG = new Set<string>();
  const pairedItems = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    if (link.ep > latestEp) {
      push({
        code: 'FUTURE_EP',
        severity: 'FAIL',
        ids: [link.id],
        message: `${link.id} ep=E${link.ep} 超出 latestEp=E${latestEp}`,
        fix: '下调 link.ep 或上调 latestEp',
      });
    }
    const goal = byG.get(link.goalId);
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
    const item = byItem.get(link.foreshadowId);
    if (!item) {
      push({
        code: 'UNKNOWN_FORESHADOW',
        severity: 'FAIL',
        ids: [link.id, link.foreshadowId],
        message: `联表 ${link.id} 引用未知 foreshadow ${link.foreshadowId}`,
        fix: 'foreshadowId 须存在于 items[]',
      });
      continue;
    }

    const dueOk = goal.dueEp !== undefined && link.ep === goal.dueEp;
    const progressOk = progress.some((p) => p.goalId === goal.id && p.ep === link.ep && p.advances);
    if (item.payoffEp === undefined || link.ep !== item.payoffEp || !(dueOk || progressOk)) {
      push({
        code: 'EP_NOT_PAYOFF',
        severity: 'FAIL',
        ids: [link.id, goal.id, item.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 due=${goal.dueEp ?? '无'}/progress=${progressOk}/fs=${item.payoffEp ?? '无'}`,
        fix: '伏笔 payoff 须踩阶段目标 due/推进同集',
      });
      continue;
    }

    pairedG.add(goal.id);
    pairedItems.add(item.id);
    aligned += 1;
  }

  for (const goal of goals) {
    if (goal.status === 'met' && !pairedG.has(goal.id)) {
      push({
        code: 'GOAL_WITHOUT_FORESHADOW',
        severity: 'FAIL',
        ids: [goal.id],
        message: `goal ${goal.id} status=met 无 foreshadow 联表`,
        fix: '为阶段目标挂 StageGoalForeshadowLink',
      });
    } else if (!pairedG.has(goal.id)) {
      push({
        code: 'PENDING_GOAL',
        severity: 'WARN',
        ids: [goal.id],
        message: `goal ${goal.id} 尚未联表到 foreshadow`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const it of items) {
    if (it.payoffEp !== undefined && !pairedItems.has(it.id)) {
      push({
        code: 'PAYOFF_WITHOUT_GOAL',
        severity: 'FAIL',
        ids: [it.id],
        message: `foreshadow ${it.id} payoffEp=E${it.payoffEp} 无 stageGoal 联表`,
        fix: '为伏笔兑现集挂 StageGoalForeshadowLink',
      });
    } else if (!pairedItems.has(it.id)) {
      push({
        code: 'PENDING_FORESHADOW',
        severity: 'WARN',
        ids: [it.id],
        message: `foreshadow ${it.id} 尚未联表到 stageGoal`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      goals: goals.length,
      items: items.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
