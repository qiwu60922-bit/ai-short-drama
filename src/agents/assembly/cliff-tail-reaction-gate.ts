/**
 * V12 · Cliff-Tail Tight × Reaction-Before-Cliff Dual Gate (紧尾悬念 + 悬念前反应 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽/悬疑向: 尾窗要紧，且 cliff 落地前须有反应镜.
 * Embeds evaluateCliffTailTight + evaluateReactionBeforeCliff; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  CLIFF_TAIL_TIGHT / CLIFF_NO_PRIOR_REACTION (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateCliffTailTight,
  type CliffTailTightFinding,
  type CliffTailTightOptions,
  type CliffTailTightReport,
} from './cliff-tail-tight-gate';
import {
  evaluateReactionBeforeCliff,
  type ReactionBeforeCliffFinding,
  type ReactionBeforeCliffOptions,
} from './reaction-before-cliff-gate';

export interface CliffTailReactionOptions extends CliffTailTightOptions {
  lookbackSec?: number;
  requirePriorReaction?: boolean;
  reactionWindowSec?: number;
}

export type CliffTailReactionFinding = {
  code: CliffTailTightFinding['code'] | ReactionBeforeCliffFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface CliffTailReactionReport {
  verdict: 'PASS' | 'FAIL';
  metrics: CliffTailTightReport['metrics'] & {
    cliffCount: number;
    cliffMissingPrior: number;
  };
  findings: CliffTailReactionFinding[];
  thresholds: Required<CliffTailReactionOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateCliffTailReaction(
  shotSpecRaw: unknown,
  opts: CliffTailReactionOptions = {},
): CliffTailReactionReport {
  const tight = evaluateCliffTailTight(shotSpecRaw, opts);
  const rxOpts: ReactionBeforeCliffOptions = {
    lookbackSec: opts.lookbackSec,
    requirePriorReaction: opts.requirePriorReaction,
    reactionWindowSec: opts.reactionWindowSec,
  };
  const rx = evaluateReactionBeforeCliff(shotSpecRaw, rxOpts);

  const findings: CliffTailReactionFinding[] = [...(tight.findings as CliffTailReactionFinding[])];
  for (const f of rx.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'CLIFF_NO_PRIOR_REACTION' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as CliffTailReactionFinding);
    }
  }

  const thresholds = {
    ...tight.thresholds,
    lookbackSec: rx.thresholds.lookbackSec,
    requirePriorReaction: rx.thresholds.requirePriorReaction,
    reactionWindowSec: rx.thresholds.reactionWindowSec,
  } as Required<CliffTailReactionOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...tight.metrics,
      cliffCount: rx.metrics.cliffCount,
      cliffMissingPrior: rx.metrics.cliffMissingPrior,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
