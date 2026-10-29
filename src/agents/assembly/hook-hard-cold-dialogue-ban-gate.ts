/**
 * V12 · Hook-Kind Mix Hard × Cold Dialogue-After-Hook Ban Dual Gate
 * (钩种多样 + 冷开禁对白抢钩 双闸), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩种不宜单一，且冷开对白不得抢在第一钩之前.
 * Embeds evaluateHookKindMix + evaluateDialogueAfterHook; merges FAIL findings.
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
  evaluateDialogueAfterHook,
  type DialogueAfterHookFinding,
  type DialogueAfterHookOptions,
} from './dialogue-after-hook-gate';

export interface HookHardColdDialogueBanOptions extends HookKindMixOptions {
  minActionChars?: number;
  unlabeledSpeechMin?: number;
  midWindowHook?: [number, number];
}

export type HookHardColdDialogueBanFinding = {
  code: HookKindMixFinding['code'] | DialogueAfterHookFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardColdDialogueBanReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    firstHookAtSec: number | null;
    dialogueBeforeHookShots: number;
  };
  findings: HookHardColdDialogueBanFinding[];
  thresholds: Required<HookHardColdDialogueBanOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardColdDialogueBan(
  shotSpecRaw: unknown,
  opts: HookHardColdDialogueBanOptions = {},
): HookHardColdDialogueBanReport {
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
  const dlgOpts: DialogueAfterHookOptions = {
    ...(opts.minActionChars !== undefined ? { minActionChars: opts.minActionChars } : {}),
    ...(opts.unlabeledSpeechMin !== undefined ? { unlabeledSpeechMin: opts.unlabeledSpeechMin } : {}),
    ...(opts.midWindow !== undefined ? { midWindow: opts.midWindow } : {}),
    ...(opts.midWindowHook !== undefined ? { midWindowHook: opts.midWindowHook } : {}),
    ...(opts.hookWindowSec !== undefined ? { hookWindowSec: opts.hookWindowSec } : {}),
    ...(opts.maxFirstShotSec !== undefined ? { maxFirstShotSec: opts.maxFirstShotSec } : {}),
    ...(opts.tailToleranceSec !== undefined ? { tailToleranceSec: opts.tailToleranceSec } : {}),
    ...(opts.maxSetupRatio !== undefined ? { maxSetupRatio: opts.maxSetupRatio } : {}),
    ...(opts.requireAllTagged !== undefined ? { requireAllTagged: opts.requireAllTagged } : {}),
    ...(opts.requireHookKind !== undefined ? { requireHookKind: opts.requireHookKind } : {}),
  };
  const dlg = evaluateDialogueAfterHook(shotSpecRaw, dlgOpts);

  const findings: HookHardColdDialogueBanFinding[] = [
    ...(mix.findings as HookHardColdDialogueBanFinding[]),
  ];
  for (const f of dlg.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'DIALOGUE_BEFORE_HOOK' ||
      f.code === 'DIALOGUE_ONLY_PLOT' ||
      f.code === 'EXPOSITION_UNLABELED' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardColdDialogueBanFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
    minActionChars: dlg.thresholds.minActionChars,
    unlabeledSpeechMin: dlg.thresholds.unlabeledSpeechMin,
    midWindowHook: dlg.thresholds.midWindowHook,
  } as Required<HookHardColdDialogueBanOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mix.metrics,
      firstHookAtSec: dlg.metrics.firstHookAtSec,
      dialogueBeforeHookShots: dlg.metrics.dialogueBeforeHookShots,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
