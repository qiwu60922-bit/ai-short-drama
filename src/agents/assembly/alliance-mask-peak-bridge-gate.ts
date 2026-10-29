/**
 * V12 · Alliance × Mask × Peak Ternary Bridge
 * (人物同盟 payoff × 伪装揭穿 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《反派拿捏》: 同盟护短 payoff 常与 mask reveal、对峙峰值同拍.
 *  - alliancePeakLink / amnesiaMaskPeak 已各自联表——本 gate 硬对齐同 ep 三元同框.
 *
 * Per link: allianceId + maskId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_ALLIANCE / UNKNOWN_MASK / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_ALLIANCE_FAIL / CHILD_MASK_FAIL / CHILD_PEAK_FAIL
 *  EP_NOT_TERNARY — link.ep = alliance.payoff = revealEp = peakEp
 *  PEAK_WITHOUT_BRIDGE / REVEAL_WITHOUT_BRIDGE / PAYOFF_WITHOUT_BRIDGE
 *  PENDING_MASK (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  AllianceEntrySchema,
  AllianceEventSchema,
  evaluateAllianceLedger,
} from './alliance-ledger-gate';
import {
  PersonaMaskEntrySchema,
  evaluatePersonaMask,
} from './persona-mask-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const AllianceMaskPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  allianceId: z.string().min(1),
  maskId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const AllianceMaskPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  masks: z.array(PersonaMaskEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AllianceMaskPeakBridgeLinkSchema),
});

export type AllianceMaskPeakBridgeLedger = z.infer<typeof AllianceMaskPeakBridgeLedgerSchema>;

export type AllianceMaskPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_ALLIANCE'
    | 'UNKNOWN_MASK'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_ALLIANCE_FAIL'
    | 'CHILD_MASK_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'EP_NOT_TERNARY'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'REVEAL_WITHOUT_BRIDGE'
    | 'PAYOFF_WITHOUT_BRIDGE'
    | 'PENDING_MASK';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AllianceMaskPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    alliances: number;
    masks: number;
    peaks: number;
    latestEp: number;
  };
  findings: AllianceMaskPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAllianceMaskPeakBridge(input: unknown): AllianceMaskPeakBridgeReport {
  const parsed = AllianceMaskPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, alliances: 0, masks: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, alliances, events, masks, peaks, links } = parsed.data;
  const findings: AllianceMaskPeakBridgeFinding[] = [];
  const push = (x: AllianceMaskPeakBridgeFinding) => findings.push(x);

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

  const mReport = evaluatePersonaMask({ series, latestEp, entries: masks });
  if (mReport.verdict === 'FAIL') {
    const childFails = mReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_MASK_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌伪装账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 persona-mask-gate',
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
  const byM = new Map(masks.map((m) => [m.id, m]));
  const byP = new Map(peaks.map((p) => [p.id, p]));
  const payoffByAlliance = new Map<string, number>();
  for (const ev of events) {
    if (ev.role === 'payoff') payoffByAlliance.set(ev.allianceId, ev.ep);
  }
  const linkedP = new Set<string>();
  const linkedM = new Set<string>();
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
    const mask = byM.get(link.maskId);
    if (!mask) {
      push({
        code: 'UNKNOWN_MASK',
        severity: 'FAIL',
        ids: [link.id, link.maskId],
        message: `联表 ${link.id} 引用未知 mask ${link.maskId}`,
        fix: 'maskId 须存在于 masks[]',
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
      mask.revealEp === undefined ||
      peak.peakEp === undefined ||
      link.ep !== payoffEp ||
      link.ep !== mask.revealEp ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, alliance.id, mask.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 payoff=${payoffEp ?? '无'}/reveal=${mask.revealEp ?? '无'}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = alliance.payoff = revealEp = peakEp',
      });
      continue;
    }

    linkedP.add(peak.id);
    linkedM.add(mask.id);
    linkedAl.add(alliance.id);
    aligned += 1;
  }

  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedP.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 alliance×mask×peak 桥`,
        fix: '为峰值集挂 AllianceMaskPeakBridge',
      });
    }
  }
  for (const mask of masks) {
    if (mask.revealEp !== undefined && !linkedM.has(mask.id)) {
      push({
        code: 'REVEAL_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [mask.id],
        message: `mask ${mask.id} revealEp=E${mask.revealEp} 无 alliance×mask×peak 桥`,
        fix: '为揭穿集挂 AllianceMaskPeakBridge',
      });
    } else if (!linkedM.has(mask.id)) {
      push({
        code: 'PENDING_MASK',
        severity: 'WARN',
        ids: [mask.id],
        message: `mask ${mask.id} 尚未联表到 alliance×mask×peak 桥`,
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
        message: `alliance ${aid} payoff=E${pep} 无 alliance×mask×peak 桥`,
        fix: '为同盟 payoff 集挂 AllianceMaskPeakBridge',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      alliances: alliances.length,
      masks: masks.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
