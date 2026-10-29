/**
 * V12 · Mask × Persona Link Gate (伪装揭穿 × 人设卡 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《帐中香》/密爽向: mask reveal 须挂在外形卡角色上，避免空壳揭穿脸.
 *  - persona-mask 管 reveal；persona-card 管外形锚点——本 gate 以 mask 为主键硬联表.
 *  - 与 personaMaskLink（人设主键）互补：本 gate 强制「已揭穿伪装必须有人设」.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_MASK / UNKNOWN_CARD
 *  CHILD_MASK_FAIL / CHILD_PERSONA_FAIL
 *  REVEAL_WITHOUT_PERSONA / PENDING_CARD (WARN) / PENDING_MASK (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  PersonaMaskEntrySchema,
  evaluatePersonaMask,
} from './persona-mask-gate';
import { PersonaCardSchema, evaluatePersonaCard } from './persona-card-gate';

const Ep = z.number().int().positive();

export const MaskPersonaLinkEntrySchema = z.object({
  id: z.string().min(1),
  maskId: z.string().min(1),
  cardSlug: z.string().min(1),
  note: z.string().optional(),
});

export const MaskPersonaLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  masks: z.array(PersonaMaskEntrySchema),
  cards: z.array(PersonaCardSchema).min(1),
  links: z.array(MaskPersonaLinkEntrySchema),
});

export type MaskPersonaLinkLedger = z.infer<typeof MaskPersonaLinkLedgerSchema>;

export type MaskPersonaLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_MASK'
    | 'UNKNOWN_CARD'
    | 'CHILD_MASK_FAIL'
    | 'CHILD_PERSONA_FAIL'
    | 'REVEAL_WITHOUT_PERSONA'
    | 'PENDING_CARD'
    | 'PENDING_MASK';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface MaskPersonaLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    masks: number;
    cards: number;
    latestEp: number;
  };
  findings: MaskPersonaLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateMaskPersonaLink(input: unknown): MaskPersonaLinkReport {
  const parsed = MaskPersonaLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, masks: 0, cards: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, masks, cards, links } = parsed.data;
  const findings: MaskPersonaLinkFinding[] = [];
  const push = (x: MaskPersonaLinkFinding) => findings.push(x);

  const mReport = evaluatePersonaMask({ series, latestEp, entries: masks });
  if (mReport.verdict === 'FAIL') {
    const childFails = mReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_MASK_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌伪装账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 persona-mask-gate',
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

  const byMask = new Map(masks.map((m) => [m.id, m]));
  const byCard = new Map(cards.map((c) => [c.slug, c]));
  const pairedMasks = new Set<string>();
  const pairedCards = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const mask = byMask.get(link.maskId);
    const card = byCard.get(link.cardSlug);
    if (!mask) {
      push({
        code: 'UNKNOWN_MASK',
        severity: 'FAIL',
        ids: [link.id, link.maskId],
        message: `联表 ${link.id} 引用未知 mask ${link.maskId}`,
        fix: 'maskId 须存在于 masks[]',
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
    pairedMasks.add(mask.id);
    pairedCards.add(card.slug);
    aligned += 1;
  }

  for (const m of masks) {
    if (m.revealEp !== undefined && !pairedMasks.has(m.id)) {
      push({
        code: 'REVEAL_WITHOUT_PERSONA',
        severity: 'FAIL',
        ids: [m.id],
        message: `mask ${m.id} revealEp=E${m.revealEp} 未挂 persona 联表`,
        fix: '在 links[] 挂 maskId↔cardSlug',
      });
    } else if (!pairedMasks.has(m.id)) {
      push({
        code: 'PENDING_MASK',
        severity: 'WARN',
        ids: [m.id],
        message: `mask ${m.id} 尚未揭穿/联表`,
        fix: '补 reveal 或 links[]',
      });
    }
  }
  for (const c of cards) {
    if (!pairedCards.has(c.slug)) {
      push({
        code: 'PENDING_CARD',
        severity: 'WARN',
        ids: [c.slug],
        message: `card ${c.slug} 尚未联表到 mask`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      masks: masks.length,
      cards: cards.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
