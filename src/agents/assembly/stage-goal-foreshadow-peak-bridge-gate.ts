/**
 * V12 · Stage-Goal × Foreshadow × Peak Ternary Bridge
 * (阶段目标 × 伏笔兑现 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 闯关向: 阶段目标 due 当集常与 S/A 伏笔 payoff、对峙峰值同拍.
 *  - 与 stageGoalForeshadowLink / stageGoalQualityPeakBridge 互补：本 gate 硬对齐同 ep 三元同框.
 *
 * Per link: goalId + foreshadowId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_GOAL / UNKNOWN_FORESHADOW / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_STAGE_FAIL / CHILD_FORESHADOW_FAIL / CHILD_PEAK_FAIL
 *  EP_NOT_TERNARY — link.ep = dueEp|progress@ep = payoffEp = peakEp
 *  GOAL_WITHOUT_BRIDGE / PAYOFF_WITHOUT_BRIDGE / PEAK_WITHOUT_BRIDGE
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
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const StageGoalForeshadowPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  goalId: z.string().min(1),
  foreshadowId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const StageGoalForeshadowPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  seasonId: z.string().min(1).default('S1'),
  latestEp: Ep,
  goals: z.array(StageGoalEntrySchema).min(1),
  progress: z.array(StageProgressSchema),
  items: z.array(ForeshadowItemSchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(StageGoalForeshadowPeakBridgeLinkSchema),
});

export type StageGoalForeshadowPeakBridgeLedger = z.infer<typeof StageGoalForeshadowPeakBridgeLedgerSchema>;

export type StageGoalForeshadowPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_GOAL'
    | 'UNKNOWN_FORESHADOW'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_STAGE_FAIL'
    | 'CHILD_FORESHADOW_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'EP_NOT_TERNARY'
    | 'GOAL_WITHOUT_BRIDGE'
    | 'PAYOFF_WITHOUT_BRIDGE'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'PENDING_GOAL'
    | 'PENDING_FORESHADOW';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface StageGoalForeshadowPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    goals: number;
    items: number;
    peaks: number;
    latestEp: number;
  };
  findings: StageGoalForeshadowPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateStageGoalForeshadowPeakBridge(input: unknown): StageGoalForeshadowPeakBridgeReport {
  const parsed = StageGoalForeshadowPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, goals: 0, items: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, seasonId, latestEp, goals, progress, items, peaks, links } = parsed.data;
  const findings: StageGoalForeshadowPeakBridgeFinding[] = [];
  const push = (x: StageGoalForeshadowPeakBridgeFinding) => findings.push(x);

  const sReport = evaluateStageGoals({ series, seasonId, latestEp, goals, progress });
  if (sReport.verdict === 'FAIL') {
    const childFails = sReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_STAGE_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌阶段目标账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
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
  const byF = new Map(items.map((it) => [it.id, it]));
  const byP = new Map(peaks.map((p) => [p.id, p]));
  const linkedG = new Set<string>();
  const linkedF = new Set<string>();
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
    const item = byF.get(link.foreshadowId);
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

    const goalHit =
      goal.dueEp === link.ep ||
      progress.some((p) => p.goalId === goal.id && p.ep === link.ep && p.advances);
    if (
      !goalHit ||
      item.payoffEp === undefined ||
      peak.peakEp === undefined ||
      link.ep !== item.payoffEp ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, goal.id, item.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 goalHit=${goalHit}/fs=${item.payoffEp ?? '无'}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = dueEp|progress = payoffEp = peakEp',
      });
      continue;
    }

    linkedG.add(goal.id);
    linkedF.add(item.id);
    linkedP.add(peak.id);
    aligned += 1;
  }

  for (const goal of goals) {
    if (goal.dueEp !== undefined && goal.dueEp <= latestEp && !linkedG.has(goal.id)) {
      push({
        code: 'GOAL_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [goal.id],
        message: `goal ${goal.id} dueEp=E${goal.dueEp} 无 stageGoal×foreshadow×peak 桥`,
        fix: '为到期目标挂 StageGoalForeshadowPeakBridge',
      });
    } else if (!linkedG.has(goal.id)) {
      push({
        code: 'PENDING_GOAL',
        severity: 'WARN',
        ids: [goal.id],
        message: `goal ${goal.id} 尚未联表`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const it of items) {
    if (it.payoffEp !== undefined && !linkedF.has(it.id)) {
      push({
        code: 'PAYOFF_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [it.id],
        message: `foreshadow ${it.id} payoffEp=E${it.payoffEp} 无 stageGoal×foreshadow×peak 桥`,
        fix: '为兑现集挂 StageGoalForeshadowPeakBridge',
      });
    } else if (!linkedF.has(it.id)) {
      push({
        code: 'PENDING_FORESHADOW',
        severity: 'WARN',
        ids: [it.id],
        message: `foreshadow ${it.id} 尚未联表`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedP.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 stageGoal×foreshadow×peak 桥`,
        fix: '为峰值集挂 StageGoalForeshadowPeakBridge',
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
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
