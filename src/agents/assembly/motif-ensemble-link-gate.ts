/**
 * V12 · Motif × Ensemble Link Gate (视觉母题 × 群像单元 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 家庭群像 A 线单元当集常回扣视觉母题 payoff.
 *  - 与 foreshadowEnsembleLink / motifCountdownLink 互补：本 gate 以 motif 联 ensemble.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_MOTIF / UNKNOWN_UNIT / FUTURE_EP
 *  CHILD_MOTIF_FAIL / CHILD_ENSEMBLE_FAIL
 *  EP_NOT_UNIT — link.ep = unit.ep 且 motif appearance@ep
 *  UNIT_WITHOUT_MOTIF / MOTIF_WITHOUT_UNIT
 *  PENDING_MOTIF (WARN)
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

const Ep = z.number().int().positive();

export const MotifEnsembleLinkEntrySchema = z.object({
  id: z.string().min(1),
  motifId: z.string().min(1),
  unitId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const MotifEnsembleLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  members: z.array(EnsembleMemberSchema),
  units: z.array(EnsembleUnitSchema),
  links: z.array(MotifEnsembleLinkEntrySchema),
});

export type MotifEnsembleLinkLedger = z.infer<typeof MotifEnsembleLinkLedgerSchema>;

export type MotifEnsembleLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_MOTIF'
    | 'UNKNOWN_UNIT'
    | 'FUTURE_EP'
    | 'CHILD_MOTIF_FAIL'
    | 'CHILD_ENSEMBLE_FAIL'
    | 'EP_NOT_UNIT'
    | 'UNIT_WITHOUT_MOTIF'
    | 'MOTIF_WITHOUT_UNIT'
    | 'PENDING_MOTIF';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface MotifEnsembleLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    motifs: number;
    units: number;
    latestEp: number;
  };
  findings: MotifEnsembleLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateMotifEnsembleLink(input: unknown): MotifEnsembleLinkReport {
  const parsed = MotifEnsembleLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, motifs: 0, units: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, motifs, appearances, members, units, links } = parsed.data;
  const findings: MotifEnsembleLinkFinding[] = [];
  const push = (x: MotifEnsembleLinkFinding) => findings.push(x);

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
  const pairedMotifs = new Set<string>();
  const pairedU = new Set<string>();
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

    const hasAppearance = appearances.some((a) => a.motifId === motif.id && a.ep === link.ep);
    if (link.ep !== unit.ep || !hasAppearance) {
      push({
        code: 'EP_NOT_UNIT',
        severity: 'FAIL',
        ids: [link.id, motif.id, unit.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 unit=${unit.ep}/appearance=${hasAppearance}`,
        fix: '母题出场须踩群像单元同集',
      });
      continue;
    }

    pairedMotifs.add(motif.id);
    pairedU.add(unit.id);
    aligned += 1;
  }

  for (const unit of units) {
    if (!pairedU.has(unit.id) && unit.ep <= latestEp) {
      push({
        code: 'UNIT_WITHOUT_MOTIF',
        severity: 'FAIL',
        ids: [unit.id],
        message: `unit ${unit.id} 无 motif 联表`,
        fix: '为群像单元挂 MotifEnsembleLink',
      });
    }
  }
  for (const motif of motifs) {
    const hasPayoff = appearances.some((a) => a.motifId === motif.id && a.role === 'payoff');
    if (hasPayoff && !pairedMotifs.has(motif.id)) {
      push({
        code: 'MOTIF_WITHOUT_UNIT',
        severity: 'FAIL',
        ids: [motif.id],
        message: `motif ${motif.id} 有 payoff appearance 无 ensemble 联表`,
        fix: '为母题回扣集挂 MotifEnsembleLink',
      });
    } else if (!pairedMotifs.has(motif.id)) {
      push({
        code: 'PENDING_MOTIF',
        severity: 'WARN',
        ids: [motif.id],
        message: `motif ${motif.id} 尚未联表到 ensemble`,
        fix: '补 links[] 或确认旁路',
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
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
