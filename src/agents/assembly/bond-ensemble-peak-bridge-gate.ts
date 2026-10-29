/**
 * V12 · Bond × Ensemble × Peak Ternary Bridge
 * (契约升级/解除 × 群像单元 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 契约真心升级常踩家庭群像 A 线单元，并对齐对峙峰值.
 *  - 与 ensembleBondLink / bondCountdownPeakBridge 互补：本 gate 硬对齐同 ep 三元同框.
 *
 * Per link: bondId + unitId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_UNIT / UNKNOWN_BOND / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_BOND_FAIL / CHILD_PEAK_FAIL / CHILD_ENSEMBLE_FAIL
 *  EP_NOT_TERNARY — link.ep = unit.ep = upgrade|dissolve = peakEp
 *  UNIT_WITHOUT_BRIDGE / TERMINAL_WITHOUT_BRIDGE / PEAK_WITHOUT_BRIDGE
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
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const BondEnsemblePeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  bondId: z.string().min(1),
  unitId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const BondEnsemblePeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  bonds: z.array(BondContractEntrySchema),
  members: z.array(EnsembleMemberSchema),
  units: z.array(EnsembleUnitSchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(BondEnsemblePeakBridgeLinkSchema),
});

export type BondEnsemblePeakBridgeLedger = z.infer<typeof BondEnsemblePeakBridgeLedgerSchema>;

export type BondEnsemblePeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_UNIT'
    | 'UNKNOWN_BOND'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_BOND_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'CHILD_ENSEMBLE_FAIL'
    | 'EP_NOT_TERNARY'
    | 'UNIT_WITHOUT_BRIDGE'
    | 'TERMINAL_WITHOUT_BRIDGE'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'PENDING_BOND';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface BondEnsemblePeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    bonds: number;
    units: number;
    peaks: number;
    latestEp: number;
  };
  findings: BondEnsemblePeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

function bondTerminalEp(b: { upgradeEp?: number; dissolveEp?: number }): number | undefined {
  return b.upgradeEp ?? b.dissolveEp;
}

export function evaluateBondEnsemblePeakBridge(input: unknown): BondEnsemblePeakBridgeReport {
  const parsed = BondEnsemblePeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, bonds: 0, units: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, bonds, members, units, peaks, links } = parsed.data;
  const findings: BondEnsemblePeakBridgeFinding[] = [];
  const push = (x: BondEnsemblePeakBridgeFinding) => findings.push(x);

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

  const byU = new Map(units.map((u) => [u.id, u]));
  const byB = new Map(bonds.map((b) => [b.id, b]));
  const byP = new Map(peaks.map((p) => [p.id, p]));
  const linkedU = new Set<string>();
  const linkedB = new Set<string>();
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

    const terminal = bondTerminalEp(bond);
    if (
      terminal === undefined ||
      peak.peakEp === undefined ||
      link.ep !== unit.ep ||
      link.ep !== terminal ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, unit.id, bond.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 unit=${unit.ep}/terminal=${terminal ?? '无'}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = unit.ep = upgradeEp|dissolveEp = peakEp',
      });
      continue;
    }

    linkedU.add(unit.id);
    linkedB.add(bond.id);
    linkedP.add(peak.id);
    aligned += 1;
  }

  for (const unit of units) {
    if (unit.ep <= latestEp && !linkedU.has(unit.id)) {
      push({
        code: 'UNIT_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [unit.id],
        message: `unit ${unit.id} ep=E${unit.ep} 无 bond×ensemble×peak 桥`,
        fix: '为群像单元挂 BondEnsemblePeakBridge',
      });
    }
  }
  for (const bond of bonds) {
    const terminal = bondTerminalEp(bond);
    if (terminal !== undefined && !linkedB.has(bond.id)) {
      push({
        code: 'TERMINAL_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [bond.id],
        message: `bond ${bond.id} terminal=E${terminal} 无 bond×ensemble×peak 桥`,
        fix: '为终局集挂 BondEnsemblePeakBridge',
      });
    } else if (!linkedB.has(bond.id)) {
      push({
        code: 'PENDING_BOND',
        severity: 'WARN',
        ids: [bond.id],
        message: `bond ${bond.id} 尚未联表`,
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
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 bond×ensemble×peak 桥`,
        fix: '为峰值集挂 BondEnsemblePeakBridge',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      bonds: bonds.length,
      units: units.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
