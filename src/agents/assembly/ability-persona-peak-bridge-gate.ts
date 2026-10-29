/**
 * V12 · Ability × Persona × Peak Ternary Bridge
 * (金手指 × 人设卡 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《伪人降临》/《机长先生》: 金手指兑现常与外形卡角色、对峙峰值同拍.
 *  - abilityPersonaLink / personaPeakLink 已各自联表——本 gate 硬对齐同 ep 三元同框.
 *
 * Per link: abilityId + cardSlug + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_ABILITY / UNKNOWN_CARD / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_ABILITY_FAIL / CHILD_PERSONA_FAIL / CHILD_PEAK_FAIL
 *  EP_NOT_TERNARY — link.ep = peakEp
 *  ACQUIRED_AFTER_TERNARY / NO_USE_AT_TERNARY
 *  PEAK_WITHOUT_BRIDGE
 *  PENDING_ABILITY (WARN) / PENDING_CARD (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  AbilityEntrySchema,
  AbilityUseSchema,
  evaluateAbilityRules,
} from './ability-rule-gate';
import { PersonaCardSchema, evaluatePersonaCard } from './persona-card-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const AbilityPersonaPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  abilityId: z.string().min(1),
  cardSlug: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const AbilityPersonaPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  cards: z.array(PersonaCardSchema).min(1),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AbilityPersonaPeakBridgeLinkSchema),
});

export type AbilityPersonaPeakBridgeLedger = z.infer<typeof AbilityPersonaPeakBridgeLedgerSchema>;

export type AbilityPersonaPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_ABILITY'
    | 'UNKNOWN_CARD'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_ABILITY_FAIL'
    | 'CHILD_PERSONA_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'EP_NOT_TERNARY'
    | 'ACQUIRED_AFTER_TERNARY'
    | 'NO_USE_AT_TERNARY'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'PENDING_ABILITY'
    | 'PENDING_CARD';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AbilityPersonaPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    abilities: number;
    cards: number;
    peaks: number;
    latestEp: number;
  };
  findings: AbilityPersonaPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAbilityPersonaPeakBridge(input: unknown): AbilityPersonaPeakBridgeReport {
  const parsed = AbilityPersonaPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, abilities: 0, cards: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, abilities, uses, cards, peaks, links } = parsed.data;
  const findings: AbilityPersonaPeakBridgeFinding[] = [];
  const push = (x: AbilityPersonaPeakBridgeFinding) => findings.push(x);

  const abReport = evaluateAbilityRules({ series, latestEp, abilities, uses });
  if (abReport.verdict === 'FAIL') {
    const childFails = abReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_ABILITY_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌金手指账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 ability-rule-gate',
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

  const byAb = new Map(abilities.map((a) => [a.id, a]));
  const byCard = new Map(cards.map((c) => [c.slug, c]));
  const byPeak = new Map(peaks.map((p) => [p.id, p]));
  const linkedAbs = new Set<string>();
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
    const ab = byAb.get(link.abilityId);
    if (!ab) {
      push({
        code: 'UNKNOWN_ABILITY',
        severity: 'FAIL',
        ids: [link.id, link.abilityId],
        message: `联表 ${link.id} 引用未知 ability ${link.abilityId}`,
        fix: 'abilityId 须存在于 abilities[]',
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

    if (peak.peakEp === undefined || link.ep !== peak.peakEp) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, ab.id, card.slug, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = peakEp',
      });
      continue;
    }

    if (ab.acquiredEp > link.ep) {
      push({
        code: 'ACQUIRED_AFTER_TERNARY',
        severity: 'FAIL',
        ids: [link.id, ab.id, card.slug, peak.id],
        message: `${link.id}: ability acquired@E${ab.acquiredEp} 晚于三元 ep=E${link.ep}`,
        fix: '先觉醒金手指，再人设×冲巅峰；或下调 acquiredEp',
      });
      continue;
    }

    const used = uses.some(
      (u) => u.abilityId === ab.id && u.by === ab.holder && u.ep === link.ep,
    );
    if (!used) {
      push({
        code: 'NO_USE_AT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, ab.id, card.slug, peak.id],
        message: `${link.id}: 三元同框 E${link.ep} 无 holder 使用 ability`,
        fix: '人设×峰值当集用一次金手指兑现规则',
      });
      continue;
    }

    linkedAbs.add(ab.id);
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
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 ability×persona×peak 桥`,
        fix: '为峰值集挂 AbilityPersonaPeakBridge',
      });
    }
  }
  for (const a of abilities) {
    if (!linkedAbs.has(a.id)) {
      push({
        code: 'PENDING_ABILITY',
        severity: 'WARN',
        ids: [a.id],
        message: `ability ${a.id} 尚未联表到 ability×persona×peak 桥`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const card of cards) {
    if (!linkedCards.has(card.slug)) {
      push({
        code: 'PENDING_CARD',
        severity: 'WARN',
        ids: [card.slug],
        message: `card ${card.slug} 尚未联表到 ability×persona×peak 桥`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      abilities: abilities.length,
      cards: cards.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
