/**
 * V12 · Persona × Frequency × Peak Ternary Bridge
 * (人设卡 × 第N次 tipping × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《轻烟染日暮》/《机长先生》: 外形卡角色常与 tipping、对峙峰值同拍.
 *  - personaFrequencyLink / personaPeakLink 已各自联表——本 gate 硬对齐同 ep 三元同框.
 *
 * Per link: cardSlug + frequencyId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_FREQUENCY / UNKNOWN_CARD / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_FREQUENCY_FAIL / CHILD_PERSONA_FAIL / CHILD_PEAK_FAIL
 *  EP_NOT_TERNARY — link.ep = tipEp = peakEp
 *  PEAK_WITHOUT_BRIDGE / TIP_WITHOUT_BRIDGE
 *  PENDING_FREQUENCY (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  FrequencyTippingEntrySchema,
  evaluateFrequencyTipping,
} from './frequency-tipping-gate';
import { PersonaCardSchema, evaluatePersonaCard } from './persona-card-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const PersonaFrequencyPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  cardSlug: z.string().min(1),
  frequencyId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const PersonaFrequencyPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  cards: z.array(PersonaCardSchema).min(1),
  frequencies: z.array(FrequencyTippingEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(PersonaFrequencyPeakBridgeLinkSchema),
});

export type PersonaFrequencyPeakBridgeLedger = z.infer<typeof PersonaFrequencyPeakBridgeLedgerSchema>;

export type PersonaFrequencyPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_FREQUENCY'
    | 'UNKNOWN_CARD'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_FREQUENCY_FAIL'
    | 'CHILD_PERSONA_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'EP_NOT_TERNARY'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'TIP_WITHOUT_BRIDGE'
    | 'PENDING_CARD';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface PersonaFrequencyPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    cards: number;
    frequencies: number;
    peaks: number;
    latestEp: number;
  };
  findings: PersonaFrequencyPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluatePersonaFrequencyPeakBridge(input: unknown): PersonaFrequencyPeakBridgeReport {
  const parsed = PersonaFrequencyPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, cards: 0, frequencies: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, cards, frequencies, peaks, links } = parsed.data;
  const findings: PersonaFrequencyPeakBridgeFinding[] = [];
  const push = (x: PersonaFrequencyPeakBridgeFinding) => findings.push(x);

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

  const byF = new Map(frequencies.map((f) => [f.id, f]));
  const byCard = new Map(cards.map((c) => [c.slug, c]));
  const byP = new Map(peaks.map((p) => [p.id, p]));
  const linkedP = new Set<string>();
  const linkedF = new Set<string>();
  const linkedCards = new Set<string>();
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
    const freq = byF.get(link.frequencyId);
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
    const peak = byP.get(link.peakId);
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
      freq.tipEp === undefined ||
      peak.peakEp === undefined ||
      link.ep !== freq.tipEp ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, freq.id, card.slug, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 tip=${freq.tipEp ?? '无'}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = tipEp = peakEp',
      });
      continue;
    }

    linkedP.add(peak.id);
    linkedF.add(freq.id);
    linkedCards.add(card.slug);
    aligned += 1;
  }

  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedP.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 persona×frequency×peak 桥`,
        fix: '为峰值集挂 PersonaFrequencyPeakBridge',
      });
    }
  }
  for (const f of frequencies) {
    if (f.tipEp !== undefined && !linkedF.has(f.id)) {
      push({
        code: 'TIP_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [f.id],
        message: `frequency ${f.id} tipEp=E${f.tipEp} 无 persona×frequency×peak 桥`,
        fix: '为 tipping 集挂 PersonaFrequencyPeakBridge',
      });
    }
  }
  for (const card of cards) {
    if (!linkedCards.has(card.slug)) {
      push({
        code: 'PENDING_CARD',
        severity: 'WARN',
        ids: [card.slug],
        message: `card ${card.slug} 尚未联表到 persona×frequency×peak 桥`,
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
      frequencies: frequencies.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
