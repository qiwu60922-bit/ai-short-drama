/**
 * V12 · Amnesia × Bond-Contract Link Gate (失忆唤回 × 契约升级/解除 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《反派拿捏！第三季》: 唤回 recover 常踩契约升级/真情终端窗.
 *  - amnesia-arc 管 plant→companion→recover；bond-contract 管 upgrade/dissolve——本 gate 硬对齐.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_AMNESIA / UNKNOWN_BOND
 *  CHILD_AMNESIA_FAIL / CHILD_BOND_FAIL
 *  RECOVER_NOT_AT_TERMINAL — recoverEp 须等于 upgradeEp|dissolveEp
 *  BOND_WITHOUT_AMNESIA — 已终端契约无联表
 *  PENDING_AMNESIA (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  AmnesiaArcEntrySchema,
  evaluateAmnesiaArc,
} from './amnesia-arc-gate';
import {
  BondContractEntrySchema,
  evaluateBondContract,
} from './bond-contract-gate';

const Ep = z.number().int().positive();

export const AmnesiaBondLinkEntrySchema = z.object({
  id: z.string().min(1),
  amnesiaId: z.string().min(1),
  bondId: z.string().min(1),
  note: z.string().optional(),
});

export const AmnesiaBondLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  amnesias: z.array(AmnesiaArcEntrySchema),
  bonds: z.array(BondContractEntrySchema),
  links: z.array(AmnesiaBondLinkEntrySchema),
});

export type AmnesiaBondLinkLedger = z.infer<typeof AmnesiaBondLinkLedgerSchema>;

export type AmnesiaBondLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_AMNESIA'
    | 'UNKNOWN_BOND'
    | 'CHILD_AMNESIA_FAIL'
    | 'CHILD_BOND_FAIL'
    | 'RECOVER_NOT_AT_TERMINAL'
    | 'BOND_WITHOUT_AMNESIA'
    | 'PENDING_AMNESIA';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AmnesiaBondLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    amnesias: number;
    bonds: number;
    latestEp: number;
  };
  findings: AmnesiaBondLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAmnesiaBondLink(input: unknown): AmnesiaBondLinkReport {
  const parsed = AmnesiaBondLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, amnesias: 0, bonds: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, amnesias, bonds, links } = parsed.data;
  const findings: AmnesiaBondLinkFinding[] = [];
  const push = (x: AmnesiaBondLinkFinding) => findings.push(x);

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

  const byAm = new Map(amnesias.map((a) => [a.id, a]));
  const byBond = new Map(bonds.map((b) => [b.id, b]));
  const pairedBonds = new Set<string>();
  const pairedAms = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const am = byAm.get(link.amnesiaId);
    const bond = byBond.get(link.bondId);
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
    pairedBonds.add(bond.id);
    pairedAms.add(am.id);

    const terminalEp = bond.upgradeEp ?? bond.dissolveEp;
    if (am.recoverEp === undefined || terminalEp === undefined || am.recoverEp !== terminalEp) {
      push({
        code: 'RECOVER_NOT_AT_TERMINAL',
        severity: 'FAIL',
        ids: [link.id, am.id, bond.id],
        message: `${link.id}: recoverEp=${am.recoverEp ?? '未唤回'} ≠ bond.terminal=${terminalEp ?? '无'}`,
        fix: '唤回集对准契约升级/解除集',
      });
      continue;
    }

    aligned += 1;
  }

  for (const b of bonds) {
    const terminalEp = b.upgradeEp ?? b.dissolveEp;
    if (terminalEp !== undefined && !pairedBonds.has(b.id)) {
      push({
        code: 'BOND_WITHOUT_AMNESIA',
        severity: 'FAIL',
        ids: [b.id],
        message: `bond ${b.id} terminalEp=E${terminalEp} 无 amnesia 联表`,
        fix: '在 links[] 挂 amnesiaId↔bondId',
      });
    }
  }
  for (const a of amnesias) {
    if (!pairedAms.has(a.id)) {
      push({
        code: 'PENDING_AMNESIA',
        severity: 'WARN',
        ids: [a.id],
        message: `amnesia ${a.id} 尚未联表到 bond`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      amnesias: amnesias.length,
      bonds: bonds.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
