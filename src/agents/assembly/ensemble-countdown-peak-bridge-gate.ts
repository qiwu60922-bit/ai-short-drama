/**
 * V12 · Ensemble × Countdown × Peak Ternary Bridge
 * (群像单元 × 阶段倒计时 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 家庭群像 A 线单元常踩倒计时 deadline，并对齐对峙峰值.
 *  - 与 countdownEnsemblePeakBridge 互补：本 gate 以 ensemble 为主键硬对齐同 ep 三元同框.
 *
 * Per link: unitId + countdownId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_UNIT / UNKNOWN_COUNTDOWN / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_ENSEMBLE_FAIL / CHILD_PEAK_FAIL / BAD_COUNTDOWN_WINDOW
 *  EP_NOT_TERNARY — link.ep = unit.ep = deadlineEp = peakEp
 *  PEAK_WITHOUT_BRIDGE / UNIT_WITHOUT_BRIDGE / DEADLINE_WITHOUT_BRIDGE
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { StageCountdownSchema } from './stage-goal-gate';
import {
  EnsembleMemberSchema,
  EnsembleUnitSchema,
  evaluateEnsembleCast,
} from './ensemble-cast-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const EnsembleCountdownPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  unitId: z.string().min(1),
  countdownId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const EnsembleCountdownPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  members: z.array(EnsembleMemberSchema),
  units: z.array(EnsembleUnitSchema),
  countdowns: z.array(StageCountdownSchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(EnsembleCountdownPeakBridgeLinkSchema),
});

export type EnsembleCountdownPeakBridgeLedger = z.infer<typeof EnsembleCountdownPeakBridgeLedgerSchema>;

export type EnsembleCountdownPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_UNIT'
    | 'UNKNOWN_COUNTDOWN'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_ENSEMBLE_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'BAD_COUNTDOWN_WINDOW'
    | 'EP_NOT_TERNARY'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'UNIT_WITHOUT_BRIDGE'
    | 'DEADLINE_WITHOUT_BRIDGE';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface EnsembleCountdownPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    units: number;
    countdowns: number;
    peaks: number;
    latestEp: number;
  };
  findings: EnsembleCountdownPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateEnsembleCountdownPeakBridge(input: unknown): EnsembleCountdownPeakBridgeReport {
  const parsed = EnsembleCountdownPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, units: 0, countdowns: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, members, units, countdowns, peaks, links } = parsed.data;
  const findings: EnsembleCountdownPeakBridgeFinding[] = [];
  const push = (x: EnsembleCountdownPeakBridgeFinding) => findings.push(x);

  const eReport = evaluateEnsembleCast({ series, latestEp, members, units });
  if (eReport.verdict === 'FAIL') {
    const childFails = eReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_ENSEMBLE_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌群像账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 ensemble-cast-gate',
    });
  }

  const peakReport = evaluatePeakBeforePayoff({ series, latestEp, entries: peaks });
  if (peakReport.verdict === 'FAIL') {
    const childFails = peakReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_PEAK_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌峰值账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 peak-before-payoff-gate',
    });
  }

  for (const cd of countdowns) {
    if (cd.deadlineEp < cd.startEp) {
      push({
        code: 'BAD_COUNTDOWN_WINDOW',
        severity: 'FAIL',
        ids: [cd.id],
        message: `countdown ${cd.id} deadlineEp=E${cd.deadlineEp} < startEp=E${cd.startEp}`,
        fix: 'deadlineEp 须 ≥ startEp',
      });
    }
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

  const byU = new Map(units.map((u) => [u.id, u]));
  const byCd = new Map(countdowns.map((c) => [c.id, c]));
  const byPeak = new Map(peaks.map((p) => [p.id, p]));
  const linkedPeaks = new Set<string>();
  const linkedUnits = new Set<string>();
  const linkedCd = new Set<string>();
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
    const unit = byU.get(link.unitId);
    if (!unit) {
      push({
        code: 'UNKNOWN_UNIT',
        severity: 'FAIL',
        ids: [link.id, link.unitId],
        message: `联表 ${link.id} 引用未知 unit ${link.unitId}`,
        fix: 'unitId 须存在于 units[]',
      });
      continue;
    }
    const cd = byCd.get(link.countdownId);
    if (!cd) {
      push({
        code: 'UNKNOWN_COUNTDOWN',
        severity: 'FAIL',
        ids: [link.id, link.countdownId],
        message: `联表 ${link.id} 引用未知 countdown ${link.countdownId}`,
        fix: 'countdownId 须存在于 countdowns[]',
      });
      continue;
    }
    const peak = byPeak.get(link.peakId);
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

    if (
      peak.peakEp === undefined ||
      link.ep !== unit.ep ||
      link.ep !== cd.deadlineEp ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, unit.id, cd.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 unit=${unit.ep}/deadline=${cd.deadlineEp}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = unit.ep = deadlineEp = peakEp',
      });
      continue;
    }

    linkedPeaks.add(peak.id);
    linkedUnits.add(unit.id);
    linkedCd.add(cd.id);
    aligned += 1;
  }

  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedPeaks.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 ensemble×countdown×peak 桥`,
        fix: '为峰值集挂 EnsembleCountdownPeakBridge',
      });
    }
  }
  for (const unit of units) {
    if (unit.ep <= latestEp && !linkedUnits.has(unit.id)) {
      push({
        code: 'UNIT_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [unit.id],
        message: `unit ${unit.id} 无 ensemble×countdown×peak 桥`,
        fix: '为群像单元挂 EnsembleCountdownPeakBridge',
      });
    }
  }
  for (const cd of countdowns) {
    if (cd.deadlineEp <= latestEp && !linkedCd.has(cd.id)) {
      push({
        code: 'DEADLINE_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [cd.id],
        message: `countdown ${cd.id} deadlineEp=E${cd.deadlineEp} 无 ensemble×countdown×peak 桥`,
        fix: '为 deadline 挂 EnsembleCountdownPeakBridge',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      units: units.length,
      countdowns: countdowns.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
