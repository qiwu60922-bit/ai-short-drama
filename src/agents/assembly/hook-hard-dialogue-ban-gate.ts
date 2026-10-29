/**
 * V12 · Hook-Kind Mix Hard × Dialogue-After-Hook Ban Dual Gate (钩种多样 + 钩前禁对白 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩种不宜单一，且对白不得抢在第一钩之前灌剧情.
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

export interface HookHardDialogueBanOptions extends HookKindMixOptions {
  minActionChars?: number;
  unlabeledSpeechMin?: number;
}

export type HookHardDialogueBanFinding = {
  code: HookKindMixFinding['code'] | DialogueAfterHookFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardDialogueBanReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    firstHookAtSec: number | null;
    dialogueBeforeHookShots: number;
  };
  findings: HookHardDialogueBanFinding[];
  thresholds: Required<HookHardDialogueBanOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardDialogueBan(
  shotSpecRaw: unknown,
  opts: HookHardDialogueBanOptions = {},
): HookHardDialogueBanReport {
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
    minActionChars: opts.minActionChars,
    unlabeledSpeechMin: opts.unlabeledSpeechMin,
    hookWindowSec: opts.hookWindowSec,
    maxFirstShotSec: opts.maxFirstShotSec,
    tailToleranceSec: opts.tailToleranceSec,
    maxSetupRatio: opts.maxSetupRatio,
    requireAllTagged: opts.requireAllTagged,
    requireHookKind: opts.requireHookKind,
  };
  const dlg = evaluateDialogueAfterHook(shotSpecRaw, dlgOpts);

  const findings: HookHardDialogueBanFinding[] = [...(mix.findings as HookHardDialogueBanFinding[])];
  for (const f of dlg.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'DIALOGUE_BEFORE_HOOK' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardDialogueBanFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
    minActionChars: dlg.thresholds.minActionChars,
    unlabeledSpeechMin: dlg.thresholds.unlabeledSpeechMin,
  } as Required<HookHardDialogueBanOptions>;

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
