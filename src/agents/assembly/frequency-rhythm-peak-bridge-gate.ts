/**
 * V12 · Frequency × Rhythm × Peak Ternary Bridge
 * (第N次 tipping × 系列节奏 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - tipping 当集常踩对峙峰值，且节奏须过 story-rhythm 密度门.
 *  - 与 frequencyQualityPeakBridge / motifRhythmPeakBridge 互补：本 gate 以 frequency 联 rhythm×peak.
 *
 * rhythms[]: { id, ep, shotSpec }
 * Per link: frequencyId + rhythmId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_FREQUENCY / UNKNOWN_RHYTHM / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_FREQUENCY_FAIL / CHILD_RHYTHM_FAIL / CHILD_PEAK_FAIL
 *  EP_NOT_TERNARY — link.ep = rhythm.ep = tipEp = peakEp
 *  RHYTHM_WITHOUT_BRIDGE / PEAK_WITHOUT_BRIDGE / TIP_WITHOUT_BRIDGE
 *  PENDING_FREQUENCY (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { evaluateStoryRhythm } from './story-rhythm-gate';
import {
  FrequencyTippingEntrySchema,
  evaluateFrequencyTipping,
} from './frequency-tipping-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const FrequencyRhythmPeakRhythmEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const FrequencyRhythmPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  frequencyId: z.string().min(1),
  rhythmId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const FrequencyRhythmPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  frequencies: z.array(FrequencyTippingEntrySchema),
  rhythms: z.array(FrequencyRhythmPeakRhythmEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(FrequencyRhythmPeakBridgeLinkSchema),
});

export type FrequencyRhythmPeakBridgeLedger = z.infer<typeof FrequencyRhythmPeakBridgeLedgerSchema>;

export type FrequencyRhythmPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_FREQUENCY'
    | 'UNKNOWN_RHYTHM'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_FREQUENCY_FAIL'
    | 'CHILD_RHYTHM_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'EP_NOT_TERNARY'
    | 'RHYTHM_WITHOUT_BRIDGE'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'TIP_WITHOUT_BRIDGE'
    | 'PENDING_FREQUENCY';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface FrequencyRhythmPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    frequencies: number;
    rhythms: number;
    peaks: number;
    latestEp: number;
  };
  findings: FrequencyRhythmPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateFrequencyRhythmPeakBridge(input: unknown): FrequencyRhythmPeakBridgeReport {
  const parsed = FrequencyRhythmPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, frequencies: 0, rhythms: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, frequencies, rhythms, peaks, links } = parsed.data;
  const findings: FrequencyRhythmPeakBridgeFinding[] = [];
  const push = (x: FrequencyRhythmPeakBridgeFinding) => findings.push(x);

  const fReport = evaluateFrequencyTipping({ series, latestEp, entries: frequencies });
  if (fReport.verdict === 'FAIL') {
    const childFails = fReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_FREQUENCY_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌频率账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 frequency-tipping-gate',
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

  const byF = new Map(frequencies.map((f) => [f.id, f]));
  const byRy = new Map(rhythms.map((r) => [r.id, r]));
  const byP = new Map(peaks.map((p) => [p.id, p]));
  const linkedF = new Set<string>();
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
    const freq = byF.get(link.frequencyId);
    if (!freq) {
      push({
        code: 'UNKNOWN_FREQUENCY',
        severity: 'FAIL',
        ids: [link.id, link.frequencyId],
        message: `联表 ${link.id} 引用未知 frequency ${link.frequencyId}`,
        fix: 'frequencyId 须存在于 frequencies[]',
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
      freq.tipEp === undefined ||
      peak.peakEp === undefined ||
      link.ep !== ry.ep ||
      link.ep !== freq.tipEp ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, freq.id, ry.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 rhythm=${ry.ep}/tip=${freq.tipEp ?? '无'}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = rhythm.ep = tipEp = peakEp',
      });
      continue;
    }

    linkedF.add(freq.id);
    linkedRy.add(ry.id);
    linkedP.add(peak.id);
    aligned += 1;
  }

  for (const ry of rhythms) {
    if (!linkedRy.has(ry.id)) {
      push({
        code: 'RHYTHM_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [ry.id],
        message: `rhythm ${ry.id} 无 frequency×rhythm×peak 桥`,
        fix: '为节奏档挂 FrequencyRhythmPeakBridge',
      });
    }
  }
  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedP.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 frequency×rhythm×peak 桥`,
        fix: '为峰值集挂 FrequencyRhythmPeakBridge',
      });
    }
  }
  for (const f of frequencies) {
    if (f.tipEp !== undefined && !linkedF.has(f.id)) {
      push({
        code: 'TIP_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [f.id],
        message: `frequency ${f.id} tipEp=E${f.tipEp} 无 frequency×rhythm×peak 桥`,
        fix: '为 tipping 集挂 FrequencyRhythmPeakBridge',
      });
    } else if (!linkedF.has(f.id)) {
      push({
        code: 'PENDING_FREQUENCY',
        severity: 'WARN',
        ids: [f.id],
        message: `frequency ${f.id} 尚未联表`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      frequencies: frequencies.length,
      rhythms: rhythms.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
