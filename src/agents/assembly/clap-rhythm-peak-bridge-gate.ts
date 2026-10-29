/**
 * V12 · Clap × Rhythm × Peak Ternary Bridge
 * (拍掌节拍 × 系列节奏 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 拍掌节拍当集常踩对峙峰值，且节奏须过 story-rhythm 密度门.
 *  - 与 openingRhythmPeakBridge / qualityCrestLink 互补：本 gate 以 clap 联 rhythm×peak.
 *
 * claps[] / rhythms[]: { id, ep, shotSpec }
 * Per link: clapId + rhythmId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_CLAP / UNKNOWN_RHYTHM / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_CLAP_FAIL / CHILD_RHYTHM_FAIL / CHILD_PEAK_FAIL
 *  EP_NOT_TERNARY — link.ep = clap.ep = rhythm.ep = peakEp
 *  CLAP_WITHOUT_BRIDGE / RHYTHM_WITHOUT_BRIDGE / PEAK_WITHOUT_BRIDGE
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

export const ClapRhythmPeakClapEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const ClapRhythmPeakRhythmEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const ClapRhythmPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  clapId: z.string().min(1),
  rhythmId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const ClapRhythmPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  claps: z.array(ClapRhythmPeakClapEntrySchema),
  rhythms: z.array(ClapRhythmPeakRhythmEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(ClapRhythmPeakBridgeLinkSchema),
});

export type ClapRhythmPeakBridgeLedger = z.infer<typeof ClapRhythmPeakBridgeLedgerSchema>;

export type ClapRhythmPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_CLAP'
    | 'UNKNOWN_RHYTHM'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_CLAP_FAIL'
    | 'CHILD_RHYTHM_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'EP_NOT_TERNARY'
    | 'CLAP_WITHOUT_BRIDGE'
    | 'RHYTHM_WITHOUT_BRIDGE'
    | 'PEAK_WITHOUT_BRIDGE';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface ClapRhythmPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    claps: number;
    rhythms: number;
    peaks: number;
    latestEp: number;
  };
  findings: ClapRhythmPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateClapRhythmPeakBridge(input: unknown): ClapRhythmPeakBridgeReport {
  const parsed = ClapRhythmPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, claps: 0, rhythms: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, claps, rhythms, peaks, links } = parsed.data;
  const findings: ClapRhythmPeakBridgeFinding[] = [];
  const push = (x: ClapRhythmPeakBridgeFinding) => findings.push(x);

  for (const ent of claps) {
    const r = evaluateHookStructure(ent.shotSpec);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_CLAP_FAIL',
        severity: 'FAIL',
        ids: [ent.id, ...childFails.flatMap((f) => f.shotIds ?? [])],
        message: `clap ${ent.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
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

  const byEnt = new Map(claps.map((o) => [o.id, o]));
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
    const ent2 = byEnt.get(link.clapId);
    if (!ent2) {
      push({
        code: 'UNKNOWN_CLAP',
        severity: 'FAIL',
        ids: [link.id, link.clapId],
        message: `联表 ${link.id} 引用未知 clap ${link.clapId}`,
        fix: 'clapId 须存在于 claps[]',
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
        message: `${link.id}: ep=E${link.ep} 未对齐 clap=${ent2.ep}/rhythm=${ry.ep}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = clap.ep = rhythm.ep = peakEp',
      });
      continue;
    }

    linkedEnt.add(ent2.id);
    linkedRy.add(ry.id);
    linkedP.add(peak.id);
    aligned += 1;
  }

  for (const ent of claps) {
    if (!linkedEnt.has(ent.id)) {
      push({
        code: 'CLAP_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [ent.id],
        message: `clap ${ent.id} ep=E${ent.ep} 无 clap×rhythm×peak 桥`,
        fix: '为拍掌节拍挂 ClapRhythmPeakBridge',
      });
    }
  }
  for (const ry of rhythms) {
    if (!linkedRy.has(ry.id)) {
      push({
        code: 'RHYTHM_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [ry.id],
        message: `rhythm ${ry.id} 无 clap×rhythm×peak 桥`,
        fix: '为节奏档挂 ClapRhythmPeakBridge',
      });
    }
  }
  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedP.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 clap×rhythm×peak 桥`,
        fix: '为峰值集挂 ClapRhythmPeakBridge',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      claps: claps.length,
      rhythms: rhythms.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
