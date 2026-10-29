/**
 * V12 · Bond × Persona-Mask Link Gate (契约升级/解除 × 伪装揭穿 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《云海不相逢》/《逃婚三年》: 契约真情升级常与假人设揭穿同拍，硬对齐 terminal@reveal.
 *  - bond-contract 管 upgrade/dissolve；persona-mask 管 reveal——本 gate 硬对齐.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_BOND / UNKNOWN_MASK
 *  CHILD_BOND_FAIL / CHILD_MASK_FAIL
 *  TERMINAL_NOT_AT_REVEAL — upgradeEp|dissolveEp 须等于 revealEp
 *  REVEAL_WITHOUT_BOND — 已 reveal 无联表
 *  PENDING_BOND (WARN)
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

export const BondMaskLinkEntrySchema = z.object({
  id: z.string().min(1),
  bondId: z.string().min(1),
  maskId: z.string().min(1),
  note: z.string().optional(),
});

export const BondMaskLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  bonds: z.array(BondContractEntrySchema),
  masks: z.array(PersonaMaskEntrySchema),
  links: z.array(BondMaskLinkEntrySchema),
});

export type BondMaskLinkLedger = z.infer<typeof BondMaskLinkLedgerSchema>;

export type BondMaskLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_BOND'
    | 'UNKNOWN_MASK'
    | 'CHILD_BOND_FAIL'
    | 'CHILD_MASK_FAIL'
    | 'TERMINAL_NOT_AT_REVEAL'
    | 'REVEAL_WITHOUT_BOND'
    | 'PENDING_BOND';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface BondMaskLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    bonds: number;
    masks: number;
    latestEp: number;
  };
  findings: BondMaskLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateBondMaskLink(input: unknown): BondMaskLinkReport {
  const parsed = BondMaskLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, bonds: 0, masks: 0, latestEp: 0 },
      findings: [
        {
          code: 'SCHEMA',
          severity: 'FAIL',
          message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        },
      ],
      gates: GATES,
    };
  }

  const { series, latestEp, bonds, masks, links } = parsed.data;
  const findings: BondMaskLinkFinding[] = [];
  const push = (x: BondMaskLinkFinding) => findings.push(x);

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

  const maskReport = evaluatePersonaMask({ series, latestEp, entries: masks });
  if (maskReport.verdict === 'FAIL') {
    const childFails = maskReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_MASK_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌伪装账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 persona-mask-gate',
    });
  }

  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const l of links) {
    if (seen.has(l.id)) dups.add(l.id);
    else seen.add(l.id);
  }
  for (const id of dups) {
    push({
      code: 'DUP_ID',
      severity: 'FAIL',
      ids: [id],
      message: `联表ID重复：${id}`,
      fix: '联表 id 须唯一',
    });
  }

  const byBond = new Map(bonds.map((b) => [b.id, b]));
  const byMask = new Map(masks.map((m) => [m.id, m]));
  const pairedMasks = new Set<string>();
  const pairedBonds = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const bond = byBond.get(link.bondId);
    const mask = byMask.get(link.maskId);
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
    if (!mask) {
      push({
        code: 'UNKNOWN_MASK',
        severity: 'FAIL',
        ids: [link.id, link.maskId],
        message: `联表 ${link.id} 引用未知 mask ${link.maskId}`,
        fix: 'maskId 须存在于 masks[]',
      });
      continue;
    }
    pairedMasks.add(mask.id);
    pairedBonds.add(bond.id);

    const terminals = [bond.upgradeEp, bond.dissolveEp].filter(
      (e): e is number => typeof e === 'number',
    );
    if (mask.revealEp === undefined || !terminals.includes(mask.revealEp)) {
      push({
        code: 'TERMINAL_NOT_AT_REVEAL',
        severity: 'FAIL',
        ids: [link.id, bond.id, mask.id],
        message: `${link.id}: upgrade/dissolve（${terminals.join('/') || '无'}）≠ revealEp=${mask.revealEp ?? '未揭穿'}`,
        fix: '契约升级或解除须踩伪装揭穿集',
      });
      continue;
    }

    aligned += 1;
  }

  for (const m of masks) {
    if (m.revealEp !== undefined && !pairedMasks.has(m.id)) {
      push({
        code: 'REVEAL_WITHOUT_BOND',
        severity: 'FAIL',
        ids: [m.id],
        message: `mask ${m.id} 已 reveal@E${m.revealEp} 但未挂 bond 联表`,
        fix: '在 links[] 挂 bondId↔maskId',
      });
    }
  }

  for (const b of bonds) {
    if (!pairedBonds.has(b.id)) {
      push({
        code: 'PENDING_BOND',
        severity: 'WARN',
        ids: [b.id],
        message: `bond ${b.id} 尚未联表到 mask`,
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
      masks: masks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
