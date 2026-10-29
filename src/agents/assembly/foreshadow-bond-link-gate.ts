/**
 * V12 · Foreshadow × Bond Link Gate (伏笔兑现 × 契约升级/解除 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《帐中香》/《逃婚三年》: S/A 伏笔 payoff 常与契约真心升级同集.
 *  - foreshadow-ledger 管 plant→payoff；bond-contract 管 upgrade|dissolve——本 gate 硬对齐.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_FORESHADOW / UNKNOWN_BOND
 *  CHILD_FORESHADOW_FAIL / CHILD_BOND_FAIL
 *  PAYOFF_NOT_AT_TERMINAL — payoffEp 须等于 upgradeEp|dissolveEp
 *  TERMINAL_WITHOUT_FORESHADOW / PAYOFF_WITHOUT_BOND
 *  PENDING_BOND (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
} from './foreshadow-ledger-gate';
import {
  BondContractEntrySchema,
  evaluateBondContract,
} from './bond-contract-gate';

const Ep = z.number().int().positive();

export const ForeshadowBondLinkEntrySchema = z.object({
  id: z.string().min(1),
  foreshadowId: z.string().min(1),
  bondId: z.string().min(1),
  note: z.string().optional(),
});

export const ForeshadowBondLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  items: z.array(ForeshadowItemSchema),
  bonds: z.array(BondContractEntrySchema),
  links: z.array(ForeshadowBondLinkEntrySchema),
});

export type ForeshadowBondLinkLedger = z.infer<typeof ForeshadowBondLinkLedgerSchema>;

export type ForeshadowBondLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_FORESHADOW'
    | 'UNKNOWN_BOND'
    | 'CHILD_FORESHADOW_FAIL'
    | 'CHILD_BOND_FAIL'
    | 'PAYOFF_NOT_AT_TERMINAL'
    | 'TERMINAL_WITHOUT_FORESHADOW'
    | 'PAYOFF_WITHOUT_BOND'
    | 'PENDING_BOND';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface ForeshadowBondLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    items: number;
    bonds: number;
    latestEp: number;
  };
  findings: ForeshadowBondLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

function bondTerminalEp(b: { upgradeEp?: number; dissolveEp?: number }): number | undefined {
  return b.upgradeEp ?? b.dissolveEp;
}

export function evaluateForeshadowBondLink(input: unknown): ForeshadowBondLinkReport {
  const parsed = ForeshadowBondLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, items: 0, bonds: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, items, bonds, links } = parsed.data;
  const findings: ForeshadowBondLinkFinding[] = [];
  const push = (x: ForeshadowBondLinkFinding) => findings.push(x);

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

  const byItem = new Map(items.map((it) => [it.id, it]));
  const byBond = new Map(bonds.map((b) => [b.id, b]));
  const pairedItems = new Set<string>();
  const pairedBonds = new Set<string>();
  let aligned = 0;

  for (const link of links) {
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
    pairedItems.add(item.id);
    pairedBonds.add(bond.id);

    const terminal = bondTerminalEp(bond);
    if (item.payoffEp === undefined || terminal === undefined || item.payoffEp !== terminal) {
      push({
        code: 'PAYOFF_NOT_AT_TERMINAL',
        severity: 'FAIL',
        ids: [link.id, item.id, bond.id],
        message: `${link.id}: payoffEp=${item.payoffEp ?? '无'} ≠ terminal=${terminal ?? '无'}`,
        fix: '伏笔兑现须对准契约终局集',
      });
      continue;
    }

    aligned += 1;
  }

  for (const b of bonds) {
    const terminal = bondTerminalEp(b);
    if (terminal !== undefined && !pairedBonds.has(b.id)) {
      push({
        code: 'TERMINAL_WITHOUT_FORESHADOW',
        severity: 'FAIL',
        ids: [b.id],
        message: `bond ${b.id} terminal=E${terminal} 无 foreshadow 联表`,
        fix: '在 links[] 挂 foreshadowId↔bondId',
      });
    } else if (!pairedBonds.has(b.id)) {
      push({
        code: 'PENDING_BOND',
        severity: 'WARN',
        ids: [b.id],
        message: `bond ${b.id} 尚未联表到 foreshadow`,
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
        fix: '在 links[] 挂 foreshadowId↔bondId',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      items: items.length,
      bonds: bonds.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
