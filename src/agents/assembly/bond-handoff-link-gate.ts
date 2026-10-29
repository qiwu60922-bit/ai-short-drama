/**
 * V12 · Bond × Cliffhanger-Handoff Link Gate (契约升级/解除 × 集间悬念承接 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《逃婚三年》: 契约真心升级当集尾卡悬念，下集 hook 承接关系线.
 *  - bond-contract 管 upgrade|dissolve；cliffhanger-handoff 管两 ShotSpec——本 gate 硬对齐 terminal@prevEp.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_BOND / UNKNOWN_HANDOFF
 *  CHILD_BOND_FAIL / CHILD_HANDOFF_FAIL
 *  TERMINAL_NOT_AT_HANDOFF — upgradeEp|dissolveEp 须等于 handoff.prevEp
 *  HANDOFF_WITHOUT_BOND — handoff 未联表
 *  PENDING_BOND (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import {
  BondContractEntrySchema,
  evaluateBondContract,
} from './bond-contract-gate';
import { evaluateCliffhangerHandoff } from './cliffhanger-handoff-gate';

const Ep = z.number().int().positive();

export const BondHandoffEntrySchema = z.object({
  id: z.string().min(1),
  prevEp: Ep,
  nextEp: Ep,
  prev: ShotSpecDocSchema,
  next: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const BondHandoffLinkEntrySchema = z.object({
  id: z.string().min(1),
  bondId: z.string().min(1),
  handoffId: z.string().min(1),
  note: z.string().optional(),
});

export const BondHandoffLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  bonds: z.array(BondContractEntrySchema),
  handoffs: z.array(BondHandoffEntrySchema),
  links: z.array(BondHandoffLinkEntrySchema),
});

export type BondHandoffLinkLedger = z.infer<typeof BondHandoffLinkLedgerSchema>;

export type BondHandoffLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_BOND'
    | 'UNKNOWN_HANDOFF'
    | 'CHILD_BOND_FAIL'
    | 'CHILD_HANDOFF_FAIL'
    | 'TERMINAL_NOT_AT_HANDOFF'
    | 'HANDOFF_WITHOUT_BOND'
    | 'PENDING_BOND';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface BondHandoffLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    bonds: number;
    handoffs: number;
    latestEp: number;
  };
  findings: BondHandoffLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateBondHandoffLink(input: unknown): BondHandoffLinkReport {
  const parsed = BondHandoffLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, bonds: 0, handoffs: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, bonds, handoffs, links } = parsed.data;
  const findings: BondHandoffLinkFinding[] = [];
  const push = (x: BondHandoffLinkFinding) => findings.push(x);

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

  for (const h of handoffs) {
    const r = evaluateCliffhangerHandoff(h.prev, h.next);
    if (r.verdict === 'FAIL') {
      const codes = r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
      push({
        code: 'CHILD_HANDOFF_FAIL',
        severity: 'FAIL',
        ids: [h.id],
        message: `handoff ${h.id} FAIL：${codes.join(',') || 'unknown'}`,
        fix: '先修 cliffhanger-handoff-gate',
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
  const byH = new Map(handoffs.map((h) => [h.id, h]));
  const pairedH = new Set<string>();
  const pairedBonds = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const bond = byBond.get(link.bondId);
    const handoff = byH.get(link.handoffId);
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
    if (!handoff) {
      push({
        code: 'UNKNOWN_HANDOFF',
        severity: 'FAIL',
        ids: [link.id, link.handoffId],
        message: `联表 ${link.id} 引用未知 handoff ${link.handoffId}`,
        fix: 'handoffId 须存在于 handoffs[]',
      });
      continue;
    }
    pairedH.add(handoff.id);
    pairedBonds.add(bond.id);

    const terminals = [bond.upgradeEp, bond.dissolveEp].filter(
      (e): e is number => typeof e === 'number',
    );
    if (!terminals.includes(handoff.prevEp)) {
      push({
        code: 'TERMINAL_NOT_AT_HANDOFF',
        severity: 'FAIL',
        ids: [link.id, bond.id, handoff.id],
        message: `${link.id}: terminal=${terminals.join('/') || '无'} ≠ handoff.prevEp=E${handoff.prevEp}`,
        fix: '契约升级/解除须落在悬念上一集',
      });
      continue;
    }

    aligned += 1;
  }

  for (const h of handoffs) {
    if (!pairedH.has(h.id)) {
      push({
        code: 'HANDOFF_WITHOUT_BOND',
        severity: 'FAIL',
        ids: [h.id],
        message: `handoff ${h.id} 未挂 bond 联表`,
        fix: '在 links[] 挂 bondId↔handoffId',
      });
    }
  }
  for (const b of bonds) {
    if (!pairedBonds.has(b.id)) {
      push({
        code: 'PENDING_BOND',
        severity: 'WARN',
        ids: [b.id],
        message: `bond ${b.id} 尚未联表到 handoff`,
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
      handoffs: handoffs.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
