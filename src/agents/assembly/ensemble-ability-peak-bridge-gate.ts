/**
 * V12 · Ensemble × Ability × Peak Ternary Bridge
 * (群像单元 × 金手指 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 家庭群像 A 线单元当集常兑现金手指并踩对峙峰值.
 *  - 与 ensembleColdOpenPeakBridge / abilityBondPeakBridge 互补.
 *
 * Per link: unitId + abilityId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_UNIT / UNKNOWN_ABILITY / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_ENSEMBLE_FAIL / CHILD_ABILITY_FAIL / CHILD_PEAK_FAIL
 *  EP_NOT_TERNARY — link.ep = unit.ep = peakEp
 *  ACQUIRED_AFTER_TERNARY / NO_USE_AT_TERNARY
 *  UNIT_WITHOUT_BRIDGE / PEAK_WITHOUT_BRIDGE
 *  PENDING_ABILITY (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  EnsembleMemberSchema,
  EnsembleUnitSchema,
  evaluateEnsembleCast,
} from './ensemble-cast-gate';
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

export const EnsembleAbilityPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  unitId: z.string().min(1),
  abilityId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const EnsembleAbilityPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  members: z.array(EnsembleMemberSchema),
  units: z.array(EnsembleUnitSchema),
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(EnsembleAbilityPeakBridgeLinkSchema),
});

export type EnsembleAbilityPeakBridgeLedger = z.infer<typeof EnsembleAbilityPeakBridgeLedgerSchema>;

export type EnsembleAbilityPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_UNIT'
    | 'UNKNOWN_ABILITY'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_ENSEMBLE_FAIL'
    | 'CHILD_ABILITY_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'EP_NOT_TERNARY'
    | 'ACQUIRED_AFTER_TERNARY'
    | 'NO_USE_AT_TERNARY'
    | 'UNIT_WITHOUT_BRIDGE'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'PENDING_ABILITY';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface EnsembleAbilityPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    units: number;
    abilities: number;
    peaks: number;
    latestEp: number;
  };
  findings: EnsembleAbilityPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateEnsembleAbilityPeakBridge(input: unknown): EnsembleAbilityPeakBridgeReport {
  const parsed = EnsembleAbilityPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, units: 0, abilities: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, members, units, abilities, uses, peaks, links } = parsed.data;
  const findings: EnsembleAbilityPeakBridgeFinding[] = [];
  const push = (x: EnsembleAbilityPeakBridgeFinding) => findings.push(x);

  const eReport = evaluateEnsembleCast({ series, latestEp, members, units });
  if (eReport.verdict === 'FAIL') {
    const childFails = eReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_ENSEMBLE_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌群像账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 ensemble-cast-gate',
    });
  }

  const aReport = evaluateAbilityRules({ series, latestEp, abilities, uses });
  if (aReport.verdict === 'FAIL') {
    const childFails = aReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_ABILITY_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌金手指账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 ability-rule-gate',
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

  const byU = new Map(units.map((u) => [u.id, u]));
  const byAb = new Map(abilities.map((a) => [a.id, a]));
  const byP = new Map(peaks.map((p) => [p.id, p]));
  const linkedU = new Set<string>();
  const linkedA = new Set<string>();
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
    const unit = byU.get(link.unitId);
    if (!unit) {
      push({
        code: 'UNKNOWN_UNIT',
        severity: 'FAIL',
        ids: [link.id, link.unitId],
        message: `联表 ${link.id} 引用未知 unit ${link.unitId}`,
        fix: 'unitId 须存在于 units[]',
      });
      continue;
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

    if (
      peak.peakEp === undefined ||
      link.ep !== unit.ep ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, unit.id, ab.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 unit=${unit.ep}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = unit.ep = peakEp',
      });
      continue;
    }

    if (ab.acquiredEp > link.ep) {
      push({
        code: 'ACQUIRED_AFTER_TERNARY',
        severity: 'FAIL',
        ids: [link.id, ab.id],
        message: `${link.id}: ability ${ab.id} acquiredEp=E${ab.acquiredEp} > ternary E${link.ep}`,
        fix: '能力须在三元集前或当集已拿到',
      });
      continue;
    }

    const used = uses.some((u) => u.abilityId === ab.id && u.by === ab.holder && u.ep === link.ep);
    if (!used) {
      push({
        code: 'NO_USE_AT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, ab.id],
        message: `${link.id}: ability ${ab.id} 未在 E${link.ep} 由 ${ab.holder} 使用`,
        fix: 'uses[] 须含 abilityId+by=holder+ep=ternary',
      });
      continue;
    }

    linkedU.add(unit.id);
    linkedA.add(ab.id);
    linkedP.add(peak.id);
    aligned += 1;
  }

  for (const unit of units) {
    if (!linkedU.has(unit.id)) {
      push({
        code: 'UNIT_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [unit.id],
        message: `unit ${unit.id} ep=E${unit.ep} 无 ensemble×ability×peak 桥`,
        fix: '为群像单元挂 EnsembleAbilityPeakBridge',
      });
    }
  }
  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedP.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 ensemble×ability×peak 桥`,
        fix: '为峰值集挂 EnsembleAbilityPeakBridge',
      });
    }
  }
  for (const ab of abilities) {
    if (!linkedA.has(ab.id)) {
      push({
        code: 'PENDING_ABILITY',
        severity: 'WARN',
        ids: [ab.id],
        message: `ability ${ab.id} 尚未联表到 ensemble×peak`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      units: units.length,
      abilities: abilities.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
