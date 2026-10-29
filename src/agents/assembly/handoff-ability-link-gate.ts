/**
 * V12 · Cliffhanger-Handoff × Ability Link Gate (集间悬念承接 × 金手指/seer 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 与 abilityHandoffLink（ability 主键）互补：本 gate 以 handoff 为主键强制「有 handoff 须对齐 use」。
 *
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import {
  AbilityEntrySchema,
  AbilityUseSchema,
  evaluateAbilityRules,
} from './ability-rule-gate';
import { evaluateCliffhangerHandoff } from './cliffhanger-handoff-gate';

const Ep = z.number().int().positive();

export const HandoffAbilityEntrySchema = z.object({
  id: z.string().min(1),
  prevEp: Ep,
  nextEp: Ep,
  prev: ShotSpecDocSchema,
  next: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const HandoffAbilityLinkEntrySchema = z.object({
  id: z.string().min(1),
  abilityId: z.string().min(1),
  handoffId: z.string().min(1),
  note: z.string().optional(),
});

export const HandoffAbilityLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  handoffs: z.array(HandoffAbilityEntrySchema),
  links: z.array(HandoffAbilityLinkEntrySchema),
});

export type HandoffAbilityLinkLedger = z.infer<typeof HandoffAbilityLinkLedgerSchema>;

export type HandoffAbilityLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_ABILITY'
    | 'UNKNOWN_HANDOFF'
    | 'CHILD_ABILITY_FAIL'
    | 'CHILD_HANDOFF_FAIL'
    | 'ACQUIRED_AFTER_HANDOFF'
    | 'NO_USE_AT_HANDOFF'
    | 'HANDOFF_WITHOUT_ABILITY'
    | 'PENDING_HANDOFF';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface HandoffAbilityLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    abilities: number;
    handoffs: number;
    latestEp: number;
  };
  findings: HandoffAbilityLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateHandoffAbilityLink(input: unknown): HandoffAbilityLinkReport {
  const parsed = HandoffAbilityLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, abilities: 0, handoffs: 0, latestEp: 0 },
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

  const { series, latestEp, abilities, uses, handoffs, links } = parsed.data;
  const findings: HandoffAbilityLinkFinding[] = [];
  const push = (x: HandoffAbilityLinkFinding) => findings.push(x);

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

  for (const h of handoffs) {
    const r = evaluateCliffhangerHandoff(h.prev, h.next);
    if (r.verdict === 'FAIL') {
      const codes = r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
      push({
        code: 'CHILD_HANDOFF_FAIL',
        severity: 'FAIL',
        ids: [h.id],
        message: `handoff ${h.id} FAIL：${codes.join(',') || 'unknown'}`,
        fix: '先修 cliffhanger-handoff-gate',
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

  const byAb = new Map(abilities.map((a) => [a.id, a]));
  const byH = new Map(handoffs.map((h) => [h.id, h]));
  const pairedH = new Set<string>();
  const pairedAbs = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const ab = byAb.get(link.abilityId);
    const handoff = byH.get(link.handoffId);
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
    pairedH.add(handoff.id);
    pairedAbs.add(ab.id);

    if (ab.acquiredEp > handoff.prevEp) {
      push({
        code: 'ACQUIRED_AFTER_HANDOFF',
        severity: 'FAIL',
        ids: [link.id, ab.id, handoff.id],
        message: `${link.id}: ability acquired@E${ab.acquiredEp} 晚于 handoff.prevEp=E${handoff.prevEp}`,
        fix: '先觉醒金手指，再卡悬念承接；或下调 acquiredEp',
      });
      continue;
    }

    const used = uses.some(
      (u) => u.abilityId === ab.id && u.by === ab.holder && u.ep === handoff.prevEp,
    );
    if (!used) {
      push({
        code: 'NO_USE_AT_HANDOFF',
        severity: 'FAIL',
        ids: [link.id, ab.id, handoff.id],
        message: `${link.id}: handoff.prevEp=E${handoff.prevEp} 无 holder 使用 ability`,
        fix: '悬念上一集用一次金手指兑现规则',
      });
      continue;
    }

    aligned += 1;
  }

  for (const h of handoffs) {
    if (!pairedH.has(h.id)) {
      push({
        code: 'HANDOFF_WITHOUT_ABILITY',
        severity: 'FAIL',
        ids: [h.id],
        message: `handoff ${h.id} 未挂 ability 联表`,
        fix: '在 links[] 挂 abilityId↔handoffId',
      });
    }
  }

  for (const a of abilities) {
    if (!pairedAbs.has(a.id)) {
      push({
        code: 'PENDING_HANDOFF',
        severity: 'WARN',
        ids: [a.id],
        message: `ability ${a.id} 尚未联表到 handoff`,
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
      handoffs: handoffs.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
