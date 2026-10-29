/**
 * V12 · Ping × Rhythm × Peak Ternary Bridge
 * (叮响节拍 × 系列节奏 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 叮响节拍当集常踩对峙峰值，且节奏须过 story-rhythm 密度门.
 *  - 与 openingRhythmPeakBridge / qualityCrestLink 互补：本 gate 以 ping 联 rhythm×peak.
 *
 * pings[] / rhythms[]: { id, ep, shotSpec }
 * Per link: pingId + rhythmId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_PING / UNKNOWN_RHYTHM / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_PING_FAIL / CHILD_RHYTHM_FAIL / CHILD_PEAK_FAIL
 *  EP_NOT_TERNARY — link.ep = ping.ep = rhythm.ep = peakEp
 *  PING_WITHOUT_BRIDGE / RHYTHM_WITHOUT_BRIDGE / PEAK_WITHOUT_BRIDGE
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { evaluateHookStructure } from './hook-structure-gate';
import { evaluateStoryRhythm } from './story-rhythm-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const PingRhythmPeakPingEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const PingRhythmPeakRhythmEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const PingRhythmPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  pingId: z.string().min(1),
  rhythmId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const PingRhythmPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  pings: z.array(PingRhythmPeakPingEntrySchema),
  rhythms: z.array(PingRhythmPeakRhythmEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(PingRhythmPeakBridgeLinkSchema),
});

export type PingRhythmPeakBridgeLedger = z.infer<typeof PingRhythmPeakBridgeLedgerSchema>;

export type PingRhythmPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_PING'
    | 'UNKNOWN_RHYTHM'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_PING_FAIL'
    | 'CHILD_RHYTHM_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'EP_NOT_TERNARY'
    | 'PING_WITHOUT_BRIDGE'
    | 'RHYTHM_WITHOUT_BRIDGE'
    | 'PEAK_WITHOUT_BRIDGE';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface PingRhythmPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    pings: number;
    rhythms: number;
    peaks: number;
    latestEp: number;
  };
  findings: PingRhythmPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluatePingRhythmPeakBridge(input: unknown): PingRhythmPeakBridgeReport {
  const parsed = PingRhythmPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, pings: 0, rhythms: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, pings, rhythms, peaks, links } = parsed.data;
  const findings: PingRhythmPeakBridgeFinding[] = [];
  const push = (x: PingRhythmPeakBridgeFinding) => findings.push(x);

  for (const ent of pings) {
    const r = evaluateHookStructure(ent.shotSpec);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_PING_FAIL',
        severity: 'FAIL',
        ids: [ent.id, ...childFails.flatMap((f) => f.shotIds ?? [])],
        message: `ping ${ent.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 hook-structure-gate',
      });
    }
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

  const byEnt = new Map(pings.map((o) => [o.id, o]));
  const byRy = new Map(rhythms.map((r) => [r.id, r]));
  const byP = new Map(peaks.map((p) => [p.id, p]));
  const linkedEnt = new Set<string>();
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
    const ent2 = byEnt.get(link.pingId);
    if (!ent2) {
      push({
        code: 'UNKNOWN_PING',
        severity: 'FAIL',
        ids: [link.id, link.pingId],
        message: `联表 ${link.id} 引用未知 ping ${link.pingId}`,
        fix: 'pingId 须存在于 pings[]',
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

    if (
      peak.peakEp === undefined ||
      link.ep !== ent2.ep ||
      link.ep !== ry.ep ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, ent2.id, ry.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 ping=${ent2.ep}/rhythm=${ry.ep}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = ping.ep = rhythm.ep = peakEp',
      });
      continue;
    }

    linkedEnt.add(ent2.id);
    linkedRy.add(ry.id);
    linkedP.add(peak.id);
    aligned += 1;
  }

  for (const ent of pings) {
    if (!linkedEnt.has(ent.id)) {
      push({
        code: 'PING_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [ent.id],
        message: `ping ${ent.id} ep=E${ent.ep} 无 ping×rhythm×peak 桥`,
        fix: '为叮响节拍挂 PingRhythmPeakBridge',
      });
    }
  }
  for (const ry of rhythms) {
    if (!linkedRy.has(ry.id)) {
      push({
        code: 'RHYTHM_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [ry.id],
        message: `rhythm ${ry.id} 无 ping×rhythm×peak 桥`,
        fix: '为节奏档挂 PingRhythmPeakBridge',
      });
    }
  }
  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedP.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 ping×rhythm×peak 桥`,
        fix: '为峰值集挂 PingRhythmPeakBridge',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      pings: pings.length,
      rhythms: rhythms.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
