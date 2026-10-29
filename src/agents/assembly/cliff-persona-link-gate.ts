/**
 * V12 · Cliff-Cascade × Persona Link Gate (跨集悬念叠钩 × 人设卡 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《机长先生》: 悬念叠钩须挂外形卡角色，避免空壳对峙.
 *  - cliff-cascade 管 prev→next；persona-card 管外形——本 gate 以 cliff 为主键硬联表.
 *  - 与 personaCliffLink（人设主键）互补：本 gate 强制「有 cliff 必须有人设」.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_CLIFF / UNKNOWN_CARD
 *  CHILD_CASCADE_FAIL / CHILD_PERSONA_FAIL
 *  CLIFF_WITHOUT_PERSONA / PENDING_CARD (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  CliffCascadeLinkEntrySchema,
  evaluateCliffCascadeLink,
} from './cliff-cascade-link-gate';
import { PersonaCardSchema, evaluatePersonaCard } from './persona-card-gate';

const Ep = z.number().int().positive();

export const CliffPersonaLinkEntrySchema = z.object({
  id: z.string().min(1),
  cliffLinkId: z.string().min(1),
  cardSlug: z.string().min(1),
  note: z.string().optional(),
});

export const CliffPersonaLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  cards: z.array(PersonaCardSchema).min(1),
  links: z.array(CliffPersonaLinkEntrySchema),
});

export type CliffPersonaLinkLedger = z.infer<typeof CliffPersonaLinkLedgerSchema>;

export type CliffPersonaLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_CLIFF'
    | 'UNKNOWN_CARD'
    | 'CHILD_CASCADE_FAIL'
    | 'CHILD_PERSONA_FAIL'
    | 'CLIFF_WITHOUT_PERSONA'
    | 'PENDING_CARD';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface CliffPersonaLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    cliffLinks: number;
    cards: number;
    latestEp: number;
  };
  findings: CliffPersonaLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateCliffPersonaLink(input: unknown): CliffPersonaLinkReport {
  const parsed = CliffPersonaLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, cliffLinks: 0, cards: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, cliffLinks, cards, links } = parsed.data;
  const findings: CliffPersonaLinkFinding[] = [];
  const push = (x: CliffPersonaLinkFinding) => findings.push(x);

  const cReport = evaluateCliffCascadeLink({ series, latestEp, links: cliffLinks });
  if (cReport.verdict === 'FAIL') {
    const childFails = cReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_CASCADE_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌叠钩账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 cliff-cascade-link-gate',
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

  const byCliff = new Map(cliffLinks.map((c) => [c.id, c]));
  const byCard = new Map(cards.map((c) => [c.slug, c]));
  const pairedCliff = new Set<string>();
  const pairedCards = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const cliff = byCliff.get(link.cliffLinkId);
    const card = byCard.get(link.cardSlug);
    if (!cliff) {
      push({
        code: 'UNKNOWN_CLIFF',
        severity: 'FAIL',
        ids: [link.id, link.cliffLinkId],
        message: `联表 ${link.id} 引用未知 cliff ${link.cliffLinkId}`,
        fix: 'cliffLinkId 须存在于 cliffLinks[]',
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
    pairedCliff.add(cliff.id);
    pairedCards.add(card.slug);
    aligned += 1;
  }

  for (const cliff of cliffLinks) {
    if (!pairedCliff.has(cliff.id)) {
      push({
        code: 'CLIFF_WITHOUT_PERSONA',
        severity: 'FAIL',
        ids: [cliff.id],
        message: `cliff ${cliff.id} 未挂 persona 联表`,
        fix: '在 links[] 挂 cliffLinkId↔cardSlug',
      });
    }
  }
  for (const c of cards) {
    if (!pairedCards.has(c.slug)) {
      push({
        code: 'PENDING_CARD',
        severity: 'WARN',
        ids: [c.slug],
        message: `card ${c.slug} 尚未联表到 cliff`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      cliffLinks: cliffLinks.length,
      cards: cards.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
