/**
 * V12 · Foreshadow × Persona × Peak Ternary Bridge
 * (伏笔兑现 × 人设卡 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《机长先生》/《盛夏芬德拉》: S/A 伏笔 payoff 常与外形卡角色、对峙峰值同拍.
 *  - foreshadowPersonaLink / personaPeakLink 已各自联表——本 gate 硬对齐同 ep 三元同框.
 *
 * Per link: foreshadowId + cardSlug + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_FORESHADOW / UNKNOWN_CARD / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_FORESHADOW_FAIL / CHILD_PERSONA_FAIL / CHILD_PEAK_FAIL
 *  EP_NOT_TERNARY — link.ep = item.payoffEp = peakEp
 *  PEAK_WITHOUT_BRIDGE / PAYOFF_WITHOUT_BRIDGE
 *  PENDING_CARD (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
} from './foreshadow-ledger-gate';
import { PersonaCardSchema, evaluatePersonaCard } from './persona-card-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const ForeshadowPersonaPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  foreshadowId: z.string().min(1),
  cardSlug: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const ForeshadowPersonaPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  items: z.array(ForeshadowItemSchema),
  cards: z.array(PersonaCardSchema).min(1),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(ForeshadowPersonaPeakBridgeLinkSchema),
});

export type ForeshadowPersonaPeakBridgeLedger = z.infer<typeof ForeshadowPersonaPeakBridgeLedgerSchema>;

export type ForeshadowPersonaPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_FORESHADOW'
    | 'UNKNOWN_CARD'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_FORESHADOW_FAIL'
    | 'CHILD_PERSONA_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'EP_NOT_TERNARY'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'PAYOFF_WITHOUT_BRIDGE'
    | 'PENDING_CARD';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface ForeshadowPersonaPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    items: number;
    cards: number;
    peaks: number;
    latestEp: number;
  };
  findings: ForeshadowPersonaPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateForeshadowPersonaPeakBridge(input: unknown): ForeshadowPersonaPeakBridgeReport {
  const parsed = ForeshadowPersonaPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, items: 0, cards: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, items, cards, peaks, links } = parsed.data;
  const findings: ForeshadowPersonaPeakBridgeFinding[] = [];
  const push = (x: ForeshadowPersonaPeakBridgeFinding) => findings.push(x);

  const fReport = evaluateForeshadowLedger({ series, latestEp, items });
  if (fReport.verdict === 'FAIL') {
    const childFails = fReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_FORESHADOW_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌伏笔账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 foreshadow-ledger-gate',
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

  const peakReport = evaluatePeakBeforePayoff({ series, latestEp, entries: peaks });
  if (peakReport.verdict === 'FAIL') {
    const childFails = peakReport.findings.filter((f) => f.severity === 'FAIL');
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

  const byItem = new Map(items.map((i) => [i.id, i]));
  const byCard = new Map(cards.map((c) => [c.slug, c]));
  const byPeak = new Map(peaks.map((p) => [p.id, p]));
  const linkedItems = new Set<string>();
  const linkedCards = new Set<string>();
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
    const item = byItem.get(link.foreshadowId);
    if (!item) {
      push({
        code: 'UNKNOWN_FORESHADOW',
        severity: 'FAIL',
        ids: [link.id, link.foreshadowId],
        message: `联表 ${link.id} 引用未知 foreshadow ${link.foreshadowId}`,
        fix: 'foreshadowId 须存在于 items[]',
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
      item.payoffEp === undefined ||
      peak.peakEp === undefined ||
      link.ep !== item.payoffEp ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, item.id, card.slug, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 fPayoff=${item.payoffEp ?? '无'}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = item.payoffEp = peakEp',
      });
      continue;
    }

    linkedItems.add(item.id);
    linkedCards.add(card.slug);
    linkedPeaks.add(peak.id);
    aligned += 1;
  }

  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedPeaks.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 foreshadow×persona×peak 桥`,
        fix: '为峰值集挂 ForeshadowPersonaPeakBridge',
      });
    }
  }
  for (const item of items) {
    if (item.payoffEp !== undefined && !linkedItems.has(item.id)) {
      push({
        code: 'PAYOFF_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [item.id],
        message: `foreshadow ${item.id} payoffEp=E${item.payoffEp} 无 foreshadow×persona×peak 桥`,
        fix: '为伏笔兑现集挂 ForeshadowPersonaPeakBridge',
      });
    }
  }
  for (const card of cards) {
    if (!linkedCards.has(card.slug)) {
      push({
        code: 'PENDING_CARD',
        severity: 'WARN',
        ids: [card.slug],
        message: `card ${card.slug} 尚未联表到 foreshadow×persona×peak 桥`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      items: items.length,
      cards: cards.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
