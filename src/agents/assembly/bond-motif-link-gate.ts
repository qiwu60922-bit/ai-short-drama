/**
 * V12 · Bond × Motif Link Gate (契约升级/解除 × 视觉母题 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《逃婚三年》/《盛夏芬德拉》: 契约真心升级常踩母题 payoff/appearance 窗.
 *  - bond-contract 管 upgrade|dissolve；motif-callback 管 appearance——本 gate 硬对齐.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_BOND / UNKNOWN_MOTIF
 *  CHILD_BOND_FAIL / CHILD_MOTIF_FAIL
 *  NO_MOTIF_AT_TERMINAL — upgrade|dissolve 须有 appearance
 *  TERMINAL_WITHOUT_MOTIF / MOTIF_WITHOUT_TERMINAL
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

export const BondMotifLinkEntrySchema = z.object({
  id: z.string().min(1),
  bondId: z.string().min(1),
  motifId: z.string().min(1),
  note: z.string().optional(),
});

export const BondMotifLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  bonds: z.array(BondContractEntrySchema),
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  links: z.array(BondMotifLinkEntrySchema),
});

export type BondMotifLinkLedger = z.infer<typeof BondMotifLinkLedgerSchema>;

export type BondMotifLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_BOND'
    | 'UNKNOWN_MOTIF'
    | 'CHILD_BOND_FAIL'
    | 'CHILD_MOTIF_FAIL'
    | 'NO_MOTIF_AT_TERMINAL'
    | 'TERMINAL_WITHOUT_MOTIF'
    | 'MOTIF_WITHOUT_TERMINAL'
    | 'PENDING_BOND';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface BondMotifLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    bonds: number;
    motifs: number;
    latestEp: number;
  };
  findings: BondMotifLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

function bondTerminalEp(b: { upgradeEp?: number; dissolveEp?: number }): number | undefined {
  return b.upgradeEp ?? b.dissolveEp;
}

export function evaluateBondMotifLink(input: unknown): BondMotifLinkReport {
  const parsed = BondMotifLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, bonds: 0, motifs: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, bonds, motifs, appearances, links } = parsed.data;
  const findings: BondMotifLinkFinding[] = [];
  const push = (x: BondMotifLinkFinding) => findings.push(x);

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

  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const l of links) {
    if (seen.has(l.id)) dups.add(l.id);
    else seen.add(l.id);
  }
  for (const id of dups) {
    push({ code: 'DUP_ID', severity: 'FAIL', ids: [id], message: `联表ID重复：${id}`, fix: '联表 id 须唯一' });
  }

  const byB = new Map(bonds.map((b) => [b.id, b]));
  const byM = new Map(motifs.map((m) => [m.id, m]));
  const appsByMotif = new Map<string, typeof appearances>();
  for (const a of appearances) {
    const arr = appsByMotif.get(a.motifId) ?? [];
    arr.push(a);
    appsByMotif.set(a.motifId, arr);
  }
  const pairedB = new Set<string>();
  const pairedM = new Set<string>();
  let aligned = 0;

  for (const link of links) {
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
    const motif = byM.get(link.motifId);
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

    const terminal = bondTerminalEp(bond);
    if (terminal === undefined) {
      push({
        code: 'PENDING_BOND',
        severity: 'WARN',
        ids: [bond.id],
        message: `bond ${bond.id} 尚未 upgrade/dissolve，跳过母题对齐`,
        fix: '规划 upgradeEp|dissolveEp',
      });
      continue;
    }

    const apps = appsByMotif.get(motif.id) ?? [];
    if (!apps.some((a) => a.ep === terminal)) {
      push({
        code: 'NO_MOTIF_AT_TERMINAL',
        severity: 'FAIL',
        ids: [link.id, bond.id, motif.id],
        message: `${link.id}: bond terminal=E${terminal} 无 motif ${motif.id} appearance`,
        fix: '在 upgrade|dissolve 集补 motif appearance',
      });
      continue;
    }

    pairedB.add(bond.id);
    pairedM.add(motif.id);
    aligned += 1;
  }

  for (const bond of bonds) {
    const terminal = bondTerminalEp(bond);
    if (terminal !== undefined && !pairedB.has(bond.id)) {
      push({
        code: 'TERMINAL_WITHOUT_MOTIF',
        severity: 'FAIL',
        ids: [bond.id],
        message: `bond ${bond.id} terminal=E${terminal} 无 motif 联表`,
        fix: '为契约终局集挂 BondMotifLink',
      });
    } else if (!pairedB.has(bond.id)) {
      push({
        code: 'PENDING_BOND',
        severity: 'WARN',
        ids: [bond.id],
        message: `bond ${bond.id} 尚未联表到 motif`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const motif of motifs) {
    if (!pairedM.has(motif.id)) {
      push({
        code: 'MOTIF_WITHOUT_TERMINAL',
        severity: 'FAIL',
        ids: [motif.id],
        message: `motif ${motif.id} 无 bond terminal 联表`,
        fix: '在 links[] 挂 bondId↔motifId',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      bonds: bonds.length,
      motifs: motifs.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
