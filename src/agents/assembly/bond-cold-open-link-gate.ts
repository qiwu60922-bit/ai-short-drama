/**
 * V12 · Bond × Cold-Open Link Gate (契约升级/解除 × 冷开钩 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 契约真心升级当集常冷开快入抛钩.
 *  - 与 vestColdOpenLink / qualityBondLink 互补：本 gate 以 bond 联 coldOpen.
 *
 * coldOpens[]: { id, ep, shotSpec }
 *  SCHEMA / DUP_ID / UNKNOWN_BOND / UNKNOWN_COLD_OPEN / FUTURE_EP
 *  CHILD_BOND_FAIL / CHILD_COLD_OPEN_FAIL
 *  EP_NOT_TERMINAL — link.ep = upgradeEp|dissolveEp = coldOpen.ep
 *  TERMINAL_WITHOUT_COLD / COLD_OPEN_WITHOUT_BOND
 *  PENDING_BOND (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { evaluateColdOpenHook } from './cold-open-hook-gate';
import {
  BondContractEntrySchema,
  evaluateBondContract,
} from './bond-contract-gate';

const Ep = z.number().int().positive();

export const BondColdOpenColdOpenEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const BondColdOpenLinkEntrySchema = z.object({
  id: z.string().min(1),
  bondId: z.string().min(1),
  coldOpenId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const BondColdOpenLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  bonds: z.array(BondContractEntrySchema),
  coldOpens: z.array(BondColdOpenColdOpenEntrySchema),
  links: z.array(BondColdOpenLinkEntrySchema),
});

export type BondColdOpenLinkLedger = z.infer<typeof BondColdOpenLinkLedgerSchema>;

export type BondColdOpenLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_BOND'
    | 'UNKNOWN_COLD_OPEN'
    | 'FUTURE_EP'
    | 'CHILD_BOND_FAIL'
    | 'CHILD_COLD_OPEN_FAIL'
    | 'EP_NOT_TERMINAL'
    | 'TERMINAL_WITHOUT_COLD'
    | 'COLD_OPEN_WITHOUT_BOND'
    | 'PENDING_BOND';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface BondColdOpenLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    bonds: number;
    coldOpens: number;
    latestEp: number;
  };
  findings: BondColdOpenLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

function bondTerminalEp(b: { upgradeEp?: number; dissolveEp?: number }): number | undefined {
  return b.upgradeEp ?? b.dissolveEp;
}

export function evaluateBondColdOpenLink(input: unknown): BondColdOpenLinkReport {
  const parsed = BondColdOpenLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, bonds: 0, coldOpens: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, bonds, coldOpens, links } = parsed.data;
  const findings: BondColdOpenLinkFinding[] = [];
  const push = (x: BondColdOpenLinkFinding) => findings.push(x);

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

  for (const co of coldOpens) {
    const r = evaluateColdOpenHook(co.shotSpec);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_COLD_OPEN_FAIL',
        severity: 'FAIL',
        ids: [co.id, ...childFails.flatMap((f) => f.shotIds ?? [])],
        message: `coldOpen ${co.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 cold-open-hook-gate',
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

  const byB = new Map(bonds.map((b) => [b.id, b]));
  const byC = new Map(coldOpens.map((c) => [c.id, c]));
  const pairedB = new Set<string>();
  const pairedC = new Set<string>();
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
    const co = byC.get(link.coldOpenId);
    if (!co) {
      push({
        code: 'UNKNOWN_COLD_OPEN',
        severity: 'FAIL',
        ids: [link.id, link.coldOpenId],
        message: `联表 ${link.id} 引用未知 coldOpen ${link.coldOpenId}`,
        fix: 'coldOpenId 须存在于 coldOpens[]',
      });
      continue;
    }

    const terminal = bondTerminalEp(bond);
    if (terminal === undefined || link.ep !== terminal || link.ep !== co.ep) {
      push({
        code: 'EP_NOT_TERMINAL',
        severity: 'FAIL',
        ids: [link.id, bond.id, co.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 terminal=${terminal ?? '无'}/coldOpen=${co.ep}`,
        fix: '终局与冷开须同集',
      });
      continue;
    }

    pairedB.add(bond.id);
    pairedC.add(co.id);
    aligned += 1;
  }

  for (const bond of bonds) {
    const terminal = bondTerminalEp(bond);
    if (terminal !== undefined && !pairedB.has(bond.id)) {
      push({
        code: 'TERMINAL_WITHOUT_COLD',
        severity: 'FAIL',
        ids: [bond.id],
        message: `bond ${bond.id} terminal=E${terminal} 无 coldOpen 联表`,
        fix: '为终局挂 BondColdOpenLink',
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
  for (const co of coldOpens) {
    if (!pairedC.has(co.id)) {
      push({
        code: 'COLD_OPEN_WITHOUT_BOND',
        severity: 'FAIL',
        ids: [co.id],
        message: `coldOpen ${co.id} 无 bond 联表`,
        fix: '为冷开挂 BondColdOpenLink',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      bonds: bonds.length,
      coldOpens: coldOpens.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
