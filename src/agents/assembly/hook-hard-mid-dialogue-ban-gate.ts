/**
 * V12 · Hook-Kind Mix Hard × Mid-Hook Dialogue Ban Dual Gate (钩种多样 + 中段再钩禁对白抢钩 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩种不宜单一，且中段须尽快再抛钩、对白不得抢在第一钩之前.
 * Embeds evaluateHookKindMix + evaluateMidHookDialogueBan; merges FAIL findings.
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
  evaluateMidHookDialogueBan,
  type MidHookDialogueBanFinding,
  type MidHookDialogueBanOptions,
} from './mid-hook-dialogue-ban-gate';

export interface HookHardMidDialogueBanOptions extends HookKindMixOptions {
  midHookByRatio?: number;
  minActionChars?: number;
  unlabeledSpeechMin?: number;
}

export type HookHardMidDialogueBanFinding = {
  code: HookKindMixFinding['code'] | MidHookDialogueBanFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardMidDialogueBanReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    firstHookAtSec: number | null;
    dialogueBeforeHookShots: number;
  };
  findings: HookHardMidDialogueBanFinding[];
  thresholds: Required<HookHardMidDialogueBanOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardMidDialogueBan(
  shotSpecRaw: unknown,
  opts: HookHardMidDialogueBanOptions = {},
): HookHardMidDialogueBanReport {
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
  const midOpts: MidHookDialogueBanOptions = {
    midHookByRatio: opts.midHookByRatio,
    minActionChars: opts.minActionChars,
    unlabeledSpeechMin: opts.unlabeledSpeechMin,
    hookWindowSec: opts.hookWindowSec,
    maxFirstShotSec: opts.maxFirstShotSec,
    midWindow: opts.midWindow,
    tailToleranceSec: opts.tailToleranceSec,
    maxSetupRatio: opts.maxSetupRatio,
    requireAllTagged: opts.requireAllTagged,
    requireHookKind: opts.requireHookKind,
  };
  const mid = evaluateMidHookDialogueBan(shotSpecRaw, midOpts);

  const findings: HookHardMidDialogueBanFinding[] = [
    ...(mix.findings as HookHardMidDialogueBanFinding[]),
  ];
  for (const f of mid.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'DIALOGUE_BEFORE_HOOK' ||
      f.code === 'MID_HOOK_MISSING' ||
      f.code === 'MID_HOOK_LATE' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardMidDialogueBanFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
    midHookByRatio: mid.thresholds.midHookByRatio,
    minActionChars: mid.thresholds.minActionChars,
    unlabeledSpeechMin: mid.thresholds.unlabeledSpeechMin,
  } as Required<HookHardMidDialogueBanOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mix.metrics,
      firstHookAtSec: mid.metrics.firstHookAtSec,
      dialogueBeforeHookShots: mid.metrics.dialogueBeforeHookShots,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
