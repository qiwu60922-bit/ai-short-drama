/**
 * V12 · Detail-Hook × Reaction-Before-Cliff Dual Gate (细节特写钩 + 悬念前反应 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《盛夏芬德拉》/密爽向: detail_cu 钩同时 cliff 前须有反应镜.
 * Embeds evaluateDetailHookKind + evaluateReactionBeforeCliff; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  DETAIL_HOOK_MISSING / CLIFF_NO_PRIOR_REACTION (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateDetailHookKind,
  type DetailHookKindFinding,
  type DetailHookKindOptions,
  type DetailHookKindReport,
} from './detail-hook-kind-gate';
import {
  evaluateReactionBeforeCliff,
  type ReactionBeforeCliffFinding,
  type ReactionBeforeCliffOptions,
} from './reaction-before-cliff-gate';

export interface DetailHookReactionOptions extends DetailHookKindOptions {
  requirePriorReaction?: boolean;
  reactionWindowSec?: number;
  lookbackSec?: number;
  requireReaction?: boolean;
}

export type DetailHookReactionFinding = {
  code: DetailHookKindFinding['code'] | ReactionBeforeCliffFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface DetailHookReactionReport {
  verdict: 'PASS' | 'FAIL';
  metrics: DetailHookKindReport['metrics'] & {
    cliffCount: number;
    cliffMissingPrior: number;
  };
  findings: DetailHookReactionFinding[];
  thresholds: Required<DetailHookReactionOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateDetailHookReaction(
  shotSpecRaw: unknown,
  opts: DetailHookReactionOptions = {},
): DetailHookReactionReport {
  const detail = evaluateDetailHookKind(shotSpecRaw, opts);
  const rxOpts: ReactionBeforeCliffOptions = {
    ...opts,
    requirePriorReaction: opts.requirePriorReaction,
    reactionWindowSec: opts.reactionWindowSec,
    lookbackSec: opts.lookbackSec,
    requireReaction: opts.requireReaction,
  };
  const rx = evaluateReactionBeforeCliff(shotSpecRaw, rxOpts);

  const findings: DetailHookReactionFinding[] = [...(detail.findings as DetailHookReactionFinding[])];
  for (const f of rx.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'CLIFF_NO_PRIOR_REACTION' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as DetailHookReactionFinding);
    }
  }

  const thresholds = {
    ...detail.thresholds,
    requirePriorReaction: rx.thresholds.requirePriorReaction,
    reactionWindowSec: rx.thresholds.reactionWindowSec,
    lookbackSec: rx.thresholds.lookbackSec,
    requireReaction: rx.thresholds.requireReaction,
  } as Required<DetailHookReactionOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...detail.metrics,
      cliffCount: rx.metrics.cliffCount,
      cliffMissingPrior: rx.metrics.cliffMissingPrior,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
