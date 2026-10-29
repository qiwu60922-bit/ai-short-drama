/**
 * V12 · Hook-Kind Mix Hard × Dialogue-Before-Cliff Ban Dual Gate (钩种多样 + 悬念前禁对白 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩种不宜单一，且 cliff 前 lookback 不得灌对白.
 * Embeds evaluateHookKindMix + evaluateDialogueBeforeCliffBan; merges FAIL findings.
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
  evaluateDialogueBeforeCliffBan,
  type DialogueBeforeCliffBanFinding,
  type DialogueBeforeCliffBanOptions,
} from './dialogue-before-cliff-ban-gate';

export interface HookHardCliffDialogueBanOptions extends HookKindMixOptions {
  banDialogueBeforeCliff?: boolean;
  reactionWindowSec?: number;
  lookbackSec?: number;
  requireReaction?: boolean;
}

export type HookHardCliffDialogueBanFinding = {
  code: HookKindMixFinding['code'] | DialogueBeforeCliffBanFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardCliffDialogueBanReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    cliffCount: number;
    dialogueBeforeCliffShots: number;
  };
  findings: HookHardCliffDialogueBanFinding[];
  thresholds: Required<HookHardCliffDialogueBanOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardCliffDialogueBan(
  shotSpecRaw: unknown,
  opts: HookHardCliffDialogueBanOptions = {},
): HookHardCliffDialogueBanReport {
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
  const banOpts: DialogueBeforeCliffBanOptions = {
    banDialogueBeforeCliff: opts.banDialogueBeforeCliff,
    reactionWindowSec: opts.reactionWindowSec,
    lookbackSec: opts.lookbackSec,
    requireReaction: opts.requireReaction,
  };
  const ban = evaluateDialogueBeforeCliffBan(shotSpecRaw, banOpts);

  const findings: HookHardCliffDialogueBanFinding[] = [
    ...(mix.findings as HookHardCliffDialogueBanFinding[]),
  ];
  for (const f of ban.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'DIALOGUE_BEFORE_CLIFF' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardCliffDialogueBanFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
    banDialogueBeforeCliff: ban.thresholds.banDialogueBeforeCliff,
    reactionWindowSec: ban.thresholds.reactionWindowSec,
    lookbackSec: ban.thresholds.lookbackSec,
    requireReaction: ban.thresholds.requireReaction,
  } as Required<HookHardCliffDialogueBanOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mix.metrics,
      cliffCount: ban.metrics.cliffCount,
      dialogueBeforeCliffShots: ban.metrics.dialogueBeforeCliffShots,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
