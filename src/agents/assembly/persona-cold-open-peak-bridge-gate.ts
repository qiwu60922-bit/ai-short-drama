/**
 * V12 · Persona × Cold-Open × Peak Ternary Bridge
 * (人设卡 × 冷开钩 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 人设卡关键对峙峰值常冷开快入同框.
 *  - 与 motifColdOpenPeakBridge / personaColdOpenLink 互补：本 gate 以 persona 联 coldOpen×peak.
 *
 * coldOpens[]: { id, ep, shotSpec }
 * Per link: cardSlug + coldOpenId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_CARD / UNKNOWN_COLD_OPEN / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_PERSONA_FAIL / CHILD_COLD_OPEN_FAIL / CHILD_PEAK_FAIL
 *  EP_NOT_TERNARY — link.ep = coldOpen.ep = peakEp
 *  CARD_WITHOUT_BRIDGE / COLD_OPEN_WITHOUT_BRIDGE / PEAK_WITHOUT_BRIDGE
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { evaluateColdOpenHook } from './cold-open-hook-gate';
import { PersonaCardSchema, evaluatePersonaCard } from './persona-card-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const PersonaColdOpenPeakColdOpenEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const PersonaColdOpenPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  cardSlug: z.string().min(1),
  coldOpenId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const PersonaColdOpenPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  cards: z.array(PersonaCardSchema).min(1),
  coldOpens: z.array(PersonaColdOpenPeakColdOpenEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(PersonaColdOpenPeakBridgeLinkSchema),
});

export type PersonaColdOpenPeakBridgeLedger = z.infer<typeof PersonaColdOpenPeakBridgeLedgerSchema>;

export type PersonaColdOpenPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_CARD'
    | 'UNKNOWN_COLD_OPEN'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_PERSONA_FAIL'
    | 'CHILD_COLD_OPEN_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'EP_NOT_TERNARY'
    | 'CARD_WITHOUT_BRIDGE'
    | 'COLD_OPEN_WITHOUT_BRIDGE'
    | 'PEAK_WITHOUT_BRIDGE';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface PersonaColdOpenPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    cards: number;
    coldOpens: number;
    peaks: number;
    latestEp: number;
  };
  findings: PersonaColdOpenPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluatePersonaColdOpenPeakBridge(input: unknown): PersonaColdOpenPeakBridgeReport {
  const parsed = PersonaColdOpenPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, cards: 0, coldOpens: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, cards, coldOpens, peaks, links } = parsed.data;
  const findings: PersonaColdOpenPeakBridgeFinding[] = [];
  const push = (x: PersonaColdOpenPeakBridgeFinding) => findings.push(x);

  for (const card of cards) {
    const r = evaluatePersonaCard(card);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_PERSONA_FAIL',
        severity: 'FAIL',
        ids: [card.slug, ...childFails.map((f) => f.path).filter(Boolean) as string[]],
        message: `persona ${card.slug} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 persona-card-gate',
      });
    }
  }

  for (const co of coldOpens) {
    const r = evaluateColdOpenHook(co.shotSpec);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_COLD_OPEN_FAIL',
        severity: 'FAIL',
        ids: [co.id, ...childFails.flatMap((f) => f.shotIds ?? [])],
        message: `coldOpen ${co.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 cold-open-hook-gate',
      });
    }
  }

  const pReport = evaluatePeakBeforePayoff({ series, latestEp, entries: peaks });
  if (pReport.verdict === 'FAIL') {
    const childFails = pReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_PEAK_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌峰值账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 peak-before-payoff-gate',
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
  const byC = new Map(coldOpens.map((c) => [c.id, c]));
  const byPeak = new Map(peaks.map((p) => [p.id, p]));
  const linkedCards = new Set<string>();
  const linkedC = new Set<string>();
  const linkedPeaks = new Set<string>();
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
    const co = byC.get(link.coldOpenId);
    if (!co) {
      push({
        code: 'UNKNOWN_COLD_OPEN',
        severity: 'FAIL',
        ids: [link.id, link.coldOpenId],
        message: `联表 ${link.id} 引用未知 coldOpen ${link.coldOpenId}`,
        fix: 'coldOpenId 须存在于 coldOpens[]',
      });
      continue;
    }
    const peak = byPeak.get(link.peakId);
    if (!peak) {
      push({
        code: 'UNKNOWN_PEAK',
        severity: 'FAIL',
        ids: [link.id, link.peakId],
        message: `联表 ${link.id} 引用未知 peak ${link.peakId}`,
        fix: 'peakId 须存在于 peaks[]',
      });
      continue;
    }

    if (
      peak.peakEp === undefined ||
      link.ep !== co.ep ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, card.slug, co.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 coldOpen=${co.ep}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = coldOpen.ep = peakEp',
      });
      continue;
    }

    linkedCards.add(card.slug);
    linkedC.add(co.id);
    linkedPeaks.add(peak.id);
    aligned += 1;
  }

  for (const card of cards) {
    if (!linkedCards.has(card.slug)) {
      push({
        code: 'CARD_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [card.slug],
        message: `persona ${card.slug} 无 persona×coldOpen×peak 桥`,
        fix: '为人设卡挂 PersonaColdOpenPeakBridge',
      });
    }
  }
  for (const co of coldOpens) {
    if (!linkedC.has(co.id)) {
      push({
        code: 'COLD_OPEN_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [co.id],
        message: `coldOpen ${co.id} ep=E${co.ep} 无 persona×coldOpen×peak 桥`,
        fix: '为冷开挂 PersonaColdOpenPeakBridge',
      });
    }
  }
  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedPeaks.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 persona×coldOpen×peak 桥`,
        fix: '为峰值集挂 PersonaColdOpenPeakBridge',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      cards: cards.length,
      coldOpens: coldOpens.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
