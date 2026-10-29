/**
 * V12 · Hook-Kind Mix Hard × Reaction-Before-Cliff Dual Gate (钩种多样 + 悬念前反应占比 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩种不宜单一，且 cliff 前须有反应镜（ReactionRatio）.
 * Embeds evaluateHookKindMix + evaluateReactionBeforeCliff; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateHookKindMix,
  type HookKindMixFinding,
  type HookKindMixOptions,
  type HookKindMixReport,
} from './hook-kind-mix-gate';
import {
  evaluateReactionBeforeCliff,
  type ReactionBeforeCliffFinding,
  type ReactionBeforeCliffOptions,
} from './reaction-before-cliff-gate';

export interface HookHardReactionRatioOptions extends HookKindMixOptions {
  reactionWindowSec?: number;
  lookbackSec?: number;
  requireReaction?: boolean;
  requirePriorReaction?: boolean;
}

export type HookHardReactionRatioFinding = {
  code: HookKindMixFinding['code'] | ReactionBeforeCliffFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardReactionRatioReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    cliffCount: number;
    cliffMissingPrior: number;
  };
  findings: HookHardReactionRatioFinding[];
  thresholds: Required<HookHardReactionRatioOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardReactionRatio(
  shotSpecRaw: unknown,
  opts: HookHardReactionRatioOptions = {},
): HookHardReactionRatioReport {
  const mixOpts: HookKindMixOptions = {
    hookWindowSec: opts.hookWindowSec,
    maxFirstShotSec: opts.maxFirstShotSec,
    midWindow: opts.midWindow,
    tailToleranceSec: opts.tailToleranceSec,
    maxSetupRatio: opts.maxSetupRatio,
    requireAllTagged: opts.requireAllTagged,
    requireHookKind: opts.requireHookKind ?? true,
    minDistinctKinds: opts.minDistinctKinds,
    maxFaceRatio: opts.maxFaceRatio,
    earlyHooksOnly: opts.earlyHooksOnly,
  };
  const mix = evaluateHookKindMix(shotSpecRaw, mixOpts);
  const rxOpts: ReactionBeforeCliffOptions = {
    reactionWindowSec: opts.reactionWindowSec,
    lookbackSec: opts.lookbackSec,
    requireReaction: opts.requireReaction,
    requirePriorReaction: opts.requirePriorReaction,
  };
  const rx = evaluateReactionBeforeCliff(shotSpecRaw, rxOpts);

  const findings: HookHardReactionRatioFinding[] = [...(mix.findings as HookHardReactionRatioFinding[])];
  for (const f of rx.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'CLIFF_NO_PRIOR_REACTION' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardReactionRatioFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
    reactionWindowSec: rx.thresholds.reactionWindowSec,
    lookbackSec: rx.thresholds.lookbackSec,
    requireReaction: rx.thresholds.requireReaction,
    requirePriorReaction: rx.thresholds.requirePriorReaction,
  } as Required<HookHardReactionRatioOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mix.metrics,
      cliffCount: rx.metrics.cliffCount,
      cliffMissingPrior: rx.metrics.cliffMissingPrior,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
