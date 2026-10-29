/**
 * V12 · Frequency × Persona Link Gate (第N次 tipping × 人设卡 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《轻烟染日暮》/《机长先生》: tipping 当集须挂外形卡角色，避免空壳第N次脸.
 *  - frequency-tipping 管 tip；persona-card 管外形锚点——本 gate 以 frequency 为主键硬联表.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_FREQUENCY / UNKNOWN_CARD
 *  CHILD_FREQUENCY_FAIL / CHILD_PERSONA_FAIL
 *  TIP_WITHOUT_PERSONA / PENDING_FREQUENCY (WARN) / PENDING_CARD (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  FrequencyTippingEntrySchema,
  evaluateFrequencyTipping,
} from './frequency-tipping-gate';
import { PersonaCardSchema, evaluatePersonaCard } from './persona-card-gate';

const Ep = z.number().int().positive();

export const FrequencyPersonaLinkEntrySchema = z.object({
  id: z.string().min(1),
  frequencyId: z.string().min(1),
  cardSlug: z.string().min(1),
  note: z.string().optional(),
});

export const FrequencyPersonaLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  frequencies: z.array(FrequencyTippingEntrySchema),
  cards: z.array(PersonaCardSchema).min(1),
  links: z.array(FrequencyPersonaLinkEntrySchema),
});

export type FrequencyPersonaLinkLedger = z.infer<typeof FrequencyPersonaLinkLedgerSchema>;

export type FrequencyPersonaLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_FREQUENCY'
    | 'UNKNOWN_CARD'
    | 'CHILD_FREQUENCY_FAIL'
    | 'CHILD_PERSONA_FAIL'
    | 'TIP_WITHOUT_PERSONA'
    | 'PENDING_FREQUENCY'
    | 'PENDING_CARD';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface FrequencyPersonaLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    frequencies: number;
    cards: number;
    latestEp: number;
  };
  findings: FrequencyPersonaLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateFrequencyPersonaLink(input: unknown): FrequencyPersonaLinkReport {
  const parsed = FrequencyPersonaLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, frequencies: 0, cards: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, frequencies, cards, links } = parsed.data;
  const findings: FrequencyPersonaLinkFinding[] = [];
  const push = (x: FrequencyPersonaLinkFinding) => findings.push(x);

  const fReport = evaluateFrequencyTipping({ series, latestEp, entries: frequencies });
  if (fReport.verdict === 'FAIL') {
    const childFails = fReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_FREQUENCY_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌频率账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 frequency-tipping-gate',
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

  const byF = new Map(frequencies.map((f) => [f.id, f]));
  const byCard = new Map(cards.map((c) => [c.slug, c]));
  const pairedF = new Set<string>();
  const pairedCards = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const freq = byF.get(link.frequencyId);
    const card = byCard.get(link.cardSlug);
    if (!freq) {
      push({
        code: 'UNKNOWN_FREQUENCY',
        severity: 'FAIL',
        ids: [link.id, link.frequencyId],
        message: `联表 ${link.id} 引用未知 frequency ${link.frequencyId}`,
        fix: 'frequencyId 须存在于 frequencies[]',
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
    pairedF.add(freq.id);
    pairedCards.add(card.slug);
    aligned += 1;
  }

  for (const f of frequencies) {
    if (f.tipEp !== undefined && !pairedF.has(f.id)) {
      push({
        code: 'TIP_WITHOUT_PERSONA',
        severity: 'FAIL',
        ids: [f.id],
        message: `frequency ${f.id} tipEp=E${f.tipEp} 未挂 persona 联表`,
        fix: '在 links[] 挂 frequencyId↔cardSlug',
      });
    } else if (!pairedF.has(f.id)) {
      push({
        code: 'PENDING_FREQUENCY',
        severity: 'WARN',
        ids: [f.id],
        message: `frequency ${f.id} 尚未 tip/联表`,
        fix: '补 tip 或 links[]',
      });
    }
  }
  for (const c of cards) {
    if (!pairedCards.has(c.slug)) {
      push({
        code: 'PENDING_CARD',
        severity: 'WARN',
        ids: [c.slug],
        message: `card ${c.slug} 尚未联表到 frequency`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      frequencies: frequencies.length,
      cards: cards.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
