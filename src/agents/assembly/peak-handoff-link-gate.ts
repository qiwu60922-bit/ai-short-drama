/**
 * V12 · Peak-Before-Payoff × Cliffhanger-Handoff Link Gate (巅峰兑现 × 集间悬念承接 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《婆婆装瘫七年，我高调离婚！》: 清算 payoff 当集尾须卡悬念，下集 hook 承接.
 *  - 《卖掉养老房那天，我重获新生》: 巅峰/回收集尾 cliff → 下集开场 hook.
 *  - peak-before-payoff 管巅峰日历；cliffhanger-handoff 管两 ShotSpec——本 gate 硬对齐 ep 窗.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_PEAK / UNKNOWN_HANDOFF
 *  CHILD_PEAK_FAIL / CHILD_HANDOFF_FAIL
 *  HANDOFF_NOT_AT_PEAK_OR_PAYOFF — handoff.prevEp 须等于 peakEp 或 payoffEp
 *  PEAK_WITHOUT_HANDOFF — 已 peak/payoff 的条目无联表
 *  PENDING_HANDOFF (WARN) — handoff 未挂 peak
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';
import { evaluateCliffhangerHandoff } from './cliffhanger-handoff-gate';

const Ep = z.number().int().positive();

export const PeakHandoffEntrySchema = z.object({
  id: z.string().min(1),
  prevEp: Ep,
  nextEp: Ep,
  prev: ShotSpecDocSchema,
  next: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const PeakHandoffLinkEntrySchema = z.object({
  id: z.string().min(1),
  peakId: z.string().min(1),
  handoffId: z.string().min(1),
  note: z.string().optional(),
});

export const PeakHandoffLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  peaks: z.array(PeakBeforePayoffEntrySchema),
  handoffs: z.array(PeakHandoffEntrySchema),
  links: z.array(PeakHandoffLinkEntrySchema),
});

export type PeakHandoffLinkLedger = z.infer<typeof PeakHandoffLinkLedgerSchema>;

export type PeakHandoffLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_PEAK'
    | 'UNKNOWN_HANDOFF'
    | 'CHILD_PEAK_FAIL'
    | 'CHILD_HANDOFF_FAIL'
    | 'HANDOFF_NOT_AT_PEAK_OR_PAYOFF'
    | 'PEAK_WITHOUT_HANDOFF'
    | 'PENDING_HANDOFF';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface PeakHandoffLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    peaks: number;
    handoffs: number;
    latestEp: number;
  };
  findings: PeakHandoffLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluatePeakHandoffLink(input: unknown): PeakHandoffLinkReport {
  const parsed = PeakHandoffLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, peaks: 0, handoffs: 0, latestEp: 0 },
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

  const { series, latestEp, peaks, handoffs, links } = parsed.data;
  const findings: PeakHandoffLinkFinding[] = [];
  const push = (x: PeakHandoffLinkFinding) => findings.push(x);

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

  for (const h of handoffs) {
    const r = evaluateCliffhangerHandoff(h.prev, h.next);
    if (r.verdict === 'FAIL') {
      const codes = r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
      push({
        code: 'CHILD_HANDOFF_FAIL',
        severity: 'FAIL',
        ids: [h.id],
        message: `handoff ${h.id} FAIL：${codes.join(',') || 'unknown'}`,
        fix: '先修 cliffhanger-handoff-gate（prev cliff + next hook）',
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

  const byPeak = new Map(peaks.map((p) => [p.id, p]));
  const byH = new Map(handoffs.map((h) => [h.id, h]));
  const pairedPeaks = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const peak = byPeak.get(link.peakId);
    const handoff = byH.get(link.handoffId);
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
    if (!handoff) {
      push({
        code: 'UNKNOWN_HANDOFF',
        severity: 'FAIL',
        ids: [link.id, link.handoffId],
        message: `联表 ${link.id} 引用未知 handoff ${link.handoffId}`,
        fix: 'handoffId 须存在于 handoffs[]',
      });
      continue;
    }
    pairedPeaks.add(peak.id);

    const allowed = new Set<number>();
    if (peak.peakEp !== undefined) allowed.add(peak.peakEp);
    if (peak.payoffEp !== undefined) allowed.add(peak.payoffEp);
    if (!allowed.has(handoff.prevEp)) {
      push({
        code: 'HANDOFF_NOT_AT_PEAK_OR_PAYOFF',
        severity: 'FAIL',
        ids: [link.id, peak.id, handoff.id],
        message: `${link.id}: handoff.prevEp=E${handoff.prevEp} 不是 peakEp/payoffEp（${[...allowed].join('/') || '无'}）`,
        fix: 'handoff 上一集对准巅峰集或回收集',
      });
      continue;
    }

    aligned += 1;
  }

  for (const peak of peaks) {
    const needs =
      peak.peakEp !== undefined || peak.payoffEp !== undefined;
    if (needs && !pairedPeaks.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_HANDOFF',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} 已有巅峰/回收计划但无 handoff 联表`,
        fix: '在 links[] 挂 peakId↔handoffId（prevEp=peak/payoff）',
      });
    }
  }

  for (const h of handoffs) {
    if (![...links].some((l) => l.handoffId === h.id)) {
      push({
        code: 'PENDING_HANDOFF',
        severity: 'WARN',
        ids: [h.id],
        message: `handoff ${h.id} 尚未联表到 peak`,
        fix: '补 links[] 或确认该 handoff 仅作旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      peaks: peaks.length,
      handoffs: handoffs.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
