/**
 * V12 · Alliance × Rhythm × Peak Ternary Bridge
 * (同盟 payoff × 系列节奏 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 同盟护短 payoff 当集常踩对峙峰值，且节奏须过 story-rhythm 密度门.
 *  - 与 allianceQualityPeakBridge / motifRhythmPeakBridge 互补：本 gate 以 alliance 联 rhythm×peak.
 *
 * rhythms[]: { id, ep, shotSpec }
 * Per link: allianceId + rhythmId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_ALLIANCE / UNKNOWN_RHYTHM / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_ALLIANCE_FAIL / CHILD_RHYTHM_FAIL / CHILD_PEAK_FAIL
 *  EP_NOT_TERNARY — link.ep = rhythm.ep = alliance.payoff = peakEp
 *  PAYOFF_WITHOUT_BRIDGE / RHYTHM_WITHOUT_BRIDGE / PEAK_WITHOUT_BRIDGE
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
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { evaluateStoryRhythm } from './story-rhythm-gate';

const Ep = z.number().int().positive();

export const AllianceRhythmPeakRhythmEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const AllianceRhythmPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  allianceId: z.string().min(1),
  rhythmId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const AllianceRhythmPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  rhythms: z.array(AllianceRhythmPeakRhythmEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AllianceRhythmPeakBridgeLinkSchema),
});

export type AllianceRhythmPeakBridgeLedger = z.infer<typeof AllianceRhythmPeakBridgeLedgerSchema>;

export type AllianceRhythmPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_ALLIANCE'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_ALLIANCE_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'UNKNOWN_RHYTHM'
    | 'CHILD_RHYTHM_FAIL'
    | 'EP_NOT_TERNARY'
    | 'PAYOFF_WITHOUT_BRIDGE'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'PENDING_ALLIANCE'
    | 'RHYTHM_WITHOUT_BRIDGE';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AllianceRhythmPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    alliances: number;
    rhythms: number;
    peaks: number;
    latestEp: number;
  };
  findings: AllianceRhythmPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;


export function evaluateAllianceRhythmPeakBridge(input: unknown): AllianceRhythmPeakBridgeReport {
  const parsed = AllianceRhythmPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, alliances: 0, rhythms: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, alliances, events, rhythms, peaks, links } = parsed.data;
  const findings: AllianceRhythmPeakBridgeFinding[] = [];
  const push = (x: AllianceRhythmPeakBridgeFinding) => findings.push(x);

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

  for (const ry of rhythms) {
    const r = evaluateStoryRhythm(ry.shotSpec);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_RHYTHM_FAIL',
        severity: 'FAIL',
        ids: [ry.id, ...childFails.flatMap((f) => f.shotIds ?? [])],
        message: `rhythm ${ry.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 story-rhythm-gate',
      });
    }
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
  const byRy = new Map(rhythms.map((r) => [r.id, r]));
  const byP = new Map(peaks.map((p) => [p.id, p]));
  const payoffByAlliance = new Map<string, number>();
  for (const ev of events) {
    if (ev.role === 'payoff') payoffByAlliance.set(ev.allianceId, ev.ep);
  }
  const linkedAl = new Set<string>();
  const linkedRy = new Set<string>();
  const linkedP = new Set<string>();
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
    const ry = byRy.get(link.rhythmId);
    if (!ry) {
      push({
        code: 'UNKNOWN_RHYTHM',
        severity: 'FAIL',
        ids: [link.id, link.rhythmId],
        message: `联表 ${link.id} 引用未知 rhythm ${link.rhythmId}`,
        fix: 'rhythmId 须存在于 rhythms[]',
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
      peak.peakEp === undefined ||
      link.ep !== ry.ep ||
      link.ep !== payoffEp ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, alliance.id, ry.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 rhythm=${ry.ep}/payoff=${payoffEp ?? '无'}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = rhythm.ep = alliance.payoff = peakEp',
      });
      continue;
    }

    linkedAl.add(alliance.id);
    linkedRy.add(ry.id);
    linkedP.add(peak.id);
    aligned += 1;
  }

  for (const [aid, pep] of payoffByAlliance) {
    if (!linkedAl.has(aid)) {
      push({
        code: 'PAYOFF_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [aid],
        message: `alliance ${aid} payoff=E${pep} 无 alliance×rhythm×peak 桥`,
        fix: '为同盟 payoff 集挂 AllianceRhythmPeakBridge',
      });
    }
  }
  for (const a of alliances) {
    if (!linkedAl.has(a.id) && !payoffByAlliance.has(a.id)) {
      push({
        code: 'PENDING_ALLIANCE',
        severity: 'WARN',
        ids: [a.id],
        message: `alliance ${a.id} 尚未联表`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedP.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 alliance×rhythm×peak 桥`,
        fix: '为峰值集挂 AllianceRhythmPeakBridge',
      });
    }
  }

  for (const ry of rhythms) {
    if (!linkedRy.has(ry.id)) {
      push({
        code: 'RHYTHM_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [ry.id],
        message: `rhythm ${ry.id} 无 alliance×rhythm×peak 桥`,
        fix: '为节奏档挂 AllianceRhythmPeakBridge',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      alliances: alliances.length,
      rhythms: rhythms.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
