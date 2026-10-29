/**
 * V12 · Hook-Kind Mix Hard × Reaction-Before-Cliff Dual Gate (钩种多样 + 悬念前反应窗 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽/悬疑向: 开场钩种不宜单一，且 cliff 前须有反应镜承接.
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

export interface HookHardReactionWindowOptions extends HookKindMixOptions {
  requirePriorReaction?: boolean;
  lookbackSec?: number;
  reactionWindowSec?: number;
}

export type HookHardReactionWindowFinding = {
  code: HookKindMixFinding['code'] | ReactionBeforeCliffFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardReactionWindowReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    cliffCount: number;
    cliffMissingPrior: number;
  };
  findings: HookHardReactionWindowFinding[];
  thresholds: Required<HookHardReactionWindowOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardReactionWindow(
  shotSpecRaw: unknown,
  opts: HookHardReactionWindowOptions = {},
): HookHardReactionWindowReport {
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
    requirePriorReaction: opts.requirePriorReaction,
    lookbackSec: opts.lookbackSec,
    reactionWindowSec: opts.reactionWindowSec,
  };
  const rx = evaluateReactionBeforeCliff(shotSpecRaw, rxOpts);

  const findings: HookHardReactionWindowFinding[] = [...(mix.findings as HookHardReactionWindowFinding[])];
  for (const f of rx.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'CLIFF_NO_PRIOR_REACTION' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardReactionWindowFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
    requirePriorReaction: rx.thresholds.requirePriorReaction,
    lookbackSec: rx.thresholds.lookbackSec,
    reactionWindowSec: rx.thresholds.reactionWindowSec ?? rx.thresholds.lookbackSec,
  } as Required<HookHardReactionWindowOptions>;

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
