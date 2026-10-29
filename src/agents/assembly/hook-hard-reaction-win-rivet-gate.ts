/**
 * V12 · Hook-Kind Mix Hard × Reaction-Before-Cliff × Hook-Window Hard Dual Gate
 * (钩种多样 + 悬念前反应持守 + 钩窗硬封顶 WinRivet 双闸), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩种不宜单一，cliff 前须持守反应镜，且钩窗须更快抛冲突（ReactionWinRivet）；与 hookHardReactionWinGrasp / hookHardReactionWinClasp 互补.
 * Embeds evaluateHookKindMix + evaluateReactionBeforeCliff + evaluateHookWindowHard; merges FAIL findings.
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
  evaluateReactionBeforeCliff,
  type ReactionBeforeCliffFinding,
  type ReactionBeforeCliffOptions,
} from './reaction-before-cliff-gate';
import {
  evaluateHookWindowHard,
  type HookWindowHardFinding,
  type HookWindowHardOptions,
} from './hook-window-hard-gate';

export interface HookHardReactionWinRivetOptions extends HookKindMixOptions {
  reactionWindowSec?: number;
  lookbackSec?: number;
  requirePriorReaction?: boolean;
  hardHookWindowSec?: number;
}

export type HookHardReactionWinRivetFinding = {
  code: HookKindMixFinding['code'] | ReactionBeforeCliffFinding['code'] | HookWindowHardFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardReactionWinRivetReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    cliffCount: number;
    hardHookWindowSec: number;
  };
  findings: HookHardReactionWinRivetFinding[];
  thresholds: Required<HookHardReactionWinRivetOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardReactionWinRivet(
  shotSpecRaw: unknown,
  opts: HookHardReactionWinRivetOptions = {},
): HookHardReactionWinRivetReport {
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
  const cliffOpts: ReactionBeforeCliffOptions = {
    requirePriorReaction: opts.requirePriorReaction,
    lookbackSec: opts.lookbackSec,
    reactionWindowSec: opts.reactionWindowSec,
  };
  const hold = evaluateReactionBeforeCliff(shotSpecRaw, cliffOpts);
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

  const findings: HookHardReactionWinRivetFinding[] = [...(mix.findings as HookHardReactionWinRivetFinding[])];
  for (const f of [...hold.findings, ...win.findings]) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'CLIFF_NO_PRIOR_REACTION' ||
      f.code === 'HOOK_WINDOW_HARD' ||
      f.code === 'FIRST_TOO_LONG' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardReactionWinRivetFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
    reactionWindowSec: hold.thresholds.reactionWindowSec,
    lookbackSec: hold.thresholds.lookbackSec,
    requirePriorReaction: hold.thresholds.requirePriorReaction ?? false,
    hardHookWindowSec: win.thresholds.hardHookWindowSec,
  } as Required<HookHardReactionWinRivetOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mix.metrics,
      cliffCount: hold.metrics.cliffCount,
      hardHookWindowSec: win.metrics.hardHookWindowSec,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
