/**
 * V12 · Gobble × Rhythm × Peak Ternary Bridge
 * (火鸡叫节拍 × 系列节奏 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 火鸡叫节拍当集常踩对峙峰值，且节奏须过 story-rhythm 密度门.
 *  - 与 openingRhythmPeakBridge / qualityCrestLink 互补：本 gate 以 gobble 联 rhythm×peak.
 *
 * gobbles[] / rhythms[]: { id, ep, shotSpec }
 * Per link: gobbleId + rhythmId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_GOBBLE / UNKNOWN_RHYTHM / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_GOBBLE_FAIL / CHILD_RHYTHM_FAIL / CHILD_PEAK_FAIL
 *  EP_NOT_TERNARY — link.ep = gobble.ep = rhythm.ep = peakEp
 *  GOBBLE_WITHOUT_BRIDGE / RHYTHM_WITHOUT_BRIDGE / PEAK_WITHOUT_BRIDGE
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

export const GobbleRhythmPeakGobbleEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const GobbleRhythmPeakRhythmEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const GobbleRhythmPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  gobbleId: z.string().min(1),
  rhythmId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const GobbleRhythmPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  gobbles: z.array(GobbleRhythmPeakGobbleEntrySchema),
  rhythms: z.array(GobbleRhythmPeakRhythmEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(GobbleRhythmPeakBridgeLinkSchema),
});

export type GobbleRhythmPeakBridgeLedger = z.infer<typeof GobbleRhythmPeakBridgeLedgerSchema>;

export type GobbleRhythmPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_GOBBLE'
    | 'UNKNOWN_RHYTHM'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_GOBBLE_FAIL'
    | 'CHILD_RHYTHM_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'EP_NOT_TERNARY'
    | 'GOBBLE_WITHOUT_BRIDGE'
    | 'RHYTHM_WITHOUT_BRIDGE'
    | 'PEAK_WITHOUT_BRIDGE';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface GobbleRhythmPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    gobbles: number;
    rhythms: number;
    peaks: number;
    latestEp: number;
  };
  findings: GobbleRhythmPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateGobbleRhythmPeakBridge(input: unknown): GobbleRhythmPeakBridgeReport {
  const parsed = GobbleRhythmPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, gobbles: 0, rhythms: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, gobbles, rhythms, peaks, links } = parsed.data;
  const findings: GobbleRhythmPeakBridgeFinding[] = [];
  const push = (x: GobbleRhythmPeakBridgeFinding) => findings.push(x);

  for (const ent of gobbles) {
    const r = evaluateHookStructure(ent.shotSpec);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_GOBBLE_FAIL',
        severity: 'FAIL',
        ids: [ent.id, ...childFails.flatMap((f) => f.shotIds ?? [])],
        message: `gobble ${ent.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
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

  const byEnt = new Map(gobbles.map((o) => [o.id, o]));
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
    const ent2 = byEnt.get(link.gobbleId);
    if (!ent2) {
      push({
        code: 'UNKNOWN_GOBBLE',
        severity: 'FAIL',
        ids: [link.id, link.gobbleId],
        message: `联表 ${link.id} 引用未知 gobble ${link.gobbleId}`,
        fix: 'gobbleId 须存在于 gobbles[]',
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
        message: `${link.id}: ep=E${link.ep} 未对齐 gobble=${ent2.ep}/rhythm=${ry.ep}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = gobble.ep = rhythm.ep = peakEp',
      });
      continue;
    }

    linkedEnt.add(ent2.id);
    linkedRy.add(ry.id);
    linkedP.add(peak.id);
    aligned += 1;
  }

  for (const ent of gobbles) {
    if (!linkedEnt.has(ent.id)) {
      push({
        code: 'GOBBLE_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [ent.id],
        message: `gobble ${ent.id} ep=E${ent.ep} 无 tick×rhythm×peak 桥`,
        fix: '为火鸡叫节拍挂 GobbleRhythmPeakBridge',
      });
    }
  }
  for (const ry of rhythms) {
    if (!linkedRy.has(ry.id)) {
      push({
        code: 'RHYTHM_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [ry.id],
        message: `rhythm ${ry.id} 无 tick×rhythm×peak 桥`,
        fix: '为节奏档挂 GobbleRhythmPeakBridge',
      });
    }
  }
  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedP.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 tick×rhythm×peak 桥`,
        fix: '为峰值集挂 GobbleRhythmPeakBridge',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      gobbles: gobbles.length,
      rhythms: rhythms.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
