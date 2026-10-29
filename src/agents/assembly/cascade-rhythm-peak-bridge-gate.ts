/**
 * V12 · Cascade × Rhythm × Peak Ternary Bridge
 * (冷开叠钩 × 系列节奏 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 冷开叠钩当集常踩对峙峰值，且节奏须过 story-rhythm 密度门.
 *  - 与 openingRhythmPeakBridge / qualityCrestLink 互补：本 gate 以 cascade 联 rhythm×peak.
 *
 * cascades[] / rhythms[]: { id, ep, shotSpec }
 * Per link: cascadeId + rhythmId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_CASCADE / UNKNOWN_RHYTHM / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_CASCADE_FAIL / CHILD_RHYTHM_FAIL / CHILD_PEAK_FAIL
 *  EP_NOT_TERNARY — link.ep = cascade.ep = rhythm.ep = peakEp
 *  CASCADE_WITHOUT_BRIDGE / RHYTHM_WITHOUT_BRIDGE / PEAK_WITHOUT_BRIDGE
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { evaluateColdOpenCascade } from './cold-open-cascade-gate';
import { evaluateStoryRhythm } from './story-rhythm-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const CascadeRhythmPeakCascadeEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const CascadeRhythmPeakRhythmEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const CascadeRhythmPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  cascadeId: z.string().min(1),
  rhythmId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const CascadeRhythmPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  cascades: z.array(CascadeRhythmPeakCascadeEntrySchema),
  rhythms: z.array(CascadeRhythmPeakRhythmEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(CascadeRhythmPeakBridgeLinkSchema),
});

export type CascadeRhythmPeakBridgeLedger = z.infer<typeof CascadeRhythmPeakBridgeLedgerSchema>;

export type CascadeRhythmPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_CASCADE'
    | 'UNKNOWN_RHYTHM'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_CASCADE_FAIL'
    | 'CHILD_RHYTHM_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'EP_NOT_TERNARY'
    | 'CASCADE_WITHOUT_BRIDGE'
    | 'RHYTHM_WITHOUT_BRIDGE'
    | 'PEAK_WITHOUT_BRIDGE';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface CascadeRhythmPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    cascades: number;
    rhythms: number;
    peaks: number;
    latestEp: number;
  };
  findings: CascadeRhythmPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateCascadeRhythmPeakBridge(input: unknown): CascadeRhythmPeakBridgeReport {
  const parsed = CascadeRhythmPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, cascades: 0, rhythms: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, cascades, rhythms, peaks, links } = parsed.data;
  const findings: CascadeRhythmPeakBridgeFinding[] = [];
  const push = (x: CascadeRhythmPeakBridgeFinding) => findings.push(x);

  for (const ent of cascades) {
    const r = evaluateColdOpenCascade(ent.shotSpec);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_CASCADE_FAIL',
        severity: 'FAIL',
        ids: [ent.id, ...childFails.flatMap((f) => f.shotIds ?? [])],
        message: `cascade ${ent.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 cold-open-cascade-gate',
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

  const byEnt = new Map(cascades.map((o) => [o.id, o]));
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
    const ent2 = byEnt.get(link.cascadeId);
    if (!ent2) {
      push({
        code: 'UNKNOWN_CASCADE',
        severity: 'FAIL',
        ids: [link.id, link.cascadeId],
        message: `联表 ${link.id} 引用未知 cascade ${link.cascadeId}`,
        fix: 'cascadeId 须存在于 cascades[]',
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
        message: `${link.id}: ep=E${link.ep} 未对齐 cascade=${ent2.ep}/rhythm=${ry.ep}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = cascade.ep = rhythm.ep = peakEp',
      });
      continue;
    }

    linkedEnt.add(ent2.id);
    linkedRy.add(ry.id);
    linkedP.add(peak.id);
    aligned += 1;
  }

  for (const ent of cascades) {
    if (!linkedEnt.has(ent.id)) {
      push({
        code: 'CASCADE_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [ent.id],
        message: `cascade ${ent.id} ep=E${ent.ep} 无 cascade×rhythm×peak 桥`,
        fix: '为冷开叠钩挂 CascadeRhythmPeakBridge',
      });
    }
  }
  for (const ry of rhythms) {
    if (!linkedRy.has(ry.id)) {
      push({
        code: 'RHYTHM_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [ry.id],
        message: `rhythm ${ry.id} 无 cascade×rhythm×peak 桥`,
        fix: '为节奏档挂 CascadeRhythmPeakBridge',
      });
    }
  }
  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedP.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 cascade×rhythm×peak 桥`,
        fix: '为峰值集挂 CascadeRhythmPeakBridge',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      cascades: cascades.length,
      rhythms: rhythms.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
