/**
 * V12 · Mask × Cliff × Peak Ternary Bridge
 * (伪装揭穿 × 跨集悬念叠钩 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《伪人降临》: 揭穿常卡在 cliff 窗 prevEp，并踩对峙峰值同框.
 *  - maskCliffLink / maskPeakLink 已各自联表——本 gate 硬对齐同 ep 三元同框.
 *
 * Per link: maskId + cliffLinkId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_MASK / UNKNOWN_CLIFF / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_MASK_FAIL / CHILD_CASCADE_FAIL / CHILD_PEAK_FAIL
 *  EP_NOT_TERNARY — link.ep = revealEp = cliff.prevEp = peakEp
 *  REVEAL_WITHOUT_BRIDGE / CLIFF_WITHOUT_BRIDGE / PEAK_WITHOUT_BRIDGE
 *  PENDING_MASK (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  CliffCascadeLinkEntrySchema,
  evaluateCliffCascadeLink,
} from './cliff-cascade-link-gate';
import {
  PersonaMaskEntrySchema,
  evaluatePersonaMask,
} from './persona-mask-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const MaskCliffPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  maskId: z.string().min(1),
  cliffLinkId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const MaskCliffPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  masks: z.array(PersonaMaskEntrySchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(MaskCliffPeakBridgeLinkSchema),
});

export type MaskCliffPeakBridgeLedger = z.infer<typeof MaskCliffPeakBridgeLedgerSchema>;

export type MaskCliffPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_MASK'
    | 'UNKNOWN_CLIFF'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_MASK_FAIL'
    | 'CHILD_CASCADE_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'EP_NOT_TERNARY'
    | 'REVEAL_WITHOUT_BRIDGE'
    | 'CLIFF_WITHOUT_BRIDGE'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'PENDING_MASK';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface MaskCliffPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    masks: number;
    cliffLinks: number;
    peaks: number;
    latestEp: number;
  };
  findings: MaskCliffPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateMaskCliffPeakBridge(input: unknown): MaskCliffPeakBridgeReport {
  const parsed = MaskCliffPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, masks: 0, cliffLinks: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, masks, cliffLinks, peaks, links } = parsed.data;
  const findings: MaskCliffPeakBridgeFinding[] = [];
  const push = (x: MaskCliffPeakBridgeFinding) => findings.push(x);

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

  const byMask = new Map(masks.map((m) => [m.id, m]));
  const byCliff = new Map(cliffLinks.map((c) => [c.id, c]));
  const byPeak = new Map(peaks.map((p) => [p.id, p]));
  const linkedMasks = new Set<string>();
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
      mask.revealEp === undefined ||
      peak.peakEp === undefined ||
      link.ep !== mask.revealEp ||
      link.ep !== cliff.prevEp ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, mask.id, cliff.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 reveal=${mask.revealEp ?? '无'}/prev=${cliff.prevEp}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = revealEp = cliff.prevEp = peakEp',
      });
      continue;
    }

    linkedMasks.add(mask.id);
    linkedCliffs.add(cliff.id);
    linkedPeaks.add(peak.id);
    aligned += 1;
  }

  for (const mask of masks) {
    if (mask.revealEp !== undefined && !linkedMasks.has(mask.id)) {
      push({
        code: 'REVEAL_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [mask.id],
        message: `mask ${mask.id} revealEp=E${mask.revealEp} 无 mask×cliff×peak 桥`,
        fix: '为揭穿集挂 MaskCliffPeakBridge',
      });
    } else if (!linkedMasks.has(mask.id)) {
      push({
        code: 'PENDING_MASK',
        severity: 'WARN',
        ids: [mask.id],
        message: `mask ${mask.id} 尚未联表到 mask×cliff×peak 桥`,
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
        message: `cliff ${c.id} 无 mask×cliff×peak 桥`,
        fix: '在 links[] 挂 maskId↔cliffLinkId↔peakId',
      });
    }
  }
  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedPeaks.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 mask×cliff×peak 桥`,
        fix: '为峰值集挂 MaskCliffPeakBridge',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      masks: masks.length,
      cliffLinks: cliffLinks.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
