/**
 * V12 · Cold-Open Hook × Reaction-After-Reversal Dual Gate (冷开场钩 + 反转后反应 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽/悬疑向: 开场即危机，且反转落地须立刻给反应镜放大情绪.
 * Embeds evaluateColdOpenHook + evaluateReactionAfterReversal; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  COLD_OPEN_LATE / SETUP_BEFORE_HOOK / REVERSAL_NO_REACTION (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateColdOpenHook,
  type ColdOpenHookFinding,
  type ColdOpenHookOptions,
  type ColdOpenHookReport,
} from './cold-open-hook-gate';
import {
  evaluateReactionAfterReversal,
  type ReactionAfterReversalFinding,
  type ReactionAfterReversalOptions,
} from './reaction-after-reversal-gate';

export interface ColdOpenReactionOptions extends ColdOpenHookOptions {
  reactionWindowSec?: number;
  lookbackSec?: number;
  requireReaction?: boolean;
  reversalOnly?: boolean;
}

export type ColdOpenReactionFinding = {
  code: ColdOpenHookFinding['code'] | ReactionAfterReversalFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface ColdOpenReactionReport {
  verdict: 'PASS' | 'FAIL';
  metrics: ColdOpenHookReport['metrics'] & {
    turnShots: number;
    reactionShots: number;
    missingAfterTurn: number;
    reversalCount: number;
    reversalMissing: number;
  };
  findings: ColdOpenReactionFinding[];
  thresholds: Required<ColdOpenReactionOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateColdOpenReaction(
  shotSpecRaw: unknown,
  opts: ColdOpenReactionOptions = {},
): ColdOpenReactionReport {
  const cold = evaluateColdOpenHook(shotSpecRaw, opts);
  const rxOpts: ReactionAfterReversalOptions = {
    reactionWindowSec: opts.reactionWindowSec,
    lookbackSec: opts.lookbackSec,
    requireReaction: opts.requireReaction ?? false,
    reversalOnly: opts.reversalOnly,
  };
  const rx = evaluateReactionAfterReversal(shotSpecRaw, rxOpts);

  const findings: ColdOpenReactionFinding[] = [...(cold.findings as ColdOpenReactionFinding[])];
  for (const f of rx.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'REVERSAL_NO_REACTION' ||
      f.code === 'REACTION_MISSING' ||
      f.code === 'INVALID_ROLE' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as ColdOpenReactionFinding);
    }
  }

  const thresholds = {
    ...cold.thresholds,
    reactionWindowSec: rx.thresholds.reactionWindowSec,
    lookbackSec: rx.thresholds.lookbackSec,
    requireReaction: rx.thresholds.requireReaction,
    reversalOnly: rx.thresholds.reversalOnly,
  } as Required<ColdOpenReactionOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...cold.metrics,
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
