/**
 * V12 · Quality-Leap × Persona Link Gate (表演门 × 人设卡 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《逃婚三年》/《机长先生》: 外形卡角色关键对峙镜须过表演/情绪门.
 *  - quality-leap 管表演可见度；persona-card 管外形锚点——本 gate 硬联表.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_CARD / FUTURE_EP
 *  CHILD_PERSONA_FAIL / CHILD_QUALITY_FAIL
 *  CARD_WITHOUT_QUALITY — cards[] 中未联表者 FAIL（已出现的人设须过表演门）
 *  LOW_INTENSITY_AT_CARD (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { PersonaCardSchema, evaluatePersonaCard } from './persona-card-gate';
import {
  QualityLeapDocSchema,
  evaluateQualityLeap,
} from './quality-leap-gate';

const Ep = z.number().int().positive();

export const QualityPersonaLinkEntrySchema = z.object({
  id: z.string().min(1),
  cardSlug: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const QualityPersonaLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  /** Intensity floor for LOW_INTENSITY_AT_CARD WARN. Default 4. */
  minCardIntense: z.number().int().min(1).max(5).optional(),
  cards: z.array(PersonaCardSchema).min(1),
  links: z.array(QualityPersonaLinkEntrySchema),
});

export type QualityPersonaLinkLedger = z.infer<typeof QualityPersonaLinkLedgerSchema>;

export type QualityPersonaLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_CARD'
    | 'FUTURE_EP'
    | 'CHILD_PERSONA_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'CARD_WITHOUT_QUALITY'
    | 'LOW_INTENSITY_AT_CARD';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface QualityPersonaLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    cards: number;
    latestEp: number;
  };
  findings: QualityPersonaLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

function maxIntensity(ql: {
  shots?: Array<{ performance?: { intensity?: number } | null }>;
}): number {
  let m = 0;
  for (const s of ql.shots ?? []) {
    const i = s.performance?.intensity;
    if (typeof i === 'number' && i > m) m = i;
  }
  return m;
}

export function evaluateQualityPersonaLink(input: unknown): QualityPersonaLinkReport {
  const parsed = QualityPersonaLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, cards: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { latestEp, minCardIntense, cards, links } = parsed.data;
  const floor = minCardIntense ?? 4;
  const findings: QualityPersonaLinkFinding[] = [];
  const push = (x: QualityPersonaLinkFinding) => findings.push(x);

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

  const byCard = new Map(cards.map((c) => [c.slug, c]));
  const pairedCards = new Set<string>();
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

    const qReport = evaluateQualityLeap(link.qualityLeap);
    if (qReport.verdict === 'FAIL') {
      const childFails = qReport.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_QUALITY_FAIL',
        severity: 'FAIL',
        ids: [link.id, card.slug, ...childFails.flatMap((f) => f.ids ?? [])],
        message: `联表 ${link.id} qualityLeap FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 quality-leap-gate',
      });
      continue;
    }

    const intense = maxIntensity(link.qualityLeap);
    if (intense < floor) {
      push({
        code: 'LOW_INTENSITY_AT_CARD',
        severity: 'WARN',
        ids: [link.id, card.slug],
        message: `${link.id}: card ${card.slug} max intensity=${intense} < minCardIntense=${floor}`,
        fix: '提高表演 intensity 或下调 minCardIntense',
      });
    }

    pairedCards.add(card.slug);
    aligned += 1;
  }

  for (const c of cards) {
    if (!pairedCards.has(c.slug)) {
      push({
        code: 'CARD_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [c.slug],
        message: `card ${c.slug} 未挂 qualityLeap 联表`,
        fix: '在 links[] 挂 cardSlug + qualityLeap',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      cards: cards.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
