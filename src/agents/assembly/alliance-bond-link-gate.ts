/**
 * V12 · Alliance×Bond Link Gate (人物同盟 × 契约关系 跨账本联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text breakdowns (structure only, no footage):
 *  - 《七块五养全家，丈夫归来后替我撑腰》: 夫妻同盟 seed→payoff 对齐契约/真情撑腰.
 *  - 《邱秘书的婚事》: 契约女友 → companion → upgrade — bond 终端应对齐同盟 payoff.
 *  - 《觉醒伪神…》公会收留对照：同盟成员须覆盖契约双方.
 *
 * Embeds child alliance + bond (CHILD_* bubbles).
 * Link rules:
 *  SCHEMA / DUP_ID / UNKNOWN_ALLIANCE / UNKNOWN_BOND
 *  CHILD_ALLIANCE_FAIL / CHILD_BOND_FAIL
 *  MEMBER_MISMATCH — partyA/partyB 须都在 alliance.members
 *  CONTRACT_WITHOUT_SEED — 已立约但同盟无 seed@≤contractEp
 *  TERMINAL_WITHOUT_PAYOFF — upgrade/dissolve 但同盟无 payoff
 *  PAYOFF_WITHOUT_TERMINAL — 同盟已 payoff 但契约无终端
 *  EP_MISMATCH — terminalEp ≠ alliance payoff.ep
 *  PENDING_PAIR (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  AllianceEntrySchema,
  AllianceEventSchema,
  evaluateAllianceLedger,
} from './alliance-ledger-gate';
import {
  BondContractEntrySchema,
  evaluateBondContract,
} from './bond-contract-gate';

const Ep = z.number().int().positive();

export const AllianceBondLinkEntrySchema = z.object({
  id: z.string().min(1),
  allianceId: z.string().min(1),
  bondId: z.string().min(1),
  note: z.string().optional(),
});

export const AllianceBondLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  bonds: z.array(BondContractEntrySchema),
  links: z.array(AllianceBondLinkEntrySchema),
});

export type AllianceBondLinkLedger = z.infer<typeof AllianceBondLinkLedgerSchema>;

export type AllianceBondLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_ALLIANCE'
    | 'UNKNOWN_BOND'
    | 'CHILD_ALLIANCE_FAIL'
    | 'CHILD_BOND_FAIL'
    | 'MEMBER_MISMATCH'
    | 'CONTRACT_WITHOUT_SEED'
    | 'TERMINAL_WITHOUT_PAYOFF'
    | 'PAYOFF_WITHOUT_TERMINAL'
    | 'EP_MISMATCH'
    | 'PENDING_PAIR';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AllianceBondLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    pending: number;
    alliances: number;
    bonds: number;
    latestEp: number;
  };
  findings: AllianceBondLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAllianceBondLink(input: unknown): AllianceBondLinkReport {
  const parsed = AllianceBondLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, pending: 0, alliances: 0, bonds: 0, latestEp: 0 },
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

  const { series, latestEp, alliances, events, bonds, links } = parsed.data;
  const findings: AllianceBondLinkFinding[] = [];
  const push = (x: AllianceBondLinkFinding) => findings.push(x);

  const alReport = evaluateAllianceLedger({ series, latestEp, alliances, events });
  if (alReport.verdict === 'FAIL') {
    const childFails = alReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_ALLIANCE_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌同盟账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 alliance-ledger-gate 再跑联表（seed→echo→payoff）',
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
      fix: '先修 bond-contract-gate 再跑联表（contract→upgrade|dissolve）',
    });
  }

  const alById = new Map(alliances.map((a) => [a.id, a]));
  const bondById = new Map(bonds.map((b) => [b.id, b]));

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
      message: `联表链接 ID 重复：${id}`,
      fix: 'links[].id 是跨账本指针主键，改成唯一 ID',
    });
  }

  let aligned = 0;
  let pending = 0;

  for (const l of links) {
    const al = alById.get(l.allianceId);
    const bond = bondById.get(l.bondId);

    if (!al) {
      push({
        code: 'UNKNOWN_ALLIANCE',
        severity: 'FAIL',
        ids: [l.id],
        message: `${l.id} 指向不存在的 allianceId=${l.allianceId}`,
        fix: 'allianceId 须对应 alliances[].id',
      });
      continue;
    }
    if (!bond) {
      push({
        code: 'UNKNOWN_BOND',
        severity: 'FAIL',
        ids: [l.id],
        message: `${l.id} 指向不存在的 bondId=${l.bondId}`,
        fix: 'bondId 须对应 bonds[].id',
      });
      continue;
    }

    const members = new Set(al.members);
    if (!members.has(bond.partyA) || !members.has(bond.partyB)) {
      push({
        code: 'MEMBER_MISMATCH',
        severity: 'FAIL',
        ids: [l.id, l.allianceId, l.bondId],
        message: `${l.id} 契约双方 ${bond.partyA}/${bond.partyB} 未都在同盟 members=[${al.members.join(',')}]`,
        fix: '把 partyA/partyB 写入 alliance.members（同盟须覆盖契约双方）',
      });
      continue;
    }

    const alEvents = events.filter((e) => e.allianceId === l.allianceId);
    const seeds = alEvents.filter((e) => e.role === 'seed');
    const payoffs = alEvents.filter((e) => e.role === 'payoff');
    const hasPayoff = payoffs.length > 0;
    const terminalEp = bond.upgradeEp ?? bond.dissolveEp;
    const terminated = terminalEp !== undefined;

    if (!seeds.some((s) => s.ep <= bond.contractEp)) {
      push({
        code: 'CONTRACT_WITHOUT_SEED',
        severity: 'FAIL',
        ids: [l.id, l.allianceId, l.bondId],
        message: `${l.id} 契约@E${bond.contractEp} 前/当时同盟 ${l.allianceId} 无 seed`,
        fix: '在 contractEp 或更早加 alliance role=seed（立约即同盟落地）',
      });
      continue;
    }

    if (!terminated && !hasPayoff) {
      pending += 1;
      push({
        code: 'PENDING_PAIR',
        severity: 'WARN',
        ids: [l.id],
        message: `${l.id} 同盟与契约都尚未收束（蓄势中）`,
        fix: '同集写 bond.upgradeEp|dissolveEp 与 alliance role=payoff',
      });
      continue;
    }

    if (terminated && !hasPayoff) {
      push({
        code: 'TERMINAL_WITHOUT_PAYOFF',
        severity: 'FAIL',
        ids: [l.id, l.allianceId, l.bondId],
        message: `${l.id} 契约已终端@E${terminalEp}，但同盟 ${l.allianceId} 无 payoff`,
        fix: '在终端集写 alliance role=payoff（真情/解除须同盟兑现）',
      });
      continue;
    }

    if (!terminated && hasPayoff) {
      push({
        code: 'PAYOFF_WITHOUT_TERMINAL',
        severity: 'FAIL',
        ids: [l.id, l.allianceId, l.bondId],
        message: `${l.id} 同盟已 payoff，但契约 ${l.bondId} 无 upgrade/dissolve`,
        fix: '在同盟 payoff 同集写 upgradeEp|dissolveEp + label',
      });
      continue;
    }

    const payoffAt = payoffs.some((p) => p.ep === terminalEp);
    if (!payoffAt) {
      const eps = payoffs.map((p) => p.ep).join(',') || 'none';
      push({
        code: 'EP_MISMATCH',
        severity: 'FAIL',
        ids: [l.id, l.allianceId, l.bondId],
        message: `${l.id} bond.terminalEp=E${terminalEp} 无对应 alliance payoff（现有@E${eps}）`,
        fix: '契约终端与同盟 payoff 须同集',
      });
      continue;
    }

    aligned += 1;
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      pending,
      alliances: alliances.length,
      bonds: bonds.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
