/**
 * V12 · Foreshadow × Bond × Peak Ternary Bridge
 * (伏笔兑现 × 契约升级/解除 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《帐中香》/《逃婚三年》: S/A 伏笔 payoff 常与契约真心升级、对峙峰值同拍.
 *  - foreshadowPeakLink / bondPeakLink 已各自联表——本 gate 硬对齐同 ep 三元同框.
 *
 * Per link: foreshadowId + bondId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_FORESHADOW / UNKNOWN_BOND / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_FORESHADOW_FAIL / CHILD_BOND_FAIL / CHILD_PEAK_FAIL
 *  EP_NOT_TERNARY — link.ep = payoffEp = upgrade|dissolve = peakEp
 *  PEAK_WITHOUT_BRIDGE / TERMINAL_WITHOUT_BRIDGE / PAYOFF_WITHOUT_BRIDGE
 *  PENDING_BOND (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
} from './foreshadow-ledger-gate';
import {
  BondContractEntrySchema,
  evaluateBondContract,
} from './bond-contract-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const ForeshadowBondPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  foreshadowId: z.string().min(1),
  bondId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const ForeshadowBondPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  items: z.array(ForeshadowItemSchema),
  bonds: z.array(BondContractEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(ForeshadowBondPeakBridgeLinkSchema),
});

export type ForeshadowBondPeakBridgeLedger = z.infer<typeof ForeshadowBondPeakBridgeLedgerSchema>;

export type ForeshadowBondPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_FORESHADOW'
    | 'UNKNOWN_BOND'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_FORESHADOW_FAIL'
    | 'CHILD_BOND_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'EP_NOT_TERNARY'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'TERMINAL_WITHOUT_BRIDGE'
    | 'PAYOFF_WITHOUT_BRIDGE'
    | 'PENDING_BOND';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface ForeshadowBondPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    items: number;
    bonds: number;
    peaks: number;
    latestEp: number;
  };
  findings: ForeshadowBondPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

function bondTerminalEp(b: { upgradeEp?: number; dissolveEp?: number }): number | undefined {
  return b.upgradeEp ?? b.dissolveEp;
}

export function evaluateForeshadowBondPeakBridge(input: unknown): ForeshadowBondPeakBridgeReport {
  const parsed = ForeshadowBondPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, items: 0, bonds: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, items, bonds, peaks, links } = parsed.data;
  const findings: ForeshadowBondPeakBridgeFinding[] = [];
  const push = (x: ForeshadowBondPeakBridgeFinding) => findings.push(x);

  const fsReport = evaluateForeshadowLedger({ series, latestEp, items });
  if (fsReport.verdict === 'FAIL') {
    const childFails = fsReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_FORESHADOW_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌伏笔账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 foreshadow-ledger-gate',
    });
  }

  const bReport = evaluateBondContract({ series, latestEp, entries: bonds });
  if (bReport.verdict === 'FAIL') {
    const childFails = bReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_BOND_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌契约账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 bond-contract-gate',
    });
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

  const byFs = new Map(items.map((i) => [i.id, i]));
  const byB = new Map(bonds.map((b) => [b.id, b]));
  const byP = new Map(peaks.map((p) => [p.id, p]));
  const linkedP = new Set<string>();
  const linkedB = new Set<string>();
  const linkedFs = new Set<string>();
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
    const item = byFs.get(link.foreshadowId);
    if (!item) {
      push({
        code: 'UNKNOWN_FORESHADOW',
        severity: 'FAIL',
        ids: [link.id, link.foreshadowId],
        message: `联表 ${link.id} 引用未知 foreshadow ${link.foreshadowId}`,
        fix: 'foreshadowId 须存在于 items[]',
      });
      continue;
    }
    const bond = byB.get(link.bondId);
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

    const terminal = bondTerminalEp(bond);
    if (
      item.payoffEp === undefined ||
      terminal === undefined ||
      peak.peakEp === undefined ||
      link.ep !== item.payoffEp ||
      link.ep !== terminal ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, item.id, bond.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 payoff=${item.payoffEp ?? '无'}/terminal=${terminal ?? '无'}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = foreshadow.payoffEp = upgrade|dissolve = peakEp',
      });
      continue;
    }

    linkedP.add(peak.id);
    linkedB.add(bond.id);
    linkedFs.add(item.id);
    aligned += 1;
  }

  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedP.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 foreshadow×bond×peak 桥`,
        fix: '为峰值集挂 ForeshadowBondPeakBridge',
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
        message: `bond ${bond.id} terminal=E${terminal} 无 foreshadow×bond×peak 桥`,
        fix: '为契约终局集挂 ForeshadowBondPeakBridge',
      });
    } else if (!linkedB.has(bond.id)) {
      push({
        code: 'PENDING_BOND',
        severity: 'WARN',
        ids: [bond.id],
        message: `bond ${bond.id} 尚未联表到 foreshadow×bond×peak 桥`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const item of items) {
    if (item.payoffEp !== undefined && !linkedFs.has(item.id)) {
      push({
        code: 'PAYOFF_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [item.id],
        message: `foreshadow ${item.id} payoffEp=E${item.payoffEp} 无 foreshadow×bond×peak 桥`,
        fix: '为伏笔兑现集挂 ForeshadowBondPeakBridge',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      items: items.length,
      bonds: bonds.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
