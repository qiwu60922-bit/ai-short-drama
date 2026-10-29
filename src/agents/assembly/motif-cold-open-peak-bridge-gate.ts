/**
 * V12 · Motif × Cold-Open × Peak Ternary Bridge
 * (视觉母题 × 冷开钩 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 母题回扣当集常冷开快入并踩对峙峰值.
 *  - 与 motifVestPeakBridge / vestColdOpenPeakBridge 互补：本 gate 以 motif 联 coldOpen×peak.
 *
 * coldOpens[]: { id, ep, shotSpec }
 * Per link: motifId + coldOpenId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_MOTIF / UNKNOWN_COLD_OPEN / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_MOTIF_FAIL / CHILD_COLD_OPEN_FAIL / CHILD_PEAK_FAIL
 *  EP_NOT_TERNARY — link.ep = coldOpen.ep = peakEp 且 motif appearance@ep
 *  MOTIF_WITHOUT_BRIDGE / COLD_OPEN_WITHOUT_BRIDGE / PEAK_WITHOUT_BRIDGE
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { evaluateColdOpenHook } from './cold-open-hook-gate';
import {
  MotifEntrySchema,
  MotifAppearanceSchema,
  evaluateMotifCallbacks,
} from './motif-callback-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const MotifColdOpenPeakColdOpenEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const MotifColdOpenPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  motifId: z.string().min(1),
  coldOpenId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const MotifColdOpenPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  coldOpens: z.array(MotifColdOpenPeakColdOpenEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(MotifColdOpenPeakBridgeLinkSchema),
});

export type MotifColdOpenPeakBridgeLedger = z.infer<typeof MotifColdOpenPeakBridgeLedgerSchema>;

export type MotifColdOpenPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_MOTIF'
    | 'UNKNOWN_COLD_OPEN'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_MOTIF_FAIL'
    | 'CHILD_COLD_OPEN_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'EP_NOT_TERNARY'
    | 'MOTIF_WITHOUT_BRIDGE'
    | 'COLD_OPEN_WITHOUT_BRIDGE'
    | 'PEAK_WITHOUT_BRIDGE';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface MotifColdOpenPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    motifs: number;
    coldOpens: number;
    peaks: number;
    latestEp: number;
  };
  findings: MotifColdOpenPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateMotifColdOpenPeakBridge(input: unknown): MotifColdOpenPeakBridgeReport {
  const parsed = MotifColdOpenPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, motifs: 0, coldOpens: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, motifs, appearances, coldOpens, peaks, links } = parsed.data;
  const findings: MotifColdOpenPeakBridgeFinding[] = [];
  const push = (x: MotifColdOpenPeakBridgeFinding) => findings.push(x);

  const mReport = evaluateMotifCallbacks({ series, latestEp, motifs, appearances });
  if (mReport.verdict === 'FAIL') {
    const childFails = mReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_MOTIF_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌母题账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 motif-callback-gate',
    });
  }

  for (const co of coldOpens) {
    const r = evaluateColdOpenHook(co.shotSpec);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_COLD_OPEN_FAIL',
        severity: 'FAIL',
        ids: [co.id, ...childFails.flatMap((f) => f.shotIds ?? [])],
        message: `coldOpen ${co.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 cold-open-hook-gate',
      });
    }
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

  const byMotif = new Map(motifs.map((m) => [m.id, m]));
  const byC = new Map(coldOpens.map((c) => [c.id, c]));
  const byPeak = new Map(peaks.map((p) => [p.id, p]));
  const linkedMotifs = new Set<string>();
  const linkedC = new Set<string>();
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
    const motif = byMotif.get(link.motifId);
    if (!motif) {
      push({
        code: 'UNKNOWN_MOTIF',
        severity: 'FAIL',
        ids: [link.id, link.motifId],
        message: `联表 ${link.id} 引用未知 motif ${link.motifId}`,
        fix: 'motifId 须存在于 motifs[]',
      });
      continue;
    }
    const co = byC.get(link.coldOpenId);
    if (!co) {
      push({
        code: 'UNKNOWN_COLD_OPEN',
        severity: 'FAIL',
        ids: [link.id, link.coldOpenId],
        message: `联表 ${link.id} 引用未知 coldOpen ${link.coldOpenId}`,
        fix: 'coldOpenId 须存在于 coldOpens[]',
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

    const hasMotif = appearances.some((a) => a.motifId === motif.id && a.ep === link.ep);
    if (
      peak.peakEp === undefined ||
      link.ep !== co.ep ||
      link.ep !== peak.peakEp ||
      !hasMotif
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, motif.id, co.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 coldOpen=${co.ep}/peak=${peak.peakEp ?? '无'}/motif@ep=${hasMotif}`,
        fix: '三元同框：link.ep = coldOpen.ep = peakEp 且 motif appearance@ep',
      });
      continue;
    }

    linkedMotifs.add(motif.id);
    linkedC.add(co.id);
    linkedPeaks.add(peak.id);
    aligned += 1;
  }

  for (const motif of motifs) {
    if (!linkedMotifs.has(motif.id)) {
      push({
        code: 'MOTIF_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [motif.id],
        message: `motif ${motif.id} 无 motif×coldOpen×peak 桥`,
        fix: '为母题挂 MotifColdOpenPeakBridge',
      });
    }
  }
  for (const co of coldOpens) {
    if (!linkedC.has(co.id)) {
      push({
        code: 'COLD_OPEN_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [co.id],
        message: `coldOpen ${co.id} ep=E${co.ep} 无 motif×coldOpen×peak 桥`,
        fix: '为冷开挂 MotifColdOpenPeakBridge',
      });
    }
  }
  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedPeaks.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 motif×coldOpen×peak 桥`,
        fix: '为峰值集挂 MotifColdOpenPeakBridge',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      motifs: motifs.length,
      coldOpens: coldOpens.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
