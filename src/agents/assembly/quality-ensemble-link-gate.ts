/**
 * V12 · Quality × Ensemble Link Gate (表演门 × 群像单元 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 家庭群像 A 线单元当集须过表演/情绪门，不能空壳群戏.
 *  - 与 ensembleQualityPeakBridge / qualityBondLink 互补：本 gate 以 quality 联 ensemble.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_UNIT / FUTURE_EP
 *  CHILD_ENSEMBLE_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_UNIT — link.ep 须等于 unit.ep
 *  UNIT_WITHOUT_QUALITY
 *  LOW_INTENSITY_AT_UNIT (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  EnsembleMemberSchema,
  EnsembleUnitSchema,
  evaluateEnsembleCast,
} from './ensemble-cast-gate';
import {
  QualityLeapDocSchema,
  evaluateQualityLeap,
} from './quality-leap-gate';

const Ep = z.number().int().positive();

export const QualityEnsembleLinkEntrySchema = z.object({
  id: z.string().min(1),
  unitId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const QualityEnsembleLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minUnitIntense: z.number().int().min(1).max(5).optional(),
  members: z.array(EnsembleMemberSchema),
  units: z.array(EnsembleUnitSchema),
  links: z.array(QualityEnsembleLinkEntrySchema),
});

export type QualityEnsembleLinkLedger = z.infer<typeof QualityEnsembleLinkLedgerSchema>;

export type QualityEnsembleLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_UNIT'
    | 'FUTURE_EP'
    | 'CHILD_ENSEMBLE_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_UNIT'
    | 'UNIT_WITHOUT_QUALITY'
    | 'LOW_INTENSITY_AT_UNIT';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface QualityEnsembleLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    units: number;
    latestEp: number;
  };
  findings: QualityEnsembleLinkFinding[];
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

export function evaluateQualityEnsembleLink(input: unknown): QualityEnsembleLinkReport {
  const parsed = QualityEnsembleLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, units: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, members, units, links, minUnitIntense = 4 } = parsed.data;
  const findings: QualityEnsembleLinkFinding[] = [];
  const push = (x: QualityEnsembleLinkFinding) => findings.push(x);

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

  const byU = new Map(units.map((u) => [u.id, u]));
  const paired = new Set<string>();
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

    const ql = evaluateQualityLeap(link.qualityLeap);
    if (ql.verdict === 'FAIL') {
      const childFails = ql.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_QUALITY_FAIL',
        severity: 'FAIL',
        ids: [link.id, ...childFails.flatMap((f) => f.ids ?? [])],
        message: `内嵌表演门 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 quality-leap-gate',
      });
      continue;
    }

    if (link.ep !== unit.ep) {
      push({
        code: 'EP_NOT_UNIT',
        severity: 'FAIL',
        ids: [link.id, unit.id],
        message: `${link.id}: ep=E${link.ep} ≠ unit=${unit.ep}`,
        fix: 'link.ep 须等于 unit.ep',
      });
      continue;
    }

    const intense = maxIntensity(link.qualityLeap);
    if (intense < minUnitIntense) {
      push({
        code: 'LOW_INTENSITY_AT_UNIT',
        severity: 'WARN',
        ids: [link.id],
        message: `${link.id}: unit 镜 max intensity=${intense} < ${minUnitIntense}`,
        fix: '抬高群像单元镜 intensity',
      });
    }

    paired.add(unit.id);
    aligned += 1;
  }

  for (const unit of units) {
    if (!paired.has(unit.id) && unit.ep <= latestEp) {
      push({
        code: 'UNIT_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [unit.id],
        message: `unit ${unit.id} 无 quality 联表`,
        fix: '为群像单元挂 QualityEnsembleLink',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      units: units.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
