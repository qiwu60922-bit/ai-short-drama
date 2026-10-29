/**
 * V12 · Reveal × Mask × Peak Ternary Bridge
 * (伪装揭穿 × 伪装层 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 揭穿主线常与并行伪装层、对峙峰值同集硬对齐.
 *  - 与 revealQualityPeakBridge / maskQualityPeakBridge 互补：本 gate 以 reveal 为主键联 mask×peak.
 *
 * Per link: revealId + maskId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_REVEAL / UNKNOWN_MASK / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_REVEAL_FAIL / CHILD_MASK_FAIL / CHILD_PEAK_FAIL
 *  EP_NOT_TERNARY — link.ep = revealEp = mask.revealEp = peakEp
 *  REVEAL_WITHOUT_BRIDGE / MASK_WITHOUT_BRIDGE / PEAK_WITHOUT_BRIDGE
 *  PENDING_REVEAL / PENDING_MASK (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  PersonaMaskEntrySchema,
  evaluatePersonaMask,
} from './persona-mask-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const RevealMaskPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  revealId: z.string().min(1),
  maskId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const RevealMaskPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  reveals: z.array(PersonaMaskEntrySchema),
  masks: z.array(PersonaMaskEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(RevealMaskPeakBridgeLinkSchema),
});

export type RevealMaskPeakBridgeLedger = z.infer<typeof RevealMaskPeakBridgeLedgerSchema>;

export type RevealMaskPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_REVEAL'
    | 'UNKNOWN_MASK'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_REVEAL_FAIL'
    | 'CHILD_MASK_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'EP_NOT_TERNARY'
    | 'REVEAL_WITHOUT_BRIDGE'
    | 'MASK_WITHOUT_BRIDGE'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'PENDING_REVEAL'
    | 'PENDING_MASK';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface RevealMaskPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    reveals: number;
    masks: number;
    peaks: number;
    latestEp: number;
  };
  findings: RevealMaskPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateRevealMaskPeakBridge(input: unknown): RevealMaskPeakBridgeReport {
  const parsed = RevealMaskPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, reveals: 0, masks: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, reveals, masks, peaks, links } = parsed.data;
  const findings: RevealMaskPeakBridgeFinding[] = [];
  const push = (x: RevealMaskPeakBridgeFinding) => findings.push(x);

  const rReport = evaluatePersonaMask({ series, latestEp, entries: reveals });
  if (rReport.verdict === 'FAIL') {
    const childFails = rReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_REVEAL_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌揭穿账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 persona-mask-gate (reveals)',
    });
  }

  const mReport = evaluatePersonaMask({ series, latestEp, entries: masks });
  if (mReport.verdict === 'FAIL') {
    const childFails = mReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_MASK_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌伪装账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 persona-mask-gate (masks)',
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

  const byR = new Map(reveals.map((a) => [a.id, a]));
  const byM = new Map(masks.map((a) => [a.id, a]));
  const byP = new Map(peaks.map((p) => [p.id, p]));
  const linkedR = new Set<string>();
  const linkedM = new Set<string>();
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
    const reveal = byR.get(link.revealId);
    if (!reveal) {
      push({
        code: 'UNKNOWN_REVEAL',
        severity: 'FAIL',
        ids: [link.id, link.revealId],
        message: `联表 ${link.id} 引用未知 reveal ${link.revealId}`,
        fix: 'revealId 须存在于 reveals[]',
      });
      continue;
    }
    const mask = byM.get(link.maskId);
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
      reveal.revealEp === undefined ||
      mask.revealEp === undefined ||
      peak.peakEp === undefined ||
      link.ep !== reveal.revealEp ||
      link.ep !== mask.revealEp ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, reveal.id, mask.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 reveal=${reveal.revealEp ?? '无'}/mask=${mask.revealEp ?? '无'}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = revealEp = mask.revealEp = peakEp',
      });
      continue;
    }

    linkedR.add(reveal.id);
    linkedM.add(mask.id);
    linkedP.add(peak.id);
    aligned += 1;
  }

  for (const it of reveals) {
    if (it.revealEp !== undefined && !linkedR.has(it.id)) {
      push({
        code: 'REVEAL_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [it.id],
        message: `reveal ${it.id} revealEp=E${it.revealEp} 无 reveal×mask×peak 桥`,
        fix: '为揭穿集挂 RevealMaskPeakBridge',
      });
    } else if (!linkedR.has(it.id)) {
      push({
        code: 'PENDING_REVEAL',
        severity: 'WARN',
        ids: [it.id],
        message: `reveal ${it.id} 尚未联表到 reveal×mask×peak 桥`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const it of masks) {
    if (it.revealEp !== undefined && !linkedM.has(it.id)) {
      push({
        code: 'MASK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [it.id],
        message: `mask ${it.id} revealEp=E${it.revealEp} 无 reveal×mask×peak 桥`,
        fix: '为伪装揭穿集挂 RevealMaskPeakBridge',
      });
    } else if (!linkedM.has(it.id)) {
      push({
        code: 'PENDING_MASK',
        severity: 'WARN',
        ids: [it.id],
        message: `mask ${it.id} 尚未联表到 reveal×mask×peak 桥`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedP.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 reveal×mask×peak 桥`,
        fix: '为峰值集挂 RevealMaskPeakBridge',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      reveals: reveals.length,
      masks: masks.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
