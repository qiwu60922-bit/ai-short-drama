/**
 * V12 · Hook-Kind Mix Hard × Reaction Beats × Cold-Open Cap Dual Gate
 * (钩种多样 + 反应镜门 + 冷开快入 双闸), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩种不宜单一，须过 reactionBeats 门，且须冷开快入（ReactionColdCap）.
 * Embeds evaluateHookKindMix + evaluateReactionBeats + evaluateColdOpenHook; merges FAIL findings.
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
  evaluateColdOpenHook,
  type ColdOpenHookFinding,
  type ColdOpenHookOptions,
} from './cold-open-hook-gate';

export interface HookHardReactionColdCapOptions extends HookKindMixOptions {
  reactionWindowSec?: number;
  lookbackSec?: number;
  requireReaction?: boolean;
  coldOpenWindowSec?: number;
}

export type HookHardReactionColdCapFinding = {
  code: HookKindMixFinding['code'] | ReactionBeatFinding['code'] | ColdOpenHookFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardReactionColdCapReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    turnShots: number;
    reactionShots: number;
    missingAfterTurn: number;
    orphanReactions: number;
    coldOpenWindowSec: number;
    firstShotRole: string | null;
  };
  findings: HookHardReactionColdCapFinding[];
  thresholds: Required<HookHardReactionColdCapOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardReactionColdCap(
  shotSpecRaw: unknown,
  opts: HookHardReactionColdCapOptions = {},
): HookHardReactionColdCapReport {
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
  const coldOpts: ColdOpenHookOptions = {
    hookWindowSec: opts.hookWindowSec,
    maxFirstShotSec: opts.maxFirstShotSec,
    midWindow: opts.midWindow,
    tailToleranceSec: opts.tailToleranceSec,
    maxSetupRatio: opts.maxSetupRatio,
    requireAllTagged: opts.requireAllTagged,
    requireHookKind: opts.requireHookKind,
    coldOpenWindowSec: opts.coldOpenWindowSec,
  };
  const cold = evaluateColdOpenHook(shotSpecRaw, coldOpts);

  const findings: HookHardReactionColdCapFinding[] = [...(mix.findings as HookHardReactionColdCapFinding[])];
  for (const f of [...react.findings, ...cold.findings]) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'REACTION_MISSING' ||
      f.code === 'REACTION_ORPHAN' ||
      f.code === 'INVALID_ROLE' ||
      f.code === 'COLD_OPEN_MISS' ||
      f.code === 'FIRST_TOO_LONG' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardReactionColdCapFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
    reactionWindowSec: react.thresholds.reactionWindowSec,
    lookbackSec: react.thresholds.lookbackSec,
    requireReaction: react.thresholds.requireReaction,
    coldOpenWindowSec: cold.thresholds.coldOpenWindowSec,
  } as Required<HookHardReactionColdCapOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mix.metrics,
      turnShots: react.metrics.turnShots,
      reactionShots: react.metrics.reactionShots,
      missingAfterTurn: react.metrics.missingAfterTurn,
      orphanReactions: react.metrics.orphanReactions,
      coldOpenWindowSec: cold.metrics.coldOpenWindowSec,
      firstShotRole: cold.metrics.firstShotRole,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
