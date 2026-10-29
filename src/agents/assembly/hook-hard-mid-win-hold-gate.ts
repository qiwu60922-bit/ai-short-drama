/**
 * V12 · Hook-Kind Mix Hard × Setup Mid Cap × Reaction-Before-Cliff Dual Gate
 * (钩种多样 + 中段铺垫封顶 + 悬念前反应持守 WinHold 双闸), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩种不宜单一，中段 setup 不可吃掉大半，且 cliff 前须持守反应镜（MidWinHold）；与 hookHardMidWinCap 互补.
 * Embeds evaluateHookKindMix + evaluateSetupMidCap + evaluateReactionBeforeCliff; merges FAIL findings.
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
  evaluateSetupMidCap,
  type SetupMidCapFinding,
  type SetupMidCapOptions,
} from './setup-mid-cap-gate';
import {
  evaluateReactionBeforeCliff,
  type ReactionBeforeCliffFinding,
  type ReactionBeforeCliffOptions,
} from './reaction-before-cliff-gate';

export interface HookHardMidWinHoldOptions extends HookKindMixOptions {
  maxMidSetupRatio?: number;
  reactionWindowSec?: number;
  lookbackSec?: number;
  requirePriorReaction?: boolean;
}

export type HookHardMidWinHoldFinding = {
  code: HookKindMixFinding['code'] | SetupMidCapFinding['code'] | ReactionBeforeCliffFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardMidWinHoldReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    midSeconds: number;
    midSetupSeconds: number;
    midSetupRatio: number;
    maxMidSetupRatio: number;
    cliffCount: number;
  };
  findings: HookHardMidWinHoldFinding[];
  thresholds: Required<HookHardMidWinHoldOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardMidWinHold(
  shotSpecRaw: unknown,
  opts: HookHardMidWinHoldOptions = {},
): HookHardMidWinHoldReport {
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
  const cliffOpts: ReactionBeforeCliffOptions = {
    requirePriorReaction: opts.requirePriorReaction,
    lookbackSec: opts.lookbackSec,
    reactionWindowSec: opts.reactionWindowSec,
  };
  const hold = evaluateReactionBeforeCliff(shotSpecRaw, cliffOpts);

  const findings: HookHardMidWinHoldFinding[] = [...(mix.findings as HookHardMidWinHoldFinding[])];
  for (const f of [...child.findings, ...hold.findings]) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'SETUP_MID_CAP' ||
      f.code === 'CLIFF_NO_PRIOR_REACTION' ||
      f.code === 'FIRST_TOO_LONG' ||
      f.code === 'SETUP_AFTER_CLIFF' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardMidWinHoldFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
    maxMidSetupRatio: child.thresholds.maxMidSetupRatio,
    reactionWindowSec: hold.thresholds.reactionWindowSec,
    lookbackSec: hold.thresholds.lookbackSec,
    requirePriorReaction: hold.thresholds.requirePriorReaction ?? false,
  } as Required<HookHardMidWinHoldOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mix.metrics,
      midSeconds: child.metrics.midSeconds,
      midSetupSeconds: child.metrics.midSetupSeconds,
      midSetupRatio: child.metrics.midSetupRatio,
      maxMidSetupRatio: child.metrics.maxMidSetupRatio,
      cliffCount: hold.metrics.cliffCount,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
