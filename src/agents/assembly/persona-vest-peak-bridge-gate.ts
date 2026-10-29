/**
 * V12 · Persona × Vest × Peak Ternary Bridge
 * (人设卡 × 马甲掉落 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《机长先生》: 掉马甲常与对峙峰值同拍，且外形卡 wearer 对齐.
 *  - personaVestLink / vestMaskPeak 已各自联表——本 gate 硬对齐同 ep 三元同框.
 *
 * Per link: cardSlug + vestId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_CARD / UNKNOWN_VEST / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_PERSONA_FAIL / CHILD_VEST_FAIL / CHILD_PEAK_FAIL
 *  WEARER_MISMATCH — vest.wearer 须等于 card.name
 *  EP_NOT_TERNARY — link.ep = dropEp = peakEp
 *  DROP_WITHOUT_BRIDGE / PEAK_WITHOUT_BRIDGE
 *  PENDING_VEST (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { PersonaCardSchema, evaluatePersonaCard } from './persona-card-gate';
import {
  IdentityVestEntrySchema,
  evaluateIdentityVest,
} from './identity-vest-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const PersonaVestPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  cardSlug: z.string().min(1),
  vestId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const PersonaVestPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  cards: z.array(PersonaCardSchema).min(1),
  vests: z.array(IdentityVestEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(PersonaVestPeakBridgeLinkSchema),
});

export type PersonaVestPeakBridgeLedger = z.infer<typeof PersonaVestPeakBridgeLedgerSchema>;

export type PersonaVestPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_CARD'
    | 'UNKNOWN_VEST'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_PERSONA_FAIL'
    | 'CHILD_VEST_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'WEARER_MISMATCH'
    | 'EP_NOT_TERNARY'
    | 'DROP_WITHOUT_BRIDGE'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'PENDING_VEST';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface PersonaVestPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    cards: number;
    vests: number;
    peaks: number;
    latestEp: number;
  };
  findings: PersonaVestPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluatePersonaVestPeakBridge(input: unknown): PersonaVestPeakBridgeReport {
  const parsed = PersonaVestPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, cards: 0, vests: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, cards, vests, peaks, links } = parsed.data;
  const findings: PersonaVestPeakBridgeFinding[] = [];
  const push = (x: PersonaVestPeakBridgeFinding) => findings.push(x);

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

  const vestReport = evaluateIdentityVest({ series, latestEp, entries: vests });
  if (vestReport.verdict === 'FAIL') {
    const childFails = vestReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_VEST_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌马甲账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 identity-vest-gate',
    });
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

  const byCard = new Map(cards.map((c) => [c.slug, c]));
  const byVest = new Map(vests.map((v) => [v.id, v]));
  const byPeak = new Map(peaks.map((p) => [p.id, p]));
  const linkedVests = new Set<string>();
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
    const vest = byVest.get(link.vestId);
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

    if (vest.wearer !== card.name) {
      push({
        code: 'WEARER_MISMATCH',
        severity: 'FAIL',
        ids: [link.id, card.slug, vest.id],
        message: `${link.id}: vest.wearer=${vest.wearer} ≠ card.name=${card.name}`,
        fix: '马甲 wearer 须对齐人设卡 name',
      });
      continue;
    }

    if (
      vest.dropEp === undefined ||
      peak.peakEp === undefined ||
      link.ep !== vest.dropEp ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, vest.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 drop=${vest.dropEp ?? '无'}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = dropEp = peakEp',
      });
      continue;
    }

    linkedVests.add(vest.id);
    linkedPeaks.add(peak.id);
    aligned += 1;
  }

  for (const vest of vests) {
    if (vest.dropEp !== undefined && !linkedVests.has(vest.id)) {
      push({
        code: 'DROP_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [vest.id],
        message: `vest ${vest.id} dropEp=E${vest.dropEp} 无 persona×vest×peak 桥`,
        fix: '为掉落集挂 PersonaVestPeakBridge',
      });
    } else if (!linkedVests.has(vest.id)) {
      push({
        code: 'PENDING_VEST',
        severity: 'WARN',
        ids: [vest.id],
        message: `vest ${vest.id} 尚未联表到 persona×vest×peak 桥`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedPeaks.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 persona×vest×peak 桥`,
        fix: '为峰值集挂 PersonaVestPeakBridge',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      cards: cards.length,
      vests: vests.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
