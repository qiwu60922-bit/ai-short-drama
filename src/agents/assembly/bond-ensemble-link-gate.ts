/**
 * V12 · Ensemble × Bond Link Gate (契约升级/解除 × 群像单元 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 家庭群像 A 线单元常与契约真心升级同集硬对齐.
 *  - 与 bondEnsembleLink / bondCountdownPeakBridge 互补：本 gate 以 bond 为主键命名.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_UNIT / UNKNOWN_BOND / FUTURE_EP
 *  CHILD_ENSEMBLE_FAIL / CHILD_BOND_FAIL
 *  EP_NOT_TERMINAL — link.ep = unit.ep = upgradeEp|dissolveEp
 *  UNIT_WITHOUT_BOND / TERMINAL_WITHOUT_UNIT
 *  PENDING_BOND (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  EnsembleMemberSchema,
  EnsembleUnitSchema,
  evaluateEnsembleCast,
} from './ensemble-cast-gate';
import {
  BondContractEntrySchema,
  evaluateBondContract,
} from './bond-contract-gate';

const Ep = z.number().int().positive();

export const BondEnsembleLinkEntrySchema = z.object({
  id: z.string().min(1),
  bondId: z.string().min(1),
  unitId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const BondEnsembleLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  bonds: z.array(BondContractEntrySchema),
  members: z.array(EnsembleMemberSchema),
  units: z.array(EnsembleUnitSchema),
  links: z.array(BondEnsembleLinkEntrySchema),
});

export type BondEnsembleLinkLedger = z.infer<typeof BondEnsembleLinkLedgerSchema>;

export type BondEnsembleLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_UNIT'
    | 'UNKNOWN_BOND'
    | 'FUTURE_EP'
    | 'CHILD_ENSEMBLE_FAIL'
    | 'CHILD_BOND_FAIL'
    | 'EP_NOT_TERMINAL'
    | 'UNIT_WITHOUT_BOND'
    | 'TERMINAL_WITHOUT_UNIT'
    | 'PENDING_BOND';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface BondEnsembleLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    units: number;
    bonds: number;
    latestEp: number;
  };
  findings: BondEnsembleLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

function bondTerminalEp(b: { upgradeEp?: number; dissolveEp?: number }): number | undefined {
  return b.upgradeEp ?? b.dissolveEp;
}

export function evaluateBondEnsembleLink(input: unknown): BondEnsembleLinkReport {
  const parsed = BondEnsembleLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, units: 0, bonds: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, members, units, bonds, links } = parsed.data;
  const findings: BondEnsembleLinkFinding[] = [];
  const push = (x: BondEnsembleLinkFinding) => findings.push(x);

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

  const bReport = evaluateBondContract({ series, latestEp, entries: bonds });
  if (bReport.verdict === 'FAIL') {
    const childFails = bReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_BOND_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌契约账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 bond-contract-gate',
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
  const byB = new Map(bonds.map((b) => [b.id, b]));
  const pairedU = new Set<string>();
  const pairedB = new Set<string>();
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
    const bond = byB.get(link.bondId);
    if (!bond) {
      push({
        code: 'UNKNOWN_BOND',
        severity: 'FAIL',
        ids: [link.id, link.bondId],
        message: `联表 ${link.id} 引用未知 bond ${link.bondId}`,
        fix: 'bondId 须存在于 bonds[]',
      });
      continue;
    }

    const terminal = bondTerminalEp(bond);
    if (terminal === undefined || link.ep !== unit.ep || link.ep !== terminal) {
      push({
        code: 'EP_NOT_TERMINAL',
        severity: 'FAIL',
        ids: [link.id, unit.id, bond.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 unit=${unit.ep}/terminal=${terminal ?? '无'}`,
        fix: '群像单元与契约终局须同集',
      });
      continue;
    }

    pairedU.add(unit.id);
    pairedB.add(bond.id);
    aligned += 1;
  }

  for (const unit of units) {
    if (!pairedU.has(unit.id)) {
      push({
        code: 'UNIT_WITHOUT_BOND',
        severity: 'FAIL',
        ids: [unit.id],
        message: `unit ${unit.id} ep=E${unit.ep} 无 bond 联表`,
        fix: '为契约挂 BondEnsembleLink',
      });
    }
  }
  for (const bond of bonds) {
    const terminal = bondTerminalEp(bond);
    if (terminal !== undefined && !pairedB.has(bond.id)) {
      push({
        code: 'TERMINAL_WITHOUT_UNIT',
        severity: 'FAIL',
        ids: [bond.id],
        message: `bond ${bond.id} terminal=E${terminal} 无 ensemble 联表`,
        fix: '为终局挂 BondEnsembleLink',
      });
    } else if (!pairedB.has(bond.id)) {
      push({
        code: 'PENDING_BOND',
        severity: 'WARN',
        ids: [bond.id],
        message: `bond ${bond.id} 尚未联表`,
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
      bonds: bonds.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
