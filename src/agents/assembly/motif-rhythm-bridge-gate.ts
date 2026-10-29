/**
 * V12 · Motif × Series-Rhythm Bridge (视觉母题 × 系列节奏档 跨 suite 桥),
 * pre-generation, offline, deterministic.
 *
 * Cross-suite: story motif-callback ledger ↔ shot-spec series-rhythm profile.
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《盛夏芬德拉》白玫瑰回扣镜须落在系列节奏档（dense/intrigue）可接受镜长内.
 *  - 《大唐憨婿》权谋母题回扣不能用密爽切碎布局镜 → profile intrigue.
 *
 * Per link: motifId + ep + shotSpec(+profile). Embed evaluateMotifCallbacks + evaluateSeriesRhythm.
 *  SCHEMA / DUP_ID / UNKNOWN_MOTIF / FUTURE_EP
 *  CHILD_MOTIF_FAIL / CHILD_RHYTHM_FAIL
 *  NO_APPEARANCE_AT_EP — motif 在 link.ep 无 appearance
 *  PROFILE_MISMATCH (WARN) — link.profile 与 bridge 默认 profile 不一致
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
  evaluateSeriesRhythm,
  SERIES_RHYTHM_PROFILE_NAMES,
  type SeriesRhythmProfileName,
} from './series-rhythm-profile';

const Ep = z.number().int().positive();

export const MotifRhythmBridgeLinkSchema = z.object({
  id: z.string().min(1),
  motifId: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  profile: z.enum(['dense', 'default', 'intrigue', 'slow_burn']).optional(),
  note: z.string().optional(),
});

export const MotifRhythmBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  /** Default series rhythm profile for links that omit profile. */
  profile: z.enum(['dense', 'default', 'intrigue', 'slow_burn']).optional(),
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  links: z.array(MotifRhythmBridgeLinkSchema),
});

export type MotifRhythmBridgeLedger = z.infer<typeof MotifRhythmBridgeLedgerSchema>;

export type MotifRhythmBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_MOTIF'
    | 'FUTURE_EP'
    | 'CHILD_MOTIF_FAIL'
    | 'CHILD_RHYTHM_FAIL'
    | 'NO_APPEARANCE_AT_EP'
    | 'PROFILE_MISMATCH';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface MotifRhythmBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    motifs: number;
    latestEp: number;
    profile: string;
  };
  findings: MotifRhythmBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateMotifRhythmBridge(input: unknown): MotifRhythmBridgeReport {
  const parsed = MotifRhythmBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, motifs: 0, latestEp: 0, profile: 'default' },
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

  const { series, latestEp, motifs, appearances, links, profile: defaultProfile = 'default' } =
    parsed.data;
  const findings: MotifRhythmBridgeFinding[] = [];
  const push = (x: MotifRhythmBridgeFinding) => findings.push(x);

  const motifReport = evaluateMotifCallbacks({ series, latestEp, motifs, appearances });
  if (motifReport.verdict === 'FAIL') {
    const childFails = motifReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_MOTIF_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌母题账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 motif-callback-gate（seed→echo→payoff）',
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

  const motifIds = new Set(motifs.map((m) => m.id));
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

    if (!motifIds.has(link.motifId)) {
      push({
        code: 'UNKNOWN_MOTIF',
        severity: 'FAIL',
        ids: [link.id, link.motifId],
        message: `联表 ${link.id} 引用未知 motif ${link.motifId}`,
        fix: 'motifId 须存在于 motifs[]',
      });
      continue;
    }

    const atEp = appearances.some((a) => a.motifId === link.motifId && a.ep === link.ep);
    if (!atEp) {
      push({
        code: 'NO_APPEARANCE_AT_EP',
        severity: 'FAIL',
        ids: [link.id, link.motifId],
        message: `${link.id}: motif ${link.motifId} 在 E${link.ep} 无 appearance`,
        fix: '为该集补 motif appearance，或改 link.ep',
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
        fix: `统一档位，或确认该回扣镜故意用 ${link.profile}（可选 ${SERIES_RHYTHM_PROFILE_NAMES.join('|')}）`,
      });
    }

    const rhythm = evaluateSeriesRhythm(link.shotSpec, { profile });
    if (rhythm.verdict === 'FAIL') {
      const childFails = rhythm.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_RHYTHM_FAIL',
        severity: 'FAIL',
        ids: [link.id, link.motifId, ...(childFails.flatMap((f) => f.shotIds ?? []))],
        message: `${link.id}: seriesRhythm(${profile}) FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '母题回扣镜须落入系列节奏档阈值（镜长/事件密度）',
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
      latestEp,
      profile: defaultProfile,
    },
    findings,
    gates: GATES,
  };
}
