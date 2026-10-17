/**
 * V12 · Reaction Beat Gate (反应镜闸门), pre-generation, offline.
 *
 * Reverse-engineered from public text of 2026-10 红果 hits (structure only, no footage):
 *  - 《天幕直播》: 天幕式 reaction 镜放大情绪——揭晓/反转后立刻给观众一张脸/群像反应。
 *  - 《伪人降临…》类悬疑: 查验结果落地后需要反应拍，否则信息增量落不下来。
 *
 * Depends on BEAT_ROLES including `reaction` (extended in hook-structure-gate).
 *  SCHEMA (FAIL)                 ShotSpecDocSchema fail
 *  INVALID_ROLE (FAIL)           beatRole outside BEAT_ROLES
 *  REACTION_MISSING (WARN|FAIL)  reversal/increment/cliffhanger not followed by reaction
 *                                within reactionWindowSec (default 8); FAIL when requireReaction
 *  REACTION_ORPHAN (WARN)        reaction with no preceding turn/cliff within lookbackSec (default 12)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { BEAT_ROLES, type BeatRole } from './hook-structure-gate';

export interface ReactionBeatOptions {
  reactionWindowSec?: number;
  lookbackSec?: number;
  requireReaction?: boolean;
}

export const REACTION_BEAT_DEFAULTS: Required<ReactionBeatOptions> = {
  reactionWindowSec: 8,
  lookbackSec: 12,
  requireReaction: false,
};

export type ReactionBeatFinding = {
  code: 'SCHEMA' | 'INVALID_ROLE' | 'REACTION_MISSING' | 'REACTION_ORPHAN';
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface ReactionBeatReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    totalSeconds: number;
    turnShots: number;
    reactionShots: number;
    missingAfterTurn: number;
    orphanReactions: number;
  };
  findings: ReactionBeatFinding[];
  thresholds: Required<ReactionBeatOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const isRole = (v: unknown): v is BeatRole =>
  typeof v === 'string' && (BEAT_ROLES as readonly string[]).includes(v);

const TURN_ROLES: ReadonlySet<BeatRole> = new Set(['reversal', 'increment', 'cliffhanger']);

export function evaluateReactionBeats(shotSpecRaw: unknown, opts: ReactionBeatOptions = {}): ReactionBeatReport {
  const t: Required<ReactionBeatOptions> = { ...REACTION_BEAT_DEFAULTS, ...opts };
  const gates = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };
  const empty = {
    totalSeconds: 0,
    turnShots: 0,
    reactionShots: 0,
    missingAfterTurn: 0,
    orphanReactions: 0,
  };
  const p = ShotSpecDocSchema.safeParse(shotSpecRaw);
  if (!p.success) {
    return {
      verdict: 'FAIL',
      thresholds: t,
      gates,
      metrics: empty,
      findings: [
        {
          code: 'SCHEMA',
          severity: 'FAIL',
          message: p.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        },
      ],
    };
  }

  let clock = 0;
  const shots = p.data.shots.map((s) => {
    const raw = (s as { beatRole?: unknown }).beatRole;
    const start = clock;
    clock += s.durSec;
    return {
      id: s.shotId,
      dur: s.durSec,
      start,
      end: clock,
      raw,
      role: isRole(raw) ? raw : undefined,
    };
  });
  const total = clock;
  const findings: ReactionBeatFinding[] = [];

  const invalid = shots.filter((s) => s.raw !== undefined && s.raw !== null && !s.role);
  if (invalid.length) {
    findings.push({
      code: 'INVALID_ROLE',
      severity: 'FAIL',
      message: `beatRole must be one of ${BEAT_ROLES.join('|')}`,
      shotIds: invalid.map((s) => s.id),
    });
  }

  const turns = shots.filter((s) => s.role && TURN_ROLES.has(s.role));
  const reactions = shots.filter((s) => s.role === 'reaction');
  let missing = 0;
  for (const turn of turns) {
    const followed = reactions.some(
      (r) => r.start >= turn.end && r.start <= turn.end + t.reactionWindowSec,
    );
    if (!followed) {
      missing += 1;
      findings.push({
        code: 'REACTION_MISSING',
        severity: t.requireReaction ? 'FAIL' : 'WARN',
        message: `${turn.role} ${turn.id} ends at ${r2(turn.end)}s with no reaction within ${t.reactionWindowSec}s`,
        shotIds: [turn.id],
      });
    }
  }

  let orphans = 0;
  for (const r of reactions) {
    const prior = turns.some((turn) => turn.end <= r.start && r.start - turn.end <= t.lookbackSec);
    if (!prior) {
      orphans += 1;
      findings.push({
        code: 'REACTION_ORPHAN',
        severity: 'WARN',
        message: `reaction ${r.id} at ${r2(r.start)}s has no turn/cliff within prior ${t.lookbackSec}s`,
        shotIds: [r.id],
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      totalSeconds: r2(total),
      turnShots: turns.length,
      reactionShots: reactions.length,
      missingAfterTurn: missing,
      orphanReactions: orphans,
    },
    findings,
    thresholds: t,
    gates,
  };
}
