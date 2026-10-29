/**
 * V12 · Amnesia × Countdown × Peak Ternary Bridge
 * (失忆唤回 × 阶段倒计时 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《天幕直播》/《反派拿捏》: deadline 常与唤回 recover、对峙峰值同拍.
 *  - 与 countdownAmnesiaPeakBridge 互补：本 gate 以 amnesia 为主键硬对齐同 ep 三元同框.
 *
 * Per link: amnesiaId + countdownId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_COUNTDOWN / UNKNOWN_AMNESIA / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_AMNESIA_FAIL / CHILD_PEAK_FAIL / BAD_COUNTDOWN_WINDOW
 *  EP_NOT_TERNARY — link.ep = deadlineEp = recoverEp = peakEp
 *  PEAK_WITHOUT_BRIDGE / DEADLINE_WITHOUT_BRIDGE / RECOVER_WITHOUT_BRIDGE
 *  PENDING_AMNESIA (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { StageCountdownSchema } from './stage-goal-gate';
import {
  AmnesiaArcEntrySchema,
  evaluateAmnesiaArc,
} from './amnesia-arc-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const AmnesiaCountdownPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  amnesiaId: z.string().min(1),
  countdownId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const AmnesiaCountdownPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  amnesias: z.array(AmnesiaArcEntrySchema),
  countdowns: z.array(StageCountdownSchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AmnesiaCountdownPeakBridgeLinkSchema),
});

export type AmnesiaCountdownPeakBridgeLedger = z.infer<typeof AmnesiaCountdownPeakBridgeLedgerSchema>;

export type AmnesiaCountdownPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_COUNTDOWN'
    | 'UNKNOWN_AMNESIA'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_AMNESIA_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'BAD_COUNTDOWN_WINDOW'
    | 'EP_NOT_TERNARY'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'DEADLINE_WITHOUT_BRIDGE'
    | 'RECOVER_WITHOUT_BRIDGE'
    | 'PENDING_AMNESIA';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AmnesiaCountdownPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    amnesias: number;
    countdowns: number;
    peaks: number;
    latestEp: number;
  };
  findings: AmnesiaCountdownPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAmnesiaCountdownPeakBridge(input: unknown): AmnesiaCountdownPeakBridgeReport {
  const parsed = AmnesiaCountdownPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, amnesias: 0, countdowns: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, amnesias, countdowns, peaks, links } = parsed.data;
  const findings: AmnesiaCountdownPeakBridgeFinding[] = [];
  const push = (x: AmnesiaCountdownPeakBridgeFinding) => findings.push(x);

  const aReport = evaluateAmnesiaArc({ series, latestEp, entries: amnesias });
  if (aReport.verdict === 'FAIL') {
    const childFails = aReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_AMNESIA_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌失忆账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 amnesia-arc-gate',
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

  const byCd = new Map(countdowns.map((c) => [c.id, c]));
  const byA = new Map(amnesias.map((a) => [a.id, a]));
  const byP = new Map(peaks.map((p) => [p.id, p]));
  const linkedCd = new Set<string>();
  const linkedA = new Set<string>();
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
    const amnesia = byA.get(link.amnesiaId);
    if (!amnesia) {
      push({
        code: 'UNKNOWN_AMNESIA',
        severity: 'FAIL',
        ids: [link.id, link.amnesiaId],
        message: `联表 ${link.id} 引用未知 amnesia ${link.amnesiaId}`,
        fix: 'amnesiaId 须存在于 amnesias[]',
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

    if (
      amnesia.recoverEp === undefined ||
      peak.peakEp === undefined ||
      link.ep !== cd.deadlineEp ||
      link.ep !== amnesia.recoverEp ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, cd.id, amnesia.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 deadline=E${cd.deadlineEp}/recover=${amnesia.recoverEp ?? '无'}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = deadlineEp = recoverEp = peakEp',
      });
      continue;
    }

    linkedCd.add(cd.id);
    linkedA.add(amnesia.id);
    linkedP.add(peak.id);
    aligned += 1;
  }

  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedP.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 countdown×amnesia×peak 桥`,
        fix: '为峰值集挂 AmnesiaCountdownPeakBridge',
      });
    }
  }
  for (const cd of countdowns) {
    if (cd.deadlineEp <= latestEp && !linkedCd.has(cd.id)) {
      push({
        code: 'DEADLINE_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [cd.id],
        message: `countdown ${cd.id} deadlineEp=E${cd.deadlineEp} 无 countdown×amnesia×peak 桥`,
        fix: '为 deadline 集挂 AmnesiaCountdownPeakBridge',
      });
    }
  }
  for (const a of amnesias) {
    if (a.recoverEp !== undefined && !linkedA.has(a.id)) {
      push({
        code: 'RECOVER_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [a.id],
        message: `amnesia ${a.id} recoverEp=E${a.recoverEp} 无 countdown×amnesia×peak 桥`,
        fix: '为唤回集挂 AmnesiaCountdownPeakBridge',
      });
    } else if (!linkedA.has(a.id)) {
      push({
        code: 'PENDING_AMNESIA',
        severity: 'WARN',
        ids: [a.id],
        message: `amnesia ${a.id} 尚未联表到 countdown×amnesia×peak 桥`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      amnesias: amnesias.length,
      countdowns: countdowns.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
