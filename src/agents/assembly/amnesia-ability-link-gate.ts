/**
 * V12 · Amnesia × Ability Link Gate (失忆唤回 × 金手指 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《反派拿捏》: recover 集常兑现金手指.
 *  - 与 abilityAmnesiaLink（ability 主键）互补：本 gate 以 amnesia 为主键.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_AMNESIA / UNKNOWN_ABILITY
 *  CHILD_AMNESIA_FAIL / CHILD_ABILITY_FAIL
 *  NO_USE_AT_RECOVER / ACQUIRED_AFTER_RECOVER
 *  RECOVER_WITHOUT_ABILITY
 *  PENDING_AMNESIA (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  AmnesiaArcEntrySchema,
  evaluateAmnesiaArc,
} from './amnesia-arc-gate';
import {
  AbilityEntrySchema,
  AbilityUseSchema,
  evaluateAbilityRules,
} from './ability-rule-gate';

const Ep = z.number().int().positive();

export const AmnesiaAbilityLinkEntrySchema = z.object({
  id: z.string().min(1),
  amnesiaId: z.string().min(1),
  abilityId: z.string().min(1),
  note: z.string().optional(),
});

export const AmnesiaAbilityLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  amnesias: z.array(AmnesiaArcEntrySchema),
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  links: z.array(AmnesiaAbilityLinkEntrySchema),
});

export type AmnesiaAbilityLinkLedger = z.infer<typeof AmnesiaAbilityLinkLedgerSchema>;

export type AmnesiaAbilityLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_AMNESIA'
    | 'UNKNOWN_ABILITY'
    | 'CHILD_AMNESIA_FAIL'
    | 'CHILD_ABILITY_FAIL'
    | 'NO_USE_AT_RECOVER'
    | 'ACQUIRED_AFTER_RECOVER'
    | 'RECOVER_WITHOUT_ABILITY'
    | 'PENDING_AMNESIA';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AmnesiaAbilityLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    amnesias: number;
    abilities: number;
    latestEp: number;
  };
  findings: AmnesiaAbilityLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAmnesiaAbilityLink(input: unknown): AmnesiaAbilityLinkReport {
  const parsed = AmnesiaAbilityLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, amnesias: 0, abilities: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, amnesias, abilities, uses, links } = parsed.data;
  const findings: AmnesiaAbilityLinkFinding[] = [];
  const push = (x: AmnesiaAbilityLinkFinding) => findings.push(x);

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

  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const l of links) {
    if (seen.has(l.id)) dups.add(l.id);
    else seen.add(l.id);
  }
  for (const id of dups) {
    push({ code: 'DUP_ID', severity: 'FAIL', ids: [id], message: `联表ID重复：${id}`, fix: '联表 id 须唯一' });
  }

  const byAm = new Map(amnesias.map((a) => [a.id, a]));
  const byAb = new Map(abilities.map((a) => [a.id, a]));
  const linkedAms = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const am = byAm.get(link.amnesiaId);
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
    if (am.recoverEp === undefined) {
      push({
        code: 'NO_USE_AT_RECOVER',
        severity: 'FAIL',
        ids: [link.id, am.id],
        message: `${link.id}: amnesia ${am.id} 尚未 recover`,
        fix: '须先标 recoverEp',
      });
      continue;
    }
    if (ab.acquiredEp > am.recoverEp) {
      push({
        code: 'ACQUIRED_AFTER_RECOVER',
        severity: 'FAIL',
        ids: [link.id, ab.id],
        message: `${link.id}: ability ${ab.id} acquiredEp=E${ab.acquiredEp} > recover E${am.recoverEp}`,
        fix: '能力须在唤回集前或当集已拿到',
      });
      continue;
    }
    const used = uses.some((u) => u.abilityId === ab.id && u.by === ab.holder && u.ep === am.recoverEp);
    if (!used) {
      push({
        code: 'NO_USE_AT_RECOVER',
        severity: 'FAIL',
        ids: [link.id, ab.id],
        message: `${link.id}: ability ${ab.id} 在 recover E${am.recoverEp} 无 holder 使用`,
        fix: '唤回集须有金手指使用',
      });
      continue;
    }
    linkedAms.add(am.id);
    aligned += 1;
  }

  for (const a of amnesias) {
    if (a.recoverEp !== undefined && !linkedAms.has(a.id)) {
      push({
        code: 'RECOVER_WITHOUT_ABILITY',
        severity: 'FAIL',
        ids: [a.id],
        message: `amnesia ${a.id} recoverEp=E${a.recoverEp} 无 amnesia×ability 联表`,
        fix: '为唤回集挂 AmnesiaAbilityLink',
      });
    } else if (!linkedAms.has(a.id)) {
      push({
        code: 'PENDING_AMNESIA',
        severity: 'WARN',
        ids: [a.id],
        message: `amnesia ${a.id} 尚未联表到 amnesia×ability`,
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
      abilities: abilities.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
