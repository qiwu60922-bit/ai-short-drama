/**
 * V12 · Ability × Identity-Vest Link Gate (金手指/seer × 马甲掉落 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《伪人降临》: 查验类金手指使用常踩掉马甲窗，避免能力空转.
 *  - ability-rule 管 acquired/use；identity-vest 管 drop——本 gate 硬对齐 use@dropEp.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_ABILITY / UNKNOWN_VEST / FUTURE_EP
 *  CHILD_ABILITY_FAIL / CHILD_VEST_FAIL
 *  EP_NOT_DROP — link.ep = dropEp 且 holder 在该 ep 有 use
 *  DROP_WITHOUT_ABILITY / NO_USE_AT_DROP
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
  IdentityVestEntrySchema,
  evaluateIdentityVest,
} from './identity-vest-gate';

const Ep = z.number().int().positive();

export const AbilityVestLinkEntrySchema = z.object({
  id: z.string().min(1),
  abilityId: z.string().min(1),
  vestId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const AbilityVestLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  vests: z.array(IdentityVestEntrySchema),
  links: z.array(AbilityVestLinkEntrySchema),
});

export type AbilityVestLinkLedger = z.infer<typeof AbilityVestLinkLedgerSchema>;

export type AbilityVestLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_ABILITY'
    | 'UNKNOWN_VEST'
    | 'FUTURE_EP'
    | 'CHILD_ABILITY_FAIL'
    | 'CHILD_VEST_FAIL'
    | 'EP_NOT_DROP'
    | 'DROP_WITHOUT_ABILITY'
    | 'NO_USE_AT_DROP'
    | 'PENDING_ABILITY';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AbilityVestLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    abilities: number;
    vests: number;
    latestEp: number;
  };
  findings: AbilityVestLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAbilityVestLink(input: unknown): AbilityVestLinkReport {
  const parsed = AbilityVestLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, abilities: 0, vests: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, abilities, uses, vests, links } = parsed.data;
  const findings: AbilityVestLinkFinding[] = [];
  const push = (x: AbilityVestLinkFinding) => findings.push(x);

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

  const vReport = evaluateIdentityVest({ series, latestEp, entries: vests });
  if (vReport.verdict === 'FAIL') {
    const childFails = vReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_VEST_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌马甲账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 identity-vest-gate',
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
  const byVest = new Map(vests.map((v) => [v.id, v]));
  const pairedAbs = new Set<string>();
  const pairedVests = new Set<string>();
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
    const vest = byVest.get(link.vestId);
    if (!vest) {
      push({
        code: 'UNKNOWN_VEST',
        severity: 'FAIL',
        ids: [link.id, link.vestId],
        message: `联表 ${link.id} 引用未知 vest ${link.vestId}`,
        fix: 'vestId 须存在于 vests[]',
      });
      continue;
    }

    if (vest.dropEp === undefined || link.ep !== vest.dropEp) {
      push({
        code: 'EP_NOT_DROP',
        severity: 'FAIL',
        ids: [link.id, ab.id, vest.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 drop=${vest.dropEp ?? '无'}`,
        fix: '金手指使用须踩掉马甲集',
      });
      continue;
    }

    const used = uses.some((u) => u.abilityId === ab.id && u.by === ab.holder && u.ep === link.ep);
    if (!used) {
      push({
        code: 'NO_USE_AT_DROP',
        severity: 'FAIL',
        ids: [link.id, ab.id],
        message: `${link.id}: ability ${ab.id} 在 drop E${link.ep} 无 holder 使用`,
        fix: '掉马甲集须有金手指使用',
      });
      continue;
    }

    pairedAbs.add(ab.id);
    pairedVests.add(vest.id);
    aligned += 1;
  }

  for (const v of vests) {
    if (v.dropEp !== undefined && !pairedVests.has(v.id)) {
      push({
        code: 'DROP_WITHOUT_ABILITY',
        severity: 'FAIL',
        ids: [v.id],
        message: `vest ${v.id} dropEp=E${v.dropEp} 无 ability 联表`,
        fix: '为掉落集挂 AbilityVestLink',
      });
    }
  }
  for (const a of abilities) {
    if (!pairedAbs.has(a.id)) {
      push({
        code: 'PENDING_ABILITY',
        severity: 'WARN',
        ids: [a.id],
        message: `ability ${a.id} 尚未联表到 vest`,
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
      vests: vests.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
