/**
 * V12 · Alliance × Cliff-Cascade Link Gate (同盟 payoff × 跨集悬念叠钩 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《反派拿捏》: 同盟护短 payoff 常踩下集 hook 承接窗，避免软重置.
 *  - alliance-ledger 管 seed→echo→payoff；cliff-cascade 管 prev→next——本 gate 硬联表 payoff@nextEp.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_ALLIANCE / UNKNOWN_CLIFF / FUTURE_EP
 *  CHILD_ALLIANCE_FAIL / CHILD_CASCADE_FAIL
 *  EP_NOT_PAYOFF_NEXT — link.ep = alliance.payoff = cliff.nextEp
 *  PAYOFF_WITHOUT_CLIFF / CLIFF_WITHOUT_ALLIANCE
 *  PENDING_ALLIANCE (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  AllianceEntrySchema,
  AllianceEventSchema,
  evaluateAllianceLedger,
} from './alliance-ledger-gate';
import {
  CliffCascadeLinkEntrySchema,
  evaluateCliffCascadeLink,
} from './cliff-cascade-link-gate';

const Ep = z.number().int().positive();

export const AllianceCliffLinkEntrySchema = z.object({
  id: z.string().min(1),
  allianceId: z.string().min(1),
  cliffLinkId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const AllianceCliffLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  links: z.array(AllianceCliffLinkEntrySchema),
});

export type AllianceCliffLinkLedger = z.infer<typeof AllianceCliffLinkLedgerSchema>;

export type AllianceCliffLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_ALLIANCE'
    | 'UNKNOWN_CLIFF'
    | 'FUTURE_EP'
    | 'CHILD_ALLIANCE_FAIL'
    | 'CHILD_CASCADE_FAIL'
    | 'EP_NOT_PAYOFF_NEXT'
    | 'PAYOFF_WITHOUT_CLIFF'
    | 'CLIFF_WITHOUT_ALLIANCE'
    | 'PENDING_ALLIANCE';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AllianceCliffLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    alliances: number;
    cliffLinks: number;
    latestEp: number;
  };
  findings: AllianceCliffLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAllianceCliffLink(input: unknown): AllianceCliffLinkReport {
  const parsed = AllianceCliffLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, alliances: 0, cliffLinks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, alliances, events, cliffLinks, links } = parsed.data;
  const findings: AllianceCliffLinkFinding[] = [];
  const push = (x: AllianceCliffLinkFinding) => findings.push(x);

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

  if (cliffLinks.length) {
    const cascade = evaluateCliffCascadeLink({ series, latestEp, links: cliffLinks });
    if (cascade.verdict === 'FAIL') {
      const childFails = cascade.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_CASCADE_FAIL',
        severity: 'FAIL',
        ids: childFails.flatMap((f) => f.ids ?? []),
        message: `内嵌 cliffCascade FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 cliff-cascade-link-gate',
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

  const byAl = new Map(alliances.map((a) => [a.id, a]));
  const byCliff = new Map(cliffLinks.map((c) => [c.id, c]));
  const payoffByAlliance = new Map<string, number>();
  for (const ev of events) {
    if (ev.role === 'payoff') payoffByAlliance.set(ev.allianceId, ev.ep);
  }
  const pairedAl = new Set<string>();
  const pairedCliff = new Set<string>();
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
    const cliff = byCliff.get(link.cliffLinkId);
    if (!cliff) {
      push({
        code: 'UNKNOWN_CLIFF',
        severity: 'FAIL',
        ids: [link.id, link.cliffLinkId],
        message: `联表 ${link.id} 引用未知 cliffLink ${link.cliffLinkId}`,
        fix: 'cliffLinkId 须存在于 cliffLinks[]',
      });
      continue;
    }

    const payoffEp = payoffByAlliance.get(alliance.id);
    if (payoffEp === undefined || link.ep !== payoffEp || link.ep !== cliff.nextEp) {
      push({
        code: 'EP_NOT_PAYOFF_NEXT',
        severity: 'FAIL',
        ids: [link.id, alliance.id, cliff.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 payoff=${payoffEp ?? '无'}/next=E${cliff.nextEp}`,
        fix: '同盟 payoff 须踩 cliff.nextEp',
      });
      continue;
    }

    pairedAl.add(alliance.id);
    pairedCliff.add(cliff.id);
    aligned += 1;
  }

  for (const [aid, pep] of payoffByAlliance) {
    if (!pairedAl.has(aid)) {
      push({
        code: 'PAYOFF_WITHOUT_CLIFF',
        severity: 'FAIL',
        ids: [aid],
        message: `alliance ${aid} payoff=E${pep} 无 cliff 联表`,
        fix: '为同盟 payoff 集挂 AllianceCliffLink',
      });
    }
  }
  for (const a of alliances) {
    if (!pairedAl.has(a.id) && !payoffByAlliance.has(a.id)) {
      push({
        code: 'PENDING_ALLIANCE',
        severity: 'WARN',
        ids: [a.id],
        message: `alliance ${a.id} 尚未联表到 cliff`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const c of cliffLinks) {
    if (!pairedCliff.has(c.id)) {
      push({
        code: 'CLIFF_WITHOUT_ALLIANCE',
        severity: 'FAIL',
        ids: [c.id],
        message: `cliffLink ${c.id} 无 alliance 联表`,
        fix: '在 links[] 挂 allianceId↔cliffLinkId',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      alliances: alliances.length,
      cliffLinks: cliffLinks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
