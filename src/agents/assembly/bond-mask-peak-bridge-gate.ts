/**
 * V12 · Bond × Mask × Peak Ternary Bridge
 * (契约升级/解除 × 伪装揭穿 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《逃婚三年，江少的花心人设崩了》: 契约真情升级常与假人设揭穿、对峙峰值同拍.
 *  - bondMaskLink / bondPeakLink 已各自联表——本 gate 硬对齐同 ep 三元同框.
 *
 * Per link: bondId + maskId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_BOND / UNKNOWN_MASK / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_BOND_FAIL / CHILD_MASK_FAIL / CHILD_PEAK_FAIL
 *  EP_NOT_TERNARY — link.ep = mask.revealEp = peak.peakEp，且 upgrade|dissolve 踩该 ep
 *  REVEAL_WITHOUT_BRIDGE / PEAK_WITHOUT_BRIDGE
 *  PENDING_BOND (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  BondContractEntrySchema,
  evaluateBondContract,
} from './bond-contract-gate';
import {
  PersonaMaskEntrySchema,
  evaluatePersonaMask,
} from './persona-mask-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const BondMaskPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  bondId: z.string().min(1),
  maskId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const BondMaskPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  bonds: z.array(BondContractEntrySchema),
  masks: z.array(PersonaMaskEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(BondMaskPeakBridgeLinkSchema),
});

export type BondMaskPeakBridgeLedger = z.infer<typeof BondMaskPeakBridgeLedgerSchema>;

export type BondMaskPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_BOND'
    | 'UNKNOWN_MASK'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_BOND_FAIL'
    | 'CHILD_MASK_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'EP_NOT_TERNARY'
    | 'REVEAL_WITHOUT_BRIDGE'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'PENDING_BOND';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface BondMaskPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    bonds: number;
    masks: number;
    peaks: number;
    latestEp: number;
  };
  findings: BondMaskPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateBondMaskPeakBridge(input: unknown): BondMaskPeakBridgeReport {
  const parsed = BondMaskPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, bonds: 0, masks: 0, peaks: 0, latestEp: 0 },
      findings: [
        {
          code: 'SCHEMA',
          severity: 'FAIL',
          message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        },
      ],
      gates: GATES,
    };
  }

  const { series, latestEp, bonds, masks, peaks, links } = parsed.data;
  const findings: BondMaskPeakBridgeFinding[] = [];
  const push = (x: BondMaskPeakBridgeFinding) => findings.push(x);

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

  const maskReport = evaluatePersonaMask({ series, latestEp, entries: masks });
  if (maskReport.verdict === 'FAIL') {
    const childFails = maskReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_MASK_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌伪装账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 persona-mask-gate',
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
    push({
      code: 'DUP_ID',
      severity: 'FAIL',
      ids: [id],
      message: `联表ID重复：${id}`,
      fix: '联表 id 须唯一',
    });
  }

  const byBond = new Map(bonds.map((b) => [b.id, b]));
  const byMask = new Map(masks.map((m) => [m.id, m]));
  const byPeak = new Map(peaks.map((p) => [p.id, p]));
  const linkedMasks = new Set<string>();
  const linkedPeaks = new Set<string>();
  const linkedBonds = new Set<string>();
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
    const mask = byMask.get(link.maskId);
    if (!mask) {
      push({
        code: 'UNKNOWN_MASK',
        severity: 'FAIL',
        ids: [link.id, link.maskId],
        message: `联表 ${link.id} 引用未知 mask ${link.maskId}`,
        fix: 'maskId 须存在于 masks[]',
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

    const terminals = [bond.upgradeEp, bond.dissolveEp].filter(
      (e): e is number => typeof e === 'number',
    );
    if (
      mask.revealEp === undefined ||
      peak.peakEp === undefined ||
      link.ep !== mask.revealEp ||
      link.ep !== peak.peakEp ||
      !terminals.includes(link.ep)
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, bond.id, mask.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 reveal=${mask.revealEp ?? '无'}/peak=${peak.peakEp ?? '无'}/terminal=${terminals.join('/') || '无'}`,
        fix: '三元同框：link.ep = revealEp = peakEp，且 upgrade|dissolve 踩该 ep',
      });
      continue;
    }

    linkedMasks.add(mask.id);
    linkedPeaks.add(peak.id);
    linkedBonds.add(bond.id);
    aligned += 1;
  }

  for (const mask of masks) {
    if (mask.revealEp !== undefined && !linkedMasks.has(mask.id)) {
      push({
        code: 'REVEAL_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [mask.id],
        message: `mask ${mask.id} revealEp=E${mask.revealEp} 无 bond×mask×peak 桥`,
        fix: '为揭穿集挂 BondMaskPeakBridge',
      });
    }
  }
  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedPeaks.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 bond×mask×peak 桥`,
        fix: '为峰值集挂 BondMaskPeakBridge',
      });
    }
  }
  for (const b of bonds) {
    if (!linkedBonds.has(b.id)) {
      push({
        code: 'PENDING_BOND',
        severity: 'WARN',
        ids: [b.id],
        message: `bond ${b.id} 尚未联表到 bond×mask×peak 桥`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      bonds: bonds.length,
      masks: masks.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
