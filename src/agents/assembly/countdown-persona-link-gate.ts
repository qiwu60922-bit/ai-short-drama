/**
 * V12 · Countdown × Persona Link Gate (阶段倒计时 × 人设卡 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《天幕直播》: 时限 deadline 当集须挂外形卡角色对峙，避免空壳倒计时脸.
 *  - countdown 管 start→deadline；persona-card 管外形锚点——本 gate 硬联表.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_COUNTDOWN / UNKNOWN_CARD
 *  CHILD_PERSONA_FAIL / BAD_COUNTDOWN_WINDOW
 *  DEADLINE_WITHOUT_PERSONA — deadline 已到无联表
 *  PENDING_CARD (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { StageCountdownSchema } from './stage-goal-gate';
import { PersonaCardSchema, evaluatePersonaCard } from './persona-card-gate';

const Ep = z.number().int().positive();

export const CountdownPersonaLinkEntrySchema = z.object({
  id: z.string().min(1),
  countdownId: z.string().min(1),
  cardSlug: z.string().min(1),
  note: z.string().optional(),
});

export const CountdownPersonaLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  countdowns: z.array(StageCountdownSchema),
  cards: z.array(PersonaCardSchema).min(1),
  links: z.array(CountdownPersonaLinkEntrySchema),
});

export type CountdownPersonaLinkLedger = z.infer<typeof CountdownPersonaLinkLedgerSchema>;

export type CountdownPersonaLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_COUNTDOWN'
    | 'UNKNOWN_CARD'
    | 'CHILD_PERSONA_FAIL'
    | 'BAD_COUNTDOWN_WINDOW'
    | 'DEADLINE_WITHOUT_PERSONA'
    | 'PENDING_CARD';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface CountdownPersonaLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    countdowns: number;
    cards: number;
    latestEp: number;
  };
  findings: CountdownPersonaLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateCountdownPersonaLink(input: unknown): CountdownPersonaLinkReport {
  const parsed = CountdownPersonaLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, countdowns: 0, cards: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { latestEp, countdowns, cards, links } = parsed.data;
  const findings: CountdownPersonaLinkFinding[] = [];
  const push = (x: CountdownPersonaLinkFinding) => findings.push(x);

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

  for (const cd of countdowns) {
    if (cd.deadlineEp < cd.startEp) {
      push({
        code: 'BAD_COUNTDOWN_WINDOW',
        severity: 'FAIL',
        ids: [cd.id],
        message: `countdown ${cd.id} deadlineEp=E${cd.deadlineEp} < startEp=E${cd.startEp}`,
        fix: 'deadlineEp 须 ≥ startEp',
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

  const byCd = new Map(countdowns.map((c) => [c.id, c]));
  const byCard = new Map(cards.map((c) => [c.slug, c]));
  const pairedCd = new Set<string>();
  const pairedCards = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const cd = byCd.get(link.countdownId);
    const card = byCard.get(link.cardSlug);
    if (!cd) {
      push({
        code: 'UNKNOWN_COUNTDOWN',
        severity: 'FAIL',
        ids: [link.id, link.countdownId],
        message: `联表 ${link.id} 引用未知 countdown ${link.countdownId}`,
        fix: 'countdownId 须存在于 countdowns[]',
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
    pairedCd.add(cd.id);
    pairedCards.add(card.slug);
    aligned += 1;
  }

  for (const cd of countdowns) {
    if (cd.deadlineEp <= latestEp && !pairedCd.has(cd.id)) {
      push({
        code: 'DEADLINE_WITHOUT_PERSONA',
        severity: 'FAIL',
        ids: [cd.id],
        message: `countdown ${cd.id} deadlineEp=E${cd.deadlineEp} 未挂 persona 联表`,
        fix: '在 links[] 挂 countdownId↔cardSlug',
      });
    }
  }
  for (const c of cards) {
    if (!pairedCards.has(c.slug)) {
      push({
        code: 'PENDING_CARD',
        severity: 'WARN',
        ids: [c.slug],
        message: `card ${c.slug} 尚未联表到 countdown`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      countdowns: countdowns.length,
      cards: cards.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
