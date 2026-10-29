/**
 * V12 · Persona × Foreshadow Link Gate (人设卡 × 伏笔兑现 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《机长先生》/《伪人降临》: 外形卡角色关键伏笔 payoff 须对齐人设锚点.
 *  - 与 foreshadowPersonaLink（foreshadow 主键）互补：本 gate 以 persona 为主键.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_CARD / UNKNOWN_FORESHADOW / FUTURE_EP
 *  CHILD_PERSONA_FAIL / CHILD_FORESHADOW_FAIL
 *  EP_NOT_PAYOFF — link.ep = payoffEp
 *  CARD_WITHOUT_FORESHADOW / PAYOFF_WITHOUT_CARD
 *  PENDING_FORESHADOW (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { PersonaCardSchema, evaluatePersonaCard } from './persona-card-gate';
import {
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
} from './foreshadow-ledger-gate';

const Ep = z.number().int().positive();

export const PersonaForeshadowLinkEntrySchema = z.object({
  id: z.string().min(1),
  cardSlug: z.string().min(1),
  foreshadowId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const PersonaForeshadowLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  cards: z.array(PersonaCardSchema).min(1),
  items: z.array(ForeshadowItemSchema),
  links: z.array(PersonaForeshadowLinkEntrySchema),
});

export type PersonaForeshadowLinkLedger = z.infer<typeof PersonaForeshadowLinkLedgerSchema>;

export type PersonaForeshadowLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_CARD'
    | 'UNKNOWN_FORESHADOW'
    | 'FUTURE_EP'
    | 'CHILD_PERSONA_FAIL'
    | 'CHILD_FORESHADOW_FAIL'
    | 'EP_NOT_PAYOFF'
    | 'CARD_WITHOUT_FORESHADOW'
    | 'PAYOFF_WITHOUT_CARD'
    | 'PENDING_FORESHADOW';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface PersonaForeshadowLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    cards: number;
    items: number;
    latestEp: number;
  };
  findings: PersonaForeshadowLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluatePersonaForeshadowLink(input: unknown): PersonaForeshadowLinkReport {
  const parsed = PersonaForeshadowLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, cards: 0, items: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, cards, items, links } = parsed.data;
  const findings: PersonaForeshadowLinkFinding[] = [];
  const push = (x: PersonaForeshadowLinkFinding) => findings.push(x);

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

  const byCard = new Map(cards.map((c) => [c.slug, c]));
  const byItem = new Map(items.map((it) => [it.id, it]));
  const pairedCards = new Set<string>();
  const pairedItems = new Set<string>();
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
    const item = byItem.get(link.foreshadowId);
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
        ids: [link.id, item.id],
        message: `${link.id}: ep=E${link.ep} ≠ payoffEp=${item.payoffEp ?? '无'}`,
        fix: 'link.ep 须对准伏笔 payoff 集',
      });
      continue;
    }

    pairedCards.add(card.slug);
    pairedItems.add(item.id);
    aligned += 1;
  }

  for (const c of cards) {
    if (!pairedCards.has(c.slug)) {
      push({
        code: 'CARD_WITHOUT_FORESHADOW',
        severity: 'FAIL',
        ids: [c.slug],
        message: `card ${c.slug} 未挂 foreshadow 联表`,
        fix: '在 links[] 挂 cardSlug + foreshadowId',
      });
    }
  }
  for (const it of items) {
    if (it.payoffEp !== undefined && !pairedItems.has(it.id)) {
      push({
        code: 'PAYOFF_WITHOUT_CARD',
        severity: 'FAIL',
        ids: [it.id],
        message: `foreshadow ${it.id} payoffEp=E${it.payoffEp} 无人设卡联表`,
        fix: '为兑现集挂 PersonaForeshadowLink',
      });
    } else if (!pairedItems.has(it.id)) {
      push({
        code: 'PENDING_FORESHADOW',
        severity: 'WARN',
        ids: [it.id],
        message: `foreshadow ${it.id} 尚未联表到 persona`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      cards: cards.length,
      items: items.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
