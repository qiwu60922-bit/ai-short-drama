/**
 * V12 · Motif × Bond Link Gate (视觉母题 × 契约升级/解除 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《逃婚三年》/《盛夏芬德拉》: 母题 payoff 常踩契约真心升级窗.
 *  - 与 bondMotifLink（bond 主键）互补：本 gate 以 motif 为主键强制「有 payoff 须对齐 bond terminal」。
 *
 *  SCHEMA / DUP_ID / UNKNOWN_MOTIF / UNKNOWN_BOND
 *  CHILD_MOTIF_FAIL / CHILD_BOND_FAIL
 *  NO_MOTIF_AT_TERMINAL — upgrade|dissolve 须有 appearance
 *  MOTIF_WITHOUT_TERMINAL / TERMINAL_WITHOUT_MOTIF
 *  PENDING_BOND (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  BondContractEntrySchema,
  evaluateBondContract,
} from './bond-contract-gate';
import {
  MotifEntrySchema,
  MotifAppearanceSchema,
  evaluateMotifCallbacks,
} from './motif-callback-gate';

const Ep = z.number().int().positive();

export const MotifBondLinkEntrySchema = z.object({
  id: z.string().min(1),
  motifId: z.string().min(1),
  bondId: z.string().min(1),
  note: z.string().optional(),
});

export const MotifBondLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  bonds: z.array(BondContractEntrySchema),
  links: z.array(MotifBondLinkEntrySchema),
});

export type MotifBondLinkLedger = z.infer<typeof MotifBondLinkLedgerSchema>;

export type MotifBondLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_MOTIF'
    | 'UNKNOWN_BOND'
    | 'CHILD_MOTIF_FAIL'
    | 'CHILD_BOND_FAIL'
    | 'NO_MOTIF_AT_TERMINAL'
    | 'MOTIF_WITHOUT_TERMINAL'
    | 'TERMINAL_WITHOUT_MOTIF'
    | 'PENDING_BOND';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface MotifBondLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    motifs: number;
    bonds: number;
    latestEp: number;
  };
  findings: MotifBondLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

function bondTerminalEp(b: { upgradeEp?: number; dissolveEp?: number }): number | undefined {
  return b.upgradeEp ?? b.dissolveEp;
}

export function evaluateMotifBondLink(input: unknown): MotifBondLinkReport {
  const parsed = MotifBondLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, motifs: 0, bonds: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, motifs, appearances, bonds, links } = parsed.data;
  const findings: MotifBondLinkFinding[] = [];
  const push = (x: MotifBondLinkFinding) => findings.push(x);

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

  const bondReport = evaluateBondContract({ series, latestEp, entries: bonds });
  if (bondReport.verdict === 'FAIL') {
    const childFails = bondReport.findings.filter((f) => f.severity === 'FAIL');
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

  const byMotif = new Map(motifs.map((m) => [m.id, m]));
  const byBond = new Map(bonds.map((b) => [b.id, b]));
  const pairedMotifs = new Set<string>();
  const pairedBonds = new Set<string>();
  let aligned = 0;

  for (const link of links) {
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
    const bond = byBond.get(link.bondId);
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

    const term = bondTerminalEp(bond);
    if (term === undefined) {
      push({
        code: 'NO_MOTIF_AT_TERMINAL',
        severity: 'FAIL',
        ids: [link.id, bond.id],
        message: `${link.id}: bond ${bond.id} 无 upgrade/dissolve terminal`,
        fix: '契约须有 upgradeEp 或 dissolveEp',
      });
      continue;
    }

    const hasAppearance = appearances.some((a) => a.motifId === motif.id && a.ep === term);
    if (!hasAppearance) {
      push({
        code: 'NO_MOTIF_AT_TERMINAL',
        severity: 'FAIL',
        ids: [link.id, motif.id, bond.id],
        message: `${link.id}: terminal E${term} 无 motif ${motif.id} appearance`,
        fix: 'terminal 集须有母题出场',
      });
      continue;
    }

    pairedMotifs.add(motif.id);
    pairedBonds.add(bond.id);
    aligned += 1;
  }

  for (const motif of motifs) {
    const hasPayoff = appearances.some((a) => a.motifId === motif.id && a.role === 'payoff');
    if (hasPayoff && !pairedMotifs.has(motif.id)) {
      push({
        code: 'MOTIF_WITHOUT_TERMINAL',
        severity: 'FAIL',
        ids: [motif.id],
        message: `motif ${motif.id} 有 payoff appearance 无 bond terminal 联表`,
        fix: '为母题回扣集挂 MotifBondLink',
      });
    }
  }
  for (const bond of bonds) {
    const term = bondTerminalEp(bond);
    if (term !== undefined && !pairedBonds.has(bond.id)) {
      push({
        code: 'TERMINAL_WITHOUT_MOTIF',
        severity: 'FAIL',
        ids: [bond.id],
        message: `bond ${bond.id} terminal=E${term} 无 motif 联表`,
        fix: '为契约终结集挂 MotifBondLink',
      });
    } else if (term === undefined && !pairedBonds.has(bond.id)) {
      push({
        code: 'PENDING_BOND',
        severity: 'WARN',
        ids: [bond.id],
        message: `bond ${bond.id} 尚未联表到 motif（motif 主键）`,
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
      bonds: bonds.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
