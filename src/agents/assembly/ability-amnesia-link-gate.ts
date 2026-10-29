/**
 * V12 · Ability × Amnesia Link Gate (金手指 × 失忆唤回 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《伪人降临》/《反派拿捏》: 唤回集常兑现金手指使用.
 *  - 与 amnesiaAbilityLink（amnesia 主键）互补：本 gate 以 ability 为主键.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_ABILITY / UNKNOWN_AMNESIA
 *  CHILD_ABILITY_FAIL / CHILD_AMNESIA_FAIL
 *  NO_USE_AT_RECOVER — recoverEp 须有 holder use
 *  ACQUIRED_AFTER_RECOVER
 *  RECOVER_WITHOUT_ABILITY — 已 recover 无联表（via pending ability side: ABILITY_WITHOUT_AMNESIA for tipped abilities unused）
 *  ABILITY_WITHOUT_AMNESIA — 已 acquired 能力无联表到已 recover 失忆
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
  AmnesiaArcEntrySchema,
  evaluateAmnesiaArc,
} from './amnesia-arc-gate';

const Ep = z.number().int().positive();

export const AbilityAmnesiaLinkEntrySchema = z.object({
  id: z.string().min(1),
  abilityId: z.string().min(1),
  amnesiaId: z.string().min(1),
  note: z.string().optional(),
});

export const AbilityAmnesiaLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  amnesias: z.array(AmnesiaArcEntrySchema),
  links: z.array(AbilityAmnesiaLinkEntrySchema),
});

export type AbilityAmnesiaLinkLedger = z.infer<typeof AbilityAmnesiaLinkLedgerSchema>;

export type AbilityAmnesiaLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_ABILITY'
    | 'UNKNOWN_AMNESIA'
    | 'CHILD_ABILITY_FAIL'
    | 'CHILD_AMNESIA_FAIL'
    | 'NO_USE_AT_RECOVER'
    | 'ACQUIRED_AFTER_RECOVER'
    | 'ABILITY_WITHOUT_AMNESIA'
    | 'PENDING_ABILITY';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AbilityAmnesiaLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    abilities: number;
    amnesias: number;
    latestEp: number;
  };
  findings: AbilityAmnesiaLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAbilityAmnesiaLink(input: unknown): AbilityAmnesiaLinkReport {
  const parsed = AbilityAmnesiaLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, abilities: 0, amnesias: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, abilities, uses, amnesias, links } = parsed.data;
  const findings: AbilityAmnesiaLinkFinding[] = [];
  const push = (x: AbilityAmnesiaLinkFinding) => findings.push(x);

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
  const byAm = new Map(amnesias.map((a) => [a.id, a]));
  const linkedAbs = new Set<string>();
  let aligned = 0;

  for (const link of links) {
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
    linkedAbs.add(ab.id);
    aligned += 1;
  }

  for (const a of abilities) {
    if (!linkedAbs.has(a.id)) {
      // If any amnesia has recover, require link; else pending warn
      const anyRecover = amnesias.some((x) => x.recoverEp !== undefined);
      if (anyRecover) {
        push({
          code: 'ABILITY_WITHOUT_AMNESIA',
          severity: 'FAIL',
          ids: [a.id],
          message: `ability ${a.id} 无 ability×amnesia 联表（已有 recover 失忆）`,
          fix: '为能力挂 AbilityAmnesiaLink',
        });
      } else {
        push({
          code: 'PENDING_ABILITY',
          severity: 'WARN',
          ids: [a.id],
          message: `ability ${a.id} 尚未联表到 ability×amnesia`,
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
      abilities: abilities.length,
      amnesias: amnesias.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
