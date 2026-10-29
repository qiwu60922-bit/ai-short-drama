/**
 * V12 · Quality-Leap × Peak Link Gate (表演门 × 羞辱峰值 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 峰值当集镜须过表演/情绪门，不能空壳对峙.
 *  - 与 qualityRevealLink 已占用互补：本 gate 以 quality×peak 联表.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_PEAK_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_PEAK — link.ep 须等于 peakEp
 *  PEAK_WITHOUT_QUALITY — 已 peak 无联表 quality
 *  PENDING_PEAK (WARN)
 *  LOW_INTENSITY_AT_PEAK (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';
import {
  QualityLeapDocSchema,
  evaluateQualityLeap,
} from './quality-leap-gate';

const Ep = z.number().int().positive();

export const QualityPeakLinkEntrySchema = z.object({
  id: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const QualityPeakLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  /** Intensity floor for LOW_INTENSITY_AT_PEAK WARN. Default 4. */
  minPeakIntense: z.number().int().min(1).max(5).optional(),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(QualityPeakLinkEntrySchema),
});

export type QualityPeakLinkLedger = z.infer<typeof QualityPeakLinkLedgerSchema>;

export type QualityPeakLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_PEAK_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_PEAK'
    | 'PEAK_WITHOUT_QUALITY'
    | 'PENDING_PEAK'
    | 'LOW_INTENSITY_AT_PEAK';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface QualityPeakLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    peaks: number;
    latestEp: number;
  };
  findings: QualityPeakLinkFinding[];
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

export function evaluateQualityPeakLink(input: unknown): QualityPeakLinkReport {
  const parsed = QualityPeakLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, peaks: 0, latestEp: 0 },
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

  const { series, latestEp, peaks, links, minPeakIntense = 4 } = parsed.data;
  const findings: QualityPeakLinkFinding[] = [];
  const push = (x: QualityPeakLinkFinding) => findings.push(x);

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

  const byPeak = new Map(peaks.map((p) => [p.id, p]));
  const linked = new Set<string>();
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

    if (peak.peakEp === undefined || link.ep !== peak.peakEp) {
      push({
        code: 'EP_NOT_PEAK',
        severity: 'FAIL',
        ids: [link.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 peakEp=${peak.peakEp ?? '无'}`,
        fix: 'link.ep 须等于 peakEp',
      });
      continue;
    }

    const ql = evaluateQualityLeap(link.qualityLeap);
    if (ql.verdict === 'FAIL') {
      const childFails = ql.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_QUALITY_FAIL',
        severity: 'FAIL',
        ids: [link.id, peak.id, ...childFails.map((f) => f.shotId).filter(Boolean) as string[]],
        message: `${link.id}: 峰值镜 E${link.ep} quality-leap FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '峰值镜须过表演/情绪/口型/镜头门（quality-leap）',
      });
      continue;
    }

    if (maxIntensity(link.qualityLeap) < minPeakIntense) {
      push({
        code: 'LOW_INTENSITY_AT_PEAK',
        severity: 'WARN',
        ids: [link.id, peak.id],
        message: `${link.id}: 峰值集强度 < ${minPeakIntense}`,
        fix: '抬高峰值镜 intensity',
      });
    }

    linked.add(peak.id);
    aligned += 1;
  }

  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linked.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 quality 联表`,
        fix: '为峰值集挂 QualityPeakLink',
      });
    } else if (peak.peakEp === undefined && !linked.has(peak.id)) {
      push({
        code: 'PENDING_PEAK',
        severity: 'WARN',
        ids: [peak.id],
        message: `peak ${peak.id} 尚未峰值/联表`,
        fix: '规划 peakEp 或补 links[]',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
