/**
 * V12 · Vest × Persona Link Gate (马甲掉落 × 人设卡 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《机长先生》: 掉马甲须挂在外形卡角色上，掉马甲不换脸.
 *  - identity-vest 管 drop；persona-card 管外形锚点——本 gate 以马甲为主键硬联表.
 *  - 与 personaVestLink（人设主键+wearer 对齐）互补：本 gate 强制「已掉马甲必须有人设」.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_VEST / UNKNOWN_CARD
 *  CHILD_VEST_FAIL / CHILD_PERSONA_FAIL
 *  DROP_WITHOUT_PERSONA / PENDING_CARD (WARN) / PENDING_VEST (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  IdentityVestEntrySchema,
  evaluateIdentityVest,
} from './identity-vest-gate';
import { PersonaCardSchema, evaluatePersonaCard } from './persona-card-gate';

const Ep = z.number().int().positive();

export const VestPersonaLinkEntrySchema = z.object({
  id: z.string().min(1),
  vestId: z.string().min(1),
  cardSlug: z.string().min(1),
  note: z.string().optional(),
});

export const VestPersonaLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  vests: z.array(IdentityVestEntrySchema),
  cards: z.array(PersonaCardSchema).min(1),
  links: z.array(VestPersonaLinkEntrySchema),
});

export type VestPersonaLinkLedger = z.infer<typeof VestPersonaLinkLedgerSchema>;

export type VestPersonaLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_VEST'
    | 'UNKNOWN_CARD'
    | 'CHILD_VEST_FAIL'
    | 'CHILD_PERSONA_FAIL'
    | 'DROP_WITHOUT_PERSONA'
    | 'PENDING_CARD'
    | 'PENDING_VEST';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface VestPersonaLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    vests: number;
    cards: number;
    latestEp: number;
  };
  findings: VestPersonaLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateVestPersonaLink(input: unknown): VestPersonaLinkReport {
  const parsed = VestPersonaLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, vests: 0, cards: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, vests, cards, links } = parsed.data;
  const findings: VestPersonaLinkFinding[] = [];
  const push = (x: VestPersonaLinkFinding) => findings.push(x);

  const vReport = evaluateIdentityVest({ series, latestEp, entries: vests });
  if (vReport.verdict === 'FAIL') {
    const childFails = vReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_VEST_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌马甲账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 identity-vest-gate',
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

  const byVest = new Map(vests.map((v) => [v.id, v]));
  const byCard = new Map(cards.map((c) => [c.slug, c]));
  const pairedVests = new Set<string>();
  const pairedCards = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const vest = byVest.get(link.vestId);
    const card = byCard.get(link.cardSlug);
    if (!vest) {
      push({
        code: 'UNKNOWN_VEST',
        severity: 'FAIL',
        ids: [link.id, link.vestId],
        message: `联表 ${link.id} 引用未知 vest ${link.vestId}`,
        fix: 'vestId 须存在于 vests[]',
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
    pairedVests.add(vest.id);
    pairedCards.add(card.slug);
    aligned += 1;
  }

  for (const v of vests) {
    if (v.dropEp !== undefined && !pairedVests.has(v.id)) {
      push({
        code: 'DROP_WITHOUT_PERSONA',
        severity: 'FAIL',
        ids: [v.id],
        message: `vest ${v.id} dropEp=E${v.dropEp} 未挂 persona 联表`,
        fix: '在 links[] 挂 vestId↔cardSlug',
      });
    } else if (!pairedVests.has(v.id)) {
      push({
        code: 'PENDING_VEST',
        severity: 'WARN',
        ids: [v.id],
        message: `vest ${v.id} 尚未掉落/联表`,
        fix: '补 drop 或 links[]',
      });
    }
  }
  for (const c of cards) {
    if (!pairedCards.has(c.slug)) {
      push({
        code: 'PENDING_CARD',
        severity: 'WARN',
        ids: [c.slug],
        message: `card ${c.slug} 尚未联表到 vest`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      vests: vests.length,
      cards: cards.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
