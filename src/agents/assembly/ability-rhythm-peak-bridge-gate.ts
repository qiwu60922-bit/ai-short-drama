/**
 * V12 · Ability × Rhythm × Peak Ternary Bridge
 * (金手指 × 系列节奏 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 金手指使用当集常踩对峙峰值，且节奏须过 story-rhythm 密度门.
 *  - 与 abilityCountdownPeakBridge / motifRhythmPeakBridge 互补：本 gate 以 ability 联 rhythm×peak.
 *
 * rhythms[]: { id, ep, shotSpec }
 * Per link: abilityId + rhythmId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_ABILITY / UNKNOWN_RHYTHM / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_ABILITY_FAIL / CHILD_RHYTHM_FAIL / CHILD_PEAK_FAIL
 *  EP_NOT_TERNARY — link.ep = rhythm.ep = peakEp
 *  ACQUIRED_AFTER_TERNARY / NO_USE_AT_TERNARY
 *  RHYTHM_WITHOUT_BRIDGE / PEAK_WITHOUT_BRIDGE
 *  PENDING_ABILITY (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { evaluateStoryRhythm } from './story-rhythm-gate';
import {
  AbilityEntrySchema,
  AbilityUseSchema,
  evaluateAbilityRules,
} from './ability-rule-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const AbilityRhythmPeakRhythmEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const AbilityRhythmPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  abilityId: z.string().min(1),
  rhythmId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const AbilityRhythmPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  rhythms: z.array(AbilityRhythmPeakRhythmEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AbilityRhythmPeakBridgeLinkSchema),
});

export type AbilityRhythmPeakBridgeLedger = z.infer<typeof AbilityRhythmPeakBridgeLedgerSchema>;

export type AbilityRhythmPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_ABILITY'
    | 'UNKNOWN_RHYTHM'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_ABILITY_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'CHILD_RHYTHM_FAIL'
    | 'EP_NOT_TERNARY'
    | 'ACQUIRED_AFTER_TERNARY'
    | 'NO_USE_AT_TERNARY'
    | 'RHYTHM_WITHOUT_BRIDGE'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'PENDING_ABILITY';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AbilityRhythmPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    abilities: number;
    rhythms: number;
    peaks: number;
    latestEp: number;
  };
  findings: AbilityRhythmPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAbilityRhythmPeakBridge(input: unknown): AbilityRhythmPeakBridgeReport {
  const parsed = AbilityRhythmPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, abilities: 0, rhythms: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, abilities, uses, rhythms, peaks, links } = parsed.data;
  const findings: AbilityRhythmPeakBridgeFinding[] = [];
  const push = (x: AbilityRhythmPeakBridgeFinding) => findings.push(x);

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

  for (const ry of rhythms) {
    const r = evaluateStoryRhythm(ry.shotSpec);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_RHYTHM_FAIL',
        severity: 'FAIL',
        ids: [ry.id, ...childFails.flatMap((f) => f.shotIds ?? [])],
        message: `rhythm ${ry.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 story-rhythm-gate',
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
  const byRy = new Map(rhythms.map((r) => [r.id, r]));
  const byPeak = new Map(peaks.map((p) => [p.id, p]));
  const linkedAb = new Set<string>();
  const linkedRy = new Set<string>();
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
    const ry = byRy.get(link.rhythmId);
    if (!ry) {
      push({
        code: 'UNKNOWN_RHYTHM',
        severity: 'FAIL',
        ids: [link.id, link.rhythmId],
        message: `联表 ${link.id} 引用未知 rhythm ${link.rhythmId}`,
        fix: 'rhythmId 须存在于 rhythms[]',
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

    if (peak.peakEp === undefined || link.ep !== ry.ep || link.ep !== peak.peakEp) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, ab.id, ry.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 rhythm=${ry.ep}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = rhythm.ep = peakEp',
      });
      continue;
    }

    if (ab.acquiredEp > link.ep) {
      push({
        code: 'ACQUIRED_AFTER_TERNARY',
        severity: 'FAIL',
        ids: [link.id, ab.id],
        message: `${link.id}: ability ${ab.id} acquiredEp=E${ab.acquiredEp} > ternary E${link.ep}`,
        fix: 'acquiredEp 须 ≤ ternary ep',
      });
      continue;
    }

    const used = uses.some((u) => u.abilityId === ab.id && u.by === ab.holder && u.ep === link.ep);
    if (!used) {
      push({
        code: 'NO_USE_AT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, ab.id],
        message: `${link.id}: ability ${ab.id} 在 ternary E${link.ep} 无 holder 使用`,
        fix: '三元同框集须有金手指使用',
      });
      continue;
    }

    linkedAb.add(ab.id);
    linkedRy.add(ry.id);
    linkedPeaks.add(peak.id);
    aligned += 1;
  }

  for (const ry of rhythms) {
    if (!linkedRy.has(ry.id)) {
      push({
        code: 'RHYTHM_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [ry.id],
        message: `rhythm ${ry.id} 无 ability×rhythm×peak 桥`,
        fix: '为节奏档挂 AbilityRhythmPeakBridge',
      });
    }
  }
  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedPeaks.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 ability×rhythm×peak 桥`,
        fix: '为峰值集挂 AbilityRhythmPeakBridge',
      });
    }
  }
  for (const a of abilities) {
    if (!linkedAb.has(a.id)) {
      push({
        code: 'PENDING_ABILITY',
        severity: 'WARN',
        ids: [a.id],
        message: `ability ${a.id} 尚未联表`,
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
      rhythms: rhythms.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
