/**
 * V12 · Hook-Kind Mix Hard × Reaction Beats × Face Cap Dual Gate
 * (钩种多样 + 反应镜门 + 脸钩占比封顶 双闸), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩种不宜单一，须过 reactionBeats 门，且脸钩占比硬封顶（ReactionFaceCap）.
 * Embeds evaluateHookKindMix + evaluateReactionBeats; merges FAIL findings.
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

export interface HookHardReactionFaceCapOptions extends HookKindMixOptions {
  reactionWindowSec?: number;
  lookbackSec?: number;
  requireReaction?: boolean;
}

export type HookHardReactionFaceCapFinding = {
  code: HookKindMixFinding['code'] | ReactionBeatFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardReactionFaceCapReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    turnShots: number;
    reactionShots: number;
    missingAfterTurn: number;
    orphanReactions: number;
  };
  findings: HookHardReactionFaceCapFinding[];
  thresholds: Required<HookHardReactionFaceCapOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardReactionFaceCap(
  shotSpecRaw: unknown,
  opts: HookHardReactionFaceCapOptions = {},
): HookHardReactionFaceCapReport {
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
  const beatOpts: ReactionBeatOptions = {
    reactionWindowSec: opts.reactionWindowSec,
    lookbackSec: opts.lookbackSec,
    requireReaction: opts.requireReaction ?? false,
  };
  const child = evaluateReactionBeats(shotSpecRaw, beatOpts);

  const findings: HookHardReactionFaceCapFinding[] = [...(mix.findings as HookHardReactionFaceCapFinding[])];
  for (const f of child.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'REACTION_MISSING' ||
      f.code === 'INVALID_ROLE' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardReactionFaceCapFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
    reactionWindowSec: child.thresholds.reactionWindowSec,
    lookbackSec: child.thresholds.lookbackSec,
    requireReaction: child.thresholds.requireReaction,
  } as Required<HookHardReactionFaceCapOptions>;

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
