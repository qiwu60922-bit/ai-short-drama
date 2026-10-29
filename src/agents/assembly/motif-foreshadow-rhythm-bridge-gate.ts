/**
 * V12 · Motif × Foreshadow × Series-Rhythm Ternary Bridge
 * (视觉母题 × 剧情伏笔 × 系列节奏 三元桥), pre-generation, offline, deterministic.
 *
 * Cross-suite: motif-callback + foreshadow-ledger ↔ shot-spec series-rhythm.
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《盛夏芬德拉》: 白玫瑰回扣与身份伏笔 payoff 同镜，且须落入 dense/intrigue 节奏档.
 *  - motifRhythmBridge / foreshadowRhythmBridge 已各自桥节奏——本 gate 硬对齐同 ep 三元同框.
 *
 * Per link: motifId + foreshadowId + ep + shotSpec(+profile).
 *  SCHEMA / DUP_ID / UNKNOWN_MOTIF / UNKNOWN_FORESHADOW / FUTURE_EP
 *  CHILD_MOTIF_FAIL / CHILD_FORESHADOW_FAIL / CHILD_RHYTHM_FAIL
 *  NO_MOTIF_AT_EP / NO_FORESHADOW_AT_EP
 *  PROFILE_MISMATCH (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import {
  MotifEntrySchema,
  MotifAppearanceSchema,
  evaluateMotifCallbacks,
} from './motif-callback-gate';
import {
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
} from './foreshadow-ledger-gate';
import {
  evaluateSeriesRhythm,
  SERIES_RHYTHM_PROFILE_NAMES,
  type SeriesRhythmProfileName,
} from './series-rhythm-profile';

const Ep = z.number().int().positive();

export const MotifForeshadowRhythmBridgeLinkSchema = z.object({
  id: z.string().min(1),
  motifId: z.string().min(1),
  foreshadowId: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  profile: z.enum(['dense', 'default', 'intrigue', 'slow_burn']).optional(),
  note: z.string().optional(),
});

export const MotifForeshadowRhythmBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  profile: z.enum(['dense', 'default', 'intrigue', 'slow_burn']).optional(),
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  items: z.array(ForeshadowItemSchema),
  links: z.array(MotifForeshadowRhythmBridgeLinkSchema),
});

export type MotifForeshadowRhythmBridgeLedger = z.infer<
  typeof MotifForeshadowRhythmBridgeLedgerSchema
>;

export type MotifForeshadowRhythmBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_MOTIF'
    | 'UNKNOWN_FORESHADOW'
    | 'FUTURE_EP'
    | 'CHILD_MOTIF_FAIL'
    | 'CHILD_FORESHADOW_FAIL'
    | 'CHILD_RHYTHM_FAIL'
    | 'NO_MOTIF_AT_EP'
    | 'NO_FORESHADOW_AT_EP'
    | 'PROFILE_MISMATCH';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface MotifForeshadowRhythmBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    motifs: number;
    items: number;
    latestEp: number;
    profile: string;
  };
  findings: MotifForeshadowRhythmBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateMotifForeshadowRhythmBridge(
  input: unknown,
): MotifForeshadowRhythmBridgeReport {
  const parsed = MotifForeshadowRhythmBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, motifs: 0, items: 0, latestEp: 0, profile: 'default' },
      findings: [
        {
          code: 'SCHEMA',
          severity: 'FAIL',
          message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        },
      ],
      gates: GATES,
    };
  }

  const {
    series,
    latestEp,
    motifs,
    appearances,
    items,
    links,
    profile: defaultProfile = 'default',
  } = parsed.data;
  const findings: MotifForeshadowRhythmBridgeFinding[] = [];
  const push = (x: MotifForeshadowRhythmBridgeFinding) => findings.push(x);

  const motifReport = evaluateMotifCallbacks({ series, latestEp, motifs, appearances });
  if (motifReport.verdict === 'FAIL') {
    const childFails = motifReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_MOTIF_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌母题账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 motif-callback-gate',
    });
  }

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

  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const l of links) {
    if (seen.has(l.id)) dups.add(l.id);
    else seen.add(l.id);
  }
  for (const id of dups) {
    push({
      code: 'DUP_ID',
      severity: 'FAIL',
      ids: [id],
      message: `联表ID重复：${id}`,
      fix: '联表 id 须唯一',
    });
  }

  const byMotif = new Map(motifs.map((m) => [m.id, m]));
  const byItem = new Map(items.map((it) => [it.id, it]));
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

    if (!byMotif.has(link.motifId)) {
      push({
        code: 'UNKNOWN_MOTIF',
        severity: 'FAIL',
        ids: [link.id, link.motifId],
        message: `联表 ${link.id} 引用未知 motif ${link.motifId}`,
        fix: 'motifId 须存在于 motifs[]',
      });
      continue;
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

    const hasMotif = appearances.some((a) => a.motifId === link.motifId && a.ep === link.ep);
    if (!hasMotif) {
      push({
        code: 'NO_MOTIF_AT_EP',
        severity: 'FAIL',
        ids: [link.id, link.motifId],
        message: `${link.id}: motif ${link.motifId} 在 E${link.ep} 无 appearance`,
        fix: '补 appearances[] 或改 link.ep',
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
        ids: [link.id, link.motifId, link.foreshadowId, ...(childFails.flatMap((f) => f.shotIds ?? []))],
        message: `${link.id}: seriesRhythm(${profile}) FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '母题×伏笔同框镜须落入系列节奏档阈值',
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
      motifs: motifs.length,
      items: items.length,
      latestEp,
      profile: defaultProfile,
    },
    findings,
    gates: GATES,
  };
}
