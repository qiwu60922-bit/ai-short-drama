/**
 * V12 · Frequency × Bond × Peak Ternary Bridge
 * (第N次 tipping × 契约升级/解除 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《警报！叶楚出狱》: tip 升级常与对峙峰值同框.
 *  - frequencyBondLink / frequencyPeakLink 已各自联表——本 gate 硬对齐同 ep 三元同框.
 *
 * Per link: frequencyId + bondId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_FREQUENCY / UNKNOWN_BOND / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_FREQUENCY_FAIL / CHILD_BOND_FAIL / CHILD_PEAK_FAIL
 *  EP_NOT_TERNARY — link.ep = tipEp = upgrade|dissolve = peakEp
 *  TIP_WITHOUT_BRIDGE / TERMINAL_WITHOUT_BRIDGE / PEAK_WITHOUT_BRIDGE
 *  PENDING_FREQUENCY (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  BondContractEntrySchema,
  evaluateBondContract,
} from './bond-contract-gate';
import {
  FrequencyTippingEntrySchema,
  evaluateFrequencyTipping,
} from './frequency-tipping-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const FrequencyBondPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  frequencyId: z.string().min(1),
  bondId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const FrequencyBondPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  frequencies: z.array(FrequencyTippingEntrySchema),
  bonds: z.array(BondContractEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(FrequencyBondPeakBridgeLinkSchema),
});

export type FrequencyBondPeakBridgeLedger = z.infer<typeof FrequencyBondPeakBridgeLedgerSchema>;

export type FrequencyBondPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_FREQUENCY'
    | 'UNKNOWN_BOND'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_FREQUENCY_FAIL'
    | 'CHILD_BOND_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'EP_NOT_TERNARY'
    | 'TIP_WITHOUT_BRIDGE'
    | 'TERMINAL_WITHOUT_BRIDGE'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'PENDING_FREQUENCY';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface FrequencyBondPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    frequencies: number;
    bonds: number;
    peaks: number;
    latestEp: number;
  };
  findings: FrequencyBondPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

function bondTerminalEp(b: { upgradeEp?: number; dissolveEp?: number }): number | undefined {
  return b.upgradeEp ?? b.dissolveEp;
}

export function evaluateFrequencyBondPeakBridge(input: unknown): FrequencyBondPeakBridgeReport {
  const parsed = FrequencyBondPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, frequencies: 0, bonds: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, frequencies, bonds, peaks, links } = parsed.data;
  const findings: FrequencyBondPeakBridgeFinding[] = [];
  const push = (x: FrequencyBondPeakBridgeFinding) => findings.push(x);

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

  const bondReport = evaluateBondContract({ series, latestEp, entries: bonds });
  if (bondReport.verdict === 'FAIL') {
    const childFails = bondReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_BOND_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌契约账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 bond-contract-gate',
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
  const byBond = new Map(bonds.map((b) => [b.id, b]));
  const byPeak = new Map(peaks.map((p) => [p.id, p]));
  const linkedF = new Set<string>();
  const linkedB = new Set<string>();
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
    const bond = byBond.get(link.bondId);
    if (!bond) {
      push({
        code: 'UNKNOWN_BOND',
        severity: 'FAIL',
        ids: [link.id, link.bondId],
        message: `联表 ${link.id} 引用未知 bond ${link.bondId}`,
        fix: 'bondId 须存在于 bonds[]',
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

    const terminal = bondTerminalEp(bond);
    const tipEp = freq.tipEp;
    if (
      tipEp === undefined ||
      terminal === undefined ||
      peak.peakEp === undefined ||
      link.ep !== tipEp ||
      link.ep !== terminal ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, freq.id, bond.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 tip=${tipEp ?? '无'}/terminal=${terminal ?? '无'}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = tipEp = upgrade|dissolve = peakEp',
      });
      continue;
    }

    linkedF.add(freq.id);
    linkedB.add(bond.id);
    linkedP.add(peak.id);
    aligned += 1;
  }

  for (const freq of frequencies) {
    if (freq.tipEp !== undefined && !linkedF.has(freq.id)) {
      push({
        code: 'TIP_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [freq.id],
        message: `frequency ${freq.id} tipEp=E${freq.tipEp} 无 frequency×bond×peak 桥`,
        fix: '为 tip 集挂 FrequencyBondPeakBridge',
      });
    } else if (!linkedF.has(freq.id)) {
      push({
        code: 'PENDING_FREQUENCY',
        severity: 'WARN',
        ids: [freq.id],
        message: `frequency ${freq.id} 尚未联表到 frequency×bond×peak 桥`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const bond of bonds) {
    const terminal = bondTerminalEp(bond);
    if (terminal !== undefined && !linkedB.has(bond.id)) {
      push({
        code: 'TERMINAL_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [bond.id],
        message: `bond ${bond.id} terminal=E${terminal} 无 frequency×bond×peak 桥`,
        fix: '为契约终局集挂 FrequencyBondPeakBridge',
      });
    }
  }
  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedP.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 frequency×bond×peak 桥`,
        fix: '为峰值集挂 FrequencyBondPeakBridge',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      frequencies: frequencies.length,
      bonds: bonds.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
