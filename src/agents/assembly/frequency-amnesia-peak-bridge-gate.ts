/**
 * V12 · Frequency × Amnesia × Peak Ternary Bridge
 * (第N次 tipping × 失忆唤回 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《警报！叶楚出狱》/《反派拿捏》: tip 升级常与唤回 recover、对峙峰值同框.
 *  - frequencyAmnesiaLink / amnesiaPeakLink 已各自联表——本 gate 硬对齐同 ep 三元同框.
 *
 * Per link: frequencyId + amnesiaId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_FREQUENCY / UNKNOWN_AMNESIA / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_FREQUENCY_FAIL / CHILD_AMNESIA_FAIL / CHILD_PEAK_FAIL
 *  EP_NOT_TERNARY — link.ep = tipEp = recoverEp = peakEp
 *  TIP_WITHOUT_BRIDGE / RECOVER_WITHOUT_BRIDGE / PEAK_WITHOUT_BRIDGE
 *  PENDING_FREQUENCY (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  FrequencyTippingEntrySchema,
  evaluateFrequencyTipping,
} from './frequency-tipping-gate';
import {
  AmnesiaArcEntrySchema,
  evaluateAmnesiaArc,
} from './amnesia-arc-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const FrequencyAmnesiaPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  frequencyId: z.string().min(1),
  amnesiaId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const FrequencyAmnesiaPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  frequencies: z.array(FrequencyTippingEntrySchema),
  amnesias: z.array(AmnesiaArcEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(FrequencyAmnesiaPeakBridgeLinkSchema),
});

export type FrequencyAmnesiaPeakBridgeLedger = z.infer<typeof FrequencyAmnesiaPeakBridgeLedgerSchema>;

export type FrequencyAmnesiaPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_FREQUENCY'
    | 'UNKNOWN_AMNESIA'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_FREQUENCY_FAIL'
    | 'CHILD_AMNESIA_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'EP_NOT_TERNARY'
    | 'TIP_WITHOUT_BRIDGE'
    | 'RECOVER_WITHOUT_BRIDGE'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'PENDING_FREQUENCY';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface FrequencyAmnesiaPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    frequencies: number;
    amnesias: number;
    peaks: number;
    latestEp: number;
  };
  findings: FrequencyAmnesiaPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateFrequencyAmnesiaPeakBridge(input: unknown): FrequencyAmnesiaPeakBridgeReport {
  const parsed = FrequencyAmnesiaPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, frequencies: 0, amnesias: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, frequencies, amnesias, peaks, links } = parsed.data;
  const findings: FrequencyAmnesiaPeakBridgeFinding[] = [];
  const push = (x: FrequencyAmnesiaPeakBridgeFinding) => findings.push(x);

  const freqReport = evaluateFrequencyTipping({ series, latestEp, entries: frequencies });
  if (freqReport.verdict === 'FAIL') {
    const childFails = freqReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_FREQUENCY_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌频率账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 frequency-tipping-gate',
    });
  }

  const aReport = evaluateAmnesiaArc({ series, latestEp, entries: amnesias });
  if (aReport.verdict === 'FAIL') {
    const childFails = aReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_AMNESIA_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌失忆账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 amnesia-arc-gate',
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

  const byFreq = new Map(frequencies.map((f) => [f.id, f]));
  const byA = new Map(amnesias.map((a) => [a.id, a]));
  const byPeak = new Map(peaks.map((p) => [p.id, p]));
  const linkedF = new Set<string>();
  const linkedA = new Set<string>();
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
    const freq = byFreq.get(link.frequencyId);
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
    const amnesia = byA.get(link.amnesiaId);
    if (!amnesia) {
      push({
        code: 'UNKNOWN_AMNESIA',
        severity: 'FAIL',
        ids: [link.id, link.amnesiaId],
        message: `联表 ${link.id} 引用未知 amnesia ${link.amnesiaId}`,
        fix: 'amnesiaId 须存在于 amnesias[]',
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

    const tipEp = freq.tipEp;
    if (
      tipEp === undefined ||
      amnesia.recoverEp === undefined ||
      peak.peakEp === undefined ||
      link.ep !== tipEp ||
      link.ep !== amnesia.recoverEp ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, freq.id, amnesia.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 tip=${tipEp ?? '无'}/recover=${amnesia.recoverEp ?? '无'}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = tipEp = recoverEp = peakEp',
      });
      continue;
    }

    linkedF.add(freq.id);
    linkedA.add(amnesia.id);
    linkedP.add(peak.id);
    aligned += 1;
  }

  for (const freq of frequencies) {
    if (freq.tipEp !== undefined && !linkedF.has(freq.id)) {
      push({
        code: 'TIP_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [freq.id],
        message: `frequency ${freq.id} tipEp=E${freq.tipEp} 无 frequency×amnesia×peak 桥`,
        fix: '为 tip 集挂 FrequencyAmnesiaPeakBridge',
      });
    } else if (!linkedF.has(freq.id)) {
      push({
        code: 'PENDING_FREQUENCY',
        severity: 'WARN',
        ids: [freq.id],
        message: `frequency ${freq.id} 尚未联表到 frequency×amnesia×peak 桥`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const a of amnesias) {
    if (a.recoverEp !== undefined && !linkedA.has(a.id)) {
      push({
        code: 'RECOVER_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [a.id],
        message: `amnesia ${a.id} recoverEp=E${a.recoverEp} 无 frequency×amnesia×peak 桥`,
        fix: '为唤回集挂 FrequencyAmnesiaPeakBridge',
      });
    }
  }
  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedP.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 frequency×amnesia×peak 桥`,
        fix: '为峰值集挂 FrequencyAmnesiaPeakBridge',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      frequencies: frequencies.length,
      amnesias: amnesias.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
