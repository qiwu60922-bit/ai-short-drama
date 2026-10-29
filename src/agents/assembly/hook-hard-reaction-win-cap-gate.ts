/**
 * V12 · Hook-Kind Mix Hard × Reaction Beats × Hook-Window Hard Dual Gate
 * (钩种多样 + 反应镜门 + 钩窗硬封顶 双闸), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩种不宜单一，须过 reactionBeats 门，且钩窗须更快抛冲突（ReactionWinCap）.
 *  - hookHardReactionWindow 已覆盖 mix×reactionBeforeCliff；本 gate 以 reactionBeats×windowHard 互补.
 * Embeds evaluateHookKindMix + evaluateReactionBeats + evaluateHookWindowHard; merges FAIL findings.
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
  evaluateHookWindowHard,
  type HookWindowHardFinding,
  type HookWindowHardOptions,
} from './hook-window-hard-gate';

export interface HookHardReactionWinCapOptions extends HookKindMixOptions {
  reactionWindowSec?: number;
  lookbackSec?: number;
  requireReaction?: boolean;
  hardHookWindowSec?: number;
}

export type HookHardReactionWinCapFinding = {
  code: HookKindMixFinding['code'] | ReactionBeatFinding['code'] | HookWindowHardFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardReactionWinCapReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    turnShots: number;
    reactionShots: number;
    missingAfterTurn: number;
    orphanReactions: number;
    hardHookWindowSec: number;
  };
  findings: HookHardReactionWinCapFinding[];
  thresholds: Required<HookHardReactionWinCapOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardReactionWinCap(
  shotSpecRaw: unknown,
  opts: HookHardReactionWinCapOptions = {},
): HookHardReactionWinCapReport {
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
  const winOpts: HookWindowHardOptions = {
    ...(opts.hardHookWindowSec !== undefined ? { hardHookWindowSec: opts.hardHookWindowSec } : {}),
    ...(opts.hookWindowSec !== undefined ? { hookWindowSec: opts.hookWindowSec } : {}),
    ...(opts.maxFirstShotSec !== undefined ? { maxFirstShotSec: opts.maxFirstShotSec } : {}),
    ...(opts.midWindow !== undefined ? { midWindow: opts.midWindow } : {}),
    ...(opts.tailToleranceSec !== undefined ? { tailToleranceSec: opts.tailToleranceSec } : {}),
    ...(opts.maxSetupRatio !== undefined ? { maxSetupRatio: opts.maxSetupRatio } : {}),
    ...(opts.requireAllTagged !== undefined ? { requireAllTagged: opts.requireAllTagged } : {}),
    ...(opts.requireHookKind !== undefined ? { requireHookKind: opts.requireHookKind } : {}),
  };
  const win = evaluateHookWindowHard(shotSpecRaw, winOpts);

  const findings: HookHardReactionWinCapFinding[] = [...(mix.findings as HookHardReactionWinCapFinding[])];
  for (const f of [...react.findings, ...win.findings]) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'REACTION_MISSING' ||
      f.code === 'REACTION_ORPHAN' ||
      f.code === 'INVALID_ROLE' ||
      f.code === 'HOOK_WINDOW_HARD' ||
      f.code === 'FIRST_TOO_LONG' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardReactionWinCapFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
    reactionWindowSec: react.thresholds.reactionWindowSec,
    lookbackSec: react.thresholds.lookbackSec,
    requireReaction: react.thresholds.requireReaction,
    hardHookWindowSec: win.thresholds.hardHookWindowSec,
  } as Required<HookHardReactionWinCapOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mix.metrics,
      turnShots: react.metrics.turnShots,
      reactionShots: react.metrics.reactionShots,
      missingAfterTurn: react.metrics.missingAfterTurn,
      orphanReactions: react.metrics.orphanReactions,
      hardHookWindowSec: win.metrics.hardHookWindowSec,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
