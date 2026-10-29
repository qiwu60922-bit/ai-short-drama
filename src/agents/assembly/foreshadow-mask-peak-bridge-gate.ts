/**
 * V12 · Foreshadow × Mask × Peak Ternary Bridge
 * (伏笔回收 × 伪装揭穿 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《伪人降临》: 高优伏笔 payoff 常与假人设揭穿、对峙峰值同拍.
 *  - foreshadowPeakLink / bondMaskPeak 已各自联表——本 gate 硬对齐同 ep 三元同框.
 *
 * Per link: foreshadowId + maskId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_FORESHADOW / UNKNOWN_MASK / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_FORESHADOW_FAIL / CHILD_MASK_FAIL / CHILD_PEAK_FAIL
 *  EP_NOT_TERNARY — link.ep = payoffEp = revealEp = peakEp
 *  PAYOFF_WITHOUT_BRIDGE / REVEAL_WITHOUT_BRIDGE / PEAK_WITHOUT_BRIDGE
 *  PENDING_FORESHADOW (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
} from './foreshadow-ledger-gate';
import {
  PersonaMaskEntrySchema,
  evaluatePersonaMask,
} from './persona-mask-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const ForeshadowMaskPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  foreshadowId: z.string().min(1),
  maskId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const ForeshadowMaskPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  items: z.array(ForeshadowItemSchema),
  masks: z.array(PersonaMaskEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(ForeshadowMaskPeakBridgeLinkSchema),
});

export type ForeshadowMaskPeakBridgeLedger = z.infer<typeof ForeshadowMaskPeakBridgeLedgerSchema>;

export type ForeshadowMaskPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_FORESHADOW'
    | 'UNKNOWN_MASK'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_FORESHADOW_FAIL'
    | 'CHILD_MASK_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'EP_NOT_TERNARY'
    | 'PAYOFF_WITHOUT_BRIDGE'
    | 'REVEAL_WITHOUT_BRIDGE'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'PENDING_FORESHADOW';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface ForeshadowMaskPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    items: number;
    masks: number;
    peaks: number;
    latestEp: number;
  };
  findings: ForeshadowMaskPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateForeshadowMaskPeakBridge(input: unknown): ForeshadowMaskPeakBridgeReport {
  const parsed = ForeshadowMaskPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, items: 0, masks: 0, peaks: 0, latestEp: 0 },
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

  const { series, latestEp, items, masks, peaks, links } = parsed.data;
  const findings: ForeshadowMaskPeakBridgeFinding[] = [];
  const push = (x: ForeshadowMaskPeakBridgeFinding) => findings.push(x);

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
    push({ code: 'DUP_ID', severity: 'FAIL', ids: [id], message: `联表ID重复：${id}`, fix: '联表 id 须唯一' });
  }

  const byFs = new Map(items.map((i) => [i.id, i]));
  const byMask = new Map(masks.map((m) => [m.id, m]));
  const byPeak = new Map(peaks.map((p) => [p.id, p]));
  const linkedFs = new Set<string>();
  const linkedMasks = new Set<string>();
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
    const fs = byFs.get(link.foreshadowId);
    if (!fs) {
      push({
        code: 'UNKNOWN_FORESHADOW',
        severity: 'FAIL',
        ids: [link.id, link.foreshadowId],
        message: `联表 ${link.id} 引用未知 foreshadow ${link.foreshadowId}`,
        fix: 'foreshadowId 须存在于 items[]',
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

    if (
      fs.payoffEp === undefined ||
      mask.revealEp === undefined ||
      peak.peakEp === undefined ||
      link.ep !== fs.payoffEp ||
      link.ep !== mask.revealEp ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, fs.id, mask.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 payoff=${fs.payoffEp ?? '无'}/reveal=${mask.revealEp ?? '无'}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = payoffEp = revealEp = peakEp',
      });
      continue;
    }

    linkedFs.add(fs.id);
    linkedMasks.add(mask.id);
    linkedPeaks.add(peak.id);
    aligned += 1;
  }

  for (const fs of items) {
    if (fs.payoffEp !== undefined && !linkedFs.has(fs.id)) {
      push({
        code: 'PAYOFF_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [fs.id],
        message: `foreshadow ${fs.id} payoffEp=E${fs.payoffEp} 无 foreshadow×mask×peak 桥`,
        fix: '为回收集挂 ForeshadowMaskPeakBridge',
      });
    }
  }
  for (const mask of masks) {
    if (mask.revealEp !== undefined && !linkedMasks.has(mask.id)) {
      push({
        code: 'REVEAL_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [mask.id],
        message: `mask ${mask.id} revealEp=E${mask.revealEp} 无 foreshadow×mask×peak 桥`,
        fix: '为揭穿集挂 ForeshadowMaskPeakBridge',
      });
    }
  }
  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedPeaks.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 foreshadow×mask×peak 桥`,
        fix: '为峰值集挂 ForeshadowMaskPeakBridge',
      });
    }
  }
  for (const fs of items) {
    if (!linkedFs.has(fs.id)) {
      push({
        code: 'PENDING_FORESHADOW',
        severity: 'WARN',
        ids: [fs.id],
        message: `foreshadow ${fs.id} 尚未联表到 foreshadow×mask×peak 桥`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      items: items.length,
      masks: masks.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
