/**
 * V12 · Ability-Rule × Peak-Before-Payoff Link Gate (金手指 × 巅峰后再兑现 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《伪人降临》: 巅峰对峙窗须有能力使用兑现规则.
 *  - 《婆婆装瘫七年》: 清算 payoff 可挂金手指/证据能力首用或加码用.
 *  - ability-rule 管次数/持有；peak-before-payoff 管巅峰日历——本 gate 硬联表 use@peak/payoff.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_ABILITY / UNKNOWN_PEAK
 *  CHILD_ABILITY_FAIL / CHILD_PEAK_FAIL
 *  ACQUIRED_AFTER_PEAK — acquiredEp > peakEp（有巅峰时）
 *  NO_USE_AT_PEAK_OR_PAYOFF — peakEp/payoffEp 无 holder 使用
 *  PEAK_WITHOUT_ABILITY — peak 未被联表
 *  PENDING_ABILITY (WARN) — ability 未挂 peak
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  AbilityEntrySchema,
  AbilityUseSchema,
  evaluateAbilityRules,
} from './ability-rule-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const AbilityPeakLinkEntrySchema = z.object({
  id: z.string().min(1),
  abilityId: z.string().min(1),
  peakId: z.string().min(1),
  note: z.string().optional(),
});

export const AbilityPeakLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AbilityPeakLinkEntrySchema),
});

export type AbilityPeakLinkLedger = z.infer<typeof AbilityPeakLinkLedgerSchema>;

export type AbilityPeakLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_ABILITY'
    | 'UNKNOWN_PEAK'
    | 'CHILD_ABILITY_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'ACQUIRED_AFTER_PEAK'
    | 'NO_USE_AT_PEAK_OR_PAYOFF'
    | 'PEAK_WITHOUT_ABILITY'
    | 'PENDING_ABILITY';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AbilityPeakLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    abilities: number;
    peaks: number;
    latestEp: number;
  };
  findings: AbilityPeakLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAbilityPeakLink(input: unknown): AbilityPeakLinkReport {
  const parsed = AbilityPeakLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, abilities: 0, peaks: 0, latestEp: 0 },
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

  const { series, latestEp, abilities, uses, peaks, links } = parsed.data;
  const findings: AbilityPeakLinkFinding[] = [];
  const push = (x: AbilityPeakLinkFinding) => findings.push(x);

  const abReport = evaluateAbilityRules({ series, latestEp, abilities, uses });
  if (abReport.verdict === 'FAIL') {
    const childFails = abReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_ABILITY_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌金手指账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 ability-rule-gate',
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

  const byAb = new Map(abilities.map((a) => [a.id, a]));
  const byPeak = new Map(peaks.map((p) => [p.id, p]));
  const pairedPeaks = new Set<string>();
  const pairedAbs = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const ab = byAb.get(link.abilityId);
    const peak = byPeak.get(link.peakId);
    if (!ab) {
      push({
        code: 'UNKNOWN_ABILITY',
        severity: 'FAIL',
        ids: [link.id, link.abilityId],
        message: `联表 ${link.id} 引用未知 ability ${link.abilityId}`,
        fix: 'abilityId 须存在于 abilities[]',
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
    pairedAbs.add(ab.id);

    if (peak.peakEp !== undefined && ab.acquiredEp > peak.peakEp) {
      push({
        code: 'ACQUIRED_AFTER_PEAK',
        severity: 'FAIL',
        ids: [link.id, ab.id, peak.id],
        message: `${link.id}: ability acquired@E${ab.acquiredEp} 晚于 peakEp=E${peak.peakEp}`,
        fix: '先觉醒金手指，再冲巅峰；或下调 acquiredEp',
      });
      continue;
    }

    const targets = [peak.peakEp, peak.payoffEp].filter(
      (e): e is number => typeof e === 'number',
    );
    const used = uses.some(
      (u) =>
        u.abilityId === ab.id &&
        u.by === ab.holder &&
        targets.includes(u.ep),
    );
    if (!used) {
      push({
        code: 'NO_USE_AT_PEAK_OR_PAYOFF',
        severity: 'FAIL',
        ids: [link.id, ab.id, peak.id],
        message: `${link.id}: peak/payoff（${targets.join('/') || '无'}）无 holder 使用 ability`,
        fix: '在巅峰集或回收集用一次金手指',
      });
      continue;
    }

    aligned += 1;
  }

  for (const p of peaks) {
    if ((p.peakEp !== undefined || p.payoffEp !== undefined) && !pairedPeaks.has(p.id)) {
      push({
        code: 'PEAK_WITHOUT_ABILITY',
        severity: 'FAIL',
        ids: [p.id],
        message: `peak ${p.id} 未挂 ability 联表`,
        fix: '在 links[] 挂 abilityId↔peakId',
      });
    }
  }

  for (const a of abilities) {
    if (!pairedAbs.has(a.id)) {
      push({
        code: 'PENDING_ABILITY',
        severity: 'WARN',
        ids: [a.id],
        message: `ability ${a.id} 尚未联表到 peak`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      abilities: abilities.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
