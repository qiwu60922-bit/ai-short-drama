/**
 * V12 · Series Rhythm Profile Gate (系列节奏档位), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (synopses / chart pages, no footage) of 2026-10-21 hits:
 *  - 《大唐憨婿之我姐姐是太子妃第四季》(溪文): 神药救后·查账反腐·世家联姻渗透东宫 —
 *    多方博弈、朝堂权谋需要「细糠」呼吸，不能用密爽切镜把布局镜切碎 → profile `intrigue`.
 *  - 《当家主母的自我修养》(香芋星/AI 漫): 掌掴撕支票立威 → 拿管家权/基金会 —
 *    开场即密爽打脸，单集事件密度要压上去 → profile `dense`.
 *  - 《婆婆装瘫七年，我高调离婚！》(九天漫剧): 发现装瘫后不吵不闹，等丈夫升副院长再清算 —
 *    跨集「巅峰后再兑现」另做候选；单集场面仍可走 dense / default，本闸只管节奏档位。
 *
 * Wraps evaluateStoryRhythm with named threshold packs. Does not replace story-rhythm-gate.
 *
 *  UNKNOWN_PROFILE (FAIL)   profile name not in SERIES_RHYTHM_PROFILES
 *  (+ all story-rhythm findings once thresholds resolve)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateStoryRhythm,
  type RhythmFinding,
  type RhythmOptions,
  type RhythmReport,
} from './story-rhythm-gate';

export const SERIES_RHYTHM_PROFILES = {
  /** 密爽女频/喜剧：更高事件密度、更短单镜（当家主母掌掴立威） */
  dense: {
    minEventsPer90s: 12,
    maxShotSeconds: 6,
    maxSecondsPerEvent: 6,
    requireCutMotive: false,
  },
  /** 与既有 story-rhythm-gate 默认对齐 */
  default: {
    minEventsPer90s: 10,
    maxShotSeconds: 8,
    maxSecondsPerEvent: 8,
    requireCutMotive: false,
  },
  /** 权谋/多方博弈：允许略长对峙镜、略低密度（大唐憨婿朝堂） */
  intrigue: {
    minEventsPer90s: 7,
    maxShotSeconds: 10,
    maxSecondsPerEvent: 10,
    requireCutMotive: false,
  },
  /** 慢热蓄势：更长呼吸（系列冷开/细糠） */
  slow_burn: {
    minEventsPer90s: 5,
    maxShotSeconds: 12,
    maxSecondsPerEvent: 12,
    requireCutMotive: false,
  },
} as const satisfies Record<string, Required<RhythmOptions>>;

export type SeriesRhythmProfileName = keyof typeof SERIES_RHYTHM_PROFILES;

export const SERIES_RHYTHM_PROFILE_NAMES = Object.keys(
  SERIES_RHYTHM_PROFILES,
) as SeriesRhythmProfileName[];

export type SeriesRhythmResolveOk = {
  ok: true;
  name: SeriesRhythmProfileName;
  thresholds: Required<RhythmOptions>;
};
export type SeriesRhythmResolveErr = {
  ok: false;
  code: 'UNKNOWN_PROFILE';
  message: string;
};
export type SeriesRhythmResolve = SeriesRhythmResolveOk | SeriesRhythmResolveErr;

export function resolveSeriesRhythmProfile(
  name?: string | null,
): SeriesRhythmResolve {
  const raw = (name ?? '').trim();
  const key = (raw === '' ? 'default' : raw) as SeriesRhythmProfileName;
  if (!(key in SERIES_RHYTHM_PROFILES)) {
    return {
      ok: false,
      code: 'UNKNOWN_PROFILE',
      message: `unknown series rhythm profile "${raw}"; want one of ${SERIES_RHYTHM_PROFILE_NAMES.join('|')}`,
    };
  }
  return { ok: true, name: key, thresholds: { ...SERIES_RHYTHM_PROFILES[key] } };
}

export interface SeriesRhythmOptions extends RhythmOptions {
  /** Named pack; default `default`. Explicit RhythmOptions fields override the pack. */
  profile?: string;
}

export type SeriesRhythmFinding =
  | RhythmFinding
  | {
      code: 'UNKNOWN_PROFILE';
      severity: 'FAIL' | 'WARN';
      message: string;
      shotIds?: string[];
    };

export type SeriesRhythmReport = Omit<RhythmReport, 'findings' | 'metrics'> & {
  profile: string;
  findings: SeriesRhythmFinding[];
  metrics: RhythmReport['metrics'] & { profile: string };
};

export function evaluateSeriesRhythm(
  shotSpecRaw: unknown,
  opts: SeriesRhythmOptions = {},
): SeriesRhythmReport {
  const gates = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };
  const requested = opts.profile ?? 'default';
  const resolved = resolveSeriesRhythmProfile(opts.profile);
  if (!resolved.ok) {
    return {
      verdict: 'FAIL',
      profile: requested,
      metrics: {
        totalSeconds: 0,
        cutEvents: 0,
        effectiveEvents: 0,
        eventsPer90s: 0,
        maxShotSeconds: 0,
        maxSecondsPerEvent: 0,
        profile: requested,
      },
      findings: [
        {
          code: 'UNKNOWN_PROFILE',
          severity: 'FAIL',
          message: resolved.message,
        },
      ],
      thresholds: { ...SERIES_RHYTHM_PROFILES.default },
      gates,
    };
  }

  const merged: RhythmOptions = {
    ...resolved.thresholds,
    ...(opts.minEventsPer90s !== undefined
      ? { minEventsPer90s: opts.minEventsPer90s }
      : {}),
    ...(opts.maxShotSeconds !== undefined
      ? { maxShotSeconds: opts.maxShotSeconds }
      : {}),
    ...(opts.maxSecondsPerEvent !== undefined
      ? { maxSecondsPerEvent: opts.maxSecondsPerEvent }
      : {}),
    ...(opts.requireCutMotive !== undefined
      ? { requireCutMotive: opts.requireCutMotive }
      : {}),
  };
  const base = evaluateStoryRhythm(shotSpecRaw, merged);
  return {
    ...base,
    profile: resolved.name,
    metrics: { ...base.metrics, profile: resolved.name },
  };
}
