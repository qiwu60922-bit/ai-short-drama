/**
 * V12 · Mid-Hook Early × Reaction-After-Reversal Dual Gate (中段早钩 + 反转后反应 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 中段尽快再抛钩，且反转落地须立刻给反应镜.
 * Embeds evaluateMidHookEarly + evaluateReactionAfterReversal; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  MID_HOOK_MISSING / MID_HOOK_LATE / REVERSAL_NO_REACTION (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateMidHookEarly,
  type MidHookEarlyFinding,
  type MidHookEarlyOptions,
  type MidHookEarlyReport,
} from './mid-hook-early-gate';
import {
  evaluateReactionAfterReversal,
  type ReactionAfterReversalFinding,
  type ReactionAfterReversalOptions,
} from './reaction-after-reversal-gate';

export interface MidHookReactionOptions extends MidHookEarlyOptions {
  reactionWindowSec?: number;
  lookbackSec?: number;
  requireReaction?: boolean;
  reversalOnly?: boolean;
}

export type MidHookReactionFinding = {
  code: MidHookEarlyFinding['code'] | ReactionAfterReversalFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface MidHookReactionReport {
  verdict: 'PASS' | 'FAIL';
  metrics: MidHookEarlyReport['metrics'] & {
    turnShots: number;
    reactionShots: number;
    missingAfterTurn: number;
    reversalCount: number;
    reversalMissing: number;
  };
  findings: MidHookReactionFinding[];
  thresholds: Required<MidHookReactionOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateMidHookReaction(
  shotSpecRaw: unknown,
  opts: MidHookReactionOptions = {},
): MidHookReactionReport {
  const mid = evaluateMidHookEarly(shotSpecRaw, opts);
  const rxOpts: ReactionAfterReversalOptions = {
    reactionWindowSec: opts.reactionWindowSec,
    lookbackSec: opts.lookbackSec,
    requireReaction: opts.requireReaction ?? false,
    reversalOnly: opts.reversalOnly,
  };
  const rx = evaluateReactionAfterReversal(shotSpecRaw, rxOpts);

  const findings: MidHookReactionFinding[] = [...(mid.findings as MidHookReactionFinding[])];
  for (const f of rx.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'REVERSAL_NO_REACTION' ||
      f.code === 'REACTION_MISSING' ||
      f.code === 'INVALID_ROLE' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as MidHookReactionFinding);
    }
  }

  const thresholds = {
    ...mid.thresholds,
    reactionWindowSec: rx.thresholds.reactionWindowSec,
    lookbackSec: rx.thresholds.lookbackSec,
    requireReaction: rx.thresholds.requireReaction,
    reversalOnly: rx.thresholds.reversalOnly,
  } as Required<MidHookReactionOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mid.metrics,
      turnShots: rx.metrics.turnShots,
      reactionShots: rx.metrics.reactionShots,
      missingAfterTurn: rx.metrics.missingAfterTurn,
      reversalCount: rx.metrics.reversalCount,
      reversalMissing: rx.metrics.reversalMissing,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
