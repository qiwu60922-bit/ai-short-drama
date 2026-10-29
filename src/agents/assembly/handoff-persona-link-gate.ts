/**
 * V12 · Handoff × Persona Link Gate (集间悬念承接 × 人设卡 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《机长先生》: 下集 hook 承接须挂外形卡角色，避免空壳对峙.
 *  - cliffhanger-handoff 管两 ShotSpec；persona-card 管外形——本 gate 以 handoff 为主键硬联表.
 *  - 与 personaHandoffLink（人设主键）互补：本 gate 强制「有 handoff 必须有人设」.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_HANDOFF / UNKNOWN_CARD
 *  CHILD_PERSONA_FAIL / CHILD_HANDOFF_FAIL
 *  HANDOFF_WITHOUT_PERSONA / PENDING_CARD (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { PersonaCardSchema, evaluatePersonaCard } from './persona-card-gate';
import { evaluateCliffhangerHandoff } from './cliffhanger-handoff-gate';

const Ep = z.number().int().positive();

export const HandoffPersonaEntrySchema = z.object({
  id: z.string().min(1),
  prevEp: Ep,
  nextEp: Ep,
  prev: ShotSpecDocSchema,
  next: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const HandoffPersonaLinkEntrySchema = z.object({
  id: z.string().min(1),
  handoffId: z.string().min(1),
  cardSlug: z.string().min(1),
  note: z.string().optional(),
});

export const HandoffPersonaLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  handoffs: z.array(HandoffPersonaEntrySchema),
  cards: z.array(PersonaCardSchema).min(1),
  links: z.array(HandoffPersonaLinkEntrySchema),
});

export type HandoffPersonaLinkLedger = z.infer<typeof HandoffPersonaLinkLedgerSchema>;

export type HandoffPersonaLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_HANDOFF'
    | 'UNKNOWN_CARD'
    | 'CHILD_PERSONA_FAIL'
    | 'CHILD_HANDOFF_FAIL'
    | 'HANDOFF_WITHOUT_PERSONA'
    | 'PENDING_CARD';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface HandoffPersonaLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    handoffs: number;
    cards: number;
    latestEp: number;
  };
  findings: HandoffPersonaLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateHandoffPersonaLink(input: unknown): HandoffPersonaLinkReport {
  const parsed = HandoffPersonaLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, handoffs: 0, cards: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { latestEp, handoffs, cards, links } = parsed.data;
  const findings: HandoffPersonaLinkFinding[] = [];
  const push = (x: HandoffPersonaLinkFinding) => findings.push(x);

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

  for (const h of handoffs) {
    const hr = evaluateCliffhangerHandoff(h.prev, h.next);
    if (hr.verdict === 'FAIL') {
      const childFails = hr.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_HANDOFF_FAIL',
        severity: 'FAIL',
        ids: [h.id, ...childFails.flatMap((f) => f.shotIds ?? [])],
        message: `handoff ${h.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
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
    push({ code: 'DUP_ID', severity: 'FAIL', ids: [id], message: `联表ID重复：${id}`, fix: '联表 id 须唯一' });
  }

  const byH = new Map(handoffs.map((h) => [h.id, h]));
  const byCard = new Map(cards.map((c) => [c.slug, c]));
  const pairedH = new Set<string>();
  const pairedCards = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const h = byH.get(link.handoffId);
    const card = byCard.get(link.cardSlug);
    if (!h) {
      push({
        code: 'UNKNOWN_HANDOFF',
        severity: 'FAIL',
        ids: [link.id, link.handoffId],
        message: `联表 ${link.id} 引用未知 handoff ${link.handoffId}`,
        fix: 'handoffId 须存在于 handoffs[]',
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
    pairedH.add(h.id);
    pairedCards.add(card.slug);
    aligned += 1;
  }

  for (const h of handoffs) {
    if (!pairedH.has(h.id)) {
      push({
        code: 'HANDOFF_WITHOUT_PERSONA',
        severity: 'FAIL',
        ids: [h.id],
        message: `handoff ${h.id} 未挂 persona 联表`,
        fix: '在 links[] 挂 handoffId↔cardSlug',
      });
    }
  }
  for (const c of cards) {
    if (!pairedCards.has(c.slug)) {
      push({
        code: 'PENDING_CARD',
        severity: 'WARN',
        ids: [c.slug],
        message: `card ${c.slug} 尚未联表到 handoff`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      handoffs: handoffs.length,
      cards: cards.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
