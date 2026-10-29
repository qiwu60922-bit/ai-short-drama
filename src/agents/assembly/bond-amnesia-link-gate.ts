/**
 * V12 · Bond × Amnesia Link Gate (契约升级/解除 × 失忆唤回 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《反派拿捏》: 契约终端窗常踩唤回 recover.
 *  - 与 amnesiaBondLink（amnesia 主键）互补：本 gate 以 bond 为主键.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_BOND / UNKNOWN_AMNESIA
 *  CHILD_BOND_FAIL / CHILD_AMNESIA_FAIL
 *  RECOVER_NOT_AT_TERMINAL — recoverEp 须等于 upgradeEp|dissolveEp
 *  BOND_WITHOUT_AMNESIA / PENDING_BOND (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  BondContractEntrySchema,
  evaluateBondContract,
} from './bond-contract-gate';
import {
  AmnesiaArcEntrySchema,
  evaluateAmnesiaArc,
} from './amnesia-arc-gate';

const Ep = z.number().int().positive();

export const BondAmnesiaLinkEntrySchema = z.object({
  id: z.string().min(1),
  bondId: z.string().min(1),
  amnesiaId: z.string().min(1),
  note: z.string().optional(),
});

export const BondAmnesiaLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  bonds: z.array(BondContractEntrySchema),
  amnesias: z.array(AmnesiaArcEntrySchema),
  links: z.array(BondAmnesiaLinkEntrySchema),
});

export type BondAmnesiaLinkLedger = z.infer<typeof BondAmnesiaLinkLedgerSchema>;

export type BondAmnesiaLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_BOND'
    | 'UNKNOWN_AMNESIA'
    | 'CHILD_BOND_FAIL'
    | 'CHILD_AMNESIA_FAIL'
    | 'RECOVER_NOT_AT_TERMINAL'
    | 'BOND_WITHOUT_AMNESIA'
    | 'PENDING_BOND';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface BondAmnesiaLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    bonds: number;
    amnesias: number;
    latestEp: number;
  };
  findings: BondAmnesiaLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateBondAmnesiaLink(input: unknown): BondAmnesiaLinkReport {
  const parsed = BondAmnesiaLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, bonds: 0, amnesias: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, bonds, amnesias, links } = parsed.data;
  const findings: BondAmnesiaLinkFinding[] = [];
  const push = (x: BondAmnesiaLinkFinding) => findings.push(x);

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

  const amReport = evaluateAmnesiaArc({ series, latestEp, entries: amnesias });
  if (amReport.verdict === 'FAIL') {
    const childFails = amReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_AMNESIA_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌失忆账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 amnesia-arc-gate',
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

  const byBond = new Map(bonds.map((b) => [b.id, b]));
  const byAm = new Map(amnesias.map((a) => [a.id, a]));
  const pairedBonds = new Set<string>();
  let aligned = 0;

  for (const link of links) {
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
    const am = byAm.get(link.amnesiaId);
    if (!am) {
      push({
        code: 'UNKNOWN_AMNESIA',
        severity: 'FAIL',
        ids: [link.id, link.amnesiaId],
        message: `联表 ${link.id} 引用未知 amnesia ${link.amnesiaId}`,
        fix: 'amnesiaId 须存在于 amnesias[]',
      });
      continue;
    }

    const terminalEp = bond.upgradeEp ?? bond.dissolveEp;
    if (am.recoverEp === undefined || terminalEp === undefined || am.recoverEp !== terminalEp) {
      push({
        code: 'RECOVER_NOT_AT_TERMINAL',
        severity: 'FAIL',
        ids: [link.id, bond.id, am.id],
        message: `${link.id}: recoverEp=${am.recoverEp ?? '未唤回'} ≠ bond.terminal=${terminalEp ?? '无'}`,
        fix: '唤回集对准契约升级/解除集',
      });
      continue;
    }

    pairedBonds.add(bond.id);
    aligned += 1;
  }

  for (const b of bonds) {
    const terminalEp = b.upgradeEp ?? b.dissolveEp;
    if (terminalEp !== undefined && !pairedBonds.has(b.id)) {
      push({
        code: 'BOND_WITHOUT_AMNESIA',
        severity: 'FAIL',
        ids: [b.id],
        message: `bond ${b.id} terminalEp=E${terminalEp} 无 bond×amnesia 联表`,
        fix: '为契约终端挂 BondAmnesiaLink',
      });
    } else if (!pairedBonds.has(b.id)) {
      push({
        code: 'PENDING_BOND',
        severity: 'WARN',
        ids: [b.id],
        message: `bond ${b.id} 尚未联表到 bond×amnesia`,
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
      amnesias: amnesias.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
