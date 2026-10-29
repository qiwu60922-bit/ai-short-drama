/**
 * V12 · Alliance × Peak-Before-Payoff Link Gate (同盟 payoff × 巅峰兑现 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《觉醒伪神》: 同盟 payoff 常踩对峙巅峰/回收集.
 *  - alliance-ledger 管 seed→echo→payoff；peak-before-payoff 管巅峰——本 gate 硬对齐.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_ALLIANCE / UNKNOWN_PEAK
 *  CHILD_ALLIANCE_FAIL / CHILD_PEAK_FAIL
 *  PAYOFF_NOT_AT_PEAK — alliance payoff ep 须等于 peakEp|payoffEp
 *  PEAK_WITHOUT_ALLIANCE — peak/payoff 无联表
 *  PENDING_ALLIANCE (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  AllianceEntrySchema,
  AllianceEventSchema,
  evaluateAllianceLedger,
} from './alliance-ledger-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const AlliancePeakLinkEntrySchema = z.object({
  id: z.string().min(1),
  allianceId: z.string().min(1),
  peakId: z.string().min(1),
  note: z.string().optional(),
});

export const AlliancePeakLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AlliancePeakLinkEntrySchema),
});

export type AlliancePeakLinkLedger = z.infer<typeof AlliancePeakLinkLedgerSchema>;

export type AlliancePeakLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_ALLIANCE'
    | 'UNKNOWN_PEAK'
    | 'CHILD_ALLIANCE_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'PAYOFF_NOT_AT_PEAK'
    | 'PEAK_WITHOUT_ALLIANCE'
    | 'PENDING_ALLIANCE';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AlliancePeakLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    alliances: number;
    peaks: number;
    latestEp: number;
  };
  findings: AlliancePeakLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAlliancePeakLink(input: unknown): AlliancePeakLinkReport {
  const parsed = AlliancePeakLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, alliances: 0, peaks: 0, latestEp: 0 },
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

  const { series, latestEp, alliances, events, peaks, links } = parsed.data;
  const findings: AlliancePeakLinkFinding[] = [];
  const push = (x: AlliancePeakLinkFinding) => findings.push(x);

  const alReport = evaluateAllianceLedger({ series, latestEp, alliances, events });
  if (alReport.verdict === 'FAIL') {
    const childFails = alReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_ALLIANCE_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌同盟账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 alliance-ledger-gate',
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

  const allianceIds = new Set(alliances.map((a) => a.id));
  const byPeak = new Map(peaks.map((p) => [p.id, p]));
  const payoffEpByAlliance = new Map<string, number>();
  for (const e of events) {
    if (e.role === 'payoff') {
      const prev = payoffEpByAlliance.get(e.allianceId);
      if (prev === undefined || e.ep > prev) payoffEpByAlliance.set(e.allianceId, e.ep);
    }
  }

  const pairedPeaks = new Set<string>();
  const pairedAlliances = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    if (!allianceIds.has(link.allianceId)) {
      push({
        code: 'UNKNOWN_ALLIANCE',
        severity: 'FAIL',
        ids: [link.id, link.allianceId],
        message: `联表 ${link.id} 引用未知 alliance ${link.allianceId}`,
        fix: 'allianceId 须存在于 alliances[]',
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
    pairedPeaks.add(peak.id);
    pairedAlliances.add(link.allianceId);

    const payoffEp = payoffEpByAlliance.get(link.allianceId);
    const targets = [peak.peakEp, peak.payoffEp].filter(
      (e): e is number => typeof e === 'number',
    );
    if (payoffEp === undefined || !targets.includes(payoffEp)) {
      push({
        code: 'PAYOFF_NOT_AT_PEAK',
        severity: 'FAIL',
        ids: [link.id, link.allianceId, peak.id],
        message: `${link.id}: alliance payoffEp=${payoffEp ?? '无'} 不在 peak/payoff（${targets.join('/') || '无'}）`,
        fix: '同盟 payoff 须踩巅峰集或回收集',
      });
      continue;
    }

    aligned += 1;
  }

  for (const p of peaks) {
    if ((p.peakEp !== undefined || p.payoffEp !== undefined) && !pairedPeaks.has(p.id)) {
      push({
        code: 'PEAK_WITHOUT_ALLIANCE',
        severity: 'FAIL',
        ids: [p.id],
        message: `peak ${p.id} 未挂 alliance 联表`,
        fix: '在 links[] 挂 allianceId↔peakId',
      });
    }
  }

  for (const a of alliances) {
    if (!pairedAlliances.has(a.id)) {
      push({
        code: 'PENDING_ALLIANCE',
        severity: 'WARN',
        ids: [a.id],
        message: `alliance ${a.id} 尚未联表到 peak`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      alliances: alliances.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
