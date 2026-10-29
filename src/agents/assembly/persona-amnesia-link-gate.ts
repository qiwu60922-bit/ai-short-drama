/**
 * V12 · Persona × Amnesia Link Gate (人设卡 × 失忆唤回 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《逃婚三年》: 外形卡角色常挂唤回 recover，避免空壳脸.
 *  - 与 amnesiaPersonaLink（amnesia 主键）互补：本 gate 以 persona card 为主键.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_CARD / UNKNOWN_AMNESIA
 *  CHILD_PERSONA_FAIL / CHILD_AMNESIA_FAIL
 *  CARD_WITHOUT_AMNESIA — 已 recover 场景下未挂卡
 *  PENDING_CARD (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { PersonaCardSchema, evaluatePersonaCard } from './persona-card-gate';
import {
  AmnesiaArcEntrySchema,
  evaluateAmnesiaArc,
} from './amnesia-arc-gate';

const Ep = z.number().int().positive();

export const PersonaAmnesiaLinkEntrySchema = z.object({
  id: z.string().min(1),
  cardSlug: z.string().min(1),
  amnesiaId: z.string().min(1),
  note: z.string().optional(),
});

export const PersonaAmnesiaLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  cards: z.array(PersonaCardSchema).min(1),
  amnesias: z.array(AmnesiaArcEntrySchema),
  links: z.array(PersonaAmnesiaLinkEntrySchema),
});

export type PersonaAmnesiaLinkLedger = z.infer<typeof PersonaAmnesiaLinkLedgerSchema>;

export type PersonaAmnesiaLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_CARD'
    | 'UNKNOWN_AMNESIA'
    | 'CHILD_PERSONA_FAIL'
    | 'CHILD_AMNESIA_FAIL'
    | 'CARD_WITHOUT_AMNESIA'
    | 'PENDING_CARD';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface PersonaAmnesiaLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    cards: number;
    amnesias: number;
    latestEp: number;
  };
  findings: PersonaAmnesiaLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluatePersonaAmnesiaLink(input: unknown): PersonaAmnesiaLinkReport {
  const parsed = PersonaAmnesiaLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, cards: 0, amnesias: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, cards, amnesias, links } = parsed.data;
  const findings: PersonaAmnesiaLinkFinding[] = [];
  const push = (x: PersonaAmnesiaLinkFinding) => findings.push(x);

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

  const aReport = evaluateAmnesiaArc({ series, latestEp, entries: amnesias });
  if (aReport.verdict === 'FAIL') {
    const childFails = aReport.findings.filter((f) => f.severity === 'FAIL');
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

  const byCard = new Map(cards.map((c) => [c.slug, c]));
  const byA = new Map(amnesias.map((a) => [a.id, a]));
  const pairedCards = new Set<string>();
  let aligned = 0;

  for (const link of links) {
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
    const amnesia = byA.get(link.amnesiaId);
    if (!amnesia) {
      push({
        code: 'UNKNOWN_AMNESIA',
        severity: 'FAIL',
        ids: [link.id, link.amnesiaId],
        message: `联表 ${link.id} 引用未知 amnesia ${link.amnesiaId}`,
        fix: 'amnesiaId 须存在于 amnesias[]',
      });
      continue;
    }
    pairedCards.add(card.slug);
    aligned += 1;
  }

  const anyRecover = amnesias.some((x) => x.recoverEp !== undefined);
  for (const c of cards) {
    if (!pairedCards.has(c.slug)) {
      if (anyRecover) {
        push({
          code: 'CARD_WITHOUT_AMNESIA',
          severity: 'FAIL',
          ids: [c.slug],
          message: `card ${c.slug} 无 persona×amnesia 联表（已有 recover 失忆）`,
          fix: '为人设卡挂 PersonaAmnesiaLink',
        });
      } else {
        push({
          code: 'PENDING_CARD',
          severity: 'WARN',
          ids: [c.slug],
          message: `card ${c.slug} 尚未联表到 persona×amnesia`,
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
      cards: cards.length,
      amnesias: amnesias.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
