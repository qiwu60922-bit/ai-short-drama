/**
 * V12 · Persona × Cold-Open Link Gate (人设卡 × 冷开钩 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 冷开快入镜须锚定外形卡角色，不能空壳抛钩.
 *
 * coldOpens[]: { id, ep, shotSpec }
 *  SCHEMA / DUP_ID / UNKNOWN_CARD / UNKNOWN_COLD_OPEN / FUTURE_EP
 *  CHILD_PERSONA_FAIL / CHILD_COLD_OPEN_FAIL
 *  EP_NOT_COLD — link.ep = coldOpen.ep
 *  CARD_WITHOUT_COLD / COLD_OPEN_WITHOUT_PERSONA
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { evaluateColdOpenHook } from './cold-open-hook-gate';
import { PersonaCardSchema, evaluatePersonaCard } from './persona-card-gate';

const Ep = z.number().int().positive();

export const PersonaColdOpenColdOpenEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const PersonaColdOpenLinkEntrySchema = z.object({
  id: z.string().min(1),
  cardSlug: z.string().min(1),
  coldOpenId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const PersonaColdOpenLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  cards: z.array(PersonaCardSchema).min(1),
  coldOpens: z.array(PersonaColdOpenColdOpenEntrySchema),
  links: z.array(PersonaColdOpenLinkEntrySchema),
});

export type PersonaColdOpenLinkLedger = z.infer<typeof PersonaColdOpenLinkLedgerSchema>;

export type PersonaColdOpenLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_CARD'
    | 'UNKNOWN_COLD_OPEN'
    | 'FUTURE_EP'
    | 'CHILD_PERSONA_FAIL'
    | 'CHILD_COLD_OPEN_FAIL'
    | 'EP_NOT_COLD'
    | 'CARD_WITHOUT_COLD'
    | 'COLD_OPEN_WITHOUT_PERSONA';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface PersonaColdOpenLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    cards: number;
    coldOpens: number;
    latestEp: number;
  };
  findings: PersonaColdOpenLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluatePersonaColdOpenLink(input: unknown): PersonaColdOpenLinkReport {
  const parsed = PersonaColdOpenLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, cards: 0, coldOpens: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { latestEp, cards, coldOpens, links } = parsed.data;
  const findings: PersonaColdOpenLinkFinding[] = [];
  const push = (x: PersonaColdOpenLinkFinding) => findings.push(x);

  for (const card of cards) {
    const r = evaluatePersonaCard(card);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_PERSONA_FAIL',
        severity: 'FAIL',
        ids: [card.slug, ...childFails.map((f) => f.path).filter(Boolean) as string[]],
        message: `persona ${card.slug} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 persona-card-gate',
      });
    }
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

  const byCard = new Map(cards.map((c) => [c.slug, c]));
  const byCo = new Map(coldOpens.map((c) => [c.id, c]));
  const pairedCards = new Set<string>();
  const pairedCo = new Set<string>();
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
    const card = byCard.get(link.cardSlug);
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
    const co = byCo.get(link.coldOpenId);
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
        code: 'EP_NOT_COLD',
        severity: 'FAIL',
        ids: [link.id, card.slug, co.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 coldOpen.ep=E${co.ep}`,
        fix: 'link.ep 须等于 coldOpen.ep',
      });
      continue;
    }
    pairedCards.add(card.slug);
    pairedCo.add(co.id);
    aligned += 1;
  }

  for (const card of cards) {
    if (!pairedCards.has(card.slug)) {
      push({
        code: 'CARD_WITHOUT_COLD',
        severity: 'FAIL',
        ids: [card.slug],
        message: `persona ${card.slug} 无冷开联表`,
        fix: '为人设卡挂 PersonaColdOpenLink',
      });
    }
  }
  for (const co of coldOpens) {
    if (!pairedCo.has(co.id)) {
      push({
        code: 'COLD_OPEN_WITHOUT_PERSONA',
        severity: 'FAIL',
        ids: [co.id],
        message: `coldOpen ${co.id} 无人设卡联表`,
        fix: '为冷开挂 PersonaColdOpenLink',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      cards: cards.length,
      coldOpens: coldOpens.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
