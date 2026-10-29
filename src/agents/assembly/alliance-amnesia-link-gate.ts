/**
 * V12 · Alliance × Amnesia Link Gate (人物同盟 payoff × 失忆唤回 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《反派拿捏》: 同盟护短 payoff 常与失忆唤回同集.
 *  - alliance-ledger 管 seed→payoff；amnesia-arc 管 plant→recover——本 gate 硬对齐.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_ALLIANCE / UNKNOWN_AMNESIA / FUTURE_EP
 *  CHILD_ALLIANCE_FAIL / CHILD_AMNESIA_FAIL
 *  EP_NOT_PAYOFF_RECOVER — link.ep = alliance.payoff = recoverEp
 *  RECOVER_WITHOUT_ALLIANCE / PAYOFF_WITHOUT_AMNESIA
 *  PENDING_AMNESIA (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  AllianceEntrySchema,
  AllianceEventSchema,
  evaluateAllianceLedger,
} from './alliance-ledger-gate';
import {
  AmnesiaArcEntrySchema,
  evaluateAmnesiaArc,
} from './amnesia-arc-gate';

const Ep = z.number().int().positive();

export const AllianceAmnesiaLinkEntrySchema = z.object({
  id: z.string().min(1),
  allianceId: z.string().min(1),
  amnesiaId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const AllianceAmnesiaLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  amnesias: z.array(AmnesiaArcEntrySchema),
  links: z.array(AllianceAmnesiaLinkEntrySchema),
});

export type AllianceAmnesiaLinkLedger = z.infer<typeof AllianceAmnesiaLinkLedgerSchema>;

export type AllianceAmnesiaLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_ALLIANCE'
    | 'UNKNOWN_AMNESIA'
    | 'FUTURE_EP'
    | 'CHILD_ALLIANCE_FAIL'
    | 'CHILD_AMNESIA_FAIL'
    | 'EP_NOT_PAYOFF_RECOVER'
    | 'RECOVER_WITHOUT_ALLIANCE'
    | 'PAYOFF_WITHOUT_AMNESIA'
    | 'PENDING_AMNESIA';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AllianceAmnesiaLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    alliances: number;
    amnesias: number;
    latestEp: number;
  };
  findings: AllianceAmnesiaLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAllianceAmnesiaLink(input: unknown): AllianceAmnesiaLinkReport {
  const parsed = AllianceAmnesiaLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, alliances: 0, amnesias: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, alliances, events, amnesias, links } = parsed.data;
  const findings: AllianceAmnesiaLinkFinding[] = [];
  const push = (x: AllianceAmnesiaLinkFinding) => findings.push(x);

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

  const byAl = new Map(alliances.map((a) => [a.id, a]));
  const byAm = new Map(amnesias.map((a) => [a.id, a]));
  const payoffByAlliance = new Map<string, number>();
  for (const ev of events) {
    if (ev.role === 'payoff') payoffByAlliance.set(ev.allianceId, ev.ep);
  }
  const pairedAl = new Set<string>();
  const pairedAm = new Set<string>();
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
    const alliance = byAl.get(link.allianceId);
    if (!alliance) {
      push({
        code: 'UNKNOWN_ALLIANCE',
        severity: 'FAIL',
        ids: [link.id, link.allianceId],
        message: `联表 ${link.id} 引用未知 alliance ${link.allianceId}`,
        fix: 'allianceId 须存在于 alliances[]',
      });
      continue;
    }
    const amnesia = byAm.get(link.amnesiaId);
    if (!amnesia) {
      push({
        code: 'UNKNOWN_AMNESIA',
        severity: 'FAIL',
        ids: [link.id, link.amnesiaId],
        message: `联表 ${link.id} 引用未知 amnesia ${link.amnesiaId}`,
        fix: 'amnesiaId 须存在于 amnesias[]',
      });
      continue;
    }

    const payoffEp = payoffByAlliance.get(alliance.id);
    if (
      payoffEp === undefined ||
      amnesia.recoverEp === undefined ||
      link.ep !== payoffEp ||
      link.ep !== amnesia.recoverEp
    ) {
      push({
        code: 'EP_NOT_PAYOFF_RECOVER',
        severity: 'FAIL',
        ids: [link.id, alliance.id, amnesia.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 payoff=${payoffEp ?? '无'}/recover=${amnesia.recoverEp ?? '无'}`,
        fix: '同盟 payoff 须踩失忆 recoverEp',
      });
      continue;
    }

    pairedAl.add(alliance.id);
    pairedAm.add(amnesia.id);
    aligned += 1;
  }

  for (const am of amnesias) {
    if (am.recoverEp !== undefined && !pairedAm.has(am.id)) {
      push({
        code: 'RECOVER_WITHOUT_ALLIANCE',
        severity: 'FAIL',
        ids: [am.id],
        message: `amnesia ${am.id} recoverEp=E${am.recoverEp} 无 alliance 联表`,
        fix: '为唤回集挂 AllianceAmnesiaLink',
      });
    } else if (!pairedAm.has(am.id)) {
      push({
        code: 'PENDING_AMNESIA',
        severity: 'WARN',
        ids: [am.id],
        message: `amnesia ${am.id} 尚未联表到 alliance`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const [aid, pep] of payoffByAlliance) {
    if (!pairedAl.has(aid)) {
      push({
        code: 'PAYOFF_WITHOUT_AMNESIA',
        severity: 'FAIL',
        ids: [aid],
        message: `alliance ${aid} payoff=E${pep} 无 amnesia 联表`,
        fix: '在 links[] 挂 allianceId↔amnesiaId',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      alliances: alliances.length,
      amnesias: amnesias.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
