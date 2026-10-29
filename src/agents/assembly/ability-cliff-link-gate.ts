/**
 * V12 · Ability-Rule × Cliff-Cascade Link Gate (金手指规则 × 跨集悬念叠钩 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《伪人降临！我是全场唯一预言家》: cliff 窗内须有能力使用兑现规则，不能空悬念.
 *  - 《持械入宋》: 季间危机承接可挂金手指首用/加码用.
 *  - ability-rule 管次数/持有；cliff-cascade 管 prev→next 叠钩——本 gate 硬联表 use@window.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_ABILITY / UNKNOWN_CLIFF
 *  CHILD_ABILITY_FAIL / CHILD_CASCADE_FAIL
 *  ACQUIRED_AFTER_CLIFF — acquiredEp > cliff.nextEp
 *  NO_USE_IN_WINDOW — cliff.prevEp..nextEp 无 holder 使用
 *  CLIFF_WITHOUT_ABILITY — cliff 条目未被联表挂上
 *  PENDING_ABILITY (WARN) — ability 已登记但无 cliff 联表
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  AbilityEntrySchema,
  AbilityUseSchema,
  evaluateAbilityRules,
} from './ability-rule-gate';
import {
  CliffCascadeLinkEntrySchema,
  evaluateCliffCascadeLink,
} from './cliff-cascade-link-gate';

const Ep = z.number().int().positive();

export const AbilityCliffLinkEntrySchema = z.object({
  id: z.string().min(1),
  abilityId: z.string().min(1),
  cliffLinkId: z.string().min(1),
  note: z.string().optional(),
});

export const AbilityCliffLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  links: z.array(AbilityCliffLinkEntrySchema),
});

export type AbilityCliffLinkLedger = z.infer<typeof AbilityCliffLinkLedgerSchema>;

export type AbilityCliffLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_ABILITY'
    | 'UNKNOWN_CLIFF'
    | 'CHILD_ABILITY_FAIL'
    | 'CHILD_CASCADE_FAIL'
    | 'ACQUIRED_AFTER_CLIFF'
    | 'NO_USE_IN_WINDOW'
    | 'CLIFF_WITHOUT_ABILITY'
    | 'PENDING_ABILITY';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AbilityCliffLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    abilities: number;
    cliffLinks: number;
    latestEp: number;
  };
  findings: AbilityCliffLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAbilityCliffLink(input: unknown): AbilityCliffLinkReport {
  const parsed = AbilityCliffLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, abilities: 0, cliffLinks: 0, latestEp: 0 },
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

  const { series, latestEp, abilities, uses, cliffLinks, links } = parsed.data;
  const findings: AbilityCliffLinkFinding[] = [];
  const push = (x: AbilityCliffLinkFinding) => findings.push(x);

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

  if (cliffLinks.length) {
    const cascade = evaluateCliffCascadeLink({ series, latestEp, links: cliffLinks });
    if (cascade.verdict === 'FAIL') {
      const childFails = cascade.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_CASCADE_FAIL',
        severity: 'FAIL',
        ids: childFails.flatMap((f) => f.ids ?? []),
        message: `内嵌 cliffCascade FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 cliff-cascade-link-gate（handoff + opening cascade）',
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
  const byCliff = new Map(cliffLinks.map((c) => [c.id, c]));
  const pairedCliffs = new Set<string>();
  const pairedAbs = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const ab = byAb.get(link.abilityId);
    const cliff = byCliff.get(link.cliffLinkId);
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
    if (!cliff) {
      push({
        code: 'UNKNOWN_CLIFF',
        severity: 'FAIL',
        ids: [link.id, link.cliffLinkId],
        message: `联表 ${link.id} 引用未知 cliffLink ${link.cliffLinkId}`,
        fix: 'cliffLinkId 须存在于 cliffLinks[]',
      });
      continue;
    }
    pairedCliffs.add(cliff.id);
    pairedAbs.add(ab.id);

    if (ab.acquiredEp > cliff.nextEp) {
      push({
        code: 'ACQUIRED_AFTER_CLIFF',
        severity: 'FAIL',
        ids: [link.id, ab.id, cliff.id],
        message: `${link.id}: ability acquired@E${ab.acquiredEp} 晚于 cliff nextEp=E${cliff.nextEp}`,
        fix: '先觉醒金手指，再挂悬崖窗；或下调 acquiredEp',
      });
      continue;
    }

    const usedInWindow = uses.some(
      (u) =>
        u.abilityId === ab.id &&
        u.by === ab.holder &&
        u.ep >= cliff.prevEp &&
        u.ep <= cliff.nextEp,
    );
    if (!usedInWindow) {
      push({
        code: 'NO_USE_IN_WINDOW',
        severity: 'FAIL',
        ids: [link.id, ab.id, cliff.id],
        message: `${link.id}: cliff E${cliff.prevEp}→E${cliff.nextEp} 窗内无 holder 使用 ability`,
        fix: '在悬念窗内用一次金手指，让叠钩兑现规则',
      });
      continue;
    }

    aligned += 1;
  }

  for (const c of cliffLinks) {
    if (!pairedCliffs.has(c.id)) {
      push({
        code: 'CLIFF_WITHOUT_ABILITY',
        severity: 'FAIL',
        ids: [c.id],
        message: `cliffLink ${c.id} 未挂 ability 联表`,
        fix: '在 links[] 挂 abilityId↔cliffLinkId',
      });
    }
  }

  for (const a of abilities) {
    if (!pairedAbs.has(a.id)) {
      push({
        code: 'PENDING_ABILITY',
        severity: 'WARN',
        ids: [a.id],
        message: `ability ${a.id} 尚未联表到 cliffCascade`,
        fix: '补 links[] 或确认该能力不挂悬崖窗',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      abilities: abilities.length,
      cliffLinks: cliffLinks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
