/**
 * V12 · Alliance × Foreshadow × Peak Ternary Bridge
 * (人物同盟 payoff × 伏笔兑现 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《反派拿捏》/《帐中香》: 同盟护短 payoff 常与 S/A 伏笔兑现、对峙峰值同拍.
 *  - alliancePeakLink / foreshadowPeakLink 已各自联表——本 gate 硬对齐同 ep 三元同框.
 *
 * Per link: allianceId + foreshadowId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_ALLIANCE / UNKNOWN_FORESHADOW / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_ALLIANCE_FAIL / CHILD_FORESHADOW_FAIL / CHILD_PEAK_FAIL
 *  EP_NOT_TERNARY — link.ep = alliance.payoff = item.payoffEp = peakEp
 *  PEAK_WITHOUT_BRIDGE / PAYOFF_WITHOUT_BRIDGE
 *  PENDING_FORESHADOW (WARN)
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
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const AllianceForeshadowPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  allianceId: z.string().min(1),
  foreshadowId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const AllianceForeshadowPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  items: z.array(ForeshadowItemSchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AllianceForeshadowPeakBridgeLinkSchema),
});

export type AllianceForeshadowPeakBridgeLedger = z.infer<typeof AllianceForeshadowPeakBridgeLedgerSchema>;

export type AllianceForeshadowPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_ALLIANCE'
    | 'UNKNOWN_FORESHADOW'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_ALLIANCE_FAIL'
    | 'CHILD_FORESHADOW_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'EP_NOT_TERNARY'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'PAYOFF_WITHOUT_BRIDGE'
    | 'PENDING_FORESHADOW';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AllianceForeshadowPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    alliances: number;
    items: number;
    peaks: number;
    latestEp: number;
  };
  findings: AllianceForeshadowPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAllianceForeshadowPeakBridge(input: unknown): AllianceForeshadowPeakBridgeReport {
  const parsed = AllianceForeshadowPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, alliances: 0, items: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, alliances, events, items, peaks, links } = parsed.data;
  const findings: AllianceForeshadowPeakBridgeFinding[] = [];
  const push = (x: AllianceForeshadowPeakBridgeFinding) => findings.push(x);

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

  const peakReport = evaluatePeakBeforePayoff({ series, latestEp, entries: peaks });
  if (peakReport.verdict === 'FAIL') {
    const childFails = peakReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_PEAK_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌峰值账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 peak-before-payoff-gate',
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
  const byPeak = new Map(peaks.map((p) => [p.id, p]));
  const payoffByAlliance = new Map<string, number>();
  for (const ev of events) {
    if (ev.role === 'payoff') payoffByAlliance.set(ev.allianceId, ev.ep);
  }
  const linkedAl = new Set<string>();
  const linkedItems = new Set<string>();
  const linkedPeaks = new Set<string>();
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
    const peak = byPeak.get(link.peakId);
    if (!peak) {
      push({
        code: 'UNKNOWN_PEAK',
        severity: 'FAIL',
        ids: [link.id, link.peakId],
        message: `联表 ${link.id} 引用未知 peak ${link.peakId}`,
        fix: 'peakId 须存在于 peaks[]',
      });
      continue;
    }

    const payoffEp = payoffByAlliance.get(alliance.id);
    if (
      payoffEp === undefined ||
      item.payoffEp === undefined ||
      peak.peakEp === undefined ||
      link.ep !== payoffEp ||
      link.ep !== item.payoffEp ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, alliance.id, item.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 payoff=${payoffEp ?? '无'}/fs=${item.payoffEp ?? '无'}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = alliance.payoff = item.payoffEp = peakEp',
      });
      continue;
    }

    linkedAl.add(alliance.id);
    linkedItems.add(item.id);
    linkedPeaks.add(peak.id);
    aligned += 1;
  }

  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedPeaks.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 alliance×foreshadow×peak 桥`,
        fix: '为峰值集挂 AllianceForeshadowPeakBridge',
      });
    }
  }
  for (const [aid, pep] of payoffByAlliance) {
    if (!linkedAl.has(aid)) {
      push({
        code: 'PAYOFF_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [aid],
        message: `alliance ${aid} payoff=E${pep} 无 alliance×foreshadow×peak 桥`,
        fix: '为同盟 payoff 集挂 AllianceForeshadowPeakBridge',
      });
    }
  }
  for (const it of items) {
    if (it.payoffEp !== undefined && !linkedItems.has(it.id)) {
      push({
        code: 'PAYOFF_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [it.id],
        message: `foreshadow ${it.id} payoffEp=E${it.payoffEp} 无 alliance×foreshadow×peak 桥`,
        fix: '为伏笔兑现集挂 AllianceForeshadowPeakBridge',
      });
    } else if (!linkedItems.has(it.id)) {
      push({
        code: 'PENDING_FORESHADOW',
        severity: 'WARN',
        ids: [it.id],
        message: `foreshadow ${it.id} 尚未联表到 alliance×foreshadow×peak 桥`,
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
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
