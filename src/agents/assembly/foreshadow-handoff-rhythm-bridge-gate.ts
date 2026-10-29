/**
 * V12 · Foreshadow × Cliffhanger-Handoff × Series-Rhythm Ternary Bridge
 * (伏笔 × 集间承接 × 系列节奏 三元桥), pre-generation, offline, deterministic.
 *
 * Cross-suite: foreshadow-ledger + cliffhanger-handoff ↔ shot-spec series-rhythm.
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《持械入宋》: S/A 伏笔 payoff 与集间悬念承接同窗，且须落入 dense/intrigue 节奏档.
 *  - foreshadowHandoffLink / foreshadowRhythmBridge 已各自联表——本 gate 硬对齐同 ep 三元同框.
 *
 * Per link: foreshadowId + handoffId + ep + shotSpec(+profile).
 *  SCHEMA / DUP_ID / UNKNOWN_FORESHADOW / UNKNOWN_HANDOFF / FUTURE_EP
 *  CHILD_FORESHADOW_FAIL / CHILD_HANDOFF_FAIL / CHILD_RHYTHM_FAIL
 *  NO_FORESHADOW_AT_EP / HANDOFF_NOT_AT_EP
 *  PROFILE_MISMATCH (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import {
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
} from './foreshadow-ledger-gate';
import { evaluateCliffhangerHandoff } from './cliffhanger-handoff-gate';
import {
  evaluateSeriesRhythm,
  SERIES_RHYTHM_PROFILE_NAMES,
  type SeriesRhythmProfileName,
} from './series-rhythm-profile';

const Ep = z.number().int().positive();

export const ForeshadowHandoffRhythmHandoffEntrySchema = z.object({
  id: z.string().min(1),
  prevEp: Ep,
  nextEp: Ep,
  prev: ShotSpecDocSchema,
  next: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const ForeshadowHandoffRhythmBridgeLinkSchema = z.object({
  id: z.string().min(1),
  foreshadowId: z.string().min(1),
  handoffId: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  profile: z.enum(['dense', 'default', 'intrigue', 'slow_burn']).optional(),
  note: z.string().optional(),
});

export const ForeshadowHandoffRhythmBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  profile: z.enum(['dense', 'default', 'intrigue', 'slow_burn']).optional(),
  items: z.array(ForeshadowItemSchema),
  handoffs: z.array(ForeshadowHandoffRhythmHandoffEntrySchema),
  links: z.array(ForeshadowHandoffRhythmBridgeLinkSchema),
});

export type ForeshadowHandoffRhythmBridgeLedger = z.infer<
  typeof ForeshadowHandoffRhythmBridgeLedgerSchema
>;

export type ForeshadowHandoffRhythmBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_FORESHADOW'
    | 'UNKNOWN_HANDOFF'
    | 'FUTURE_EP'
    | 'CHILD_FORESHADOW_FAIL'
    | 'CHILD_HANDOFF_FAIL'
    | 'CHILD_RHYTHM_FAIL'
    | 'NO_FORESHADOW_AT_EP'
    | 'HANDOFF_NOT_AT_EP'
    | 'PROFILE_MISMATCH';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface ForeshadowHandoffRhythmBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    items: number;
    handoffs: number;
    latestEp: number;
    profile: string;
  };
  findings: ForeshadowHandoffRhythmBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateForeshadowHandoffRhythmBridge(
  input: unknown,
): ForeshadowHandoffRhythmBridgeReport {
  const parsed = ForeshadowHandoffRhythmBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, items: 0, handoffs: 0, latestEp: 0, profile: 'default' },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, items, handoffs, links, profile: defaultProfile = 'default' } = parsed.data;
  const findings: ForeshadowHandoffRhythmBridgeFinding[] = [];
  const push = (x: ForeshadowHandoffRhythmBridgeFinding) => findings.push(x);

  const fsReport = evaluateForeshadowLedger({ series, latestEp, items });
  if (fsReport.verdict === 'FAIL') {
    const childFails = fsReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_FORESHADOW_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌伏笔账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 foreshadow-ledger-gate',
    });
  }

  for (const h of handoffs) {
    const r = evaluateCliffhangerHandoff(h.prev, h.next);
    if (r.verdict === 'FAIL') {
      const codes = r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
      push({
        code: 'CHILD_HANDOFF_FAIL',
        severity: 'FAIL',
        ids: [h.id],
        message: `handoff ${h.id} FAIL：${codes.join(',') || 'unknown'}`,
        fix: '先修 cliffhanger-handoff-gate',
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

  const byItem = new Map(items.map((it) => [it.id, it]));
  const byH = new Map(handoffs.map((h) => [h.id, h]));
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
    const handoff = byH.get(link.handoffId);
    if (!handoff) {
      push({
        code: 'UNKNOWN_HANDOFF',
        severity: 'FAIL',
        ids: [link.id, link.handoffId],
        message: `联表 ${link.id} 引用未知 handoff ${link.handoffId}`,
        fix: 'handoffId 须存在于 handoffs[]',
      });
      continue;
    }

    const events = [item.plantEp, item.payoffEp, item.lastAdvancedEp, item.plannedPayoffEp].filter(
      (e): e is number => typeof e === 'number',
    );
    if (!events.includes(link.ep)) {
      push({
        code: 'NO_FORESHADOW_AT_EP',
        severity: 'FAIL',
        ids: [link.id, item.id],
        message: `${link.id}: foreshadow ${item.id} 在 E${link.ep} 无 plant/advance/payoff`,
        fix: 'link.ep 对准 plantEp / lastAdvancedEp / payoffEp',
      });
      continue;
    }

    if (handoff.prevEp !== link.ep && handoff.nextEp !== link.ep) {
      push({
        code: 'HANDOFF_NOT_AT_EP',
        severity: 'FAIL',
        ids: [link.id, handoff.id],
        message: `${link.id}: handoff ${handoff.id} prev=E${handoff.prevEp}/next=E${handoff.nextEp} 未踩 E${link.ep}`,
        fix: 'handoff.prevEp 或 nextEp 须等于 link.ep',
      });
      continue;
    }

    const profile = (link.profile ?? defaultProfile) as SeriesRhythmProfileName;
    if (link.profile && link.profile !== defaultProfile) {
      push({
        code: 'PROFILE_MISMATCH',
        severity: 'WARN',
        ids: [link.id],
        message: `${link.id}: link.profile=${link.profile} ≠ bridge profile=${defaultProfile}`,
        fix: `统一档位，或确认故意用 ${link.profile}（${SERIES_RHYTHM_PROFILE_NAMES.join('|')}）`,
      });
    }

    const rhythm = evaluateSeriesRhythm(link.shotSpec, { profile });
    if (rhythm.verdict === 'FAIL') {
      const childFails = rhythm.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_RHYTHM_FAIL',
        severity: 'FAIL',
        ids: [link.id, item.id, handoff.id, ...(childFails.flatMap((f) => f.shotIds ?? []))],
        message: `${link.id}: seriesRhythm(${profile}) FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '伏笔×承接同框镜须落入系列节奏档阈值',
      });
      continue;
    }

    aligned += 1;
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      items: items.length,
      handoffs: handoffs.length,
      latestEp,
      profile: defaultProfile,
    },
    findings,
    gates: GATES,
  };
}
