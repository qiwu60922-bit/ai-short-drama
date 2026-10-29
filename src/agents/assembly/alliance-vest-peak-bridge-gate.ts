/**
 * V12 · Alliance × Vest × Peak Ternary Bridge
 * (人物同盟 payoff × 马甲掉落 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《反派拿捏》/《机长先生》: 同盟护短 payoff 常与掉马甲、对峙峰值同拍.
 *  - alliancePeakLink / personaVestPeak 已各自联表——本 gate 硬对齐同 ep 三元同框.
 *
 * Per link: allianceId + vestId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_ALLIANCE / UNKNOWN_VEST / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_ALLIANCE_FAIL / CHILD_VEST_FAIL / CHILD_PEAK_FAIL
 *  EP_NOT_TERNARY — link.ep = alliance.payoff = dropEp = peakEp
 *  PEAK_WITHOUT_BRIDGE / DROP_WITHOUT_BRIDGE / PAYOFF_WITHOUT_BRIDGE
 *  PENDING_VEST (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  AllianceEntrySchema,
  AllianceEventSchema,
  evaluateAllianceLedger,
} from './alliance-ledger-gate';
import {
  IdentityVestEntrySchema,
  evaluateIdentityVest,
} from './identity-vest-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const AllianceVestPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  allianceId: z.string().min(1),
  vestId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const AllianceVestPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  vests: z.array(IdentityVestEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AllianceVestPeakBridgeLinkSchema),
});

export type AllianceVestPeakBridgeLedger = z.infer<typeof AllianceVestPeakBridgeLedgerSchema>;

export type AllianceVestPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_ALLIANCE'
    | 'UNKNOWN_VEST'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_ALLIANCE_FAIL'
    | 'CHILD_VEST_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'EP_NOT_TERNARY'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'DROP_WITHOUT_BRIDGE'
    | 'PAYOFF_WITHOUT_BRIDGE'
    | 'PENDING_VEST';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AllianceVestPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    alliances: number;
    vests: number;
    peaks: number;
    latestEp: number;
  };
  findings: AllianceVestPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAllianceVestPeakBridge(input: unknown): AllianceVestPeakBridgeReport {
  const parsed = AllianceVestPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, alliances: 0, vests: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, alliances, events, vests, peaks, links } = parsed.data;
  const findings: AllianceVestPeakBridgeFinding[] = [];
  const push = (x: AllianceVestPeakBridgeFinding) => findings.push(x);

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

  const vReport = evaluateIdentityVest({ series, latestEp, entries: vests });
  if (vReport.verdict === 'FAIL') {
    const childFails = vReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_VEST_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌马甲账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 identity-vest-gate',
    });
  }

  const pReport = evaluatePeakBeforePayoff({ series, latestEp, entries: peaks });
  if (pReport.verdict === 'FAIL') {
    const childFails = pReport.findings.filter((f) => f.severity === 'FAIL');
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
  const byV = new Map(vests.map((v) => [v.id, v]));
  const byP = new Map(peaks.map((p) => [p.id, p]));
  const payoffByAlliance = new Map<string, number>();
  for (const ev of events) {
    if (ev.role === 'payoff') payoffByAlliance.set(ev.allianceId, ev.ep);
  }
  const linkedP = new Set<string>();
  const linkedV = new Set<string>();
  const linkedAl = new Set<string>();
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
    const vest = byV.get(link.vestId);
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
    const peak = byP.get(link.peakId);
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
      vest.dropEp === undefined ||
      peak.peakEp === undefined ||
      link.ep !== payoffEp ||
      link.ep !== vest.dropEp ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, alliance.id, vest.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 payoff=${payoffEp ?? '无'}/drop=${vest.dropEp ?? '无'}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = alliance.payoff = dropEp = peakEp',
      });
      continue;
    }

    linkedP.add(peak.id);
    linkedV.add(vest.id);
    linkedAl.add(alliance.id);
    aligned += 1;
  }

  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedP.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 alliance×vest×peak 桥`,
        fix: '为峰值集挂 AllianceVestPeakBridge',
      });
    }
  }
  for (const vest of vests) {
    if (vest.dropEp !== undefined && !linkedV.has(vest.id)) {
      push({
        code: 'DROP_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [vest.id],
        message: `vest ${vest.id} dropEp=E${vest.dropEp} 无 alliance×vest×peak 桥`,
        fix: '为掉落集挂 AllianceVestPeakBridge',
      });
    } else if (!linkedV.has(vest.id)) {
      push({
        code: 'PENDING_VEST',
        severity: 'WARN',
        ids: [vest.id],
        message: `vest ${vest.id} 尚未联表到 alliance×vest×peak 桥`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const [aid, pep] of payoffByAlliance) {
    if (!linkedAl.has(aid)) {
      push({
        code: 'PAYOFF_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [aid],
        message: `alliance ${aid} payoff=E${pep} 无 alliance×vest×peak 桥`,
        fix: '为同盟 payoff 集挂 AllianceVestPeakBridge',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      alliances: alliances.length,
      vests: vests.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
