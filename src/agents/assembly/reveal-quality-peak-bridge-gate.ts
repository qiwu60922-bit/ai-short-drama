/**
 * V12 · Reveal × Quality × Peak Ternary Bridge
 * (伪装揭穿 × 表演门 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - mask reveal 当集须过表演门并踩对峙峰值.
 *  - 与 qualityMaskPeakBridge 互补：本 gate 以 reveal 为主键命名.
 *
 * Per link: revealId + peakId + ep + qualityLeap.
 *  SCHEMA / DUP_ID / UNKNOWN_REVEAL / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_REVEAL_FAIL / CHILD_PEAK_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_TERNARY — link.ep = revealEp = peakEp
 *  REVEAL_WITHOUT_BRIDGE / PEAK_WITHOUT_BRIDGE
 *  PENDING_REVEAL (WARN) / LOW_INTENSITY_AT_TERNARY (WARN)
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
import {
  QualityLeapDocSchema,
  evaluateQualityLeap,
} from './quality-leap-gate';

const Ep = z.number().int().positive();

export const RevealQualityPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  revealId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const RevealQualityPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minTernaryIntense: z.number().int().min(1).max(5).optional(),
  reveals: z.array(PersonaMaskEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(RevealQualityPeakBridgeLinkSchema),
});

export type RevealQualityPeakBridgeLedger = z.infer<typeof RevealQualityPeakBridgeLedgerSchema>;

export type RevealQualityPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_REVEAL'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_REVEAL_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_TERNARY'
    | 'REVEAL_WITHOUT_BRIDGE'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'PENDING_REVEAL'
    | 'LOW_INTENSITY_AT_TERNARY';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface RevealQualityPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    reveals: number;
    peaks: number;
    latestEp: number;
  };
  findings: RevealQualityPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

function maxIntensity(ql: {
  shots?: Array<{ performance?: { intensity?: number } | null }>;
}): number {
  let m = 0;
  for (const s of ql.shots ?? []) {
    const i = s.performance?.intensity;
    if (typeof i === 'number' && i > m) m = i;
  }
  return m;
}

export function evaluateRevealQualityPeakBridge(input: unknown): RevealQualityPeakBridgeReport {
  const parsed = RevealQualityPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, reveals: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, reveals, peaks, links, minTernaryIntense = 4 } = parsed.data;
  const findings: RevealQualityPeakBridgeFinding[] = [];
  const push = (x: RevealQualityPeakBridgeFinding) => findings.push(x);

  const rReport = evaluatePersonaMask({ series, latestEp, entries: reveals });
  if (rReport.verdict === 'FAIL') {
    const childFails = rReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_REVEAL_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌揭穿账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 persona-mask-gate',
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

  const byR = new Map(reveals.map((r) => [r.id, r]));
  const byP = new Map(peaks.map((p) => [p.id, p]));
  const linkedR = new Set<string>();
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

    const qReport = evaluateQualityLeap(link.qualityLeap);
    if (qReport.verdict === 'FAIL') {
      const childFails = qReport.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_QUALITY_FAIL',
        severity: 'FAIL',
        ids: [link.id, ...(childFails.map((f) => f.shotId).filter(Boolean) as string[])],
        message: `联表 ${link.id} qualityLeap FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 quality-leap-gate',
      });
      continue;
    }

    if (
      reveal.revealEp === undefined ||
      peak.peakEp === undefined ||
      link.ep !== reveal.revealEp ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, reveal.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 reveal=${reveal.revealEp ?? '无'}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = revealEp = peakEp',
      });
      continue;
    }

    const intense = maxIntensity(link.qualityLeap);
    if (intense < minTernaryIntense) {
      push({
        code: 'LOW_INTENSITY_AT_TERNARY',
        severity: 'WARN',
        ids: [link.id, reveal.id, peak.id],
        message: `${link.id}: max intensity=${intense} < minTernaryIntense=${minTernaryIntense}`,
        fix: '提高表演 intensity 或下调 minTernaryIntense',
      });
    }

    linkedR.add(reveal.id);
    linkedP.add(peak.id);
    aligned += 1;
  }

  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedP.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 reveal×quality×peak 桥`,
        fix: '为峰值集挂 RevealQualityPeakBridge',
      });
    }
  }
  for (const reveal of reveals) {
    if (reveal.revealEp !== undefined && !linkedR.has(reveal.id)) {
      push({
        code: 'REVEAL_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [reveal.id],
        message: `reveal ${reveal.id} revealEp=E${reveal.revealEp} 无 reveal×quality×peak 桥`,
        fix: '在 links[] 挂 revealId + peakId + qualityLeap',
      });
    } else if (!linkedR.has(reveal.id)) {
      push({
        code: 'PENDING_REVEAL',
        severity: 'WARN',
        ids: [reveal.id],
        message: `reveal ${reveal.id} 尚未联表到 quality×peak`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      reveals: reveals.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
