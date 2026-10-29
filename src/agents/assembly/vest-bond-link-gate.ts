/**
 * V12 · Identity-Vest × Bond Link Gate (马甲掉落 × 契约升级/解除 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《逃婚三年》/《机长先生》: 契约真心升级常与掉马甲同集，避免空壳身份崩塌.
 *  - 与 bondVestLink（bond 主键）互补：本 gate 以 vest 为主键强制「有 drop 须对齐 terminal」。
 *
 *  SCHEMA / DUP_ID / UNKNOWN_BOND / UNKNOWN_VEST
 *  CHILD_BOND_FAIL / CHILD_VEST_FAIL
 *  TERMINAL_NOT_AT_DROP — upgrade|dissolve 须等于 dropEp
 *  DROP_WITHOUT_BOND / TERMINAL_WITHOUT_VEST
 *  PENDING_VEST (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  BondContractEntrySchema,
  evaluateBondContract,
} from './bond-contract-gate';
import {
  IdentityVestEntrySchema,
  evaluateIdentityVest,
} from './identity-vest-gate';

const Ep = z.number().int().positive();

export const VestBondLinkEntrySchema = z.object({
  id: z.string().min(1),
  bondId: z.string().min(1),
  vestId: z.string().min(1),
  note: z.string().optional(),
});

export const VestBondLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  bonds: z.array(BondContractEntrySchema),
  vests: z.array(IdentityVestEntrySchema),
  links: z.array(VestBondLinkEntrySchema),
});

export type VestBondLinkLedger = z.infer<typeof VestBondLinkLedgerSchema>;

export type VestBondLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_BOND'
    | 'UNKNOWN_VEST'
    | 'CHILD_BOND_FAIL'
    | 'CHILD_VEST_FAIL'
    | 'TERMINAL_NOT_AT_DROP'
    | 'DROP_WITHOUT_BOND'
    | 'TERMINAL_WITHOUT_VEST'
    | 'PENDING_VEST';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface VestBondLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    bonds: number;
    vests: number;
    latestEp: number;
  };
  findings: VestBondLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateVestBondLink(input: unknown): VestBondLinkReport {
  const parsed = VestBondLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, bonds: 0, vests: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, bonds, vests, links } = parsed.data;
  const findings: VestBondLinkFinding[] = [];
  const push = (x: VestBondLinkFinding) => findings.push(x);

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

  const vestReport = evaluateIdentityVest({ series, latestEp, entries: vests });
  if (vestReport.verdict === 'FAIL') {
    const childFails = vestReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_VEST_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌马甲账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 identity-vest-gate',
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
  const byVest = new Map(vests.map((v) => [v.id, v]));
  const pairedBonds = new Set<string>();
  const pairedVests = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const bond = byBond.get(link.bondId);
    const vest = byVest.get(link.vestId);
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
    if (!vest) {
      push({
        code: 'UNKNOWN_VEST',
        severity: 'FAIL',
        ids: [link.id, link.vestId],
        message: `联表 ${link.id} 引用未知 vest ${link.vestId}`,
        fix: 'vestId 须存在于 vests[]',
      });
      continue;
    }
    pairedBonds.add(bond.id);
    pairedVests.add(vest.id);

    const terminals = [bond.upgradeEp, bond.dissolveEp].filter(
      (e): e is number => typeof e === 'number',
    );
    if (vest.dropEp === undefined || !terminals.includes(vest.dropEp)) {
      push({
        code: 'TERMINAL_NOT_AT_DROP',
        severity: 'FAIL',
        ids: [link.id, bond.id, vest.id],
        message: `${link.id}: upgrade/dissolve（${terminals.join('/') || '无'}）不在 dropEp=${vest.dropEp ?? '无'}`,
        fix: '契约升级或解除须踩掉马甲集',
      });
      continue;
    }

    aligned += 1;
  }

  for (const v of vests) {
    if (v.dropEp !== undefined && !pairedVests.has(v.id)) {
      push({
        code: 'DROP_WITHOUT_BOND',
        severity: 'FAIL',
        ids: [v.id],
        message: `vest ${v.id} dropEp=E${v.dropEp} 无 bond 联表`,
        fix: '为掉落集挂 VestBondLink',
      });
    }
  }
  for (const b of bonds) {
    const terminals = [b.upgradeEp, b.dissolveEp].filter(
      (e): e is number => typeof e === 'number',
    );
    if (terminals.length > 0 && !pairedBonds.has(b.id)) {
      push({
        code: 'TERMINAL_WITHOUT_VEST',
        severity: 'FAIL',
        ids: [b.id],
        message: `bond ${b.id} terminal=${terminals.join('/')} 无 vest 联表`,
        fix: '为升级/解除集挂 VestBondLink',
      });
    } else if (!pairedBonds.has(b.id)) {
      push({
        code: 'PENDING_VEST',
        severity: 'WARN',
        ids: [b.id],
        message: `vest 侧优先；bond ${b.id} 尚未联表到 vest`,
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
      vests: vests.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
