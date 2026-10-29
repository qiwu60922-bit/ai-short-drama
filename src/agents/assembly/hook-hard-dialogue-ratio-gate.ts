/**
 * V12 · Hook-Kind Mix Hard × 钩种多样 + 对白/铺垫细比重 Dual Gate,
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩种不宜单一，且须过 setupDialogueCap 门.
 * Embeds evaluateHookKindMix + evaluateSetupDialogueCap; merges FAIL findings.
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
  evaluateSetupDialogueCap,
  type SetupDialogueCapFinding,
  type SetupDialogueCapOptions,
} from './setup-dialogue-cap-gate';

export interface HookHardDialogueRatioOptions extends HookKindMixOptions {
  maxMidSetupRatio?: number;
  minActionChars?: number;
  unlabeledSpeechMin?: number;
}

export type HookHardDialogueRatioFinding = {
  code: HookKindMixFinding['code'] | SetupDialogueCapFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardDialogueRatioReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    midSeconds: number;
    midSetupSeconds: number;
    midSetupRatio: number;
    plotShots: number;
    dialogueOnlyPlotShots: number;
    unlabeledExpositionShots: number;
  };
  findings: HookHardDialogueRatioFinding[];
  thresholds: Required<HookHardDialogueRatioOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardDialogueRatio(
  shotSpecRaw: unknown,
  opts: HookHardDialogueRatioOptions = {},
): HookHardDialogueRatioReport {
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
  const dlgOpts: SetupDialogueCapOptions = {
    maxMidSetupRatio: opts.maxMidSetupRatio,
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
  const child = evaluateSetupDialogueCap(shotSpecRaw, dlgOpts);

  const findings: HookHardDialogueRatioFinding[] = [...(mix.findings as HookHardDialogueRatioFinding[])];
  for (const f of child.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'SETUP_MID_CAP' ||
      f.code === 'DIALOGUE_ONLY_PLOT' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardDialogueRatioFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
    maxMidSetupRatio: child.thresholds.maxMidSetupRatio,
    minActionChars: child.thresholds.minActionChars,
    unlabeledSpeechMin: child.thresholds.unlabeledSpeechMin,
  } as Required<HookHardDialogueRatioOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mix.metrics,
      midSeconds: child.metrics.midSeconds,
      midSetupSeconds: child.metrics.midSetupSeconds,
      midSetupRatio: child.metrics.midSetupRatio,
      plotShots: child.metrics.plotShots,
      dialogueOnlyPlotShots: child.metrics.dialogueOnlyPlotShots,
      unlabeledExpositionShots: child.metrics.unlabeledExpositionShots,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
