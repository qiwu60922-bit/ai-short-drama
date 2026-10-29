/**
 * V12 · Amnesia × Peak-Before-Payoff Link Gate (失忆唤回 × 巅峰兑现 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《反派拿捏！第三季》: 唤回 recover 落在关系/对峙巅峰窗.
 *  - amnesia-arc 管 plant→companion→recover；peak-before-payoff 管巅峰日历——本 gate 硬对齐.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_AMNESIA / UNKNOWN_PEAK
 *  CHILD_AMNESIA_FAIL / CHILD_PEAK_FAIL
 *  RECOVER_NOT_AT_PEAK — recoverEp 须等于 peakEp 或 payoffEp
 *  PEAK_WITHOUT_AMNESIA — peak/payoff 无联表
 *  PENDING_AMNESIA (WARN) — amnesia 未挂 peak
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  AmnesiaArcEntrySchema,
  evaluateAmnesiaArc,
} from './amnesia-arc-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const AmnesiaPeakLinkEntrySchema = z.object({
  id: z.string().min(1),
  amnesiaId: z.string().min(1),
  peakId: z.string().min(1),
  note: z.string().optional(),
});

export const AmnesiaPeakLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  amnesias: z.array(AmnesiaArcEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AmnesiaPeakLinkEntrySchema),
});

export type AmnesiaPeakLinkLedger = z.infer<typeof AmnesiaPeakLinkLedgerSchema>;

export type AmnesiaPeakLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_AMNESIA'
    | 'UNKNOWN_PEAK'
    | 'CHILD_AMNESIA_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'RECOVER_NOT_AT_PEAK'
    | 'PEAK_WITHOUT_AMNESIA'
    | 'PENDING_AMNESIA';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AmnesiaPeakLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    amnesias: number;
    peaks: number;
    latestEp: number;
  };
  findings: AmnesiaPeakLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAmnesiaPeakLink(input: unknown): AmnesiaPeakLinkReport {
  const parsed = AmnesiaPeakLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, amnesias: 0, peaks: 0, latestEp: 0 },
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

  const { series, latestEp, amnesias, peaks, links } = parsed.data;
  const findings: AmnesiaPeakLinkFinding[] = [];
  const push = (x: AmnesiaPeakLinkFinding) => findings.push(x);

  const amReport = evaluateAmnesiaArc({ series, latestEp, entries: amnesias });
  if (amReport.verdict === 'FAIL') {
    const childFails = amReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_AMNESIA_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌失忆账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 amnesia-arc-gate',
    });
  }

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

  const byAm = new Map(amnesias.map((a) => [a.id, a]));
  const byPeak = new Map(peaks.map((p) => [p.id, p]));
  const pairedPeaks = new Set<string>();
  const pairedAms = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const am = byAm.get(link.amnesiaId);
    const peak = byPeak.get(link.peakId);
    if (!am) {
      push({
        code: 'UNKNOWN_AMNESIA',
        severity: 'FAIL',
        ids: [link.id, link.amnesiaId],
        message: `联表 ${link.id} 引用未知 amnesia ${link.amnesiaId}`,
        fix: 'amnesiaId 须存在于 amnesias[]',
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
    pairedAms.add(am.id);

    const targets = [peak.peakEp, peak.payoffEp].filter(
      (e): e is number => typeof e === 'number',
    );
    if (am.recoverEp === undefined || !targets.includes(am.recoverEp)) {
      push({
        code: 'RECOVER_NOT_AT_PEAK',
        severity: 'FAIL',
        ids: [link.id, am.id, peak.id],
        message: `${link.id}: recoverEp=${am.recoverEp ?? '未唤回'} 不在 peak/payoff（${targets.join('/') || '无'}）`,
        fix: '唤回集对准巅峰集或回收集',
      });
      continue;
    }

    aligned += 1;
  }

  for (const p of peaks) {
    if ((p.peakEp !== undefined || p.payoffEp !== undefined) && !pairedPeaks.has(p.id)) {
      push({
        code: 'PEAK_WITHOUT_AMNESIA',
        severity: 'FAIL',
        ids: [p.id],
        message: `peak ${p.id} 未挂 amnesia 联表`,
        fix: '在 links[] 挂 amnesiaId↔peakId',
      });
    }
  }

  for (const a of amnesias) {
    if (!pairedAms.has(a.id)) {
      push({
        code: 'PENDING_AMNESIA',
        severity: 'WARN',
        ids: [a.id],
        message: `amnesia ${a.id} 尚未联表到 peak`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      amnesias: amnesias.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
