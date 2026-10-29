/**
 * V12 · Reveal × Bond Link Gate (伪装揭穿 × 契约升级/解除 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 揭穿主线常与契约 upgrade/dissolve 同集硬对齐.
 *  - 与 bondMaskLink 互补：本 gate 以 reveal 为主键命名.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_REVEAL / UNKNOWN_BOND
 *  CHILD_REVEAL_FAIL / CHILD_BOND_FAIL
 *  TERMINAL_NOT_AT_REVEAL — upgradeEp|dissolveEp 须等于 revealEp
 *  REVEAL_WITHOUT_BOND / PENDING_BOND (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  BondContractEntrySchema,
  evaluateBondContract,
} from './bond-contract-gate';
import {
  PersonaMaskEntrySchema,
  evaluatePersonaMask,
} from './persona-mask-gate';

const Ep = z.number().int().positive();

export const RevealBondLinkEntrySchema = z.object({
  id: z.string().min(1),
  revealId: z.string().min(1),
  bondId: z.string().min(1),
  note: z.string().optional(),
});

export const RevealBondLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  reveals: z.array(PersonaMaskEntrySchema),
  bonds: z.array(BondContractEntrySchema),
  links: z.array(RevealBondLinkEntrySchema),
});

export type RevealBondLinkLedger = z.infer<typeof RevealBondLinkLedgerSchema>;

export type RevealBondLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_REVEAL'
    | 'UNKNOWN_BOND'
    | 'CHILD_REVEAL_FAIL'
    | 'CHILD_BOND_FAIL'
    | 'TERMINAL_NOT_AT_REVEAL'
    | 'REVEAL_WITHOUT_BOND'
    | 'PENDING_BOND';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface RevealBondLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    reveals: number;
    bonds: number;
    latestEp: number;
  };
  findings: RevealBondLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateRevealBondLink(input: unknown): RevealBondLinkReport {
  const parsed = RevealBondLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, reveals: 0, bonds: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, reveals, bonds, links } = parsed.data;
  const findings: RevealBondLinkFinding[] = [];
  const push = (x: RevealBondLinkFinding) => findings.push(x);

  const rReport = evaluatePersonaMask({ series, latestEp, entries: reveals });
  if (rReport.verdict === 'FAIL') {
    const childFails = rReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_REVEAL_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌揭穿账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 persona-mask-gate',
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

  const byR = new Map(reveals.map((r) => [r.id, r]));
  const byB = new Map(bonds.map((b) => [b.id, b]));
  const pairedR = new Set<string>();
  const pairedB = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const reveal = byR.get(link.revealId);
    if (!reveal) {
      push({
        code: 'UNKNOWN_REVEAL',
        severity: 'FAIL',
        ids: [link.id, link.revealId],
        message: `联表 ${link.id} 引用未知 reveal ${link.revealId}`,
        fix: 'revealId 须存在于 reveals[]',
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

    const terminals = [bond.upgradeEp, bond.dissolveEp].filter(
      (e): e is number => typeof e === 'number',
    );
    if (reveal.revealEp === undefined || !terminals.includes(reveal.revealEp)) {
      push({
        code: 'TERMINAL_NOT_AT_REVEAL',
        severity: 'FAIL',
        ids: [link.id, reveal.id, bond.id],
        message: `${link.id}: upgrade/dissolve（${terminals.join('/') || '无'}）≠ revealEp=${reveal.revealEp ?? '未揭穿'}`,
        fix: '契约升级或解除须踩伪装揭穿集',
      });
      continue;
    }

    pairedR.add(reveal.id);
    pairedB.add(bond.id);
    aligned += 1;
  }

  for (const r of reveals) {
    if (r.revealEp !== undefined && !pairedR.has(r.id)) {
      push({
        code: 'REVEAL_WITHOUT_BOND',
        severity: 'FAIL',
        ids: [r.id],
        message: `reveal ${r.id} 已 reveal@E${r.revealEp} 但未挂 bond 联表`,
        fix: '在 links[] 挂 revealId↔bondId',
      });
    }
  }
  for (const b of bonds) {
    if (!pairedB.has(b.id)) {
      push({
        code: 'PENDING_BOND',
        severity: 'WARN',
        ids: [b.id],
        message: `bond ${b.id} 尚未联表到 reveal`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      reveals: reveals.length,
      bonds: bonds.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
