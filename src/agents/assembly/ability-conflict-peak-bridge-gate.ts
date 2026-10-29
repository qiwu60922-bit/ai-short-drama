/**
 * V12 · Ability × Conflict × Peak Ternary Bridge
 * (金手指使用 × 冲突欠账兑现 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《伪人降临》/《叶楚出狱》: 金手指使用常踩冲突兑现与对峙峰值同拍.
 *  - abilityPeakLink / conflictPeakLink 已各自联表——本 gate 硬对齐同 ep 三元同框.
 *
 * Per link: abilityId + conflictId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_ABILITY / UNKNOWN_CONFLICT / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_ABILITY_FAIL / CHILD_CONFLICT_FAIL / CHILD_PEAK_FAIL
 *  EP_NOT_TERNARY — link.ep = use@holder = payoffEp = peakEp
 *  PEAK_WITHOUT_BRIDGE / PAYOFF_WITHOUT_BRIDGE / ABILITY_WITHOUT_BRIDGE
 *  PENDING_ABILITY (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  AbilityEntrySchema,
  AbilityUseSchema,
  evaluateAbilityRules,
} from './ability-rule-gate';
import {
  ConflictEntrySchema,
  evaluateConflictPayoffGap,
} from './conflict-payoff-gap-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const AbilityConflictPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  abilityId: z.string().min(1),
  conflictId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const AbilityConflictPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  conflicts: z.array(ConflictEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AbilityConflictPeakBridgeLinkSchema),
});

export type AbilityConflictPeakBridgeLedger = z.infer<typeof AbilityConflictPeakBridgeLedgerSchema>;

export type AbilityConflictPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_ABILITY'
    | 'UNKNOWN_CONFLICT'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_ABILITY_FAIL'
    | 'CHILD_CONFLICT_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'EP_NOT_TERNARY'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'PAYOFF_WITHOUT_BRIDGE'
    | 'ABILITY_WITHOUT_BRIDGE'
    | 'PENDING_ABILITY';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AbilityConflictPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    abilities: number;
    conflicts: number;
    peaks: number;
    latestEp: number;
  };
  findings: AbilityConflictPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAbilityConflictPeakBridge(input: unknown): AbilityConflictPeakBridgeReport {
  const parsed = AbilityConflictPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, abilities: 0, conflicts: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, abilities, uses, conflicts, peaks, links } = parsed.data;
  const findings: AbilityConflictPeakBridgeFinding[] = [];
  const push = (x: AbilityConflictPeakBridgeFinding) => findings.push(x);

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

  const cReport = evaluateConflictPayoffGap({ series, latestEp, conflicts });
  if (cReport.verdict === 'FAIL') {
    const childFails = cReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_CONFLICT_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌冲突账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 conflict-payoff-gap-gate',
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

  const byAb = new Map(abilities.map((a) => [a.id, a]));
  const byC = new Map(conflicts.map((c) => [c.id, c]));
  const byP = new Map(peaks.map((p) => [p.id, p]));
  const linkedP = new Set<string>();
  const linkedC = new Set<string>();
  const linkedAb = new Set<string>();
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
    const ab = byAb.get(link.abilityId);
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
    const conflict = byC.get(link.conflictId);
    if (!conflict) {
      push({
        code: 'UNKNOWN_CONFLICT',
        severity: 'FAIL',
        ids: [link.id, link.conflictId],
        message: `联表 ${link.id} 引用未知 conflict ${link.conflictId}`,
        fix: 'conflictId 须存在于 conflicts[]',
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

    const used = uses.some((u) => u.abilityId === ab.id && u.by === ab.holder && u.ep === link.ep);
    if (
      !used ||
      conflict.payoffEp === undefined ||
      peak.peakEp === undefined ||
      link.ep !== conflict.payoffEp ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, ab.id, conflict.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 use=${used}/payoff=${conflict.payoffEp ?? '无'}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep 有 holder use = payoffEp = peakEp',
      });
      continue;
    }

    linkedP.add(peak.id);
    linkedC.add(conflict.id);
    linkedAb.add(ab.id);
    aligned += 1;
  }

  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedP.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 ability×conflict×peak 桥`,
        fix: '为峰值集挂 AbilityConflictPeakBridge',
      });
    }
  }
  for (const c of conflicts) {
    if (c.payoffEp !== undefined && !linkedC.has(c.id)) {
      push({
        code: 'PAYOFF_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [c.id],
        message: `conflict ${c.id} payoffEp=E${c.payoffEp} 无 ability×conflict×peak 桥`,
        fix: '为兑现集挂 AbilityConflictPeakBridge',
      });
    }
  }
  for (const ab of abilities) {
    if (!linkedAb.has(ab.id)) {
      push({
        code: 'PENDING_ABILITY',
        severity: 'WARN',
        ids: [ab.id],
        message: `ability ${ab.id} 尚未联表到 ability×conflict×peak 桥`,
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
      conflicts: conflicts.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
