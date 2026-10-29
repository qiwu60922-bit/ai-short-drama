/**
 * V12 · Countdown × Peak-Before-Payoff Link Gate (阶段倒计时 × 巅峰兑现 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《天幕直播》: 时限 deadline 当集冲巅峰对峙 / 清算.
 *  - countdown 管 start→deadline；peak-before-payoff 管巅峰——本 gate 硬对齐 deadline=peakEp.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_COUNTDOWN / UNKNOWN_PEAK
 *  CHILD_PEAK_FAIL / BAD_COUNTDOWN_WINDOW
 *  DEADLINE_NOT_AT_PEAK — deadlineEp 须等于 peakEp|payoffEp
 *  PEAK_WITHOUT_COUNTDOWN — peak/payoff 无联表
 *  PENDING_COUNTDOWN (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { StageCountdownSchema } from './stage-goal-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const CountdownPeakLinkEntrySchema = z.object({
  id: z.string().min(1),
  countdownId: z.string().min(1),
  peakId: z.string().min(1),
  note: z.string().optional(),
});

export const CountdownPeakLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  countdowns: z.array(StageCountdownSchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(CountdownPeakLinkEntrySchema),
});

export type CountdownPeakLinkLedger = z.infer<typeof CountdownPeakLinkLedgerSchema>;

export type CountdownPeakLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_COUNTDOWN'
    | 'UNKNOWN_PEAK'
    | 'CHILD_PEAK_FAIL'
    | 'BAD_COUNTDOWN_WINDOW'
    | 'DEADLINE_NOT_AT_PEAK'
    | 'PEAK_WITHOUT_COUNTDOWN'
    | 'PENDING_COUNTDOWN';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface CountdownPeakLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    countdowns: number;
    peaks: number;
    latestEp: number;
  };
  findings: CountdownPeakLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateCountdownPeakLink(input: unknown): CountdownPeakLinkReport {
  const parsed = CountdownPeakLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, countdowns: 0, peaks: 0, latestEp: 0 },
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

  const { series, latestEp, countdowns, peaks, links } = parsed.data;
  const findings: CountdownPeakLinkFinding[] = [];
  const push = (x: CountdownPeakLinkFinding) => findings.push(x);

  const peakReport = evaluatePeakBeforePayoff({ series, latestEp, entries: peaks });
  if (peakReport.verdict === 'FAIL') {
    const childFails = peakReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_PEAK_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌巅峰账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
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
    if (cd.deadlineEp > latestEp || cd.startEp > latestEp) {
      push({
        code: 'BAD_COUNTDOWN_WINDOW',
        severity: 'FAIL',
        ids: [cd.id],
        message: `countdown ${cd.id} 超出 latestEp=E${latestEp}`,
        fix: '下调 deadline/start 或上调 latestEp',
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
    push({
      code: 'DUP_ID',
      severity: 'FAIL',
      ids: [id],
      message: `联表ID重复：${id}`,
      fix: '联表 id 须唯一',
    });
  }

  const byCd = new Map(countdowns.map((c) => [c.id, c]));
  const byPeak = new Map(peaks.map((p) => [p.id, p]));
  const pairedPeaks = new Set<string>();
  const pairedCd = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const cd = byCd.get(link.countdownId);
    const peak = byPeak.get(link.peakId);
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
    pairedPeaks.add(peak.id);
    pairedCd.add(cd.id);

    const targets = [peak.peakEp, peak.payoffEp].filter(
      (e): e is number => typeof e === 'number',
    );
    if (!targets.includes(cd.deadlineEp)) {
      push({
        code: 'DEADLINE_NOT_AT_PEAK',
        severity: 'FAIL',
        ids: [link.id, cd.id, peak.id],
        message: `${link.id}: deadlineEp=E${cd.deadlineEp} 不在 peak/payoff（${targets.join('/') || '无'}）`,
        fix: 'countdown deadline 须踩巅峰集或回收集',
      });
      continue;
    }

    aligned += 1;
  }

  for (const p of peaks) {
    if ((p.peakEp !== undefined || p.payoffEp !== undefined) && !pairedPeaks.has(p.id)) {
      push({
        code: 'PEAK_WITHOUT_COUNTDOWN',
        severity: 'FAIL',
        ids: [p.id],
        message: `peak ${p.id} 未挂 countdown 联表`,
        fix: '在 links[] 挂 countdownId↔peakId',
      });
    }
  }

  for (const cd of countdowns) {
    if (!pairedCd.has(cd.id)) {
      push({
        code: 'PENDING_COUNTDOWN',
        severity: 'WARN',
        ids: [cd.id],
        message: `countdown ${cd.id} 尚未联表到 peak`,
        fix: '补 links[] 或确认旁路',
      });
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
