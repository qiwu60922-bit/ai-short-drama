/**
 * V12 · Bond × Ability Link Gate (契约升级/解除 × 金手指 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《伪人降临》/《逃婚三年》: 契约真心升级常踩金手指使用窗，避免能力空转.
 *  - 与 abilityBondLink（ability 主键）互补：本 gate 以 bond 为主键强制「有 terminal 须对齐 use」。
 *
 *  SCHEMA / DUP_ID / UNKNOWN_ABILITY / UNKNOWN_BOND / FUTURE_EP
 *  CHILD_ABILITY_FAIL / CHILD_BOND_FAIL
 *  EP_NOT_TERMINAL — link.ep = upgrade|dissolve 且 holder 在该 ep 有 use
 *  TERMINAL_WITHOUT_ABILITY / NO_USE_AT_TERMINAL
 *  PENDING_BOND (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  AbilityEntrySchema,
  AbilityUseSchema,
  evaluateAbilityRules,
} from './ability-rule-gate';
import {
  BondContractEntrySchema,
  evaluateBondContract,
} from './bond-contract-gate';

const Ep = z.number().int().positive();

export const BondAbilityLinkEntrySchema = z.object({
  id: z.string().min(1),
  abilityId: z.string().min(1),
  bondId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const BondAbilityLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  bonds: z.array(BondContractEntrySchema),
  links: z.array(BondAbilityLinkEntrySchema),
});

export type BondAbilityLinkLedger = z.infer<typeof BondAbilityLinkLedgerSchema>;

export type BondAbilityLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_ABILITY'
    | 'UNKNOWN_BOND'
    | 'FUTURE_EP'
    | 'CHILD_ABILITY_FAIL'
    | 'CHILD_BOND_FAIL'
    | 'EP_NOT_TERMINAL'
    | 'TERMINAL_WITHOUT_ABILITY'
    | 'NO_USE_AT_TERMINAL'
    | 'PENDING_BOND';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface BondAbilityLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    abilities: number;
    bonds: number;
    latestEp: number;
  };
  findings: BondAbilityLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

function bondTerminalEp(b: { upgradeEp?: number; dissolveEp?: number }): number | undefined {
  return b.upgradeEp ?? b.dissolveEp;
}

export function evaluateBondAbilityLink(input: unknown): BondAbilityLinkReport {
  const parsed = BondAbilityLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, abilities: 0, bonds: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, abilities, uses, bonds, links } = parsed.data;
  const findings: BondAbilityLinkFinding[] = [];
  const push = (x: BondAbilityLinkFinding) => findings.push(x);

  const abReport = evaluateAbilityRules({ series, latestEp, abilities, uses });
  if (abReport.verdict === 'FAIL') {
    const childFails = abReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_ABILITY_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌金手指账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 ability-rule-gate',
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

  const byAb = new Map(abilities.map((a) => [a.id, a]));
  const byBond = new Map(bonds.map((b) => [b.id, b]));
  const pairedAbs = new Set<string>();
  const pairedBonds = new Set<string>();
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
    const ab = byAb.get(link.abilityId);
    if (!ab) {
      push({
        code: 'UNKNOWN_ABILITY',
        severity: 'FAIL',
        ids: [link.id, link.abilityId],
        message: `联表 ${link.id} 引用未知 ability ${link.abilityId}`,
        fix: 'abilityId 须存在于 abilities[]',
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

    const terminal = bondTerminalEp(bond);
    if (terminal === undefined || link.ep !== terminal) {
      push({
        code: 'EP_NOT_TERMINAL',
        severity: 'FAIL',
        ids: [link.id, ab.id, bond.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 terminal=${terminal ?? '无'}`,
        fix: '金手指使用须踩契约终局集',
      });
      continue;
    }

    const used = uses.some((u) => u.abilityId === ab.id && u.by === ab.holder && u.ep === link.ep);
    if (!used) {
      push({
        code: 'NO_USE_AT_TERMINAL',
        severity: 'FAIL',
        ids: [link.id, ab.id],
        message: `${link.id}: ability ${ab.id} 在 terminal E${link.ep} 无 holder 使用`,
        fix: '契约终局集须有金手指使用',
      });
      continue;
    }

    pairedAbs.add(ab.id);
    pairedBonds.add(bond.id);
    aligned += 1;
  }

  for (const bond of bonds) {
    const terminal = bondTerminalEp(bond);
    if (terminal !== undefined && !pairedBonds.has(bond.id)) {
      push({
        code: 'TERMINAL_WITHOUT_ABILITY',
        severity: 'FAIL',
        ids: [bond.id],
        message: `bond ${bond.id} terminal=E${terminal} 无 ability 联表`,
        fix: '为契约终局集挂 BondAbilityLink',
      });
    }
  }
  for (const bond of bonds) {
    const terminal = bondTerminalEp(bond);
    if (terminal === undefined && !pairedBonds.has(bond.id)) {
      push({
        code: 'PENDING_BOND',
        severity: 'WARN',
        ids: [bond.id],
        message: `bond ${bond.id} 尚未联表到 ability`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      abilities: abilities.length,
      bonds: bonds.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
