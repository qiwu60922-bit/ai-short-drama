/**
 * V12 · Hook-Kind Mix Hard × Cliff-Tail Dialogue Ban Dual Gate
 * (钩种多样 + 尾窗悬念禁对白 双闸), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩种不宜单一，且尾窗紧卡悬念、cliff 前 lookback 不得灌对白.
 * Embeds evaluateHookKindMix + evaluateCliffTailDialogueBan; merges FAIL findings.
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
  evaluateCliffTailDialogueBan,
  type CliffTailDialogueBanFinding,
  type CliffTailDialogueBanOptions,
} from './cliff-tail-dialogue-ban-gate';

export interface HookHardTailDialogueBanOptions extends HookKindMixOptions {
  hardTailToleranceSec?: number;
  banDialogueBeforeCliff?: boolean;
  reactionWindowSec?: number;
  lookbackSec?: number;
  requireReaction?: boolean;
}

export type HookHardTailDialogueBanFinding = {
  code: HookKindMixFinding['code'] | CliffTailDialogueBanFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardTailDialogueBanReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    cliffCount: number;
    dialogueBeforeCliffShots: number;
  };
  findings: HookHardTailDialogueBanFinding[];
  thresholds: Required<HookHardTailDialogueBanOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardTailDialogueBan(
  shotSpecRaw: unknown,
  opts: HookHardTailDialogueBanOptions = {},
): HookHardTailDialogueBanReport {
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
  const tailOpts: CliffTailDialogueBanOptions = {
    ...(opts.hookWindowSec !== undefined ? { hookWindowSec: opts.hookWindowSec } : {}),
    ...(opts.maxFirstShotSec !== undefined ? { maxFirstShotSec: opts.maxFirstShotSec } : {}),
    ...(opts.midWindow !== undefined ? { midWindow: opts.midWindow } : {}),
    ...(opts.tailToleranceSec !== undefined ? { tailToleranceSec: opts.tailToleranceSec } : {}),
    ...(opts.maxSetupRatio !== undefined ? { maxSetupRatio: opts.maxSetupRatio } : {}),
    ...(opts.requireAllTagged !== undefined ? { requireAllTagged: opts.requireAllTagged } : {}),
    ...(opts.requireHookKind !== undefined ? { requireHookKind: opts.requireHookKind } : {}),
    ...(opts.hardTailToleranceSec !== undefined ? { hardTailToleranceSec: opts.hardTailToleranceSec } : {}),
    ...(opts.banDialogueBeforeCliff !== undefined ? { banDialogueBeforeCliff: opts.banDialogueBeforeCliff } : {}),
    ...(opts.reactionWindowSec !== undefined ? { reactionWindowSec: opts.reactionWindowSec } : {}),
    ...(opts.lookbackSec !== undefined ? { lookbackSec: opts.lookbackSec } : {}),
    ...(opts.requireReaction !== undefined ? { requireReaction: opts.requireReaction } : {}),
  };
  const tail = evaluateCliffTailDialogueBan(shotSpecRaw, tailOpts);

  const findings: HookHardTailDialogueBanFinding[] = [
    ...(mix.findings as HookHardTailDialogueBanFinding[]),
  ];
  for (const f of tail.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'DIALOGUE_BEFORE_CLIFF' ||
      f.code === 'CLIFF_TAIL_TIGHT' ||
      f.code === 'NO_CLIFF' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardTailDialogueBanFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
    hardTailToleranceSec: tail.thresholds.hardTailToleranceSec,
    banDialogueBeforeCliff: tail.thresholds.banDialogueBeforeCliff,
    reactionWindowSec: tail.thresholds.reactionWindowSec,
    lookbackSec: tail.thresholds.lookbackSec,
    requireReaction: tail.thresholds.requireReaction,
  } as Required<HookHardTailDialogueBanOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mix.metrics,
      cliffCount: tail.metrics.cliffCount,
      dialogueBeforeCliffShots: tail.metrics.dialogueBeforeCliffShots,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
