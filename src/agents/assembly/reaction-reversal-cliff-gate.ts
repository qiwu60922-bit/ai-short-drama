/**
 * V12 · Reaction-After-Reversal × Reaction-Before-Cliff Gate (反转后反应 + 悬念前反应 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《天幕直播》: 反转须立刻给反应，且 cliff 前仍须有反应承接，情绪不断档.
 * Embeds evaluateReactionAfterReversal + evaluateReactionBeforeCliff; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  REVERSAL_NO_REACTION / CLIFF_NO_PRIOR_REACTION (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateReactionAfterReversal,
  type ReactionAfterReversalFinding,
  type ReactionAfterReversalOptions,
  type ReactionAfterReversalReport,
} from './reaction-after-reversal-gate';
import {
  evaluateReactionBeforeCliff,
  type ReactionBeforeCliffFinding,
  type ReactionBeforeCliffOptions,
} from './reaction-before-cliff-gate';

export interface ReactionReversalCliffOptions extends ReactionAfterReversalOptions {
  requirePriorReaction?: boolean;
}

export type ReactionReversalCliffFinding = {
  code: ReactionAfterReversalFinding['code'] | ReactionBeforeCliffFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface ReactionReversalCliffReport {
  verdict: 'PASS' | 'FAIL';
  metrics: ReactionAfterReversalReport['metrics'] & {
    cliffCount: number;
    cliffMissingPrior: number;
  };
  findings: ReactionReversalCliffFinding[];
  thresholds: Required<ReactionReversalCliffOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateReactionReversalCliff(
  shotSpecRaw: unknown,
  opts: ReactionReversalCliffOptions = {},
): ReactionReversalCliffReport {
  const requirePriorReaction = opts.requirePriorReaction ?? true;
  const after = evaluateReactionAfterReversal(shotSpecRaw, opts);
  const beforeOpts: ReactionBeforeCliffOptions = {
    ...opts,
    requirePriorReaction,
  };
  const before = evaluateReactionBeforeCliff(shotSpecRaw, beforeOpts);

  const findings: ReactionReversalCliffFinding[] = [
    ...(after.findings as ReactionReversalCliffFinding[]),
  ];
  for (const f of before.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'CLIFF_NO_PRIOR_REACTION' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as ReactionReversalCliffFinding);
    }
  }

  const thresholds: Required<ReactionReversalCliffOptions> = {
    ...after.thresholds,
    requirePriorReaction,
  };

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...after.metrics,
      cliffCount: before.metrics.cliffCount,
      cliffMissingPrior: before.metrics.cliffMissingPrior,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
