/**
 * V12 · Stage-Goal × Quality × Peak Ternary Bridge
 * (阶段目标 × 表演门 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《天幕直播》/闯关向: 阶段目标 due 当集须过表演门并踩对峙峰值.
 *
 * Per link: goalId + peakId + ep + qualityLeap.
 *  SCHEMA / DUP_ID / UNKNOWN_GOAL / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_STAGE_FAIL / CHILD_PEAK_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_TERNARY — link.ep = dueEp|progress@ep = peakEp
 *  GOAL_WITHOUT_BRIDGE / PEAK_WITHOUT_BRIDGE
 *  PENDING_GOAL (WARN) / LOW_INTENSITY_AT_TERNARY (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  StageGoalEntrySchema,
  StageProgressSchema,
  evaluateStageGoals,
} from './stage-goal-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';
import {
  QualityLeapDocSchema,
  evaluateQualityLeap,
} from './quality-leap-gate';

const Ep = z.number().int().positive();

export const StageGoalQualityPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  goalId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const StageGoalQualityPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  seasonId: z.string().min(1).default('S1'),
  latestEp: Ep,
  minTernaryIntense: z.number().int().min(1).max(5).optional(),
  goals: z.array(StageGoalEntrySchema).min(1),
  progress: z.array(StageProgressSchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(StageGoalQualityPeakBridgeLinkSchema),
});

export type StageGoalQualityPeakBridgeLedger = z.infer<typeof StageGoalQualityPeakBridgeLedgerSchema>;

export type StageGoalQualityPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_GOAL'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_STAGE_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_TERNARY'
    | 'GOAL_WITHOUT_BRIDGE'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'PENDING_GOAL'
    | 'LOW_INTENSITY_AT_TERNARY';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface StageGoalQualityPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    goals: number;
    peaks: number;
    latestEp: number;
  };
  findings: StageGoalQualityPeakBridgeFinding[];
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

export function evaluateStageGoalQualityPeakBridge(input: unknown): StageGoalQualityPeakBridgeReport {
  const parsed = StageGoalQualityPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, goals: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, seasonId, latestEp, goals, progress, peaks, links, minTernaryIntense = 4 } = parsed.data;
  const findings: StageGoalQualityPeakBridgeFinding[] = [];
  const push = (x: StageGoalQualityPeakBridgeFinding) => findings.push(x);

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

  const pReport = evaluatePeakBeforePayoff({ series, latestEp, entries: peaks });
  if (pReport.verdict === 'FAIL') {
    const childFails = pReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_PEAK_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌峰值账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 peak-before-payoff-gate',
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
  const byP = new Map(peaks.map((p) => [p.id, p]));
  const linkedG = new Set<string>();
  const linkedP = new Set<string>();
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
    const peak = byP.get(link.peakId);
    if (!peak) {
      push({
        code: 'UNKNOWN_PEAK',
        severity: 'FAIL',
        ids: [link.id, link.peakId],
        message: `联表 ${link.id} 引用未知 peak ${link.peakId}`,
        fix: 'peakId 须存在于 peaks[]',
      });
      continue;
    }

    const qReport = evaluateQualityLeap(link.qualityLeap);
    if (qReport.verdict === 'FAIL') {
      const childFails = qReport.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_QUALITY_FAIL',
        severity: 'FAIL',
        ids: [link.id, ...(childFails.map((f) => f.shotId).filter(Boolean) as string[])],
        message: `联表 ${link.id} qualityLeap FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 quality-leap-gate',
      });
      continue;
    }

    const dueOk = goal.dueEp !== undefined && link.ep === goal.dueEp;
    const progressOk = progress.some((p) => p.goalId === goal.id && p.ep === link.ep && p.advances);
    if (
      peak.peakEp === undefined ||
      link.ep !== peak.peakEp ||
      !(dueOk || progressOk)
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, goal.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 due=${goal.dueEp ?? '无'}/progress=${progressOk}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = dueEp|progress = peakEp',
      });
      continue;
    }

    const intense = maxIntensity(link.qualityLeap);
    if (intense < minTernaryIntense) {
      push({
        code: 'LOW_INTENSITY_AT_TERNARY',
        severity: 'WARN',
        ids: [link.id, goal.id, peak.id],
        message: `${link.id}: max intensity=${intense} < minTernaryIntense=${minTernaryIntense}`,
        fix: '提高表演 intensity 或下调 minTernaryIntense',
      });
    }

    linkedG.add(goal.id);
    linkedP.add(peak.id);
    aligned += 1;
  }

  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedP.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 stageGoal×quality×peak 桥`,
        fix: '为峰值集挂 StageGoalQualityPeakBridge',
      });
    }
  }
  for (const goal of goals) {
    if (!linkedG.has(goal.id)) {
      if (goal.status === 'met' || (goal.dueEp !== undefined && goal.dueEp <= latestEp)) {
        push({
          code: 'GOAL_WITHOUT_BRIDGE',
          severity: 'FAIL',
          ids: [goal.id],
          message: `goal ${goal.id} 未挂 stageGoal×quality×peak 桥`,
          fix: '在 links[] 挂 goalId + peakId + qualityLeap',
        });
      } else {
        push({
          code: 'PENDING_GOAL',
          severity: 'WARN',
          ids: [goal.id],
          message: `goal ${goal.id} 尚未联表到 quality×peak`,
          fix: '补 links[] 或确认旁路',
        });
      }
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      goals: goals.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
