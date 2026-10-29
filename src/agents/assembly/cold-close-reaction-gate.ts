/**
 * V12 · Tail Cold-Close × Reaction-After-Reversal Dual Gate (冷收尾 + 反转后反应 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 尾窗冷收在最大悬念处，且反转落地须立刻给反应镜.
 * Embeds evaluateTailColdClose + evaluateReactionAfterReversal; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  SETUP_AFTER_CLIFF / TAIL_NOT_COLD / REVERSAL_NO_REACTION (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateTailColdClose,
  type TailColdCloseFinding,
  type TailColdCloseOptions,
  type TailColdCloseReport,
} from './tail-cold-close-gate';
import {
  evaluateReactionAfterReversal,
  type ReactionAfterReversalFinding,
  type ReactionAfterReversalOptions,
} from './reaction-after-reversal-gate';

export interface ColdCloseReactionOptions extends TailColdCloseOptions {
  reactionWindowSec?: number;
  lookbackSec?: number;
  requireReaction?: boolean;
  reversalOnly?: boolean;
}

export type ColdCloseReactionFinding = {
  code: TailColdCloseFinding['code'] | ReactionAfterReversalFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface ColdCloseReactionReport {
  verdict: 'PASS' | 'FAIL';
  metrics: TailColdCloseReport['metrics'] & {
    turnShots: number;
    reactionShots: number;
    missingAfterTurn: number;
    reversalCount: number;
    reversalMissing: number;
  };
  findings: ColdCloseReactionFinding[];
  thresholds: Required<ColdCloseReactionOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateColdCloseReaction(
  shotSpecRaw: unknown,
  opts: ColdCloseReactionOptions = {},
): ColdCloseReactionReport {
  const cold = evaluateTailColdClose(shotSpecRaw, opts);
  const rxOpts: ReactionAfterReversalOptions = {
    reactionWindowSec: opts.reactionWindowSec,
    lookbackSec: opts.lookbackSec,
    requireReaction: opts.requireReaction ?? false,
    reversalOnly: opts.reversalOnly,
  };
  const rx = evaluateReactionAfterReversal(shotSpecRaw, rxOpts);

  const findings: ColdCloseReactionFinding[] = [...(cold.findings as ColdCloseReactionFinding[])];
  for (const f of rx.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'REVERSAL_NO_REACTION' ||
      f.code === 'REACTION_MISSING' ||
      f.code === 'INVALID_ROLE' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as ColdCloseReactionFinding);
    }
  }

  const thresholds = {
    ...cold.thresholds,
    reactionWindowSec: rx.thresholds.reactionWindowSec,
    lookbackSec: rx.thresholds.lookbackSec,
    requireReaction: rx.thresholds.requireReaction,
    reversalOnly: rx.thresholds.reversalOnly,
  } as Required<ColdCloseReactionOptions>;

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
