/**
 * V12 · Cliff-Cascade × Bond Link Gate (跨集悬念叠钩 × 契约升级/解除 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《逃婚三年》: 契约真心升级常踩下集 hook 承接窗，避免软重置.
 *  - 与 bondCliffLink（bond 主键）互补：本 gate 以 cliff 为主键强制「有 cliff 须对齐 terminal」。
 *
 *  SCHEMA / DUP_ID / UNKNOWN_BOND / UNKNOWN_CLIFF / FUTURE_EP
 *  CHILD_BOND_FAIL / CHILD_CASCADE_FAIL
 *  EP_NOT_CLIFF_TERMINAL — link.ep = upgrade|dissolve = cliff.nextEp
 *  BOND_WITHOUT_CLIFF / CLIFF_WITHOUT_BOND
 *  PENDING_CLIFF (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  BondContractEntrySchema,
  evaluateBondContract,
} from './bond-contract-gate';
import {
  CliffCascadeLinkEntrySchema,
  evaluateCliffCascadeLink,
} from './cliff-cascade-link-gate';

const Ep = z.number().int().positive();

export const CliffBondLinkEntrySchema = z.object({
  id: z.string().min(1),
  bondId: z.string().min(1),
  cliffLinkId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const CliffBondLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  bonds: z.array(BondContractEntrySchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  links: z.array(CliffBondLinkEntrySchema),
});

export type CliffBondLinkLedger = z.infer<typeof CliffBondLinkLedgerSchema>;

export type CliffBondLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_BOND'
    | 'UNKNOWN_CLIFF'
    | 'FUTURE_EP'
    | 'CHILD_BOND_FAIL'
    | 'CHILD_CASCADE_FAIL'
    | 'EP_NOT_CLIFF_TERMINAL'
    | 'BOND_WITHOUT_CLIFF'
    | 'CLIFF_WITHOUT_BOND'
    | 'PENDING_CLIFF';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface CliffBondLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    bonds: number;
    cliffLinks: number;
    latestEp: number;
  };
  findings: CliffBondLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateCliffBondLink(input: unknown): CliffBondLinkReport {
  const parsed = CliffBondLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, bonds: 0, cliffLinks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, bonds, cliffLinks, links } = parsed.data;
  const findings: CliffBondLinkFinding[] = [];
  const push = (x: CliffBondLinkFinding) => findings.push(x);

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

  if (cliffLinks.length) {
    const cascade = evaluateCliffCascadeLink({ series, latestEp, links: cliffLinks });
    if (cascade.verdict === 'FAIL') {
      const childFails = cascade.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_CASCADE_FAIL',
        severity: 'FAIL',
        ids: childFails.flatMap((f) => f.ids ?? []),
        message: `内嵌 cliffCascade FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 cliff-cascade-link-gate',
      });
    }
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

  const byBond = new Map(bonds.map((b) => [b.id, b]));
  const byCliff = new Map(cliffLinks.map((c) => [c.id, c]));
  const pairedBond = new Set<string>();
  const pairedCliff = new Set<string>();
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
    const cliff = byCliff.get(link.cliffLinkId);
    if (!cliff) {
      push({
        code: 'UNKNOWN_CLIFF',
        severity: 'FAIL',
        ids: [link.id, link.cliffLinkId],
        message: `联表 ${link.id} 引用未知 cliffLink ${link.cliffLinkId}`,
        fix: 'cliffLinkId 须存在于 cliffLinks[]',
      });
      continue;
    }

    const terminals = [bond.upgradeEp, bond.dissolveEp].filter(
      (e): e is number => typeof e === 'number',
    );
    if (!terminals.includes(link.ep) || link.ep !== cliff.nextEp) {
      push({
        code: 'EP_NOT_CLIFF_TERMINAL',
        severity: 'FAIL',
        ids: [link.id, bond.id, cliff.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 terminal=${terminals.join('/') || '无'}/next=E${cliff.nextEp}`,
        fix: '契约 upgrade|dissolve 须踩 cliff.nextEp',
      });
      continue;
    }

    pairedBond.add(bond.id);
    pairedCliff.add(cliff.id);
    aligned += 1;
  }

  for (const bond of bonds) {
    const terminals = [bond.upgradeEp, bond.dissolveEp].filter(
      (e): e is number => typeof e === 'number',
    );
    if (terminals.length > 0 && !pairedBond.has(bond.id)) {
      push({
        code: 'BOND_WITHOUT_CLIFF',
        severity: 'FAIL',
        ids: [bond.id],
        message: `bond ${bond.id} terminal=${terminals.join('/')} 无 cliff 联表`,
        fix: '为契约升级/解除集挂 CliffBondLink',
      });
    } else if (!pairedBond.has(bond.id)) {
      push({
        code: 'PENDING_CLIFF',
        severity: 'WARN',
        ids: [bond.id],
        message: `bond ${bond.id} 尚未联表到 cliff`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const c of cliffLinks) {
    if (!pairedCliff.has(c.id)) {
      push({
        code: 'CLIFF_WITHOUT_BOND',
        severity: 'FAIL',
        ids: [c.id],
        message: `cliffLink ${c.id} 无 bond 联表`,
        fix: '在 links[] 挂 bondId↔cliffLinkId',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      bonds: bonds.length,
      cliffLinks: cliffLinks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
