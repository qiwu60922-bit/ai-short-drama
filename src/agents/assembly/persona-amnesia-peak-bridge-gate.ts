/**
 * V12 · Persona × Amnesia × Peak Ternary Bridge
 * (人设卡 × 失忆唤回 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《逃婚三年》/《机长先生》: 唤回 recover 常与外形卡角色、对峙峰值同拍.
 *  - 与 personaAmnesiaPeakBridge（amnesia 主键）互补：本 gate 以 persona 为主键硬对齐同 ep 三元同框.
 *
 * Per link: cardSlug + amnesiaId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_AMNESIA / UNKNOWN_CARD / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_AMNESIA_FAIL / CHILD_PERSONA_FAIL / CHILD_PEAK_FAIL
 *  EP_NOT_TERNARY — link.ep = recoverEp = peakEp
 *  PEAK_WITHOUT_BRIDGE / RECOVER_WITHOUT_BRIDGE
 *  PENDING_CARD (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  AmnesiaArcEntrySchema,
  evaluateAmnesiaArc,
} from './amnesia-arc-gate';
import { PersonaCardSchema, evaluatePersonaCard } from './persona-card-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const PersonaAmnesiaPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  cardSlug: z.string().min(1),
  amnesiaId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const PersonaAmnesiaPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  cards: z.array(PersonaCardSchema).min(1),
  amnesias: z.array(AmnesiaArcEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(PersonaAmnesiaPeakBridgeLinkSchema),
});

export type PersonaAmnesiaPeakBridgeLedger = z.infer<typeof PersonaAmnesiaPeakBridgeLedgerSchema>;

export type PersonaAmnesiaPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_AMNESIA'
    | 'UNKNOWN_CARD'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_AMNESIA_FAIL'
    | 'CHILD_PERSONA_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'EP_NOT_TERNARY'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'RECOVER_WITHOUT_BRIDGE'
    | 'PENDING_CARD';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface PersonaAmnesiaPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    cards: number;
    amnesias: number;
    peaks: number;
    latestEp: number;
  };
  findings: PersonaAmnesiaPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluatePersonaAmnesiaPeakBridge(input: unknown): PersonaAmnesiaPeakBridgeReport {
  const parsed = PersonaAmnesiaPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, cards: 0, amnesias: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, cards, amnesias, peaks, links } = parsed.data;
  const findings: PersonaAmnesiaPeakBridgeFinding[] = [];
  const push = (x: PersonaAmnesiaPeakBridgeFinding) => findings.push(x);

  const aReport = evaluateAmnesiaArc({ series, latestEp, entries: amnesias });
  if (aReport.verdict === 'FAIL') {
    const childFails = aReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_AMNESIA_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌失忆账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 amnesia-arc-gate',
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

  const byA = new Map(amnesias.map((a) => [a.id, a]));
  const byCard = new Map(cards.map((c) => [c.slug, c]));
  const byP = new Map(peaks.map((p) => [p.id, p]));
  const linkedP = new Set<string>();
  const linkedA = new Set<string>();
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
    const amnesia = byA.get(link.amnesiaId);
    if (!amnesia) {
      push({
        code: 'UNKNOWN_AMNESIA',
        severity: 'FAIL',
        ids: [link.id, link.amnesiaId],
        message: `联表 ${link.id} 引用未知 amnesia ${link.amnesiaId}`,
        fix: 'amnesiaId 须存在于 amnesias[]',
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
      amnesia.recoverEp === undefined ||
      peak.peakEp === undefined ||
      link.ep !== amnesia.recoverEp ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, amnesia.id, card.slug, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 recover=${amnesia.recoverEp ?? '无'}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = recoverEp = peakEp',
      });
      continue;
    }

    linkedP.add(peak.id);
    linkedA.add(amnesia.id);
    linkedCards.add(card.slug);
    aligned += 1;
  }

  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedP.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 persona×amnesia×peak 桥`,
        fix: '为峰值集挂 PersonaAmnesiaPeakBridge',
      });
    }
  }
  for (const a of amnesias) {
    if (a.recoverEp !== undefined && !linkedA.has(a.id)) {
      push({
        code: 'RECOVER_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [a.id],
        message: `amnesia ${a.id} recoverEp=E${a.recoverEp} 无 persona×amnesia×peak 桥`,
        fix: '为唤回集挂 PersonaAmnesiaPeakBridge',
      });
    }
  }
  for (const card of cards) {
    if (!linkedCards.has(card.slug)) {
      push({
        code: 'PENDING_CARD',
        severity: 'WARN',
        ids: [card.slug],
        message: `card ${card.slug} 尚未联表到 persona×amnesia×peak 桥`,
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
      amnesias: amnesias.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
