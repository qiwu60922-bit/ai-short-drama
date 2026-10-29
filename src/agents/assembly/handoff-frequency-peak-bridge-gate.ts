/**
 * V12 · Handoff × Frequency × Peak Ternary Bridge
 * (集间承接 × 第N次 tipping × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《轻烟染日暮》: 第N次 tipping 常踩对峙峰值，并卡在悬念上一集交给下集.
 *  - handoffFrequencyLink / handoffPeakLink 已各自联表——本 gate 硬对齐同 ep 三元同框.
 *
 * Per link: frequencyId + handoffId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_FREQUENCY / UNKNOWN_HANDOFF / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_FREQUENCY_FAIL / CHILD_HANDOFF_FAIL / CHILD_PEAK_FAIL
 *  EP_NOT_TERNARY — link.ep = tipEp = handoff.prevEp = peakEp
 *  TIP_WITHOUT_BRIDGE / HANDOFF_WITHOUT_BRIDGE / PEAK_WITHOUT_BRIDGE
 *  PENDING_FREQUENCY (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import {
  FrequencyTippingEntrySchema,
  evaluateFrequencyTipping,
} from './frequency-tipping-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';
import { evaluateCliffhangerHandoff } from './cliffhanger-handoff-gate';

const Ep = z.number().int().positive();

export const HandoffFrequencyPeakHandoffEntrySchema = z.object({
  id: z.string().min(1),
  prevEp: Ep,
  nextEp: Ep,
  prev: ShotSpecDocSchema,
  next: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const HandoffFrequencyPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  frequencyId: z.string().min(1),
  handoffId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const HandoffFrequencyPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  frequencies: z.array(FrequencyTippingEntrySchema),
  handoffs: z.array(HandoffFrequencyPeakHandoffEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(HandoffFrequencyPeakBridgeLinkSchema),
});

export type HandoffFrequencyPeakBridgeLedger = z.infer<typeof HandoffFrequencyPeakBridgeLedgerSchema>;

export type HandoffFrequencyPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_FREQUENCY'
    | 'UNKNOWN_HANDOFF'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_FREQUENCY_FAIL'
    | 'CHILD_HANDOFF_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'EP_NOT_TERNARY'
    | 'TIP_WITHOUT_BRIDGE'
    | 'HANDOFF_WITHOUT_BRIDGE'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'PENDING_FREQUENCY';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface HandoffFrequencyPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    frequencies: number;
    handoffs: number;
    peaks: number;
    latestEp: number;
  };
  findings: HandoffFrequencyPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateHandoffFrequencyPeakBridge(input: unknown): HandoffFrequencyPeakBridgeReport {
  const parsed = HandoffFrequencyPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, frequencies: 0, handoffs: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, frequencies, handoffs, peaks, links } = parsed.data;
  const findings: HandoffFrequencyPeakBridgeFinding[] = [];
  const push = (x: HandoffFrequencyPeakBridgeFinding) => findings.push(x);

  const vestReport = evaluateFrequencyTipping({ series, latestEp, entries: frequencies });
  if (vestReport.verdict === 'FAIL') {
    const childFails = vestReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_FREQUENCY_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌频率账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 frequency-tipping-gate',
    });
  }

  for (const h of handoffs) {
    const r = evaluateCliffhangerHandoff(h.prev, h.next);
    if (r.verdict === 'FAIL') {
      const codes = r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
      push({
        code: 'CHILD_HANDOFF_FAIL',
        severity: 'FAIL',
        ids: [h.id],
        message: `handoff ${h.id} FAIL：${codes.join(',') || 'unknown'}`,
        fix: '先修 cliffhanger-handoff-gate',
      });
    }
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

  const byFrequency = new Map(frequencies.map((v) => [v.id, v]));
  const byH = new Map(handoffs.map((h) => [h.id, h]));
  const byPeak = new Map(peaks.map((p) => [p.id, p]));
  const linkedFrequencies = new Set<string>();
  const linkedH = new Set<string>();
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
    const vest = byFrequency.get(link.frequencyId);
    if (!vest) {
      push({
        code: 'UNKNOWN_FREQUENCY',
        severity: 'FAIL',
        ids: [link.id, link.frequencyId],
        message: `联表 ${link.id} 引用未知 frequency ${link.frequencyId}`,
        fix: 'frequencyId 须存在于 frequencies[]',
      });
      continue;
    }
    const handoff = byH.get(link.handoffId);
    if (!handoff) {
      push({
        code: 'UNKNOWN_HANDOFF',
        severity: 'FAIL',
        ids: [link.id, link.handoffId],
        message: `联表 ${link.id} 引用未知 handoff ${link.handoffId}`,
        fix: 'handoffId 须存在于 handoffs[]',
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
      vest.tipEp === undefined ||
      peak.peakEp === undefined ||
      link.ep !== vest.tipEp ||
      link.ep !== handoff.prevEp ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, vest.id, handoff.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 tip=${vest.tipEp ?? '无'}/prev=${handoff.prevEp}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = tipEp = handoff.prevEp = peakEp',
      });
      continue;
    }

    linkedFrequencies.add(vest.id);
    linkedH.add(handoff.id);
    linkedPeaks.add(peak.id);
    aligned += 1;
  }

  for (const vest of frequencies) {
    if (vest.tipEp !== undefined && !linkedFrequencies.has(vest.id)) {
      push({
        code: 'TIP_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [vest.id],
        message: `frequency ${vest.id} tipEp=E${vest.tipEp} 无 handoff×frequency×peak 桥`,
        fix: '为 tipping 集挂 HandoffFrequencyPeakBridge',
      });
    } else if (!linkedFrequencies.has(vest.id)) {
      push({
        code: 'PENDING_FREQUENCY',
        severity: 'WARN',
        ids: [vest.id],
        message: `frequency ${vest.id} 尚未联表到 handoff×frequency×peak 桥`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const h of handoffs) {
    if (!linkedH.has(h.id)) {
      push({
        code: 'HANDOFF_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [h.id],
        message: `handoff ${h.id} 无 handoff×frequency×peak 桥`,
        fix: '在 links[] 挂 frequencyId↔handoffId↔peakId',
      });
    }
  }
  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedPeaks.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 handoff×frequency×peak 桥`,
        fix: '为峰值集挂 HandoffFrequencyPeakBridge',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      frequencies: frequencies.length,
      handoffs: handoffs.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
