/**
 * V12 · Cliff × Frequency × Peak Ternary Bridge
 * (跨集悬念叠钩 × 第N次 tipping × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《轻烟染日暮》: cliff 窗与第N次 tipping、对峙峰值同集兑现.
 *  - cliffFrequencyLink / cliffPeakLink 已各自联表——本 gate 硬对齐同 ep 三元同框.
 *
 * Per link: cliffLinkId + frequencyId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_CLIFF / UNKNOWN_FREQUENCY / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_CASCADE_FAIL / CHILD_FREQUENCY_FAIL / CHILD_PEAK_FAIL
 *  EP_NOT_TERNARY — link.ep = prevEp = tipEp = peakEp
 *  CLIFF_WITHOUT_BRIDGE / TIP_WITHOUT_BRIDGE / PEAK_WITHOUT_BRIDGE
 *  PENDING_CLIFF (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  FrequencyTippingEntrySchema,
  evaluateFrequencyTipping,
} from './frequency-tipping-gate';
import {
  CliffCascadeLinkEntrySchema,
  evaluateCliffCascadeLink,
} from './cliff-cascade-link-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const CliffFrequencyPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  cliffLinkId: z.string().min(1),
  frequencyId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const CliffFrequencyPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  frequencies: z.array(FrequencyTippingEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(CliffFrequencyPeakBridgeLinkSchema),
});

export type CliffFrequencyPeakBridgeLedger = z.infer<typeof CliffFrequencyPeakBridgeLedgerSchema>;

export type CliffFrequencyPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_CLIFF'
    | 'UNKNOWN_FREQUENCY'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_CASCADE_FAIL'
    | 'CHILD_FREQUENCY_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'EP_NOT_TERNARY'
    | 'CLIFF_WITHOUT_BRIDGE'
    | 'TIP_WITHOUT_BRIDGE'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'PENDING_CLIFF';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface CliffFrequencyPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    cliffLinks: number;
    frequencies: number;
    peaks: number;
    latestEp: number;
  };
  findings: CliffFrequencyPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateCliffFrequencyPeakBridge(input: unknown): CliffFrequencyPeakBridgeReport {
  const parsed = CliffFrequencyPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, cliffLinks: 0, frequencies: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, cliffLinks, frequencies, peaks, links } = parsed.data;
  const findings: CliffFrequencyPeakBridgeFinding[] = [];
  const push = (x: CliffFrequencyPeakBridgeFinding) => findings.push(x);

  const maskReport = evaluateCliffCascadeLink({ series, latestEp, links: cliffLinks });
  if (maskReport.verdict === 'FAIL') {
    const childFails = maskReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_CASCADE_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌 cliff-cascade 账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 cliff-cascade-link-gate',
    });
  }

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

  const byCliff = new Map(cliffLinks.map((m) => [m.id, m]));
  const byFreq = new Map(frequencies.map((f) => [f.id, f]));
  const byPeak = new Map(peaks.map((p) => [p.id, p]));
  const linkedCliffs = new Set<string>();
  const linkedFreqs = new Set<string>();
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
    const mask = byCliff.get(link.cliffLinkId);
    if (!mask) {
      push({
        code: 'UNKNOWN_CLIFF',
        severity: 'FAIL',
        ids: [link.id, link.cliffLinkId],
        message: `联表 ${link.id} 引用未知 cliff ${link.cliffLinkId}`,
        fix: 'cliffLinkId 须存在于 cliffLinks[]',
      });
      continue;
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

    if (
      mask.prevEp === undefined ||
      freq.tipEp === undefined ||
      peak.peakEp === undefined ||
      link.ep !== mask.prevEp ||
      link.ep !== freq.tipEp ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, mask.id, freq.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 prev=${mask.prevEp ?? '无'}/tip=${freq.tipEp ?? '无'}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = prevEp = tipEp = peakEp',
      });
      continue;
    }

    linkedCliffs.add(mask.id);
    linkedFreqs.add(freq.id);
    linkedPeaks.add(peak.id);
    aligned += 1;
  }

  for (const mask of cliffLinks) {
    if (mask.prevEp !== undefined && !linkedCliffs.has(mask.id)) {
      push({
        code: 'CLIFF_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [mask.id],
        message: `cliff ${mask.id} prevEp=E${mask.prevEp} 无 cliff×frequency×peak 桥`,
        fix: '为 cliff 窗挂 CliffFrequencyPeakBridge',
      });
    } else if (!linkedCliffs.has(mask.id)) {
      push({
        code: 'PENDING_CLIFF',
        severity: 'WARN',
        ids: [mask.id],
        message: `cliff ${mask.id} 尚未联表到 cliff×frequency×peak 桥`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const f of frequencies) {
    if (f.tipEp !== undefined && !linkedFreqs.has(f.id)) {
      push({
        code: 'TIP_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [f.id],
        message: `frequency ${f.id} tipEp=E${f.tipEp} 无 cliff×frequency×peak 桥`,
        fix: '为 tipping 集挂 CliffFrequencyPeakBridge',
      });
    }
  }
  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedPeaks.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 cliff×frequency×peak 桥`,
        fix: '为峰值集挂 CliffFrequencyPeakBridge',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      cliffLinks: cliffLinks.length,
      frequencies: frequencies.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
