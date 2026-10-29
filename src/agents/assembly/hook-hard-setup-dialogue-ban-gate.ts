/**
 * V12 · Hook-Kind Mix Hard × Dialogue-Setup Ban Dual Gate (钩种多样 + 钩后禁铺垫/禁抢钩对白 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩种不宜单一，且第一钩后不得回 setup，对白不得抢钩前灌剧情.
 * Embeds evaluateHookKindMix + evaluateDialogueSetupBan; merges FAIL findings.
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
  evaluateDialogueSetupBan,
  type DialogueSetupBanFinding,
  type DialogueSetupBanOptions,
} from './dialogue-setup-ban-gate';

export interface HookHardSetupDialogueBanOptions extends HookKindMixOptions {
  minActionChars?: number;
  unlabeledSpeechMin?: number;
}

export type HookHardSetupDialogueBanFinding = {
  code: HookKindMixFinding['code'] | DialogueSetupBanFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardSetupDialogueBanReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    firstHookAtSec: number | null;
    dialogueBeforeHookShots: number;
    setupAfterHookShots: number;
  };
  findings: HookHardSetupDialogueBanFinding[];
  thresholds: Required<HookHardSetupDialogueBanOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardSetupDialogueBan(
  shotSpecRaw: unknown,
  opts: HookHardSetupDialogueBanOptions = {},
): HookHardSetupDialogueBanReport {
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
  const banOpts: DialogueSetupBanOptions = {
    ...(opts.minActionChars !== undefined ? { minActionChars: opts.minActionChars } : {}),
    ...(opts.unlabeledSpeechMin !== undefined ? { unlabeledSpeechMin: opts.unlabeledSpeechMin } : {}),
    ...(opts.hookWindowSec !== undefined ? { hookWindowSec: opts.hookWindowSec } : {}),
    ...(opts.maxFirstShotSec !== undefined ? { maxFirstShotSec: opts.maxFirstShotSec } : {}),
    ...(opts.midWindow !== undefined ? { midWindow: opts.midWindow } : {}),
    ...(opts.tailToleranceSec !== undefined ? { tailToleranceSec: opts.tailToleranceSec } : {}),
    ...(opts.maxSetupRatio !== undefined ? { maxSetupRatio: opts.maxSetupRatio } : {}),
    ...(opts.requireAllTagged !== undefined ? { requireAllTagged: opts.requireAllTagged } : {}),
    ...(opts.requireHookKind !== undefined ? { requireHookKind: opts.requireHookKind } : {}),
  };
  const ban = evaluateDialogueSetupBan(shotSpecRaw, banOpts);

  const findings: HookHardSetupDialogueBanFinding[] = [
    ...(mix.findings as HookHardSetupDialogueBanFinding[]),
  ];
  for (const f of ban.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'DIALOGUE_BEFORE_HOOK' ||
      f.code === 'SETUP_AFTER_HOOK' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardSetupDialogueBanFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
    minActionChars: ban.thresholds.minActionChars,
    unlabeledSpeechMin: ban.thresholds.unlabeledSpeechMin,
  } as Required<HookHardSetupDialogueBanOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mix.metrics,
      firstHookAtSec: ban.metrics.firstHookAtSec,
      dialogueBeforeHookShots: ban.metrics.dialogueBeforeHookShots,
      setupAfterHookShots: ban.metrics.setupAfterHookShots,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
