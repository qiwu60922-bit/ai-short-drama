/**
 * V12 · Stage-Goal × Mask Link Gate (阶段目标 × 伪装揭穿 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 闯关向: 阶段目标 due/推进常与 mask reveal 同集.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_GOAL / UNKNOWN_MASK / FUTURE_EP
 *  CHILD_STAGE_FAIL / CHILD_MASK_FAIL
 *  EP_NOT_REVEAL — link.ep = dueEp|progress = revealEp
 *  GOAL_WITHOUT_MASK / REVEAL_WITHOUT_GOAL
 *  PENDING_GOAL / PENDING_MASK (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  StageGoalEntrySchema,
  StageProgressSchema,
  evaluateStageGoals,
} from './stage-goal-gate';
import {
  PersonaMaskEntrySchema,
  evaluatePersonaMask,
} from './persona-mask-gate';

const Ep = z.number().int().positive();

export const StageGoalMaskLinkEntrySchema = z.object({
  id: z.string().min(1),
  goalId: z.string().min(1),
  maskId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const StageGoalMaskLinkLedgerSchema = z.object({
  series: z.string().min(1),
  seasonId: z.string().min(1).default('S1'),
  latestEp: Ep,
  goals: z.array(StageGoalEntrySchema).min(1),
  progress: z.array(StageProgressSchema),
  masks: z.array(PersonaMaskEntrySchema),
  links: z.array(StageGoalMaskLinkEntrySchema),
});

export type StageGoalMaskLinkLedger = z.infer<typeof StageGoalMaskLinkLedgerSchema>;

export type StageGoalMaskLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_GOAL'
    | 'UNKNOWN_MASK'
    | 'FUTURE_EP'
    | 'CHILD_STAGE_FAIL'
    | 'CHILD_MASK_FAIL'
    | 'EP_NOT_REVEAL'
    | 'GOAL_WITHOUT_MASK'
    | 'REVEAL_WITHOUT_GOAL'
    | 'PENDING_GOAL'
    | 'PENDING_MASK';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface StageGoalMaskLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    goals: number;
    masks: number;
    latestEp: number;
  };
  findings: StageGoalMaskLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateStageGoalMaskLink(input: unknown): StageGoalMaskLinkReport {
  const parsed = StageGoalMaskLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, goals: 0, masks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, seasonId, latestEp, goals, progress, masks, links } = parsed.data;
  const findings: StageGoalMaskLinkFinding[] = [];
  const push = (x: StageGoalMaskLinkFinding) => findings.push(x);

  const sReport = evaluateStageGoals({ series, seasonId, latestEp, goals, progress });
  if (sReport.verdict === 'FAIL') {
    const childFails = sReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_STAGE_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌阶段目标 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 stage-goal-gate',
    });
  }

  const mReport = evaluatePersonaMask({ series, latestEp, entries: masks });
  if (mReport.verdict === 'FAIL') {
    const childFails = mReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_MASK_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌伪装账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 persona-mask-gate',
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
  const byM = new Map(masks.map((m) => [m.id, m]));
  const pairedG = new Set<string>();
  const pairedM = new Set<string>();
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
    const mask = byM.get(link.maskId);
    if (!mask) {
      push({
        code: 'UNKNOWN_MASK',
        severity: 'FAIL',
        ids: [link.id, link.maskId],
        message: `联表 ${link.id} 引用未知 mask ${link.maskId}`,
        fix: 'maskId 须存在于 masks[]',
      });
      continue;
    }

    const goalHit =
      goal.dueEp === link.ep ||
      progress.some((p) => p.goalId === goal.id && p.ep === link.ep && p.advances);
    if (!goalHit || mask.revealEp === undefined || link.ep !== mask.revealEp) {
      push({
        code: 'EP_NOT_REVEAL',
        severity: 'FAIL',
        ids: [link.id, goal.id, mask.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 goalHit=${goalHit}/reveal=${mask.revealEp ?? '无'}`,
        fix: '阶段目标与揭穿须同集',
      });
      continue;
    }

    pairedG.add(goal.id);
    pairedM.add(mask.id);
    aligned += 1;
  }

  for (const goal of goals) {
    if (goal.dueEp !== undefined && goal.dueEp <= latestEp && !pairedG.has(goal.id)) {
      push({
        code: 'GOAL_WITHOUT_MASK',
        severity: 'FAIL',
        ids: [goal.id],
        message: `goal ${goal.id} dueEp=E${goal.dueEp} 无 mask 联表`,
        fix: '为到期目标挂 StageGoalMaskLink',
      });
    } else if (!pairedG.has(goal.id)) {
      push({
        code: 'PENDING_GOAL',
        severity: 'WARN',
        ids: [goal.id],
        message: `goal ${goal.id} 尚未联表`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const mask of masks) {
    if (mask.revealEp !== undefined && !pairedM.has(mask.id)) {
      push({
        code: 'REVEAL_WITHOUT_GOAL',
        severity: 'FAIL',
        ids: [mask.id],
        message: `mask ${mask.id} revealEp=E${mask.revealEp} 无 stageGoal 联表`,
        fix: '为揭穿集挂 StageGoalMaskLink',
      });
    } else if (!pairedM.has(mask.id)) {
      push({
        code: 'PENDING_MASK',
        severity: 'WARN',
        ids: [mask.id],
        message: `mask ${mask.id} 尚未联表`,
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
      masks: masks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
