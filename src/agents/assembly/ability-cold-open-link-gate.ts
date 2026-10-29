/**
 * V12 · Ability × Cold-Open Link Gate (金手指 × 冷开钩 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 金手指当集使用常冷开快入抛钩.
 *  - 与 abilityVestLink / vestColdOpenLink 互补：本 gate 以 ability 联 coldOpen.
 *
 * coldOpens[]: { id, ep, shotSpec }
 *  SCHEMA / DUP_ID / UNKNOWN_ABILITY / UNKNOWN_COLD_OPEN / FUTURE_EP
 *  CHILD_ABILITY_FAIL / CHILD_COLD_OPEN_FAIL
 *  EP_NOT_USE — link.ep = coldOpen.ep 且 holder 在该 ep 有 use
 *  NO_USE_AT_COLD / COLD_OPEN_WITHOUT_ABILITY
 *  PENDING_ABILITY (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { evaluateColdOpenHook } from './cold-open-hook-gate';
import {
  AbilityEntrySchema,
  AbilityUseSchema,
  evaluateAbilityRules,
} from './ability-rule-gate';

const Ep = z.number().int().positive();

export const AbilityColdOpenColdOpenEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const AbilityColdOpenLinkEntrySchema = z.object({
  id: z.string().min(1),
  abilityId: z.string().min(1),
  coldOpenId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const AbilityColdOpenLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  coldOpens: z.array(AbilityColdOpenColdOpenEntrySchema),
  links: z.array(AbilityColdOpenLinkEntrySchema),
});

export type AbilityColdOpenLinkLedger = z.infer<typeof AbilityColdOpenLinkLedgerSchema>;

export type AbilityColdOpenLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_ABILITY'
    | 'UNKNOWN_COLD_OPEN'
    | 'FUTURE_EP'
    | 'CHILD_ABILITY_FAIL'
    | 'CHILD_COLD_OPEN_FAIL'
    | 'EP_NOT_USE'
    | 'NO_USE_AT_COLD'
    | 'COLD_OPEN_WITHOUT_ABILITY'
    | 'PENDING_ABILITY';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AbilityColdOpenLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    abilities: number;
    coldOpens: number;
    latestEp: number;
  };
  findings: AbilityColdOpenLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAbilityColdOpenLink(input: unknown): AbilityColdOpenLinkReport {
  const parsed = AbilityColdOpenLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, abilities: 0, coldOpens: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, abilities, uses, coldOpens, links } = parsed.data;
  const findings: AbilityColdOpenLinkFinding[] = [];
  const push = (x: AbilityColdOpenLinkFinding) => findings.push(x);

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

  for (const co of coldOpens) {
    const r = evaluateColdOpenHook(co.shotSpec);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_COLD_OPEN_FAIL',
        severity: 'FAIL',
        ids: [co.id, ...childFails.flatMap((f) => f.shotIds ?? [])],
        message: `coldOpen ${co.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 cold-open-hook-gate',
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
    push({ code: 'DUP_ID', severity: 'FAIL', ids: [id], message: `联表ID重复：${id}`, fix: '联表 id 须唯一' });
  }

  const byAb = new Map(abilities.map((a) => [a.id, a]));
  const byC = new Map(coldOpens.map((c) => [c.id, c]));
  const pairedAb = new Set<string>();
  const pairedC = new Set<string>();
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
    const co = byC.get(link.coldOpenId);
    if (!co) {
      push({
        code: 'UNKNOWN_COLD_OPEN',
        severity: 'FAIL',
        ids: [link.id, link.coldOpenId],
        message: `联表 ${link.id} 引用未知 coldOpen ${link.coldOpenId}`,
        fix: 'coldOpenId 须存在于 coldOpens[]',
      });
      continue;
    }

    if (link.ep !== co.ep) {
      push({
        code: 'EP_NOT_USE',
        severity: 'FAIL',
        ids: [link.id, ab.id, co.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 coldOpen=${co.ep}`,
        fix: '能力使用与冷开须同集',
      });
      continue;
    }

    const used = uses.some((u) => u.abilityId === ab.id && u.by === ab.holder && u.ep === link.ep);
    if (!used) {
      push({
        code: 'NO_USE_AT_COLD',
        severity: 'FAIL',
        ids: [link.id, ab.id],
        message: `${link.id}: ability ${ab.id} 在 E${link.ep} 无 holder 使用`,
        fix: '能力×冷开同框须有使用',
      });
      continue;
    }

    pairedAb.add(ab.id);
    pairedC.add(co.id);
    aligned += 1;
  }

  for (const co of coldOpens) {
    if (!pairedC.has(co.id)) {
      push({
        code: 'COLD_OPEN_WITHOUT_ABILITY',
        severity: 'FAIL',
        ids: [co.id],
        message: `coldOpen ${co.id} 无 ability 联表`,
        fix: '为冷开挂 AbilityColdOpenLink',
      });
    }
  }
  for (const a of abilities) {
    if (!pairedAb.has(a.id)) {
      push({
        code: 'PENDING_ABILITY',
        severity: 'WARN',
        ids: [a.id],
        message: `ability ${a.id} 尚未联表`,
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
      coldOpens: coldOpens.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
