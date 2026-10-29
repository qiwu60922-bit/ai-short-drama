/**
 * V12 · Mid-Turn Density × Reaction-Before-Cliff Gate (中段密度 + 悬念前反应 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽/悬疑向: 中段反转够密，且 cliff 前须有反应镜.
 * Embeds evaluateMidTurnDensity + evaluateReactionBeforeCliff; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  MID_TURN_SPARSE / CLIFF_NO_PRIOR_REACTION (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateMidTurnDensity,
  type MidTurnDensityFinding,
  type MidTurnDensityOptions,
  type MidTurnDensityReport,
} from './mid-turn-density-gate';
import {
  evaluateReactionBeforeCliff,
  type ReactionBeforeCliffFinding,
  type ReactionBeforeCliffOptions,
} from './reaction-before-cliff-gate';

export interface MidTurnReactionOptions extends MidTurnDensityOptions {
  requirePriorReaction?: boolean;
  reactionWindowSec?: number;
  lookbackSec?: number;
  requireReaction?: boolean;
}

export type MidTurnReactionFinding = {
  code: MidTurnDensityFinding['code'] | ReactionBeforeCliffFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface MidTurnReactionReport {
  verdict: 'PASS' | 'FAIL';
  metrics: MidTurnDensityReport['metrics'] & {
    cliffCount: number;
    cliffMissingPrior: number;
  };
  findings: MidTurnReactionFinding[];
  thresholds: Required<MidTurnReactionOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateMidTurnReaction(
  shotSpecRaw: unknown,
  opts: MidTurnReactionOptions = {},
): MidTurnReactionReport {
  const mid = evaluateMidTurnDensity(shotSpecRaw, opts);
  const rxOpts: ReactionBeforeCliffOptions = {
    requirePriorReaction: opts.requirePriorReaction,
    reactionWindowSec: opts.reactionWindowSec,
    lookbackSec: opts.lookbackSec,
    requireReaction: opts.requireReaction,
  };
  const rx = evaluateReactionBeforeCliff(shotSpecRaw, rxOpts);

  const findings: MidTurnReactionFinding[] = [...(mid.findings as MidTurnReactionFinding[])];
  for (const f of rx.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'CLIFF_NO_PRIOR_REACTION' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as MidTurnReactionFinding);
    }
  }

  const thresholds: Required<MidTurnReactionOptions> = {
    ...mid.thresholds,
    requirePriorReaction: rx.thresholds.requirePriorReaction,
    reactionWindowSec: rx.thresholds.reactionWindowSec,
    lookbackSec: rx.thresholds.lookbackSec,
    requireReaction: rx.thresholds.requireReaction,
  };

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mid.metrics,
      cliffCount: rx.metrics.cliffCount,
      cliffMissingPrior: rx.metrics.cliffMissingPrior,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
