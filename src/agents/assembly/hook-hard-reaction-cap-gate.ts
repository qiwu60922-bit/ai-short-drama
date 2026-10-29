/**
 * V12 · Hook-Kind Mix Hard × 钩种多样 + 反应镜封顶 Dual Gate,
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩种不宜单一，且须过 reactionBeats 门.
 * Embeds evaluateHookKindMix + evaluateReactionBeats; merges FAIL findings.
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

export interface HookHardReactionCapOptions extends HookKindMixOptions {
  reactionWindowSec?: number;
  lookbackSec?: number;
  requireReaction?: boolean;
}

export type HookHardReactionCapFinding = {
  code: HookKindMixFinding['code'] | ReactionBeatFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardReactionCapReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    turnShots: number;
    reactionShots: number;
    missingAfterTurn: number;
    orphanReactions: number;
  };
  findings: HookHardReactionCapFinding[];
  thresholds: Required<HookHardReactionCapOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardReactionCap(
  shotSpecRaw: unknown,
  opts: HookHardReactionCapOptions = {},
): HookHardReactionCapReport {
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
  const beatOpts: ReactionBeatOptions = {
    reactionWindowSec: opts.reactionWindowSec,
    lookbackSec: opts.lookbackSec,
    requireReaction: opts.requireReaction ?? false,
  };
  const child = evaluateReactionBeats(shotSpecRaw, beatOpts);

  const findings: HookHardReactionCapFinding[] = [...(mix.findings as HookHardReactionCapFinding[])];
  for (const f of child.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'REACTION_MISSING' ||
      f.code === 'INVALID_ROLE' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardReactionCapFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
    reactionWindowSec: child.thresholds.reactionWindowSec,
    lookbackSec: child.thresholds.lookbackSec,
    requireReaction: child.thresholds.requireReaction,
  } as Required<HookHardReactionCapOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mix.metrics,
      turnShots: child.metrics.turnShots,
      reactionShots: child.metrics.reactionShots,
      missingAfterTurn: child.metrics.missingAfterTurn,
      orphanReactions: child.metrics.orphanReactions,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
