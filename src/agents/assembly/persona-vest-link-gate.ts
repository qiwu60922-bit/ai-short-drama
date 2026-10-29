/**
 * V12 · Persona-Card × Identity-Vest Link Gate (人设卡 × 马甲延迟掉落 跨账本联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text breakdowns (structure only, no footage):
 *  - 《机长先生，你的未婚妻嫁人了》: 机长马甲 — 视觉人设卡须对齐 wearer，掉马甲不换脸.
 *  - 《无敌贾二虎》: 隐忍底牌 — card.name = vest.wearer；drop 前后同一角色卡.
 *  - persona-card（外形/锚点）与 identity-vest（真身份延迟掉落）分账本，本 gate 硬联表.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_CARD / UNKNOWN_VEST
 *  CHILD_PERSONA_FAIL / CHILD_VEST_FAIL
 *  WEARER_MISMATCH — vest.wearer 须等于 card.name
 *  DROP_WITHOUT_VEST_LABEL_IN_NOTES (WARN) — drop 后建议 vestLabel 出现在 card.notes/anchors
 *  PENDING_PAIR (WARN) — 马甲未掉
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { PersonaCardSchema, evaluatePersonaCard } from './persona-card-gate';
import {
  IdentityVestEntrySchema,
  evaluateIdentityVest,
} from './identity-vest-gate';

const Ep = z.number().int().positive();

export const PersonaVestLinkEntrySchema = z.object({
  id: z.string().min(1),
  cardSlug: z.string().min(1),
  vestId: z.string().min(1),
  note: z.string().optional(),
});

export const PersonaVestLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  cards: z.array(PersonaCardSchema).min(1),
  vests: z.array(IdentityVestEntrySchema),
  links: z.array(PersonaVestLinkEntrySchema),
});

export type PersonaVestLinkLedger = z.infer<typeof PersonaVestLinkLedgerSchema>;

export type PersonaVestLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_CARD'
    | 'UNKNOWN_VEST'
    | 'CHILD_PERSONA_FAIL'
    | 'CHILD_VEST_FAIL'
    | 'WEARER_MISMATCH'
    | 'VEST_LABEL_UNANCHORED'
    | 'PENDING_PAIR';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface PersonaVestLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    pending: number;
    cards: number;
    vests: number;
    latestEp: number;
  };
  findings: PersonaVestLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluatePersonaVestLink(input: unknown): PersonaVestLinkReport {
  const parsed = PersonaVestLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, pending: 0, cards: 0, vests: 0, latestEp: 0 },
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

  const { series, latestEp, cards, vests, links } = parsed.data;
  const findings: PersonaVestLinkFinding[] = [];
  const push = (x: PersonaVestLinkFinding) => findings.push(x);

  for (const card of cards) {
    const r = evaluatePersonaCard(card);
    if (r.verdict === 'FAIL') {
      const codes = r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
      push({
        code: 'CHILD_PERSONA_FAIL',
        severity: 'FAIL',
        ids: [card.slug],
        message: `人设卡 ${card.slug} FAIL：${codes.join(',') || 'unknown'}`,
        fix: '先修 persona-card-gate（adult/anchors/wardrobe/fiction）',
      });
    }
  }

  const vestReport = evaluateIdentityVest({ series, latestEp, entries: vests });
  if (vestReport.verdict === 'FAIL') {
    const childFails = vestReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_VEST_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌马甲账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 identity-vest-gate 再跑联表（plant/tease/drop）',
    });
  }

  const cardBySlug = new Map(cards.map((c) => [c.slug, c]));
  const vestById = new Map(vests.map((v) => [v.id, v]));

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
      message: `联表链接 ID 重复：${id}`,
      fix: 'links[].id 须唯一',
    });
  }

  let aligned = 0;
  let pending = 0;

  for (const l of links) {
    const card = cardBySlug.get(l.cardSlug);
    const vest = vestById.get(l.vestId);

    if (!card) {
      push({
        code: 'UNKNOWN_CARD',
        severity: 'FAIL',
        ids: [l.id],
        message: `${l.id} 指向不存在的 cardSlug=${l.cardSlug}`,
        fix: 'cardSlug 须对应 cards[].slug',
      });
      continue;
    }
    if (!vest) {
      push({
        code: 'UNKNOWN_VEST',
        severity: 'FAIL',
        ids: [l.id],
        message: `${l.id} 指向不存在的 vestId=${l.vestId}`,
        fix: 'vestId 须对应 vests[].id',
      });
      continue;
    }

    if (vest.wearer !== card.name) {
      push({
        code: 'WEARER_MISMATCH',
        severity: 'FAIL',
        ids: [l.id, l.cardSlug, l.vestId],
        message: `${l.id} vest.wearer='${vest.wearer}' ≠ card.name='${card.name}'（掉马甲不得换脸/换人）`,
        fix: '把 wearer 改成与人设卡 name 完全一致',
      });
      continue;
    }

    if (vest.dropEp === undefined) {
      pending += 1;
      push({
        code: 'PENDING_PAIR',
        severity: 'WARN',
        ids: [l.id],
        message: `${l.id} 马甲尚未掉落（人设卡已立，蓄势中）`,
        fix: '峰值集写 dropEp + dropLabel',
      });
      continue;
    }

    const hay = [
      ...(card.anchors ?? []),
      ...(card.notes ? [card.notes] : []),
      card.name,
    ].join('|');
    if (!hay.includes(vest.vestLabel)) {
      push({
        code: 'VEST_LABEL_UNANCHORED',
        severity: 'WARN',
        ids: [l.id, l.cardSlug, l.vestId],
        message: `${l.id} vestLabel='${vest.vestLabel}' 未出现在 card.anchors/notes（掉马甲后观众难对齐外形记忆）`,
        fix: '把马甲名写入 anchors 或 notes，方便 drop 后回扣外形',
      });
    }

    aligned += 1;
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      pending,
      cards: cards.length,
      vests: vests.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
