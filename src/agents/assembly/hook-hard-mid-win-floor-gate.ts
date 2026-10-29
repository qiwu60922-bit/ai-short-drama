/**
 * V12 · Hook-Kind Mix Hard × Setup Mid Cap × Reaction Beats Floor Dual Gate
 * (钩种多样 + 中段铺垫封顶 + 反应镜保底 MidWinFloor 双闸), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩种不宜单一，中段 setup 不可吃掉大半，且反应镜须达保底（MidWinFloor）；与 hookHardMidWinCap / hookHardMidWinHold 互补.
 * Embeds evaluateHookKindMix + evaluateSetupMidCap + evaluateReactionBeats; merges FAIL findings.
 * Default maxFaceRatio=0.5; default requireReaction=false.
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
  evaluateSetupMidCap,
  type SetupMidCapFinding,
  type SetupMidCapOptions,
} from './setup-mid-cap-gate';
import {
  evaluateReactionBeats,
  type ReactionBeatFinding,
  type ReactionBeatOptions,
} from './reaction-beat-gate';

export interface HookHardMidWinFloorOptions extends HookKindMixOptions {
  maxMidSetupRatio?: number;
  reactionWindowSec?: number;
  lookbackSec?: number;
  requireReaction?: boolean;
}

export type HookHardMidWinFloorFinding = {
  code: HookKindMixFinding['code'] | SetupMidCapFinding['code'] | ReactionBeatFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardMidWinFloorReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    midSeconds: number;
    midSetupSeconds: number;
    midSetupRatio: number;
    maxMidSetupRatio: number;
    turnShots: number;
    reactionShots: number;
    missingAfterTurn: number;
    orphanReactions: number;
  };
  findings: HookHardMidWinFloorFinding[];
  thresholds: Required<HookHardMidWinFloorOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardMidWinFloor(
  shotSpecRaw: unknown,
  opts: HookHardMidWinFloorOptions = {},
): HookHardMidWinFloorReport {
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
  const midOpts: SetupMidCapOptions = {
    maxMidSetupRatio: opts.maxMidSetupRatio,
    hookWindowSec: opts.hookWindowSec,
    maxFirstShotSec: opts.maxFirstShotSec,
    midWindow: opts.midWindow,
    tailToleranceSec: opts.tailToleranceSec,
    maxSetupRatio: opts.maxSetupRatio,
    requireAllTagged: opts.requireAllTagged,
    requireHookKind: opts.requireHookKind,
  };
  const child = evaluateSetupMidCap(shotSpecRaw, midOpts);
  const reactOpts: ReactionBeatOptions = {
    reactionWindowSec: opts.reactionWindowSec,
    lookbackSec: opts.lookbackSec,
    requireReaction: opts.requireReaction ?? false,
  };
  const react = evaluateReactionBeats(shotSpecRaw, reactOpts);

  const findings: HookHardMidWinFloorFinding[] = [...(mix.findings as HookHardMidWinFloorFinding[])];
  for (const f of [...child.findings, ...react.findings]) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'SETUP_MID_CAP' ||
      f.code === 'REACTION_MISSING' ||
      f.code === 'REACTION_ORPHAN' ||
      f.code === 'INVALID_ROLE' ||
      f.code === 'FIRST_TOO_LONG' ||
      f.code === 'SETUP_AFTER_CLIFF' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardMidWinFloorFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
    maxMidSetupRatio: child.thresholds.maxMidSetupRatio,
    reactionWindowSec: react.thresholds.reactionWindowSec,
    lookbackSec: react.thresholds.lookbackSec,
    requireReaction: react.thresholds.requireReaction,
  } as Required<HookHardMidWinFloorOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mix.metrics,
      midSeconds: child.metrics.midSeconds,
      midSetupSeconds: child.metrics.midSetupSeconds,
      midSetupRatio: child.metrics.midSetupRatio,
      maxMidSetupRatio: child.metrics.maxMidSetupRatio,
      turnShots: react.metrics.turnShots,
      reactionShots: react.metrics.reactionShots,
      missingAfterTurn: react.metrics.missingAfterTurn,
      orphanReactions: react.metrics.orphanReactions,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
