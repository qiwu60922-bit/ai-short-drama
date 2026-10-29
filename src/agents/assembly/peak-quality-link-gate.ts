/**
 * V12 · Peak-Before-Payoff × Quality-Leap Link Gate (巅峰后再兑现 × 表演门 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《卖掉养老房那天，我重获新生》: 订婚宴嫌弃峰值镜须过表演/情绪门，不能空壳清算脸.
 *  - 《婆婆装瘫七年，我高调离婚！》: 升副院长峰值 + 清算 payoff 两拍都挂 quality-leap.
 *  - peak-before-payoff 管「先巅峰再兑现」；quality-leap 管峰值镜可见表演——本 gate 硬联表.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_PEAK_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_PEAK_OR_PAYOFF — link.ep 须等于 peakEp 或 payoffEp
 *  PEAK_WITHOUT_QUALITY — 已填 peakEp 的条目在 peakEp 无联表 quality
 *  PAYOFF_WITHOUT_QUALITY — 已 payoff 的条目在 payoffEp 无联表 quality
 *  LOW_INTENSITY_AT_PEAK (WARN) — peakEp 联表 max intensity < minPeakIntense
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

export const PeakQualityLinkEntrySchema = z.object({
  id: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const PeakQualityLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  /** Intensity floor for LOW_INTENSITY_AT_PEAK WARN. Default 4. */
  minPeakIntense: z.number().int().min(1).max(5).optional(),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(PeakQualityLinkEntrySchema),
});

export type PeakQualityLinkLedger = z.infer<typeof PeakQualityLinkLedgerSchema>;

export type PeakQualityLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_PEAK_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_PEAK_OR_PAYOFF'
    | 'PEAK_WITHOUT_QUALITY'
    | 'PAYOFF_WITHOUT_QUALITY'
    | 'LOW_INTENSITY_AT_PEAK';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface PeakQualityLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    peaks: number;
    latestEp: number;
  };
  findings: PeakQualityLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

function maxIntensity(ql: { shots?: Array<{ performance?: { intensity?: number } | null }> }): number {
  let m = 0;
  for (const s of ql.shots ?? []) {
    const i = s.performance?.intensity;
    if (typeof i === 'number' && i > m) m = i;
  }
  return m;
}

export function evaluatePeakQualityLink(input: unknown): PeakQualityLinkReport {
  const parsed = PeakQualityLinkLedgerSchema.safeParse(input);
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
  const findings: PeakQualityLinkFinding[] = [];
  const push = (x: PeakQualityLinkFinding) => findings.push(x);

  const peakReport = evaluatePeakBeforePayoff({ series, latestEp, entries: peaks });
  if (peakReport.verdict === 'FAIL') {
    const childFails = peakReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_PEAK_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌巅峰账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 peak-before-payoff-gate（peak≤payoff + peakLabel）',
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
  const linkedAt = new Set<string>();
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

    const allowed = new Set<number>();
    if (peak.peakEp !== undefined) allowed.add(peak.peakEp);
    if (peak.payoffEp !== undefined) allowed.add(peak.payoffEp);
    if (!allowed.has(link.ep)) {
      push({
        code: 'EP_NOT_PEAK_OR_PAYOFF',
        severity: 'FAIL',
        ids: [link.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 不是 peakEp/payoffEp（${[...allowed].join('/') || '无'}）`,
        fix: 'link.ep 对准巅峰集或回收集',
      });
      continue;
    }
    linkedAt.add(`${peak.id}@${link.ep}`);

    const ql = evaluateQualityLeap(link.qualityLeap);
    if (ql.verdict === 'FAIL') {
      const childFails = ql.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_QUALITY_FAIL',
        severity: 'FAIL',
        ids: [link.id, peak.id, ...(childFails.map((f) => f.shotId).filter(Boolean) as string[])],
        message: `${link.id}: E${link.ep} quality-leap FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '峰值/清算镜须过表演/情绪/口型/镜头门',
      });
      continue;
    }

    if (peak.peakEp !== undefined && link.ep === peak.peakEp) {
      const mi = maxIntensity(link.qualityLeap);
      if (mi < minPeakIntense) {
        push({
          code: 'LOW_INTENSITY_AT_PEAK',
          severity: 'WARN',
          ids: [link.id, peak.id],
          message: `${link.id}: 巅峰 E${link.ep} max intensity=${mi} < ${minPeakIntense}`,
          fix: '巅峰镜补高强度表演（intensity≥阈值）',
        });
      }
    }

    aligned += 1;
  }

  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedAt.has(`${peak.id}@${peak.peakEp}`)) {
      push({
        code: 'PEAK_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 qualityLeap 联表`,
        fix: '为巅峰集挂 PeakQualityLink（qualityLeap）',
      });
    }
    if (peak.payoffEp !== undefined && !linkedAt.has(`${peak.id}@${peak.payoffEp}`)) {
      push({
        code: 'PAYOFF_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} payoffEp=E${peak.payoffEp} 无 qualityLeap 联表`,
        fix: '为清算回收集挂 PeakQualityLink（qualityLeap）',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { links: links.length, aligned, peaks: peaks.length, latestEp },
    findings,
    gates: GATES,
  };
}
