/**
 * V12 · Ability × Ensemble Link Gate (金手指 × 群像单元 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 家庭群像 A 线单元当集常兑现金手指，避免能力空转.
 *  - 与 ensembleAbilityPeakBridge / abilityBondLink 互补：本 gate 以 ability 联 ensemble.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_ABILITY / UNKNOWN_UNIT / FUTURE_EP
 *  CHILD_ABILITY_FAIL / CHILD_ENSEMBLE_FAIL
 *  EP_NOT_UNIT — link.ep = unit.ep 且 holder 在该 ep 有 use
 *  UNIT_WITHOUT_ABILITY / NO_USE_AT_UNIT
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
  EnsembleMemberSchema,
  EnsembleUnitSchema,
  evaluateEnsembleCast,
} from './ensemble-cast-gate';

const Ep = z.number().int().positive();

export const AbilityEnsembleLinkEntrySchema = z.object({
  id: z.string().min(1),
  abilityId: z.string().min(1),
  unitId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const AbilityEnsembleLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  members: z.array(EnsembleMemberSchema),
  units: z.array(EnsembleUnitSchema),
  links: z.array(AbilityEnsembleLinkEntrySchema),
});

export type AbilityEnsembleLinkLedger = z.infer<typeof AbilityEnsembleLinkLedgerSchema>;

export type AbilityEnsembleLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_ABILITY'
    | 'UNKNOWN_UNIT'
    | 'FUTURE_EP'
    | 'CHILD_ABILITY_FAIL'
    | 'CHILD_ENSEMBLE_FAIL'
    | 'EP_NOT_UNIT'
    | 'UNIT_WITHOUT_ABILITY'
    | 'NO_USE_AT_UNIT'
    | 'PENDING_ABILITY';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AbilityEnsembleLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    abilities: number;
    units: number;
    latestEp: number;
  };
  findings: AbilityEnsembleLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAbilityEnsembleLink(input: unknown): AbilityEnsembleLinkReport {
  const parsed = AbilityEnsembleLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, abilities: 0, units: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, abilities, uses, members, units, links } = parsed.data;
  const findings: AbilityEnsembleLinkFinding[] = [];
  const push = (x: AbilityEnsembleLinkFinding) => findings.push(x);

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
  const byU = new Map(units.map((u) => [u.id, u]));
  const pairedAbs = new Set<string>();
  const pairedU = new Set<string>();
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

    if (link.ep !== unit.ep) {
      push({
        code: 'EP_NOT_UNIT',
        severity: 'FAIL',
        ids: [link.id, ab.id, unit.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 unit=${unit.ep}`,
        fix: '金手指使用须踩群像单元同集',
      });
      continue;
    }

    const used = uses.some((u) => u.abilityId === ab.id && u.by === ab.holder && u.ep === link.ep);
    if (!used) {
      push({
        code: 'NO_USE_AT_UNIT',
        severity: 'FAIL',
        ids: [link.id, ab.id],
        message: `${link.id}: ability ${ab.id} 在 unit E${link.ep} 无 holder 使用`,
        fix: '群像单元集须有金手指使用',
      });
      continue;
    }

    pairedAbs.add(ab.id);
    pairedU.add(unit.id);
    aligned += 1;
  }

  for (const unit of units) {
    if (!pairedU.has(unit.id) && unit.ep <= latestEp) {
      push({
        code: 'UNIT_WITHOUT_ABILITY',
        severity: 'FAIL',
        ids: [unit.id],
        message: `unit ${unit.id} 无 ability 联表`,
        fix: '为群像单元挂 AbilityEnsembleLink',
      });
    }
  }
  for (const a of abilities) {
    if (!pairedAbs.has(a.id)) {
      push({
        code: 'PENDING_ABILITY',
        severity: 'WARN',
        ids: [a.id],
        message: `ability ${a.id} 尚未联表到 ensemble`,
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
      units: units.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
