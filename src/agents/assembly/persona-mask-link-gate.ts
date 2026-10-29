/**
 * V12 · Persona-Card × Persona-Mask Link Gate (人设卡 × 伪装人设 跨账本联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《逃婚三年，江少的花心人设崩了》: 花心纨绔 mask — wearer 须对齐外形卡 name，崩塌不换脸.
 *  - 《枝头春意闹》: 造谣假人设当场抓包 — card 外形锚点在 reveal 前后同一角色.
 *  - persona-card（外形）与 persona-mask（假身份/抓包崩塌）分账本，本 gate 硬联表.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_CARD / UNKNOWN_MASK
 *  CHILD_PERSONA_FAIL / CHILD_MASK_FAIL
 *  WEARER_MISMATCH — mask.wearer 须等于 card.name
 *  REVEAL_LABEL_UNANCHORED (WARN) — reveal 后建议 revealLabel 出现在 card.notes/anchors
 *  PENDING_PAIR (WARN) — mask 尚未 reveal
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { PersonaCardSchema, evaluatePersonaCard } from './persona-card-gate';
import {
  PersonaMaskEntrySchema,
  evaluatePersonaMask,
} from './persona-mask-gate';

const Ep = z.number().int().positive();

export const PersonaMaskLinkEntrySchema = z.object({
  id: z.string().min(1),
  cardSlug: z.string().min(1),
  maskId: z.string().min(1),
  note: z.string().optional(),
});

export const PersonaMaskLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  cards: z.array(PersonaCardSchema).min(1),
  masks: z.array(PersonaMaskEntrySchema),
  links: z.array(PersonaMaskLinkEntrySchema),
});

export type PersonaMaskLinkLedger = z.infer<typeof PersonaMaskLinkLedgerSchema>;

export type PersonaMaskLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_CARD'
    | 'UNKNOWN_MASK'
    | 'CHILD_PERSONA_FAIL'
    | 'CHILD_MASK_FAIL'
    | 'WEARER_MISMATCH'
    | 'REVEAL_LABEL_UNANCHORED'
    | 'PENDING_PAIR';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface PersonaMaskLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    pending: number;
    cards: number;
    masks: number;
    latestEp: number;
  };
  findings: PersonaMaskLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluatePersonaMaskLink(input: unknown): PersonaMaskLinkReport {
  const parsed = PersonaMaskLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, pending: 0, cards: 0, masks: 0, latestEp: 0 },
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

  const { series, latestEp, cards, masks, links } = parsed.data;
  const findings: PersonaMaskLinkFinding[] = [];
  const push = (x: PersonaMaskLinkFinding) => findings.push(x);

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

  const maskReport = evaluatePersonaMask({ series, latestEp, entries: masks });
  if (maskReport.verdict === 'FAIL') {
    const childFails = maskReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_MASK_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌伪装账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 persona-mask-gate 再跑联表（plant/maintain/reveal）',
    });
  }

  const cardBySlug = new Map(cards.map((c) => [c.slug, c]));
  const maskById = new Map(masks.map((m) => [m.id, m]));

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
    const mask = maskById.get(l.maskId);

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
    if (!mask) {
      push({
        code: 'UNKNOWN_MASK',
        severity: 'FAIL',
        ids: [l.id],
        message: `${l.id} 指向不存在的 maskId=${l.maskId}`,
        fix: 'maskId 须对应 masks[].id',
      });
      continue;
    }

    if (mask.wearer !== card.name) {
      push({
        code: 'WEARER_MISMATCH',
        severity: 'FAIL',
        ids: [l.id, l.cardSlug, l.maskId],
        message: `${l.id} mask.wearer='${mask.wearer}' ≠ card.name='${card.name}'（伪装崩塌不得换脸/换人）`,
        fix: '把 wearer 改成与人设卡 name 完全一致',
      });
      continue;
    }

    if (mask.revealEp === undefined) {
      pending += 1;
      push({
        code: 'PENDING_PAIR',
        severity: 'WARN',
        ids: [l.id],
        message: `${l.id} 伪装尚未揭穿（人设卡已立，蓄势中）`,
        fix: '抓包/崩塌集写 revealEp + revealLabel',
      });
      continue;
    }

    if (mask.revealLabel) {
      const hay = [
        ...(card.anchors ?? []),
        ...(card.notes ? [card.notes] : []),
        card.name,
      ].join('|');
      if (!hay.includes(mask.revealLabel) && !(mask.label && hay.includes(mask.label))) {
        push({
          code: 'REVEAL_LABEL_UNANCHORED',
          severity: 'WARN',
          ids: [l.id, l.cardSlug, l.maskId],
          message: `${l.id} revealLabel='${mask.revealLabel}' 未出现在 card.anchors/notes（崩塌后难对齐外形记忆）`,
          fix: '把伪装名或揭穿标记写入 anchors/notes',
        });
      }
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
      masks: masks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
