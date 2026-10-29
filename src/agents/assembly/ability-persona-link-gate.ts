/**
 * V12 · Ability × Persona Link Gate (金手指 × 人设卡 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《伪人降临》/《机长先生》: 金手指持有者须挂外形卡，避免空壳能力脸.
 *  - ability-rule 管 acquired/use；persona-card 管外形锚点——本 gate 硬联表.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_ABILITY / UNKNOWN_CARD
 *  CHILD_ABILITY_FAIL / CHILD_PERSONA_FAIL
 *  ABILITY_WITHOUT_PERSONA / PENDING_CARD (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  AbilityEntrySchema,
  AbilityUseSchema,
  evaluateAbilityRules,
} from './ability-rule-gate';
import { PersonaCardSchema, evaluatePersonaCard } from './persona-card-gate';

const Ep = z.number().int().positive();

export const AbilityPersonaLinkEntrySchema = z.object({
  id: z.string().min(1),
  abilityId: z.string().min(1),
  cardSlug: z.string().min(1),
  note: z.string().optional(),
});

export const AbilityPersonaLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  cards: z.array(PersonaCardSchema).min(1),
  links: z.array(AbilityPersonaLinkEntrySchema),
});

export type AbilityPersonaLinkLedger = z.infer<typeof AbilityPersonaLinkLedgerSchema>;

export type AbilityPersonaLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_ABILITY'
    | 'UNKNOWN_CARD'
    | 'CHILD_ABILITY_FAIL'
    | 'CHILD_PERSONA_FAIL'
    | 'ABILITY_WITHOUT_PERSONA'
    | 'PENDING_CARD';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AbilityPersonaLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    abilities: number;
    cards: number;
    latestEp: number;
  };
  findings: AbilityPersonaLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAbilityPersonaLink(input: unknown): AbilityPersonaLinkReport {
  const parsed = AbilityPersonaLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, abilities: 0, cards: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, abilities, uses, cards, links } = parsed.data;
  const findings: AbilityPersonaLinkFinding[] = [];
  const push = (x: AbilityPersonaLinkFinding) => findings.push(x);

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

  for (const card of cards) {
    const r = evaluatePersonaCard(card);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_PERSONA_FAIL',
        severity: 'FAIL',
        ids: [card.slug, ...childFails.flatMap((f) => (f.path ? [f.path] : []))],
        message: `人设卡 ${card.slug} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 persona-card-gate',
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
  const byCard = new Map(cards.map((c) => [c.slug, c]));
  const pairedAb = new Set<string>();
  const pairedCards = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const ability = byAb.get(link.abilityId);
    const card = byCard.get(link.cardSlug);
    if (!ability) {
      push({
        code: 'UNKNOWN_ABILITY',
        severity: 'FAIL',
        ids: [link.id, link.abilityId],
        message: `联表 ${link.id} 引用未知 ability ${link.abilityId}`,
        fix: 'abilityId 须存在于 abilities[]',
      });
      continue;
    }
    if (!card) {
      push({
        code: 'UNKNOWN_CARD',
        severity: 'FAIL',
        ids: [link.id, link.cardSlug],
        message: `联表 ${link.id} 引用未知 card ${link.cardSlug}`,
        fix: 'cardSlug 须存在于 cards[]',
      });
      continue;
    }
    pairedAb.add(ability.id);
    pairedCards.add(card.slug);
    aligned += 1;
  }

  for (const a of abilities) {
    if (!pairedAb.has(a.id)) {
      push({
        code: 'ABILITY_WITHOUT_PERSONA',
        severity: 'FAIL',
        ids: [a.id],
        message: `ability ${a.id} 未挂 persona 联表`,
        fix: '在 links[] 挂 abilityId↔cardSlug',
      });
    }
  }
  for (const c of cards) {
    if (!pairedCards.has(c.slug)) {
      push({
        code: 'PENDING_CARD',
        severity: 'WARN',
        ids: [c.slug],
        message: `card ${c.slug} 尚未联表到 ability`,
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
      cards: cards.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
