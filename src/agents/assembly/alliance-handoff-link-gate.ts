/**
 * V12 · Alliance × Cliffhanger-Handoff Link Gate (同盟 payoff × 集间悬念承接 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《觉醒伪神》: 同盟 payoff 当集尾卡悬念，下集 hook 承接护短线.
 *  - alliance-ledger 管 seed→echo→payoff；cliffhanger-handoff 管两 ShotSpec——本 gate 硬对齐.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_ALLIANCE / UNKNOWN_HANDOFF
 *  CHILD_ALLIANCE_FAIL / CHILD_HANDOFF_FAIL
 *  HANDOFF_NOT_AT_PAYOFF — handoff.prevEp 须等于 alliance payoff ep
 *  PAYOFF_WITHOUT_HANDOFF — 已有 payoff 无联表
 *  PENDING_HANDOFF (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import {
  AllianceEntrySchema,
  AllianceEventSchema,
  evaluateAllianceLedger,
} from './alliance-ledger-gate';
import { evaluateCliffhangerHandoff } from './cliffhanger-handoff-gate';

const Ep = z.number().int().positive();

export const AllianceHandoffEntrySchema = z.object({
  id: z.string().min(1),
  prevEp: Ep,
  nextEp: Ep,
  prev: ShotSpecDocSchema,
  next: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const AllianceHandoffLinkEntrySchema = z.object({
  id: z.string().min(1),
  allianceId: z.string().min(1),
  handoffId: z.string().min(1),
  note: z.string().optional(),
});

export const AllianceHandoffLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  handoffs: z.array(AllianceHandoffEntrySchema),
  links: z.array(AllianceHandoffLinkEntrySchema),
});

export type AllianceHandoffLinkLedger = z.infer<typeof AllianceHandoffLinkLedgerSchema>;

export type AllianceHandoffLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_ALLIANCE'
    | 'UNKNOWN_HANDOFF'
    | 'CHILD_ALLIANCE_FAIL'
    | 'CHILD_HANDOFF_FAIL'
    | 'HANDOFF_NOT_AT_PAYOFF'
    | 'PAYOFF_WITHOUT_HANDOFF'
    | 'PENDING_HANDOFF';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AllianceHandoffLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    alliances: number;
    handoffs: number;
    latestEp: number;
  };
  findings: AllianceHandoffLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAllianceHandoffLink(input: unknown): AllianceHandoffLinkReport {
  const parsed = AllianceHandoffLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, alliances: 0, handoffs: 0, latestEp: 0 },
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

  const { series, latestEp, alliances, events, handoffs, links } = parsed.data;
  const findings: AllianceHandoffLinkFinding[] = [];
  const push = (x: AllianceHandoffLinkFinding) => findings.push(x);

  const alReport = evaluateAllianceLedger({ series, latestEp, alliances, events });
  if (alReport.verdict === 'FAIL') {
    const childFails = alReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_ALLIANCE_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌同盟账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 alliance-ledger-gate',
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
    push({
      code: 'DUP_ID',
      severity: 'FAIL',
      ids: [id],
      message: `联表ID重复：${id}`,
      fix: '联表 id 须唯一',
    });
  }

  const allianceIds = new Set(alliances.map((a) => a.id));
  const byH = new Map(handoffs.map((h) => [h.id, h]));
  const payoffEpByAlliance = new Map<string, number>();
  for (const e of events) {
    if (e.role === 'payoff') {
      const prev = payoffEpByAlliance.get(e.allianceId);
      if (prev === undefined || e.ep > prev) payoffEpByAlliance.set(e.allianceId, e.ep);
    }
  }

  const pairedAlliances = new Set<string>();
  const pairedHandoffs = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    if (!allianceIds.has(link.allianceId)) {
      push({
        code: 'UNKNOWN_ALLIANCE',
        severity: 'FAIL',
        ids: [link.id, link.allianceId],
        message: `联表 ${link.id} 引用未知 alliance ${link.allianceId}`,
        fix: 'allianceId 须存在于 alliances[]',
      });
      continue;
    }
    const handoff = byH.get(link.handoffId);
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
    pairedAlliances.add(link.allianceId);
    pairedHandoffs.add(handoff.id);

    const payoffEp = payoffEpByAlliance.get(link.allianceId);
    if (payoffEp === undefined || handoff.prevEp !== payoffEp) {
      push({
        code: 'HANDOFF_NOT_AT_PAYOFF',
        severity: 'FAIL',
        ids: [link.id, link.allianceId, handoff.id],
        message: `${link.id}: handoff.prevEp=E${handoff.prevEp} ≠ alliance payoffEp（${payoffEp ?? '无'}）`,
        fix: 'handoff 上一集对准同盟 payoff 集',
      });
      continue;
    }

    aligned += 1;
  }

  for (const [aid, ep] of payoffEpByAlliance) {
    if (!pairedAlliances.has(aid)) {
      push({
        code: 'PAYOFF_WITHOUT_HANDOFF',
        severity: 'FAIL',
        ids: [aid],
        message: `alliance ${aid} payoff@E${ep} 无 handoff 联表`,
        fix: '在 links[] 挂 allianceId↔handoffId',
      });
    }
  }

  for (const h of handoffs) {
    if (!pairedHandoffs.has(h.id)) {
      push({
        code: 'PENDING_HANDOFF',
        severity: 'WARN',
        ids: [h.id],
        message: `handoff ${h.id} 尚未联表到 alliance`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      alliances: alliances.length,
      handoffs: handoffs.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
