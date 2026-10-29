/**
 * V12 · Reaction-Before-Cliff Gate (悬念前反应镜闸), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《天幕直播》/悬疑揭晓: cliffhanger 落地前须有反应镜承接情绪，否则悬念空飘.
 * Wraps evaluateReactionBeats; FAIL when a cliffhanger has no reaction ending within
 * lookbackSec before its start (default 8).
 *
 *  SCHEMA (+ child reaction findings)
 *  CLIFF_NO_PRIOR_REACTION (FAIL)
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

export interface ReactionBeforeCliffOptions extends ReactionBeatOptions {
  /** Require reaction before cliffhanger (default true). */
  requirePriorReaction?: boolean;
}

export type ReactionBeforeCliffFinding = {
  code: 'SCHEMA' | 'CLIFF_NO_PRIOR_REACTION' | ReactionBeatFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface ReactionBeforeCliffReport {
  verdict: 'PASS' | 'FAIL';
  metrics: ReactionBeatReport['metrics'] & {
    cliffCount: number;
    cliffMissingPrior: number;
  };
  findings: ReactionBeforeCliffFinding[];
  thresholds: Required<ReactionBeforeCliffOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };
const isRole = (v: unknown): v is BeatRole =>
  typeof v === 'string' && (BEAT_ROLES as readonly string[]).includes(v);

export function evaluateReactionBeforeCliff(
  shotSpecRaw: unknown,
  opts: ReactionBeforeCliffOptions = {},
): ReactionBeforeCliffReport {
  const reactionWindowSec = opts.reactionWindowSec ?? 8;
  const lookbackSec = opts.lookbackSec ?? 8;
  const requireReaction = opts.requireReaction ?? false;
  const requirePriorReaction = opts.requirePriorReaction ?? true;

  const child = evaluateReactionBeats(shotSpecRaw, {
    reactionWindowSec,
    lookbackSec,
    requireReaction,
  });
  const thresholds: Required<ReactionBeforeCliffOptions> = {
    ...child.thresholds,
    requirePriorReaction,
  };

  const findings: ReactionBeforeCliffFinding[] = [
    ...(child.findings as ReactionBeforeCliffFinding[]),
  ];

  let cliffCount = 0;
  let cliffMissingPrior = 0;
  const p = ShotSpecDocSchema.safeParse(shotSpecRaw);
  if (p.success && requirePriorReaction) {
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
      if (s.role !== 'cliffhanger') continue;
      cliffCount += 1;
      const hasPrior = shots.some(
        (r) =>
          r.role === 'reaction' &&
          r.end <= s.start &&
          s.start - r.end <= lookbackSec,
      );
      if (!hasPrior) {
        cliffMissingPrior += 1;
        if (!findings.some((f) => f.code === 'SCHEMA')) {
          findings.push({
            code: 'CLIFF_NO_PRIOR_REACTION',
            severity: 'FAIL',
            message: `cliffhanger ${s.id} 前 ${lookbackSec}s 内无 reaction`,
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
      cliffCount,
      cliffMissingPrior,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
