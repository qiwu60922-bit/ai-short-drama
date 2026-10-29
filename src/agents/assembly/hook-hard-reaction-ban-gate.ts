/**
 * V12 · Hook-Kind Mix Hard × Reaction-After-Reversal Ban Dual Gate (钩种多样 + 反转后禁缺反应 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩种不宜单一，且反转落地须立刻给反应镜.
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

export interface HookHardReactionBanOptions extends HookKindMixOptions {
  reactionWindowSec?: number;
  lookbackSec?: number;
  requireReaction?: boolean;
  reversalOnly?: boolean;
}

export type HookHardReactionBanFinding = {
  code: HookKindMixFinding['code'] | ReactionAfterReversalFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardReactionBanReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    reversalCount: number;
    reversalMissing: number;
  };
  findings: HookHardReactionBanFinding[];
  thresholds: Required<HookHardReactionBanOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardReactionBan(
  shotSpecRaw: unknown,
  opts: HookHardReactionBanOptions = {},
): HookHardReactionBanReport {
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
  const rxOpts: ReactionAfterReversalOptions = {
    reactionWindowSec: opts.reactionWindowSec,
    lookbackSec: opts.lookbackSec,
    requireReaction: opts.requireReaction,
    reversalOnly: opts.reversalOnly,
  };
  const rx = evaluateReactionAfterReversal(shotSpecRaw, rxOpts);

  const findings: HookHardReactionBanFinding[] = [...(mix.findings as HookHardReactionBanFinding[])];
  for (const f of rx.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'REVERSAL_NO_REACTION' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardReactionBanFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
    reactionWindowSec: rx.thresholds.reactionWindowSec,
    lookbackSec: rx.thresholds.lookbackSec,
    requireReaction: rx.thresholds.requireReaction,
    reversalOnly: rx.thresholds.reversalOnly,
  } as Required<HookHardReactionBanOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mix.metrics,
      reversalCount: rx.metrics.reversalCount,
      reversalMissing: rx.metrics.reversalMissing,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
