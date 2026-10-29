/**
 * V12 · Amnesia × Handoff × Peak Ternary Bridge
 * (失忆唤回 × 集间悬念承接 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《反派拿捏》: 唤回 recover 常卡在悬念上一集交给下集，并踩对峙峰值.
 *  - amnesiaHandoffLink / amnesiaPeakLink 已各自联表——与 handoffAmnesiaPeakBridge（handoff 主键）互补：本 gate 以 amnesia 为主键硬对齐同 ep 三元同框.
 *
 * Per link: amnesiaId + handoffId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_HANDOFF / UNKNOWN_AMNESIA / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_HANDOFF_FAIL / CHILD_AMNESIA_FAIL / CHILD_PEAK_FAIL
 *  EP_NOT_TERNARY — link.ep = recoverEp = handoff.prevEp = peakEp
 *  HANDOFF_WITHOUT_BRIDGE / RECOVER_WITHOUT_BRIDGE / PEAK_WITHOUT_BRIDGE
 *  PENDING_AMNESIA (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import {
  AmnesiaArcEntrySchema,
  evaluateAmnesiaArc,
} from './amnesia-arc-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';
import { evaluateCliffhangerHandoff } from './cliffhanger-handoff-gate';

const Ep = z.number().int().positive();

export const AmnesiaHandoffPeakHandoffEntrySchema = z.object({
  id: z.string().min(1),
  prevEp: Ep,
  nextEp: Ep,
  prev: ShotSpecDocSchema,
  next: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const AmnesiaHandoffPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  handoffId: z.string().min(1),
  amnesiaId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const AmnesiaHandoffPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  handoffs: z.array(AmnesiaHandoffPeakHandoffEntrySchema),
  amnesias: z.array(AmnesiaArcEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AmnesiaHandoffPeakBridgeLinkSchema),
});

export type AmnesiaHandoffPeakBridgeLedger = z.infer<typeof AmnesiaHandoffPeakBridgeLedgerSchema>;

export type AmnesiaHandoffPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_HANDOFF'
    | 'UNKNOWN_AMNESIA'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_HANDOFF_FAIL'
    | 'CHILD_AMNESIA_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'EP_NOT_TERNARY'
    | 'HANDOFF_WITHOUT_BRIDGE'
    | 'RECOVER_WITHOUT_BRIDGE'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'PENDING_AMNESIA';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AmnesiaHandoffPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    handoffs: number;
    amnesias: number;
    peaks: number;
    latestEp: number;
  };
  findings: AmnesiaHandoffPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAmnesiaHandoffPeakBridge(input: unknown): AmnesiaHandoffPeakBridgeReport {
  const parsed = AmnesiaHandoffPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, handoffs: 0, amnesias: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, handoffs, amnesias, peaks, links } = parsed.data;
  const findings: AmnesiaHandoffPeakBridgeFinding[] = [];
  const push = (x: AmnesiaHandoffPeakBridgeFinding) => findings.push(x);

  for (const h of handoffs) {
    const r = evaluateCliffhangerHandoff(h.prev, h.next);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_HANDOFF_FAIL',
        severity: 'FAIL',
        ids: [h.id, ...childFails.flatMap((f) => f.ids ?? [])],
        message: `内嵌 handoff ${h.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 cliffhanger-handoff-gate',
      });
    }
  }

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

  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const l of links) {
    if (seen.has(l.id)) dups.add(l.id);
    else seen.add(l.id);
  }
  for (const id of dups) {
    push({ code: 'DUP_ID', severity: 'FAIL', ids: [id], message: `联表ID重复：${id}`, fix: '联表 id 须唯一' });
  }

  const byH = new Map(handoffs.map((h) => [h.id, h]));
  const byA = new Map(amnesias.map((a) => [a.id, a]));
  const byP = new Map(peaks.map((p) => [p.id, p]));
  const linkedH = new Set<string>();
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
    const handoff = byH.get(link.handoffId);
    if (!handoff) {
      push({
        code: 'UNKNOWN_HANDOFF',
        severity: 'FAIL',
        ids: [link.id, link.handoffId],
        message: `联表 ${link.id} 引用未知 handoff ${link.handoffId}`,
        fix: 'handoffId 须存在于 handoffs[]',
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
      link.ep !== amnesia.recoverEp ||
      link.ep !== handoff.prevEp ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, handoff.id, amnesia.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 recover=${amnesia.recoverEp ?? '无'}/prevEp=${handoff.prevEp}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = recoverEp = handoff.prevEp = peakEp',
      });
      continue;
    }

    linkedH.add(handoff.id);
    linkedA.add(amnesia.id);
    linkedP.add(peak.id);
    aligned += 1;
  }

  for (const h of handoffs) {
    if (!linkedH.has(h.id)) {
      push({
        code: 'HANDOFF_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [h.id],
        message: `handoff ${h.id} prevEp=E${h.prevEp} 无 amnesia×handoff×peak 桥`,
        fix: '为承接集挂 AmnesiaHandoffPeakBridge',
      });
    }
  }
  for (const a of amnesias) {
    if (a.recoverEp !== undefined && !linkedA.has(a.id)) {
      push({
        code: 'RECOVER_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [a.id],
        message: `amnesia ${a.id} recoverEp=E${a.recoverEp} 无 amnesia×handoff×peak 桥`,
        fix: '为唤回集挂 AmnesiaHandoffPeakBridge',
      });
    } else if (!linkedA.has(a.id)) {
      push({
        code: 'PENDING_AMNESIA',
        severity: 'WARN',
        ids: [a.id],
        message: `amnesia ${a.id} 尚未联表到 amnesia×handoff×peak 桥`,
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
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 amnesia×handoff×peak 桥`,
        fix: '为峰值集挂 AmnesiaHandoffPeakBridge',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      handoffs: handoffs.length,
      amnesias: amnesias.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
