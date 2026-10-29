/**
 * V12 · Foreshadow × Countdown × Peak Ternary Bridge
 * (伏笔回收 × 阶段倒计时 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 高优伏笔 payoff 常踩倒计时 deadline，并对齐对峙峰值.
 *  - 与 foreshadowMaskPeakBridge / countdownForeshadowLink 互补：本 gate 硬对齐同 ep 三元同框.
 *
 * Per link: foreshadowId + countdownId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_FORESHADOW / UNKNOWN_COUNTDOWN / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_FORESHADOW_FAIL / CHILD_PEAK_FAIL / BAD_COUNTDOWN_WINDOW
 *  EP_NOT_TERNARY — link.ep = payoffEp = deadlineEp = peakEp
 *  PAYOFF_WITHOUT_BRIDGE / DEADLINE_WITHOUT_BRIDGE / PEAK_WITHOUT_BRIDGE
 *  PENDING_FORESHADOW (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
} from './foreshadow-ledger-gate';
import { StageCountdownSchema } from './stage-goal-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const ForeshadowCountdownPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  foreshadowId: z.string().min(1),
  countdownId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const ForeshadowCountdownPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  items: z.array(ForeshadowItemSchema),
  countdowns: z.array(StageCountdownSchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(ForeshadowCountdownPeakBridgeLinkSchema),
});

export type ForeshadowCountdownPeakBridgeLedger = z.infer<typeof ForeshadowCountdownPeakBridgeLedgerSchema>;

export type ForeshadowCountdownPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_FORESHADOW'
    | 'UNKNOWN_COUNTDOWN'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_FORESHADOW_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'BAD_COUNTDOWN_WINDOW'
    | 'EP_NOT_TERNARY'
    | 'PAYOFF_WITHOUT_BRIDGE'
    | 'DEADLINE_WITHOUT_BRIDGE'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'PENDING_FORESHADOW';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface ForeshadowCountdownPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    items: number;
    countdowns: number;
    peaks: number;
    latestEp: number;
  };
  findings: ForeshadowCountdownPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateForeshadowCountdownPeakBridge(input: unknown): ForeshadowCountdownPeakBridgeReport {
  const parsed = ForeshadowCountdownPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, items: 0, countdowns: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, items, countdowns, peaks, links } = parsed.data;
  const findings: ForeshadowCountdownPeakBridgeFinding[] = [];
  const push = (x: ForeshadowCountdownPeakBridgeFinding) => findings.push(x);

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

  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const l of links) {
    if (seen.has(l.id)) dups.add(l.id);
    else seen.add(l.id);
  }
  for (const id of dups) {
    push({ code: 'DUP_ID', severity: 'FAIL', ids: [id], message: `联表ID重复：${id}`, fix: '联表 id 须唯一' });
  }

  const byFs = new Map(items.map((i) => [i.id, i]));
  const byCd = new Map(countdowns.map((c) => [c.id, c]));
  const byPeak = new Map(peaks.map((p) => [p.id, p]));
  const linkedFs = new Set<string>();
  const linkedCd = new Set<string>();
  const linkedPeaks = new Set<string>();
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
    const fs = byFs.get(link.foreshadowId);
    if (!fs) {
      push({
        code: 'UNKNOWN_FORESHADOW',
        severity: 'FAIL',
        ids: [link.id, link.foreshadowId],
        message: `联表 ${link.id} 引用未知 foreshadow ${link.foreshadowId}`,
        fix: 'foreshadowId 须存在于 items[]',
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
      fs.payoffEp === undefined ||
      peak.peakEp === undefined ||
      link.ep !== fs.payoffEp ||
      link.ep !== cd.deadlineEp ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, fs.id, cd.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 payoff=${fs.payoffEp ?? '无'}/deadline=${cd.deadlineEp}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = payoffEp = deadlineEp = peakEp',
      });
      continue;
    }

    linkedFs.add(fs.id);
    linkedCd.add(cd.id);
    linkedPeaks.add(peak.id);
    aligned += 1;
  }

  for (const fs of items) {
    if (fs.payoffEp !== undefined && !linkedFs.has(fs.id)) {
      push({
        code: 'PAYOFF_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [fs.id],
        message: `foreshadow ${fs.id} payoffEp=E${fs.payoffEp} 无 foreshadow×countdown×peak 桥`,
        fix: '为回收集挂 ForeshadowCountdownPeakBridge',
      });
    } else if (!linkedFs.has(fs.id)) {
      push({
        code: 'PENDING_FORESHADOW',
        severity: 'WARN',
        ids: [fs.id],
        message: `foreshadow ${fs.id} 尚未联表到 foreshadow×countdown×peak 桥`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const cd of countdowns) {
    if (cd.deadlineEp <= latestEp && !linkedCd.has(cd.id)) {
      push({
        code: 'DEADLINE_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [cd.id],
        message: `countdown ${cd.id} deadlineEp=E${cd.deadlineEp} 无 foreshadow×countdown×peak 桥`,
        fix: '为 deadline 挂 ForeshadowCountdownPeakBridge',
      });
    }
  }
  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedPeaks.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 foreshadow×countdown×peak 桥`,
        fix: '为峰值集挂 ForeshadowCountdownPeakBridge',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      items: items.length,
      countdowns: countdowns.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
