/**
 * V12 · Motif × Ensemble × Peak Ternary Bridge
 * (视觉母题 × 群像单元 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 母题回扣常踩家庭群像 A 线单元，并对齐对峙峰值.
 *  - 与 motifMaskPeakBridge / foreshadowEnsembleLink 互补：本 gate 硬对齐同 ep 三元同框.
 *
 * Per link: motifId + unitId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_MOTIF / UNKNOWN_UNIT / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_MOTIF_FAIL / CHILD_ENSEMBLE_FAIL / CHILD_PEAK_FAIL
 *  EP_NOT_TERNARY — link.ep = unit.ep = peakEp 且 motif appearance@ep
 *  PEAK_WITHOUT_BRIDGE / MOTIF_WITHOUT_BRIDGE / UNIT_WITHOUT_BRIDGE
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  MotifEntrySchema,
  MotifAppearanceSchema,
  evaluateMotifCallbacks,
} from './motif-callback-gate';
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

export const MotifEnsemblePeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  motifId: z.string().min(1),
  unitId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const MotifEnsemblePeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  members: z.array(EnsembleMemberSchema),
  units: z.array(EnsembleUnitSchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(MotifEnsemblePeakBridgeLinkSchema),
});

export type MotifEnsemblePeakBridgeLedger = z.infer<typeof MotifEnsemblePeakBridgeLedgerSchema>;

export type MotifEnsemblePeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_MOTIF'
    | 'UNKNOWN_UNIT'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_MOTIF_FAIL'
    | 'CHILD_ENSEMBLE_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'EP_NOT_TERNARY'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'MOTIF_WITHOUT_BRIDGE'
    | 'UNIT_WITHOUT_BRIDGE';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface MotifEnsemblePeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    motifs: number;
    units: number;
    peaks: number;
    latestEp: number;
  };
  findings: MotifEnsemblePeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateMotifEnsemblePeakBridge(input: unknown): MotifEnsemblePeakBridgeReport {
  const parsed = MotifEnsemblePeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, motifs: 0, units: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, motifs, appearances, members, units, peaks, links } = parsed.data;
  const findings: MotifEnsemblePeakBridgeFinding[] = [];
  const push = (x: MotifEnsemblePeakBridgeFinding) => findings.push(x);

  const motifReport = evaluateMotifCallbacks({ series, latestEp, motifs, appearances });
  if (motifReport.verdict === 'FAIL') {
    const childFails = motifReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_MOTIF_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌母题账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 motif-callback-gate',
    });
  }

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
  const byU = new Map(units.map((u) => [u.id, u]));
  const byPeak = new Map(peaks.map((p) => [p.id, p]));
  const linkedPeaks = new Set<string>();
  const linkedMotifs = new Set<string>();
  const linkedUnits = new Set<string>();
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

    const hasAppearance = appearances.some((a) => a.motifId === motif.id && a.ep === link.ep);
    if (
      peak.peakEp === undefined ||
      link.ep !== unit.ep ||
      link.ep !== peak.peakEp ||
      !hasAppearance
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, motif.id, unit.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 unit=${unit.ep}/peak=${peak.peakEp ?? '无'}/appearance=${hasAppearance}`,
        fix: '三元同框：link.ep = unit.ep = peakEp 且 motif appearance@ep',
      });
      continue;
    }

    linkedPeaks.add(peak.id);
    linkedMotifs.add(motif.id);
    linkedUnits.add(unit.id);
    aligned += 1;
  }

  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedPeaks.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 motif×ensemble×peak 桥`,
        fix: '为峰值集挂 MotifEnsemblePeakBridge',
      });
    }
  }
  for (const motif of motifs) {
    const hasPayoff = appearances.some((a) => a.motifId === motif.id && a.role === 'payoff');
    if (hasPayoff && !linkedMotifs.has(motif.id)) {
      push({
        code: 'MOTIF_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [motif.id],
        message: `motif ${motif.id} 有 payoff appearance 无 motif×ensemble×peak 桥`,
        fix: '为母题回扣集挂 MotifEnsemblePeakBridge',
      });
    }
  }
  for (const unit of units) {
    if (unit.ep <= latestEp && !linkedUnits.has(unit.id)) {
      push({
        code: 'UNIT_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [unit.id],
        message: `unit ${unit.id} 无 motif×ensemble×peak 桥`,
        fix: '为群像单元挂 MotifEnsemblePeakBridge',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      motifs: motifs.length,
      units: units.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
