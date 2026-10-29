/**
 * V12 · Reaction-After-Reversal Gate (反转后反应镜硬闸), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《天幕直播》/悬疑揭晓: 反转落地须立刻给反应镜，否则信息增量落不下来.
 * Wraps evaluateReactionBeats; additionally FAILS when a reversal has no reaction
 * within reactionWindowSec (default 8).
 *
 *  SCHEMA (+ child reaction findings)
 *  REVERSAL_NO_REACTION (FAIL) — reversal not followed by reaction in window
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { BEAT_ROLES, type BeatRole } from './hook-structure-gate';
import {
  evaluateReactionBeats,
  type ReactionBeatFinding,
  type ReactionBeatOptions,
  type ReactionBeatReport,
} from './reaction-beat-gate';

export interface ReactionAfterReversalOptions extends ReactionBeatOptions {
  /** Only enforce after beatRole=reversal (default true). */
  reversalOnly?: boolean;
}

export type ReactionAfterReversalFinding = {
  code: 'SCHEMA' | 'REVERSAL_NO_REACTION' | ReactionBeatFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface ReactionAfterReversalReport {
  verdict: 'PASS' | 'FAIL';
  metrics: ReactionBeatReport['metrics'] & {
    reversalCount: number;
    reversalMissing: number;
  };
  findings: ReactionAfterReversalFinding[];
  thresholds: Required<ReactionAfterReversalOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };
const isRole = (v: unknown): v is BeatRole =>
  typeof v === 'string' && (BEAT_ROLES as readonly string[]).includes(v);

export function evaluateReactionAfterReversal(
  shotSpecRaw: unknown,
  opts: ReactionAfterReversalOptions = {},
): ReactionAfterReversalReport {
  const reactionWindowSec = opts.reactionWindowSec ?? 8;
  const lookbackSec = opts.lookbackSec ?? 12;
  // Child stays warn-level for non-reversal turns; this gate hard-fails only on reversal.
  const requireReaction = opts.requireReaction ?? false;
  const reversalOnly = opts.reversalOnly ?? true;

  const child = evaluateReactionBeats(shotSpecRaw, {
    reactionWindowSec,
    lookbackSec,
    requireReaction,
  });
  const thresholds: Required<ReactionAfterReversalOptions> = {
    ...child.thresholds,
    reversalOnly,
  };

  const findings: ReactionAfterReversalFinding[] = [
    ...(child.findings as ReactionAfterReversalFinding[]),
  ];

  let reversalCount = 0;
  let reversalMissing = 0;
  const p = ShotSpecDocSchema.safeParse(shotSpecRaw);
  if (p.success) {
    let clock = 0;
    const shots = p.data.shots.map((s) => {
      const start = clock;
      clock += s.durSec;
      const raw = (s as { beatRole?: unknown }).beatRole;
      return {
        id: s.shotId,
        start,
        end: clock,
        role: isRole(raw) ? raw : undefined,
      };
    });

    for (const s of shots) {
      if (s.role !== 'reversal') continue;
      reversalCount += 1;
      const hasReaction = shots.some(
        (r) =>
          r.role === 'reaction' &&
          r.start >= s.end &&
          r.start <= s.end + reactionWindowSec,
      );
      if (!hasReaction) {
        reversalMissing += 1;
        if (!findings.some((f) => f.code === 'SCHEMA')) {
          findings.push({
            code: 'REVERSAL_NO_REACTION',
            severity: 'FAIL',
            message: `reversal ${s.id} 后 ${reactionWindowSec}s 内无 reaction`,
            shotIds: [s.id],
          });
        }
      }
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...child.metrics,
      reversalCount,
      reversalMissing,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
