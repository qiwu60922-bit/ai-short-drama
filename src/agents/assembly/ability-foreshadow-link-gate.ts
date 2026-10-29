/**
 * V12 · Ability × Foreshadow Link Gate (金手指 × 伏笔兑现 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《伪人降临》/《帐中香》: S/A 伏笔 payoff 常踩金手指使用窗.
 *  - ability-rule 管 acquired/use；foreshadow-ledger 管 plant→payoff——本 gate 硬对齐 use@payoff.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_ABILITY / UNKNOWN_FORESHADOW / FUTURE_EP
 *  CHILD_ABILITY_FAIL / CHILD_FORESHADOW_FAIL
 *  EP_NOT_PAYOFF — link.ep = payoffEp 且 holder 在该 ep 有 use
 *  PAYOFF_WITHOUT_ABILITY / NO_USE_AT_PAYOFF
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
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
} from './foreshadow-ledger-gate';

const Ep = z.number().int().positive();

export const AbilityForeshadowLinkEntrySchema = z.object({
  id: z.string().min(1),
  abilityId: z.string().min(1),
  foreshadowId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const AbilityForeshadowLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  items: z.array(ForeshadowItemSchema),
  links: z.array(AbilityForeshadowLinkEntrySchema),
});

export type AbilityForeshadowLinkLedger = z.infer<typeof AbilityForeshadowLinkLedgerSchema>;

export type AbilityForeshadowLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_ABILITY'
    | 'UNKNOWN_FORESHADOW'
    | 'FUTURE_EP'
    | 'CHILD_ABILITY_FAIL'
    | 'CHILD_FORESHADOW_FAIL'
    | 'EP_NOT_PAYOFF'
    | 'PAYOFF_WITHOUT_ABILITY'
    | 'NO_USE_AT_PAYOFF'
    | 'PENDING_ABILITY';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AbilityForeshadowLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    abilities: number;
    items: number;
    latestEp: number;
  };
  findings: AbilityForeshadowLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAbilityForeshadowLink(input: unknown): AbilityForeshadowLinkReport {
  const parsed = AbilityForeshadowLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, abilities: 0, items: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, abilities, uses, items, links } = parsed.data;
  const findings: AbilityForeshadowLinkFinding[] = [];
  const push = (x: AbilityForeshadowLinkFinding) => findings.push(x);

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

  const fsReport = evaluateForeshadowLedger({ series, latestEp, items });
  if (fsReport.verdict === 'FAIL') {
    const childFails = fsReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_FORESHADOW_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌伏笔账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 foreshadow-ledger-gate',
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
  const byFs = new Map(items.map((i) => [i.id, i]));
  const pairedAbs = new Set<string>();
  const pairedFs = new Set<string>();
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
    const item = byFs.get(link.foreshadowId);
    if (!item) {
      push({
        code: 'UNKNOWN_FORESHADOW',
        severity: 'FAIL',
        ids: [link.id, link.foreshadowId],
        message: `联表 ${link.id} 引用未知 foreshadow ${link.foreshadowId}`,
        fix: 'foreshadowId 须存在于 items[]',
      });
      continue;
    }

    if (item.payoffEp === undefined || link.ep !== item.payoffEp) {
      push({
        code: 'EP_NOT_PAYOFF',
        severity: 'FAIL',
        ids: [link.id, ab.id, item.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 payoff=${item.payoffEp ?? '无'}`,
        fix: '金手指使用须踩伏笔回收集',
      });
      continue;
    }

    const used = uses.some((u) => u.abilityId === ab.id && u.by === ab.holder && u.ep === link.ep);
    if (!used) {
      push({
        code: 'NO_USE_AT_PAYOFF',
        severity: 'FAIL',
        ids: [link.id, ab.id],
        message: `${link.id}: ability ${ab.id} 在 payoff E${link.ep} 无 holder use`,
        fix: '补 uses[] 于 payoff 集',
      });
      continue;
    }

    pairedAbs.add(ab.id);
    pairedFs.add(item.id);
    aligned += 1;
  }

  for (const item of items) {
    if (item.payoffEp !== undefined && !pairedFs.has(item.id)) {
      push({
        code: 'PAYOFF_WITHOUT_ABILITY',
        severity: 'FAIL',
        ids: [item.id],
        message: `foreshadow ${item.id} payoffEp=E${item.payoffEp} 无 ability 联表`,
        fix: '为伏笔兑现集挂 AbilityForeshadowLink',
      });
    }
  }
  for (const ab of abilities) {
    if (!pairedAbs.has(ab.id)) {
      push({
        code: 'PENDING_ABILITY',
        severity: 'WARN',
        ids: [ab.id],
        message: `ability ${ab.id} 尚未联表到 foreshadow`,
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
      items: items.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
