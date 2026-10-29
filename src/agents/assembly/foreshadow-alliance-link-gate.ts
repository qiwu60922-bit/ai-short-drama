/**
 * V12 · Foreshadow × Alliance Link Gate (伏笔兑现 × 同盟 payoff 联表·伏笔优先),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《帐中香》/《反派拿捏》: S/A 伏笔 payoff 常要求同盟护短同框（伏笔侧主导）.
 *  - 与 allianceForeshadowLink 对偶：本 gate 以 foreshadow 为锚，要求 closed payoff 挂同盟.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_FORESHADOW / UNKNOWN_ALLIANCE / FUTURE_EP
 *  CHILD_FORESHADOW_FAIL / CHILD_ALLIANCE_FAIL
 *  EP_NOT_DUAL_PAYOFF — link.ep = item.payoffEp = alliance.payoff
 *  FORESHADOW_WITHOUT_ALLIANCE / PAYOFF_WITHOUT_FORESHADOW
 *  PENDING_ALLIANCE (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
} from './foreshadow-ledger-gate';
import {
  AllianceEntrySchema,
  AllianceEventSchema,
  evaluateAllianceLedger,
} from './alliance-ledger-gate';

const Ep = z.number().int().positive();

export const ForeshadowAllianceLinkEntrySchema = z.object({
  id: z.string().min(1),
  foreshadowId: z.string().min(1),
  allianceId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const ForeshadowAllianceLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  items: z.array(ForeshadowItemSchema),
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  links: z.array(ForeshadowAllianceLinkEntrySchema),
});

export type ForeshadowAllianceLinkLedger = z.infer<typeof ForeshadowAllianceLinkLedgerSchema>;

export type ForeshadowAllianceLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_FORESHADOW'
    | 'UNKNOWN_ALLIANCE'
    | 'FUTURE_EP'
    | 'CHILD_FORESHADOW_FAIL'
    | 'CHILD_ALLIANCE_FAIL'
    | 'EP_NOT_DUAL_PAYOFF'
    | 'FORESHADOW_WITHOUT_ALLIANCE'
    | 'PAYOFF_WITHOUT_FORESHADOW'
    | 'PENDING_ALLIANCE';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface ForeshadowAllianceLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    items: number;
    alliances: number;
    latestEp: number;
  };
  findings: ForeshadowAllianceLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateForeshadowAllianceLink(input: unknown): ForeshadowAllianceLinkReport {
  const parsed = ForeshadowAllianceLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, items: 0, alliances: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, items, alliances, events, links } = parsed.data;
  const findings: ForeshadowAllianceLinkFinding[] = [];
  const push = (x: ForeshadowAllianceLinkFinding) => findings.push(x);

  const fsReport = evaluateForeshadowLedger({ series, latestEp, items });
  if (fsReport.verdict === 'FAIL') {
    const childFails = fsReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_FORESHADOW_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌伏笔账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 foreshadow-ledger-gate',
    });
  }

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

  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const l of links) {
    if (seen.has(l.id)) dups.add(l.id);
    else seen.add(l.id);
  }
  for (const id of dups) {
    push({ code: 'DUP_ID', severity: 'FAIL', ids: [id], message: `联表ID重复：${id}`, fix: '联表 id 须唯一' });
  }

  const byItem = new Map(items.map((it) => [it.id, it]));
  const byAl = new Map(alliances.map((a) => [a.id, a]));
  const payoffByAlliance = new Map<string, number>();
  for (const ev of events) {
    if (ev.role === 'payoff') payoffByAlliance.set(ev.allianceId, ev.ep);
  }
  const pairedItems = new Set<string>();
  const pairedAl = new Set<string>();
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
    const item = byItem.get(link.foreshadowId);
    if (!item) {
      push({
        code: 'UNKNOWN_FORESHADOW',
        severity: 'FAIL',
        ids: [link.id, link.foreshadowId],
        message: `联表 ${link.id} 引用未知 foreshadow ${link.foreshadowId}`,
        fix: 'foreshadowId 须存在于 items[]',
      });
      continue;
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

    const aPayoff = payoffByAlliance.get(alliance.id);
    if (
      item.payoffEp === undefined ||
      aPayoff === undefined ||
      link.ep !== item.payoffEp ||
      link.ep !== aPayoff
    ) {
      push({
        code: 'EP_NOT_DUAL_PAYOFF',
        severity: 'FAIL',
        ids: [link.id, item.id, alliance.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 fPayoff=${item.payoffEp ?? '无'}/aPayoff=${aPayoff ?? '无'}`,
        fix: '伏笔 payoff 与同盟 payoff 须同集',
      });
      continue;
    }

    pairedItems.add(item.id);
    pairedAl.add(alliance.id);
    aligned += 1;
  }

  for (const it of items) {
    if (it.payoffEp !== undefined && !pairedItems.has(it.id)) {
      push({
        code: 'FORESHADOW_WITHOUT_ALLIANCE',
        severity: 'FAIL',
        ids: [it.id],
        message: `foreshadow ${it.id} payoffEp=E${it.payoffEp} 无 alliance 联表`,
        fix: '为伏笔兑现集挂 ForeshadowAllianceLink',
      });
    }
  }
  for (const [aid, pep] of payoffByAlliance) {
    if (!pairedAl.has(aid)) {
      push({
        code: 'PAYOFF_WITHOUT_FORESHADOW',
        severity: 'FAIL',
        ids: [aid],
        message: `alliance ${aid} payoff=E${pep} 无 foreshadow 联表`,
        fix: '为同盟 payoff 集挂 ForeshadowAllianceLink',
      });
    }
  }
  for (const a of alliances) {
    if (!pairedAl.has(a.id) && !payoffByAlliance.has(a.id)) {
      push({
        code: 'PENDING_ALLIANCE',
        severity: 'WARN',
        ids: [a.id],
        message: `alliance ${a.id} 尚未联表到 foreshadow`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      items: items.length,
      alliances: alliances.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
