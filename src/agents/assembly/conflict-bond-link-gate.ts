/**
 * V12 · Conflict × Bond Link Gate (冲突欠账兑现 × 契约升级/解除 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《叶楚出狱》/《逃婚三年》: 冲突当场兑现常与契约真心升级同集.
 *  - conflict-payoff 管 open→payoff；bond-contract 管 upgrade|dissolve——本 gate 硬对齐.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_CONFLICT / UNKNOWN_BOND / FUTURE_EP
 *  CHILD_CONFLICT_FAIL / CHILD_BOND_FAIL
 *  EP_NOT_PAYOFF_TERMINAL — link.ep = payoffEp = upgrade|dissolve
 *  PAYOFF_WITHOUT_BOND / TERMINAL_WITHOUT_CONFLICT
 *  PENDING_CONFLICT (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  ConflictEntrySchema,
  evaluateConflictPayoffGap,
} from './conflict-payoff-gap-gate';
import {
  BondContractEntrySchema,
  evaluateBondContract,
} from './bond-contract-gate';

const Ep = z.number().int().positive();

export const ConflictBondLinkEntrySchema = z.object({
  id: z.string().min(1),
  conflictId: z.string().min(1),
  bondId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const ConflictBondLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  conflicts: z.array(ConflictEntrySchema),
  bonds: z.array(BondContractEntrySchema),
  links: z.array(ConflictBondLinkEntrySchema),
});

export type ConflictBondLinkLedger = z.infer<typeof ConflictBondLinkLedgerSchema>;

export type ConflictBondLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_CONFLICT'
    | 'UNKNOWN_BOND'
    | 'FUTURE_EP'
    | 'CHILD_CONFLICT_FAIL'
    | 'CHILD_BOND_FAIL'
    | 'EP_NOT_PAYOFF_TERMINAL'
    | 'PAYOFF_WITHOUT_BOND'
    | 'TERMINAL_WITHOUT_CONFLICT'
    | 'PENDING_CONFLICT';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface ConflictBondLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    conflicts: number;
    bonds: number;
    latestEp: number;
  };
  findings: ConflictBondLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

function bondTerminalEp(b: { upgradeEp?: number; dissolveEp?: number }): number | undefined {
  return b.upgradeEp ?? b.dissolveEp;
}

export function evaluateConflictBondLink(input: unknown): ConflictBondLinkReport {
  const parsed = ConflictBondLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, conflicts: 0, bonds: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, conflicts, bonds, links } = parsed.data;
  const findings: ConflictBondLinkFinding[] = [];
  const push = (x: ConflictBondLinkFinding) => findings.push(x);

  const cReport = evaluateConflictPayoffGap({ series, latestEp, conflicts });
  if (cReport.verdict === 'FAIL') {
    const childFails = cReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_CONFLICT_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌冲突账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 conflict-payoff-gap-gate',
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

  const byC = new Map(conflicts.map((c) => [c.id, c]));
  const byB = new Map(bonds.map((b) => [b.id, b]));
  const pairedC = new Set<string>();
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
    const conflict = byC.get(link.conflictId);
    if (!conflict) {
      push({
        code: 'UNKNOWN_CONFLICT',
        severity: 'FAIL',
        ids: [link.id, link.conflictId],
        message: `联表 ${link.id} 引用未知 conflict ${link.conflictId}`,
        fix: 'conflictId 须存在于 conflicts[]',
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
    if (
      conflict.payoffEp === undefined ||
      terminal === undefined ||
      link.ep !== conflict.payoffEp ||
      link.ep !== terminal
    ) {
      push({
        code: 'EP_NOT_PAYOFF_TERMINAL',
        severity: 'FAIL',
        ids: [link.id, conflict.id, bond.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 payoff=${conflict.payoffEp ?? '无'}/terminal=${terminal ?? '无'}`,
        fix: '冲突 payoff 须踩契约终局集',
      });
      continue;
    }

    pairedC.add(conflict.id);
    pairedB.add(bond.id);
    aligned += 1;
  }

  for (const c of conflicts) {
    if (c.payoffEp !== undefined && !pairedC.has(c.id)) {
      push({
        code: 'PAYOFF_WITHOUT_BOND',
        severity: 'FAIL',
        ids: [c.id],
        message: `conflict ${c.id} payoffEp=E${c.payoffEp} 无 bond 联表`,
        fix: '为冲突兑现集挂 ConflictBondLink',
      });
    } else if (!pairedC.has(c.id)) {
      push({
        code: 'PENDING_CONFLICT',
        severity: 'WARN',
        ids: [c.id],
        message: `conflict ${c.id} 尚未联表到 bond`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const bond of bonds) {
    const terminal = bondTerminalEp(bond);
    if (terminal !== undefined && !pairedB.has(bond.id)) {
      push({
        code: 'TERMINAL_WITHOUT_CONFLICT',
        severity: 'FAIL',
        ids: [bond.id],
        message: `bond ${bond.id} terminal=E${terminal} 无 conflict 联表`,
        fix: '在 links[] 挂 conflictId↔bondId',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      conflicts: conflicts.length,
      bonds: bonds.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
