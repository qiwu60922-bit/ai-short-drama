/**
 * V12 · Ensemble × Foreshadow Link Gate (群像单元 × 伏笔兑现 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 群像 A 线单元常与 S/A 伏笔 payoff 同集.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_UNIT / UNKNOWN_FORESHADOW / FUTURE_EP
 *  CHILD_ENSEMBLE_FAIL / CHILD_FORESHADOW_FAIL
 *  EP_NOT_PAYOFF — link.ep = unit.ep = payoffEp
 *  UNIT_WITHOUT_FORESHADOW / PAYOFF_WITHOUT_UNIT
 *  PENDING_FORESHADOW (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  EnsembleMemberSchema,
  EnsembleUnitSchema,
  evaluateEnsembleCast,
} from './ensemble-cast-gate';
import {
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
} from './foreshadow-ledger-gate';

const Ep = z.number().int().positive();

export const EnsembleForeshadowLinkEntrySchema = z.object({
  id: z.string().min(1),
  unitId: z.string().min(1),
  foreshadowId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const EnsembleForeshadowLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  members: z.array(EnsembleMemberSchema),
  units: z.array(EnsembleUnitSchema),
  items: z.array(ForeshadowItemSchema),
  links: z.array(EnsembleForeshadowLinkEntrySchema),
});

export type EnsembleForeshadowLinkLedger = z.infer<typeof EnsembleForeshadowLinkLedgerSchema>;

export type EnsembleForeshadowLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_UNIT'
    | 'UNKNOWN_FORESHADOW'
    | 'FUTURE_EP'
    | 'CHILD_ENSEMBLE_FAIL'
    | 'CHILD_FORESHADOW_FAIL'
    | 'EP_NOT_PAYOFF'
    | 'UNIT_WITHOUT_FORESHADOW'
    | 'PAYOFF_WITHOUT_UNIT'
    | 'PENDING_FORESHADOW';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface EnsembleForeshadowLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    units: number;
    items: number;
    latestEp: number;
  };
  findings: EnsembleForeshadowLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateEnsembleForeshadowLink(input: unknown): EnsembleForeshadowLinkReport {
  const parsed = EnsembleForeshadowLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, units: 0, items: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, members, units, items, links } = parsed.data;
  const findings: EnsembleForeshadowLinkFinding[] = [];
  const push = (x: EnsembleForeshadowLinkFinding) => findings.push(x);

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
  const byItem = new Map(items.map((it) => [it.id, it]));
  const pairedU = new Set<string>();
  const pairedItems = new Set<string>();
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
    const item = byItem.get(link.foreshadowId);
    if (!item) {
      push({
        code: 'UNKNOWN_FORESHADOW',
        severity: 'FAIL',
        ids: [link.id, link.foreshadowId],
        message: `联表 ${link.id} 引用未知 foreshadow ${link.foreshadowId}`,
        fix: 'foreshadowId 须存在于 items[]',
      });
      continue;
    }

    if (item.payoffEp === undefined || link.ep !== item.payoffEp || link.ep !== unit.ep) {
      push({
        code: 'EP_NOT_PAYOFF',
        severity: 'FAIL',
        ids: [link.id, unit.id, item.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 unit=${unit.ep}/fs=${item.payoffEp ?? '无'}`,
        fix: '伏笔 payoff 须踩群像单元同集',
      });
      continue;
    }

    pairedU.add(unit.id);
    pairedItems.add(item.id);
    aligned += 1;
  }

  for (const unit of units) {
    if (!pairedU.has(unit.id) && unit.ep <= latestEp) {
      push({
        code: 'UNIT_WITHOUT_FORESHADOW',
        severity: 'FAIL',
        ids: [unit.id],
        message: `unit ${unit.id} 无 foreshadow 联表`,
        fix: '为群像单元挂 EnsembleForeshadowLink',
      });
    }
  }
  for (const it of items) {
    if (it.payoffEp !== undefined && !pairedItems.has(it.id)) {
      push({
        code: 'PAYOFF_WITHOUT_UNIT',
        severity: 'FAIL',
        ids: [it.id],
        message: `foreshadow ${it.id} payoffEp=E${it.payoffEp} 无 ensemble 联表`,
        fix: '为伏笔兑现集挂 EnsembleForeshadowLink',
      });
    } else if (!pairedItems.has(it.id)) {
      push({
        code: 'PENDING_FORESHADOW',
        severity: 'WARN',
        ids: [it.id],
        message: `foreshadow ${it.id} 尚未联表到 ensemble`,
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
      items: items.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
