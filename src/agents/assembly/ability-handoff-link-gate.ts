/**
 * V12 · Ability-Rule × Cliffhanger-Handoff Link Gate (金手指 × 集间悬念承接 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《伪人降临》: 能力兑现当集尾卡悬念，下集 hook 承接规则线.
 *  - ability-rule 管次数/持有；cliffhanger-handoff 管两 ShotSpec——本 gate 硬对齐 use@prevEp.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_ABILITY / UNKNOWN_HANDOFF
 *  CHILD_ABILITY_FAIL / CHILD_HANDOFF_FAIL
 *  ACQUIRED_AFTER_HANDOFF — acquiredEp > handoff.prevEp
 *  NO_USE_AT_HANDOFF — prevEp 无 holder 使用
 *  HANDOFF_WITHOUT_ABILITY — handoff 未联表
 *  PENDING_ABILITY (WARN)
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

export const AbilityHandoffEntrySchema = z.object({
  id: z.string().min(1),
  prevEp: Ep,
  nextEp: Ep,
  prev: ShotSpecDocSchema,
  next: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const AbilityHandoffLinkEntrySchema = z.object({
  id: z.string().min(1),
  abilityId: z.string().min(1),
  handoffId: z.string().min(1),
  note: z.string().optional(),
});

export const AbilityHandoffLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  handoffs: z.array(AbilityHandoffEntrySchema),
  links: z.array(AbilityHandoffLinkEntrySchema),
});

export type AbilityHandoffLinkLedger = z.infer<typeof AbilityHandoffLinkLedgerSchema>;

export type AbilityHandoffLinkFinding = {
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
    | 'PENDING_ABILITY';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AbilityHandoffLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    abilities: number;
    handoffs: number;
    latestEp: number;
  };
  findings: AbilityHandoffLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAbilityHandoffLink(input: unknown): AbilityHandoffLinkReport {
  const parsed = AbilityHandoffLinkLedgerSchema.safeParse(input);
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
  const findings: AbilityHandoffLinkFinding[] = [];
  const push = (x: AbilityHandoffLinkFinding) => findings.push(x);

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
        code: 'PENDING_ABILITY',
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
