/**
 * V12 · Cliff × Bond × Peak Ternary Bridge
 * (跨集悬念叠钩 × 契约升级/解除 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《逃婚三年》: 契约真心升级常卡在 cliff 窗 prevEp，并踩对峙峰值同框.
 *  - cliffBondLink / cliffPeakLink 已各自联表——本 gate 硬对齐同 ep 三元同框.
 *
 * Per link: cliffLinkId + bondId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_BOND / UNKNOWN_CLIFF / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_BOND_FAIL / CHILD_CASCADE_FAIL / CHILD_PEAK_FAIL
 *  EP_NOT_TERNARY — link.ep = upgradeEp = cliff.prevEp = peakEp
 *  TERMINAL_WITHOUT_BRIDGE / CLIFF_WITHOUT_BRIDGE / PEAK_WITHOUT_BRIDGE
 *  PENDING_BOND (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  CliffCascadeLinkEntrySchema,
  evaluateCliffCascadeLink,
} from './cliff-cascade-link-gate';
import {
  BondContractEntrySchema,
  evaluateBondContract,
} from './bond-contract-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const CliffBondPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  bondId: z.string().min(1),
  cliffLinkId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const CliffBondPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  bonds: z.array(BondContractEntrySchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(CliffBondPeakBridgeLinkSchema),
});

export type CliffBondPeakBridgeLedger = z.infer<typeof CliffBondPeakBridgeLedgerSchema>;

export type CliffBondPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_BOND'
    | 'UNKNOWN_CLIFF'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_BOND_FAIL'
    | 'CHILD_CASCADE_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'EP_NOT_TERNARY'
    | 'TERMINAL_WITHOUT_BRIDGE'
    | 'CLIFF_WITHOUT_BRIDGE'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'PENDING_BOND';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface CliffBondPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    bonds: number;
    cliffLinks: number;
    peaks: number;
    latestEp: number;
  };
  findings: CliffBondPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateCliffBondPeakBridge(input: unknown): CliffBondPeakBridgeReport {
  const parsed = CliffBondPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, bonds: 0, cliffLinks: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, bonds, cliffLinks, peaks, links } = parsed.data;
  const findings: CliffBondPeakBridgeFinding[] = [];
  const push = (x: CliffBondPeakBridgeFinding) => findings.push(x);

  const maskReport = evaluateBondContract({ series, latestEp, entries: bonds });
  if (maskReport.verdict === 'FAIL') {
    const childFails = maskReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_BOND_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌契约账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 bond-contract-gate',
    });
  }

  const cascadeReport = evaluateCliffCascadeLink({ series, latestEp, links: cliffLinks });
  if (cascadeReport.verdict === 'FAIL') {
    const childFails = cascadeReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_CASCADE_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌 cliff-cascade 账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 cliff-cascade-link-gate',
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

  const byBond = new Map(bonds.map((m) => [m.id, m]));
  const byCliff = new Map(cliffLinks.map((c) => [c.id, c]));
  const byPeak = new Map(peaks.map((p) => [p.id, p]));
  const linkedBonds = new Set<string>();
  const linkedCliffs = new Set<string>();
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
    const mask = byBond.get(link.bondId);
    if (!mask) {
      push({
        code: 'UNKNOWN_BOND',
        severity: 'FAIL',
        ids: [link.id, link.bondId],
        message: `联表 ${link.id} 引用未知 bond ${link.bondId}`,
        fix: 'bondId 须存在于 bonds[]',
      });
      continue;
    }
    const cliff = byCliff.get(link.cliffLinkId);
    if (!cliff) {
      push({
        code: 'UNKNOWN_CLIFF',
        severity: 'FAIL',
        ids: [link.id, link.cliffLinkId],
        message: `联表 ${link.id} 引用未知 cliff ${link.cliffLinkId}`,
        fix: 'cliffLinkId 须存在于 cliffLinks[]',
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
      mask.upgradeEp === undefined ||
      peak.peakEp === undefined ||
      link.ep !== mask.upgradeEp ||
      link.ep !== cliff.prevEp ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, mask.id, cliff.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 upgrade=${mask.upgradeEp ?? '无'}/prev=${cliff.prevEp}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = upgradeEp = cliff.prevEp = peakEp',
      });
      continue;
    }

    linkedBonds.add(mask.id);
    linkedCliffs.add(cliff.id);
    linkedPeaks.add(peak.id);
    aligned += 1;
  }

  for (const mask of bonds) {
    if (mask.upgradeEp !== undefined && !linkedBonds.has(mask.id)) {
      push({
        code: 'TERMINAL_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [mask.id],
        message: `bond ${mask.id} upgradeEp=E${mask.upgradeEp} 无 cliff×bond×peak 桥`,
        fix: '为契约终端集挂 CliffBondPeakBridge',
      });
    } else if (!linkedBonds.has(mask.id)) {
      push({
        code: 'PENDING_BOND',
        severity: 'WARN',
        ids: [mask.id],
        message: `bond ${mask.id} 尚未联表到 cliff×bond×peak 桥`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const c of cliffLinks) {
    if (!linkedCliffs.has(c.id)) {
      push({
        code: 'CLIFF_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [c.id],
        message: `cliff ${c.id} 无 cliff×bond×peak 桥`,
        fix: '在 links[] 挂 bondId↔cliffLinkId↔peakId',
      });
    }
  }
  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedPeaks.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 cliff×bond×peak 桥`,
        fix: '为峰值集挂 CliffBondPeakBridge',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      bonds: bonds.length,
      cliffLinks: cliffLinks.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
