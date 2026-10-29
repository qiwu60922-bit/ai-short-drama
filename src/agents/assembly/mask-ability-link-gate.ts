/**
 * V12 · Persona-Mask × Ability-Rule Link Gate (伪装人设 × 金手指规则 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《伪人降临！我是全场唯一预言家》: 唯一持有者 = mask/identity 穿戴者；揭穿前能力仍须守规则.
 *  - 《逃婚三年，江少的花心人设崩了》: mask reveal 后金手指/真心能力才可公开用.
 *  - 与 abilityMaskLink（ability 主键）互补：本 gate 以 mask 为主键强制「有 reveal 须对齐 ability」。
 *
 *  SCHEMA / DUP_ID / UNKNOWN_ABILITY / UNKNOWN_MASK
 *  CHILD_ABILITY_FAIL / CHILD_MASK_FAIL
 *  HOLDER_WEARER_MISMATCH — ability.holder ≠ mask.wearer
 *  REVEAL_BEFORE_ACQUIRED — mask.revealEp < ability.acquiredEp
 *  NO_USE_AFTER_REVEAL — 已 reveal 但 revealEp..latestEp 无 holder 使用记录
 *  ABILITY_PENDING_WITH_MASK (WARN) — mask 未 reveal 且能力已 acquired
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  AbilityEntrySchema,
  AbilityUseSchema,
  evaluateAbilityRules,
} from './ability-rule-gate';
import {
  PersonaMaskEntrySchema,
  evaluatePersonaMask,
} from './persona-mask-gate';

const Ep = z.number().int().positive();

export const MaskAbilityLinkEntrySchema = z.object({
  id: z.string().min(1),
  abilityId: z.string().min(1),
  maskId: z.string().min(1),
  note: z.string().optional(),
});

export const MaskAbilityLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  masks: z.array(PersonaMaskEntrySchema),
  links: z.array(MaskAbilityLinkEntrySchema),
});

export type MaskAbilityLinkLedger = z.infer<typeof MaskAbilityLinkLedgerSchema>;

export type MaskAbilityLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_ABILITY'
    | 'UNKNOWN_MASK'
    | 'CHILD_ABILITY_FAIL'
    | 'CHILD_MASK_FAIL'
    | 'HOLDER_WEARER_MISMATCH'
    | 'REVEAL_BEFORE_ACQUIRED'
    | 'NO_USE_AFTER_REVEAL'
    | 'ABILITY_PENDING_WITH_MASK';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface MaskAbilityLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    pending: number;
    abilities: number;
    masks: number;
    latestEp: number;
  };
  findings: MaskAbilityLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateMaskAbilityLink(input: unknown): MaskAbilityLinkReport {
  const parsed = MaskAbilityLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, pending: 0, abilities: 0, masks: 0, latestEp: 0 },
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

  const { series, latestEp, abilities, uses, masks, links } = parsed.data;
  const findings: MaskAbilityLinkFinding[] = [];
  const push = (x: MaskAbilityLinkFinding) => findings.push(x);

  const abReport = evaluateAbilityRules({ series, latestEp, abilities, uses });
  if (abReport.verdict === 'FAIL') {
    const childFails = abReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_ABILITY_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌金手指账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 ability-rule-gate（次数/持有/拿到就用）',
    });
  }

  const maskReport = evaluatePersonaMask({ series, latestEp, entries: masks });
  if (maskReport.verdict === 'FAIL') {
    const childFails = maskReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_MASK_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌伪装账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 persona-mask-gate（plant→maintain→reveal）',
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
  const byMask = new Map(masks.map((m) => [m.id, m]));
  let aligned = 0;
  let pending = 0;

  for (const link of links) {
    const ab = byAb.get(link.abilityId);
    const mask = byMask.get(link.maskId);
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
    if (!mask) {
      push({
        code: 'UNKNOWN_MASK',
        severity: 'FAIL',
        ids: [link.id, link.maskId],
        message: `联表 ${link.id} 引用未知 mask ${link.maskId}`,
        fix: 'maskId 须存在于 masks[]',
      });
      continue;
    }

    if (ab.holder !== mask.wearer) {
      push({
        code: 'HOLDER_WEARER_MISMATCH',
        severity: 'FAIL',
        ids: [link.id, ab.id, mask.id],
        message: `${link.id}: ability.holder=${ab.holder} ≠ mask.wearer=${mask.wearer}`,
        fix: '金手指持有者须与伪装穿戴者同一角色',
      });
      continue;
    }

    if (mask.revealEp !== undefined && mask.revealEp < ab.acquiredEp) {
      push({
        code: 'REVEAL_BEFORE_ACQUIRED',
        severity: 'FAIL',
        ids: [link.id, ab.id, mask.id],
        message: `${link.id}: mask reveal@E${mask.revealEp} 早于 ability acquired@E${ab.acquiredEp}`,
        fix: '先觉醒/拿到金手指，再崩塌伪装；或下调 acquiredEp',
      });
      continue;
    }

    if (mask.revealEp === undefined) {
      pending += 1;
      push({
        code: 'ABILITY_PENDING_WITH_MASK',
        severity: 'WARN',
        ids: [link.id, ab.id, mask.id],
        message: `${link.id}: mask ${mask.id} 未 reveal，ability ${ab.id} 已 acquired@E${ab.acquiredEp}`,
        fix: '规划 revealLabel/revealEp，或确认伪装长线覆盖能力',
      });
      aligned += 1;
      continue;
    }

    const usedAfter = uses.some(
      (u) =>
        u.abilityId === ab.id &&
        u.by === ab.holder &&
        u.ep >= mask.revealEp! &&
        u.ep <= latestEp,
    );
    if (!usedAfter) {
      push({
        code: 'NO_USE_AFTER_REVEAL',
        severity: 'FAIL',
        ids: [link.id, ab.id, mask.id],
        message: `${link.id}: mask 已 reveal@E${mask.revealEp}，但之后无 holder 使用 ability`,
        fix: '揭穿当集或随后立刻用一次金手指，让观众看见「面具下的真规则」',
      });
      continue;
    }

    aligned += 1;
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      pending,
      abilities: abilities.length,
      masks: masks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
