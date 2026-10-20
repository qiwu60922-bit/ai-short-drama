/**
 * V12 · Opening Cascade Gate (开场叠钩闸门), pre-generation, offline.
 *
 * Reverse-engineered from public text breakdowns of 2026-10 红果/抖音 hits (structure only, no footage):
 *  - 《老公请和我恋爱吧》: 派出所认亲 → 死对头变合法老公 → 穿到八年后 — 开场叠钩 cascade.
 *  - 《回到70年代霸道婆婆带我飞》: 跳河危机 → 穿书认知 → 婆婆重生反常拥抱 — 三层叠钩.
 *  - 《我成全嫡孙抗旨退婚，他却慌了》(快创): 八十老太重生 + 全族流放三日倒计时 + 前世惨死 — 开场叠层.
 *  - 《猪圈倒了，薄荷火了》(晨帧): 恶邻贴墙建猪圈 + 臭气压迫后立刻反常种薄荷 — 冲突后马上第二拍.
 *
 * Counts shots whose `beatRole` ∈ CASCADE_BEAT_ROLES and whose start time is inside cascadeWindowSec.
 *  SCHEMA (FAIL)         ShotSpecDocSchema fail
 *  CASCADE_THIN (FAIL)   cascadeBeatCount < minCascadeBeats (default 2)
 *  INVALID_ROLE (FAIL)   beatRole outside BEAT_ROLES vocabulary
 *  CASCADE_FLAT (WARN)   ≥minCascadeBeats but all cascade roles identical (同拍重复, 少信息增量)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { BEAT_ROLES, type BeatRole } from './hook-structure-gate';

/** Roles that count as an opening cascade beat (叠钩可计拍). */
export const CASCADE_BEAT_ROLES = ['hook', 'reversal', 'increment'] as const;
export type CascadeBeatRole = (typeof CASCADE_BEAT_ROLES)[number];

export interface OpeningCascadeOptions {
  /** Seconds from episode start that still count as "opening". Default 8. */
  cascadeWindowSec?: number;
  /** Minimum cascade beats that must *start* inside the window. Default 2. */
  minCascadeBeats?: number;
}

export type OpeningCascadeFinding = {
  code: 'SCHEMA' | 'CASCADE_THIN' | 'INVALID_ROLE' | 'CASCADE_FLAT';
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface OpeningCascadeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    totalSeconds: number;
    cascadeWindowSec: number;
    minCascadeBeats: number;
    cascadeBeatCount: number;
    cascadeStartsAtSec: number[];
    cascadeRoles: CascadeBeatRole[];
    cascadeShotIds: string[];
  };
  findings: OpeningCascadeFinding[];
  thresholds: Required<OpeningCascadeOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const isRole = (v: unknown): v is BeatRole =>
  typeof v === 'string' && (BEAT_ROLES as readonly string[]).includes(v);
const isCascadeRole = (v: unknown): v is CascadeBeatRole =>
  typeof v === 'string' && (CASCADE_BEAT_ROLES as readonly string[]).includes(v);

export function evaluateOpeningCascade(
  shotSpecRaw: unknown,
  opts: OpeningCascadeOptions = {},
): OpeningCascadeReport {
  const t: Required<OpeningCascadeOptions> = {
    cascadeWindowSec: 8,
    minCascadeBeats: 2,
    ...opts,
  };
  const gates = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };
  const emptyMetrics = {
    totalSeconds: 0,
    cascadeWindowSec: t.cascadeWindowSec,
    minCascadeBeats: t.minCascadeBeats,
    cascadeBeatCount: 0,
    cascadeStartsAtSec: [] as number[],
    cascadeRoles: [] as CascadeBeatRole[],
    cascadeShotIds: [] as string[],
  };

  const p = ShotSpecDocSchema.safeParse(shotSpecRaw);
  if (!p.success) {
    return {
      verdict: 'FAIL',
      thresholds: t,
      gates,
      metrics: emptyMetrics,
      findings: [
        {
          code: 'SCHEMA',
          severity: 'FAIL',
          message: `ShotSpec schema invalid: ${p.error.issues[0]?.message ?? 'parse failed'}`,
        },
      ],
    };
  }

  const findings: OpeningCascadeFinding[] = [];
  const cascadeStartsAtSec: number[] = [];
  const cascadeRoles: CascadeBeatRole[] = [];
  const cascadeShotIds: string[] = [];
  let cursor = 0;
  let total = 0;

  for (const shot of p.data.shots) {
    const dur = Number(shot.durSec) || 0;
    const start = cursor;
    const end = cursor + dur;
    cursor = end;
    total = end;

    const rawRole = (shot as { beatRole?: unknown }).beatRole;
    if (rawRole !== undefined && rawRole !== null && rawRole !== '' && !isRole(rawRole)) {
      findings.push({
        code: 'INVALID_ROLE',
        severity: 'FAIL',
        message: `shot ${shot.shotId} has unknown beatRole "${String(rawRole)}"`,
        shotIds: [shot.shotId],
      });
      continue;
    }

    if (isCascadeRole(rawRole) && start < t.cascadeWindowSec) {
      cascadeStartsAtSec.push(r2(start));
      cascadeRoles.push(rawRole);
      cascadeShotIds.push(shot.shotId);
    }
  }

  const cascadeBeatCount = cascadeRoles.length;
  if (cascadeBeatCount < t.minCascadeBeats) {
    findings.push({
      code: 'CASCADE_THIN',
      severity: 'FAIL',
      message:
        `opening cascade has ${cascadeBeatCount} beat(s) starting within ${t.cascadeWindowSec}s; ` +
        `need ≥${t.minCascadeBeats} of ${CASCADE_BEAT_ROLES.join('|')} (叠钩 cascade)`,
      shotIds: cascadeShotIds.length ? cascadeShotIds : undefined,
    });
  } else if (new Set(cascadeRoles).size === 1) {
    findings.push({
      code: 'CASCADE_FLAT',
      severity: 'WARN',
      message:
        `opening cascade uses only "${cascadeRoles[0]}" ${cascadeBeatCount}× — ` +
        `prefer mixing hook/reversal/increment for information stack`,
      shotIds: cascadeShotIds,
    });
  }

  const hasFail = findings.some((f) => f.severity === 'FAIL');
  return {
    verdict: hasFail ? 'FAIL' : 'PASS',
    thresholds: t,
    gates,
    metrics: {
      totalSeconds: r2(total),
      cascadeWindowSec: t.cascadeWindowSec,
      minCascadeBeats: t.minCascadeBeats,
      cascadeBeatCount,
      cascadeStartsAtSec,
      cascadeRoles,
      cascadeShotIds,
    },
    findings,
  };
}
