/**
 * V12 · Countdown × Quality × Peak Ternary Bridge
 * (阶段倒计时 × 表演门 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《天幕直播》: deadline 当集须过表演强度门，并踩对峙峰值.
 *  - countdownPeakLink / countdownQuality 各自联表——本 gate 硬对齐同 ep 三元同框.
 *
 * Per link: countdownId + peakId + ep + qualityLeap.
 *  SCHEMA / DUP_ID / UNKNOWN_COUNTDOWN / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_PEAK_FAIL / CHILD_QUALITY_FAIL / BAD_COUNTDOWN_WINDOW
 *  EP_NOT_TERNARY — link.ep = deadlineEp = peakEp
 *  DEADLINE_WITHOUT_BRIDGE / PEAK_WITHOUT_BRIDGE
 *  PENDING_COUNTDOWN (WARN) / LOW_INTENSITY_AT_TERNARY (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { StageCountdownSchema } from './stage-goal-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';
import {
  QualityLeapDocSchema,
  evaluateQualityLeap,
} from './quality-leap-gate';

const Ep = z.number().int().positive();

export const CountdownQualityPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  countdownId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const CountdownQualityPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minTernaryIntense: z.number().int().min(1).max(5).optional(),
  countdowns: z.array(StageCountdownSchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(CountdownQualityPeakBridgeLinkSchema),
});

export type CountdownQualityPeakBridgeLedger = z.infer<typeof CountdownQualityPeakBridgeLedgerSchema>;

export type CountdownQualityPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_COUNTDOWN'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_PEAK_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'BAD_COUNTDOWN_WINDOW'
    | 'EP_NOT_TERNARY'
    | 'DEADLINE_WITHOUT_BRIDGE'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'PENDING_COUNTDOWN'
    | 'LOW_INTENSITY_AT_TERNARY';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface CountdownQualityPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    countdowns: number;
    peaks: number;
    latestEp: number;
  };
  findings: CountdownQualityPeakBridgeFinding[];
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

export function evaluateCountdownQualityPeakBridge(input: unknown): CountdownQualityPeakBridgeReport {
  const parsed = CountdownQualityPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, countdowns: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, countdowns, peaks, links, minTernaryIntense = 4 } = parsed.data;
  const findings: CountdownQualityPeakBridgeFinding[] = [];
  const push = (x: CountdownQualityPeakBridgeFinding) => findings.push(x);

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

  for (const cd of countdowns) {
    if (cd.deadlineEp < cd.startEp) {
      push({
        code: 'BAD_COUNTDOWN_WINDOW',
        severity: 'FAIL',
        ids: [cd.id],
        message: `countdown ${cd.id}: deadlineEp=E${cd.deadlineEp} < startEp=E${cd.startEp}`,
        fix: 'deadline 须 ≥ start',
      });
    }
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

  const byCd = new Map(countdowns.map((c) => [c.id, c]));
  const byP = new Map(peaks.map((p) => [p.id, p]));
  const linkedCd = new Set<string>();
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
    const cd = byCd.get(link.countdownId);
    if (!cd) {
      push({
        code: 'UNKNOWN_COUNTDOWN',
        severity: 'FAIL',
        ids: [link.id, link.countdownId],
        message: `联表 ${link.id} 引用未知 countdown ${link.countdownId}`,
        fix: 'countdownId 须存在于 countdowns[]',
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
      peak.peakEp === undefined ||
      link.ep !== cd.deadlineEp ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, cd.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 deadline=${cd.deadlineEp}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = deadlineEp = peakEp',
      });
      continue;
    }

    const intense = maxIntensity(link.qualityLeap);
    if (intense < minTernaryIntense) {
      push({
        code: 'LOW_INTENSITY_AT_TERNARY',
        severity: 'WARN',
        ids: [link.id, cd.id, peak.id],
        message: `${link.id}: max intensity=${intense} < minTernaryIntense=${minTernaryIntense}`,
        fix: '提高表演 intensity 或下调 minTernaryIntense',
      });
    }

    linkedCd.add(cd.id);
    linkedP.add(peak.id);
    aligned += 1;
  }

  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedP.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 countdown×quality×peak 桥`,
        fix: '为峰值集挂 CountdownQualityPeakBridge',
      });
    }
  }
  for (const cd of countdowns) {
    if (!linkedCd.has(cd.id)) {
      if (cd.deadlineEp <= latestEp) {
        push({
          code: 'DEADLINE_WITHOUT_BRIDGE',
          severity: 'FAIL',
          ids: [cd.id],
          message: `countdown ${cd.id} deadlineEp=E${cd.deadlineEp} 未挂 countdown×quality×peak 桥`,
          fix: '在 links[] 挂 countdownId + peakId + qualityLeap',
        });
      } else {
        push({
          code: 'PENDING_COUNTDOWN',
          severity: 'WARN',
          ids: [cd.id],
          message: `countdown ${cd.id} 尚未联表到 quality×peak`,
          fix: '补 links[] 或确认旁路',
        });
      }
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      countdowns: countdowns.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
