/**
 * V12 · Handoff × Cliff × Peak Ternary Bridge
 * (集间承接 × 跨集悬念叠钩 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《持械入宋》: handoff 与 cliff cascade 同窗，并踩对峙峰值.
 *  - handoffCliffLink / handoffPeakLink 已各自联表——本 gate 硬对齐同 ep 三元同框.
 *
 * Per link: handoffId + cliffLinkId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_HANDOFF / UNKNOWN_CLIFF / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_HANDOFF_FAIL / CHILD_CASCADE_FAIL / CHILD_PEAK_FAIL
 *  EP_NOT_TERNARY — link.ep = handoff.prevEp = cliff.prevEp = peakEp
 *  HANDOFF_WITHOUT_BRIDGE / CLIFF_WITHOUT_BRIDGE / PEAK_WITHOUT_BRIDGE
 *  PENDING_HANDOFF (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import {
  CliffCascadeLinkEntrySchema,
  evaluateCliffCascadeLink,
} from './cliff-cascade-link-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';
import { evaluateCliffhangerHandoff } from './cliffhanger-handoff-gate';

const Ep = z.number().int().positive();

export const HandoffCliffPeakHandoffEntrySchema = z.object({
  id: z.string().min(1),
  prevEp: Ep,
  nextEp: Ep,
  prev: ShotSpecDocSchema,
  next: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const HandoffCliffPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  handoffId: z.string().min(1),
  cliffLinkId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const HandoffCliffPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  handoffs: z.array(HandoffCliffPeakHandoffEntrySchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(HandoffCliffPeakBridgeLinkSchema),
});

export type HandoffCliffPeakBridgeLedger = z.infer<typeof HandoffCliffPeakBridgeLedgerSchema>;

export type HandoffCliffPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_HANDOFF'
    | 'UNKNOWN_CLIFF'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_HANDOFF_FAIL'
    | 'CHILD_CASCADE_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'EP_NOT_TERNARY'
    | 'HANDOFF_WITHOUT_BRIDGE'
    | 'CLIFF_WITHOUT_BRIDGE'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'PENDING_HANDOFF';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface HandoffCliffPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    handoffs: number;
    cliffLinks: number;
    peaks: number;
    latestEp: number;
  };
  findings: HandoffCliffPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateHandoffCliffPeakBridge(input: unknown): HandoffCliffPeakBridgeReport {
  const parsed = HandoffCliffPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, handoffs: 0, cliffLinks: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, handoffs, cliffLinks, peaks, links } = parsed.data;
  const findings: HandoffCliffPeakBridgeFinding[] = [];
  const push = (x: HandoffCliffPeakBridgeFinding) => findings.push(x);

  for (const h of handoffs) {
    const r = evaluateCliffhangerHandoff(h.prev, h.next);
    if (r.verdict === 'FAIL') {
      const codes = r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
      push({
        code: 'CHILD_HANDOFF_FAIL',
        severity: 'FAIL',
        ids: [h.id],
        message: `handoff ${h.id} FAIL：${codes.join(',') || 'unknown'}`,
        fix: '先修 cliffhanger-handoff-gate',
      });
    }
  }

  if (cliffLinks.length) {
    const cascade = evaluateCliffCascadeLink({ series, latestEp, links: cliffLinks });
    if (cascade.verdict === 'FAIL') {
      const childFails = cascade.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_CASCADE_FAIL',
        severity: 'FAIL',
        ids: childFails.flatMap((f) => f.ids ?? []),
        message: `内嵌 cliffCascade FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 cliff-cascade-link-gate',
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

  const byH = new Map(handoffs.map((h) => [h.id, h]));
  const byCliff = new Map(cliffLinks.map((c) => [c.id, c]));
  const byPeak = new Map(peaks.map((p) => [p.id, p]));
  const linkedH = new Set<string>();
  const linkedC = new Set<string>();
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
    const cliff = byCliff.get(link.cliffLinkId);
    if (!cliff) {
      push({
        code: 'UNKNOWN_CLIFF',
        severity: 'FAIL',
        ids: [link.id, link.cliffLinkId],
        message: `联表 ${link.id} 引用未知 cliff ${link.cliffLinkId}`,
        fix: 'cliffLinkId 须存在于 cliffLinks[]',
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
      link.ep !== handoff.prevEp ||
      link.ep !== cliff.prevEp ||
      link.ep !== peak.peakEp ||
      handoff.nextEp !== cliff.nextEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, handoff.id, cliff.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 handoff.prev=${handoff.prevEp}/cliff.prev=${cliff.prevEp}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = handoff.prevEp = cliff.prevEp = peakEp，且 next 同窗',
      });
      continue;
    }

    linkedH.add(handoff.id);
    linkedC.add(cliff.id);
    linkedP.add(peak.id);
    aligned += 1;
  }

  for (const h of handoffs) {
    if (!linkedH.has(h.id)) {
      push({
        code: 'HANDOFF_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [h.id],
        message: `handoff ${h.id} 无 handoff×cliff×peak 桥`,
        fix: '在 links[] 挂 handoffId↔cliffLinkId↔peakId',
      });
    }
  }
  for (const c of cliffLinks) {
    if (!linkedC.has(c.id)) {
      push({
        code: 'CLIFF_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [c.id],
        message: `cliff ${c.id} 无 handoff×cliff×peak 桥`,
        fix: '在 links[] 挂 handoffId↔cliffLinkId↔peakId',
      });
    }
  }
  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedP.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 handoff×cliff×peak 桥`,
        fix: '为峰值集挂 HandoffCliffPeakBridge',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      handoffs: handoffs.length,
      cliffLinks: cliffLinks.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
