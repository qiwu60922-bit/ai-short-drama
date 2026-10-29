/**
 * V12 · Bond × Foreshadow Link Gate (契约纽带 × 伏笔兑现 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 契约向: 契约 upgrade/dissolve 常与 S/A 伏笔 payoff 同集.
 *  - 与 foreshadowBondLink（foreshadow 主键）互补：本 gate 以 bond 为主键.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_BOND / UNKNOWN_FORESHADOW / FUTURE_EP
 *  CHILD_BOND_FAIL / CHILD_FORESHADOW_FAIL
 *  EP_NOT_PAYOFF_UPGRADE — link.ep = upgradeEp|dissolveEp = payoffEp
 *  BOND_WITHOUT_FORESHADOW / PAYOFF_WITHOUT_BOND
 *  PENDING_BOND / PENDING_FORESHADOW (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  BondContractEntrySchema,
  evaluateBondContract,
} from './bond-contract-gate';
import {
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
} from './foreshadow-ledger-gate';

const Ep = z.number().int().positive();

export const BondForeshadowLinkEntrySchema = z.object({
  id: z.string().min(1),
  bondId: z.string().min(1),
  foreshadowId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const BondForeshadowLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  bonds: z.array(BondContractEntrySchema),
  items: z.array(ForeshadowItemSchema),
  links: z.array(BondForeshadowLinkEntrySchema),
});

export type BondForeshadowLinkLedger = z.infer<typeof BondForeshadowLinkLedgerSchema>;

export type BondForeshadowLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_BOND'
    | 'UNKNOWN_FORESHADOW'
    | 'FUTURE_EP'
    | 'CHILD_BOND_FAIL'
    | 'CHILD_FORESHADOW_FAIL'
    | 'EP_NOT_PAYOFF_UPGRADE'
    | 'BOND_WITHOUT_FORESHADOW'
    | 'PAYOFF_WITHOUT_BOND'
    | 'PENDING_BOND'
    | 'PENDING_FORESHADOW';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface BondForeshadowLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    bonds: number;
    items: number;
    latestEp: number;
  };
  findings: BondForeshadowLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateBondForeshadowLink(input: unknown): BondForeshadowLinkReport {
  const parsed = BondForeshadowLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, bonds: 0, items: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, bonds, items, links } = parsed.data;
  const findings: BondForeshadowLinkFinding[] = [];
  const push = (x: BondForeshadowLinkFinding) => findings.push(x);

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

  const byB = new Map(bonds.map((b) => [b.id, b]));
  const byItem = new Map(items.map((it) => [it.id, it]));
  const pairedB = new Set<string>();
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

    const bondEp = bond.upgradeEp ?? bond.dissolveEp;
    if (
      bondEp === undefined ||
      item.payoffEp === undefined ||
      link.ep !== bondEp ||
      link.ep !== item.payoffEp
    ) {
      push({
        code: 'EP_NOT_PAYOFF_UPGRADE',
        severity: 'FAIL',
        ids: [link.id, bond.id, item.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 bond=${bondEp ?? '无'}/fs=${item.payoffEp ?? '无'}`,
        fix: '伏笔 payoff 须踩契约 upgrade/dissolve 同集',
      });
      continue;
    }

    pairedB.add(bond.id);
    pairedItems.add(item.id);
    aligned += 1;
  }

  for (const bond of bonds) {
    const bondEp = bond.upgradeEp ?? bond.dissolveEp;
    if (bondEp !== undefined && !pairedB.has(bond.id)) {
      push({
        code: 'BOND_WITHOUT_FORESHADOW',
        severity: 'FAIL',
        ids: [bond.id],
        message: `bond ${bond.id} upgrade/dissolve=E${bondEp} 无 foreshadow 联表`,
        fix: '为契约转折挂 BondForeshadowLink',
      });
    } else if (!pairedB.has(bond.id)) {
      push({
        code: 'PENDING_BOND',
        severity: 'WARN',
        ids: [bond.id],
        message: `bond ${bond.id} 尚未联表到 foreshadow`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const it of items) {
    if (it.payoffEp !== undefined && !pairedItems.has(it.id)) {
      push({
        code: 'PAYOFF_WITHOUT_BOND',
        severity: 'FAIL',
        ids: [it.id],
        message: `foreshadow ${it.id} payoffEp=E${it.payoffEp} 无 bond 联表`,
        fix: '为伏笔兑现集挂 BondForeshadowLink',
      });
    } else if (!pairedItems.has(it.id)) {
      push({
        code: 'PENDING_FORESHADOW',
        severity: 'WARN',
        ids: [it.id],
        message: `foreshadow ${it.id} 尚未联表到 bond`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      bonds: bonds.length,
      items: items.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
