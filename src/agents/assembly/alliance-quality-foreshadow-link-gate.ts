/**
 * V12 · Alliance × Quality × Foreshadow Link Gate
 * (同盟 payoff × 表演门 × 伏笔兑现 联表), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 同盟护短 payoff 常与 S/A 伏笔 payoff 同集，且须过表演门.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_ALLIANCE / UNKNOWN_FORESHADOW / FUTURE_EP
 *  CHILD_ALLIANCE_FAIL / CHILD_FORESHADOW_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_PAYOFF — link.ep = alliance.payoff = foreshadow.payoffEp
 *  ALLIANCE_WITHOUT_LINK / PAYOFF_WITHOUT_LINK
 *  PENDING_ALLIANCE / PENDING_FORESHADOW (WARN)
 *  LOW_INTENSITY_AT_PAYOFF (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  AllianceEntrySchema,
  AllianceEventSchema,
  evaluateAllianceLedger,
} from './alliance-ledger-gate';
import {
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
} from './foreshadow-ledger-gate';
import {
  QualityLeapDocSchema,
  evaluateQualityLeap,
} from './quality-leap-gate';

const Ep = z.number().int().positive();

export const AllianceQualityForeshadowLinkEntrySchema = z.object({
  id: z.string().min(1),
  allianceId: z.string().min(1),
  foreshadowId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const AllianceQualityForeshadowLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minPayoffIntense: z.number().int().min(1).max(5).optional(),
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  items: z.array(ForeshadowItemSchema),
  links: z.array(AllianceQualityForeshadowLinkEntrySchema),
});

export type AllianceQualityForeshadowLinkLedger = z.infer<typeof AllianceQualityForeshadowLinkLedgerSchema>;

export type AllianceQualityForeshadowLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_ALLIANCE'
    | 'UNKNOWN_FORESHADOW'
    | 'FUTURE_EP'
    | 'CHILD_ALLIANCE_FAIL'
    | 'CHILD_FORESHADOW_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_PAYOFF'
    | 'ALLIANCE_WITHOUT_LINK'
    | 'PAYOFF_WITHOUT_LINK'
    | 'PENDING_ALLIANCE'
    | 'PENDING_FORESHADOW'
    | 'LOW_INTENSITY_AT_PAYOFF';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AllianceQualityForeshadowLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    alliances: number;
    items: number;
    latestEp: number;
  };
  findings: AllianceQualityForeshadowLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

function maxIntensity(ql: {
  shots?: Array<{ performance?: { intensity?: number } | null }>;
}): number {
  let m = 0;
  for (const s of ql.shots ?? []) {
    const i = s.performance?.intensity;
    if (typeof i === 'number' && i > m) m = i;
  }
  return m;
}

export function evaluateAllianceQualityForeshadowLink(input: unknown): AllianceQualityForeshadowLinkReport {
  const parsed = AllianceQualityForeshadowLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, alliances: 0, items: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, alliances, events, items, links, minPayoffIntense = 4 } = parsed.data;
  const findings: AllianceQualityForeshadowLinkFinding[] = [];
  const push = (x: AllianceQualityForeshadowLinkFinding) => findings.push(x);

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
  const byItem = new Map(items.map((it) => [it.id, it]));
  const payoffByAlliance = new Map<string, number>();
  for (const ev of events) {
    if (ev.role === 'payoff') payoffByAlliance.set(ev.allianceId, ev.ep);
  }
  const pairedAl = new Set<string>();
  const pairedItems = new Set<string>();
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

    const qReport = evaluateQualityLeap(link.qualityLeap);
    if (qReport.verdict === 'FAIL') {
      const childFails = qReport.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_QUALITY_FAIL',
        severity: 'FAIL',
        ids: [link.id, ...(childFails.map((f) => f.shotId).filter(Boolean) as string[])],
        message: `联表 ${link.id} qualityLeap FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 quality-leap-gate',
      });
      continue;
    }

    const alPayoff = payoffByAlliance.get(alliance.id);
    if (
      alPayoff === undefined ||
      item.payoffEp === undefined ||
      link.ep !== alPayoff ||
      link.ep !== item.payoffEp
    ) {
      push({
        code: 'EP_NOT_PAYOFF',
        severity: 'FAIL',
        ids: [link.id, alliance.id, item.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 alliancePayoff=${alPayoff ?? '无'}/fs=${item.payoffEp ?? '无'}`,
        fix: '同盟 payoff + 伏笔 payoff + quality 须同集',
      });
      continue;
    }

    const intense = maxIntensity(link.qualityLeap);
    if (intense < minPayoffIntense) {
      push({
        code: 'LOW_INTENSITY_AT_PAYOFF',
        severity: 'WARN',
        ids: [link.id, alliance.id, item.id],
        message: `${link.id}: max intensity=${intense} < minPayoffIntense=${minPayoffIntense}`,
        fix: '提高表演 intensity 或下调 minPayoffIntense',
      });
    }

    pairedAl.add(alliance.id);
    pairedItems.add(item.id);
    aligned += 1;
  }

  for (const [aid, pep] of payoffByAlliance) {
    if (!pairedAl.has(aid)) {
      push({
        code: 'ALLIANCE_WITHOUT_LINK',
        severity: 'FAIL',
        ids: [aid],
        message: `alliance ${aid} payoff=E${pep} 无 alliance×quality×foreshadow 联表`,
        fix: '为同盟 payoff 挂 AllianceQualityForeshadowLink',
      });
    }
  }
  for (const a of alliances) {
    if (!pairedAl.has(a.id) && !payoffByAlliance.has(a.id)) {
      push({
        code: 'PENDING_ALLIANCE',
        severity: 'WARN',
        ids: [a.id],
        message: `alliance ${a.id} 尚未联表`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const it of items) {
    if (it.payoffEp !== undefined && !pairedItems.has(it.id)) {
      push({
        code: 'PAYOFF_WITHOUT_LINK',
        severity: 'FAIL',
        ids: [it.id],
        message: `foreshadow ${it.id} payoffEp=E${it.payoffEp} 无 alliance×quality 联表`,
        fix: '为伏笔兑现集挂 AllianceQualityForeshadowLink',
      });
    } else if (!pairedItems.has(it.id)) {
      push({
        code: 'PENDING_FORESHADOW',
        severity: 'WARN',
        ids: [it.id],
        message: `foreshadow ${it.id} 尚未联表`,
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
      items: items.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
