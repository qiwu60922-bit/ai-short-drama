/**
 * V12 · Hook-Kind Mix Hard × Reaction Beats × Reaction-Before-Cliff Dual Gate
 * (钩种多样 + 反应镜门 + 悬念前反应持守 双闸), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩种不宜单一，须过 reactionBeats 门，且 cliff 前须持守反应镜（ReactionWinHold）.
 *  - 与 hookHardReactionWinCap / hookHardReactionWindow 互补.
 * Embeds evaluateHookKindMix + evaluateReactionBeats + evaluateReactionBeforeCliff; merges FAIL findings.
 * Default maxFaceRatio=0.5.
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
  evaluateReactionBeats,
  type ReactionBeatFinding,
  type ReactionBeatOptions,
} from './reaction-beat-gate';
import {
  evaluateReactionBeforeCliff,
  type ReactionBeforeCliffFinding,
  type ReactionBeforeCliffOptions,
} from './reaction-before-cliff-gate';

export interface HookHardReactionWinHoldOptions extends HookKindMixOptions {
  reactionWindowSec?: number;
  lookbackSec?: number;
  requireReaction?: boolean;
  requirePriorReaction?: boolean;
}

export type HookHardReactionWinHoldFinding = {
  code: HookKindMixFinding['code'] | ReactionBeatFinding['code'] | ReactionBeforeCliffFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardReactionWinHoldReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    turnShots: number;
    reactionShots: number;
    missingAfterTurn: number;
    orphanReactions: number;
    cliffCount: number;
  };
  findings: HookHardReactionWinHoldFinding[];
  thresholds: Required<HookHardReactionWinHoldOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardReactionWinHold(
  shotSpecRaw: unknown,
  opts: HookHardReactionWinHoldOptions = {},
): HookHardReactionWinHoldReport {
  const mixOpts: HookKindMixOptions = {
    hookWindowSec: opts.hookWindowSec,
    maxFirstShotSec: opts.maxFirstShotSec,
    midWindow: opts.midWindow,
    tailToleranceSec: opts.tailToleranceSec,
    maxSetupRatio: opts.maxSetupRatio,
    requireAllTagged: opts.requireAllTagged,
    requireHookKind: opts.requireHookKind ?? true,
    minDistinctKinds: opts.minDistinctKinds,
    maxFaceRatio: opts.maxFaceRatio ?? 0.5,
    earlyHooksOnly: opts.earlyHooksOnly,
  };
  const mix = evaluateHookKindMix(shotSpecRaw, mixOpts);
  const reactOpts: ReactionBeatOptions = {
    reactionWindowSec: opts.reactionWindowSec,
    lookbackSec: opts.lookbackSec,
    requireReaction: opts.requireReaction ?? false,
  };
  const react = evaluateReactionBeats(shotSpecRaw, reactOpts);
  const cliffOpts: ReactionBeforeCliffOptions = {
    requirePriorReaction: opts.requirePriorReaction,
    lookbackSec: opts.lookbackSec,
    reactionWindowSec: opts.reactionWindowSec,
  };
  const hold = evaluateReactionBeforeCliff(shotSpecRaw, cliffOpts);

  const findings: HookHardReactionWinHoldFinding[] = [...(mix.findings as HookHardReactionWinHoldFinding[])];
  for (const f of [...react.findings, ...hold.findings]) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'REACTION_MISSING' ||
      f.code === 'REACTION_ORPHAN' ||
      f.code === 'INVALID_ROLE' ||
      f.code === 'CLIFF_NO_PRIOR_REACTION' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardReactionWinHoldFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
    reactionWindowSec: react.thresholds.reactionWindowSec,
    lookbackSec: react.thresholds.lookbackSec,
    requireReaction: react.thresholds.requireReaction,
    requirePriorReaction: hold.thresholds.requirePriorReaction ?? false,
  } as Required<HookHardReactionWinHoldOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mix.metrics,
      turnShots: react.metrics.turnShots,
      reactionShots: react.metrics.reactionShots,
      missingAfterTurn: react.metrics.missingAfterTurn,
      orphanReactions: react.metrics.orphanReactions,
      cliffCount: hold.metrics.cliffCount,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
