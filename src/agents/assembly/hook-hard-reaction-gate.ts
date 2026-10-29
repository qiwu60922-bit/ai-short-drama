/**
 * V12 · Hook-Kind Mix Hard × Reaction-After-Reversal Dual Gate (钩种多样 + 反转后反应 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽/悬疑向: 开场钩种不宜单一，且反转后须立刻给反应镜.
 *  - 与 reactionHookHard（reaction 主键）互补：本 gate 以 hookKindMix 为主键.
 * Embeds evaluateHookKindMix + evaluateReactionAfterReversal; merges FAIL findings.
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
  evaluateReactionAfterReversal,
  type ReactionAfterReversalFinding,
  type ReactionAfterReversalOptions,
} from './reaction-after-reversal-gate';

export interface HookHardReactionOptions extends HookKindMixOptions {
  reactionWindowSec?: number;
  lookbackSec?: number;
  requireReaction?: boolean;
  reversalOnly?: boolean;
}

export type HookHardReactionFinding = {
  code: HookKindMixFinding['code'] | ReactionAfterReversalFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardReactionReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    reversalCount: number;
    reversalMissing: number;
  };
  findings: HookHardReactionFinding[];
  thresholds: Required<HookHardReactionOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardReaction(
  shotSpecRaw: unknown,
  opts: HookHardReactionOptions = {},
): HookHardReactionReport {
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
  const reactOpts: ReactionAfterReversalOptions = {
    reactionWindowSec: opts.reactionWindowSec,
    lookbackSec: opts.lookbackSec,
    requireReaction: opts.requireReaction,
    reversalOnly: opts.reversalOnly,
  };
  const react = evaluateReactionAfterReversal(shotSpecRaw, reactOpts);

  const findings: HookHardReactionFinding[] = [...(mix.findings as HookHardReactionFinding[])];
  for (const f of react.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'REVERSAL_NO_REACTION' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardReactionFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
    reactionWindowSec: react.thresholds.reactionWindowSec,
    lookbackSec: react.thresholds.lookbackSec,
    requireReaction: react.thresholds.requireReaction,
    reversalOnly: react.thresholds.reversalOnly,
  } as Required<HookHardReactionOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mix.metrics,
      reversalCount: react.metrics.reversalCount,
      reversalMissing: react.metrics.reversalMissing,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
