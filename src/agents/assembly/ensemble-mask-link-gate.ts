/**
 * V12 · Ensemble × Mask Link Gate (群像单元 × 伪装揭穿 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 家庭群像 A 线单元常与 mask reveal 同集硬对齐.
 *  - 与 allianceMaskLink / ensembleForeshadowLink 互补：本 gate 以 ensemble 联 mask.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_UNIT / UNKNOWN_MASK / FUTURE_EP
 *  CHILD_ENSEMBLE_FAIL / CHILD_MASK_FAIL
 *  EP_NOT_REVEAL — link.ep = unit.ep = revealEp
 *  UNIT_WITHOUT_MASK / REVEAL_WITHOUT_UNIT
 *  PENDING_MASK (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  EnsembleMemberSchema,
  EnsembleUnitSchema,
  evaluateEnsembleCast,
} from './ensemble-cast-gate';
import {
  PersonaMaskEntrySchema,
  evaluatePersonaMask,
} from './persona-mask-gate';

const Ep = z.number().int().positive();

export const EnsembleMaskLinkEntrySchema = z.object({
  id: z.string().min(1),
  unitId: z.string().min(1),
  maskId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const EnsembleMaskLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  members: z.array(EnsembleMemberSchema),
  units: z.array(EnsembleUnitSchema),
  masks: z.array(PersonaMaskEntrySchema),
  links: z.array(EnsembleMaskLinkEntrySchema),
});

export type EnsembleMaskLinkLedger = z.infer<typeof EnsembleMaskLinkLedgerSchema>;

export type EnsembleMaskLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_UNIT'
    | 'UNKNOWN_MASK'
    | 'FUTURE_EP'
    | 'CHILD_ENSEMBLE_FAIL'
    | 'CHILD_MASK_FAIL'
    | 'EP_NOT_REVEAL'
    | 'UNIT_WITHOUT_MASK'
    | 'REVEAL_WITHOUT_UNIT'
    | 'PENDING_MASK';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface EnsembleMaskLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    units: number;
    masks: number;
    latestEp: number;
  };
  findings: EnsembleMaskLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateEnsembleMaskLink(input: unknown): EnsembleMaskLinkReport {
  const parsed = EnsembleMaskLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, units: 0, masks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, members, units, masks, links } = parsed.data;
  const findings: EnsembleMaskLinkFinding[] = [];
  const push = (x: EnsembleMaskLinkFinding) => findings.push(x);

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

  const mReport = evaluatePersonaMask({ series, latestEp, entries: masks });
  if (mReport.verdict === 'FAIL') {
    const childFails = mReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_MASK_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌伪装账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 persona-mask-gate',
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
  const byM = new Map(masks.map((m) => [m.id, m]));
  const pairedU = new Set<string>();
  const pairedM = new Set<string>();
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
    const mask = byM.get(link.maskId);
    if (!mask) {
      push({
        code: 'UNKNOWN_MASK',
        severity: 'FAIL',
        ids: [link.id, link.maskId],
        message: `联表 ${link.id} 引用未知 mask ${link.maskId}`,
        fix: 'maskId 须存在于 masks[]',
      });
      continue;
    }

    if (mask.revealEp === undefined || link.ep !== unit.ep || link.ep !== mask.revealEp) {
      push({
        code: 'EP_NOT_REVEAL',
        severity: 'FAIL',
        ids: [link.id, unit.id, mask.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 unit=${unit.ep}/reveal=${mask.revealEp ?? '无'}`,
        fix: '群像单元与揭穿须同集',
      });
      continue;
    }

    pairedU.add(unit.id);
    pairedM.add(mask.id);
    aligned += 1;
  }

  for (const unit of units) {
    if (!pairedU.has(unit.id)) {
      push({
        code: 'UNIT_WITHOUT_MASK',
        severity: 'FAIL',
        ids: [unit.id],
        message: `unit ${unit.id} 无 mask 联表`,
        fix: '为群像单元挂 EnsembleMaskLink',
      });
    }
  }
  for (const mask of masks) {
    if (mask.revealEp !== undefined && !pairedM.has(mask.id)) {
      push({
        code: 'REVEAL_WITHOUT_UNIT',
        severity: 'FAIL',
        ids: [mask.id],
        message: `mask ${mask.id} revealEp=E${mask.revealEp} 无 ensemble 联表`,
        fix: '为揭穿集挂 EnsembleMaskLink',
      });
    } else if (!pairedM.has(mask.id)) {
      push({
        code: 'PENDING_MASK',
        severity: 'WARN',
        ids: [mask.id],
        message: `mask ${mask.id} 尚未联表`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      units: units.length,
      masks: masks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
