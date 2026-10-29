/**
 * V12 · Quality-Leap × Stage-Goal Link Gate (表演门 × 季级阶段目标 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 阶段目标 due 当集须过表演/情绪门，不能空壳兑现 destination.
 *  - 与 qualityCountdownLink / abilityStageLink 互补：本 gate 以 quality×stage 联表.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_GOAL / FUTURE_EP
 *  CHILD_QUALITY_FAIL
 *  EP_NOT_DUE — link.ep 须等于 dueEp
 *  DUE_WITHOUT_QUALITY
 *  PENDING_GOAL (WARN)
 *  LOW_INTENSITY_AT_DUE (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { StageGoalEntrySchema } from './stage-goal-gate';
import {
  QualityLeapDocSchema,
  evaluateQualityLeap,
} from './quality-leap-gate';

const Ep = z.number().int().positive();

export const QualityStageLinkEntrySchema = z.object({
  id: z.string().min(1),
  goalId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const QualityStageLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minDueIntense: z.number().int().min(1).max(5).optional(),
  goals: z.array(StageGoalEntrySchema),
  links: z.array(QualityStageLinkEntrySchema),
});

export type QualityStageLinkLedger = z.infer<typeof QualityStageLinkLedgerSchema>;

export type QualityStageLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_GOAL'
    | 'FUTURE_EP'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_DUE'
    | 'DUE_WITHOUT_QUALITY'
    | 'PENDING_GOAL'
    | 'LOW_INTENSITY_AT_DUE';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface QualityStageLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    goals: number;
    latestEp: number;
  };
  findings: QualityStageLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

function maxIntensity(ql: {
  shots?: Array<{ performance?: { intensity?: number } | null }>;
}): number {
  let m = 0;
  for (const s of ql.shots ?? []) {
    const i = s.performance?.intensity;
    if (typeof i === 'number' && i > m) m = i;
  }
  return m;
}

export function evaluateQualityStageLink(input: unknown): QualityStageLinkReport {
  const parsed = QualityStageLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, goals: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { latestEp, goals, links, minDueIntense = 4 } = parsed.data;
  const findings: QualityStageLinkFinding[] = [];
  const push = (x: QualityStageLinkFinding) => findings.push(x);

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
  const linked = new Set<string>();
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
    if (goal.dueEp === undefined || link.ep !== goal.dueEp) {
      push({
        code: 'EP_NOT_DUE',
        severity: 'FAIL',
        ids: [link.id, goal.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 dueEp=${goal.dueEp ?? '无'}`,
        fix: 'link.ep 须等于 dueEp',
      });
      continue;
    }
    const ql = evaluateQualityLeap(link.qualityLeap);
    if (ql.verdict === 'FAIL') {
      const childFails = ql.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_QUALITY_FAIL',
        severity: 'FAIL',
        ids: [link.id, goal.id, ...childFails.map((f) => f.shotId).filter(Boolean) as string[]],
        message: `${link.id}: 阶段目标镜 E${link.ep} quality-leap FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '阶段目标镜须过表演/情绪/口型/镜头门（quality-leap）',
      });
      continue;
    }
    if (maxIntensity(link.qualityLeap) < minDueIntense) {
      push({
        code: 'LOW_INTENSITY_AT_DUE',
        severity: 'WARN',
        ids: [link.id, goal.id],
        message: `${link.id}: due 集强度 < ${minDueIntense}`,
        fix: '抬高 due 镜 intensity',
      });
    }
    linked.add(goal.id);
    aligned += 1;
  }

  for (const goal of goals) {
    if (goal.dueEp !== undefined && !linked.has(goal.id)) {
      push({
        code: 'DUE_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [goal.id],
        message: `goal ${goal.id} dueEp=E${goal.dueEp} 无 quality 联表`,
        fix: '为阶段目标 due 集挂 QualityStageLink',
      });
    } else if (goal.dueEp === undefined && !linked.has(goal.id)) {
      push({
        code: 'PENDING_GOAL',
        severity: 'WARN',
        ids: [goal.id],
        message: `goal ${goal.id} 尚未 due/联表`,
        fix: '规划 dueEp 或补 links[]',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { links: links.length, aligned, goals: goals.length, latestEp },
    findings,
    gates: GATES,
  };
}
