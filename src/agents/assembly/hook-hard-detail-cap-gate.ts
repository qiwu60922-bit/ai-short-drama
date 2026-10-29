/**
 * V12 · Hook-Kind Mix Hard × Setup-Dialogue Cap Dual Gate (钩种多样 + 中段铺垫/对白细节封顶 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩种不宜单一，且中段 setup/对白带过剧情须封顶.
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

export interface HookHardDetailCapOptions extends HookKindMixOptions {
  maxMidSetupRatio?: number;
  minActionChars?: number;
  unlabeledSpeechMin?: number;
}

export type HookHardDetailCapFinding = {
  code: HookKindMixFinding['code'] | SetupDialogueCapFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardDetailCapReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    midSeconds: number;
    midSetupSeconds: number;
    midSetupRatio: number;
    maxMidSetupRatio: number;
    plotShots: number;
    dialogueOnlyPlotShots: number;
    unlabeledExpositionShots: number;
  };
  findings: HookHardDetailCapFinding[];
  thresholds: Required<HookHardDetailCapOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardDetailCap(
  shotSpecRaw: unknown,
  opts: HookHardDetailCapOptions = {},
): HookHardDetailCapReport {
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
  const capOpts: SetupDialogueCapOptions = {
    maxMidSetupRatio: opts.maxMidSetupRatio,
    minActionChars: opts.minActionChars,
    unlabeledSpeechMin: opts.unlabeledSpeechMin,
    midWindow: opts.midWindow,
    hookWindowSec: opts.hookWindowSec,
    maxFirstShotSec: opts.maxFirstShotSec,
    tailToleranceSec: opts.tailToleranceSec,
    maxSetupRatio: opts.maxSetupRatio,
    requireAllTagged: opts.requireAllTagged,
    requireHookKind: opts.requireHookKind,
  };
  const cap = evaluateSetupDialogueCap(shotSpecRaw, capOpts);

  const findings: HookHardDetailCapFinding[] = [...(mix.findings as HookHardDetailCapFinding[])];
  for (const f of cap.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'SETUP_MID_CAP' ||
      f.code === 'DIALOGUE_ONLY_PLOT' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardDetailCapFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
    maxMidSetupRatio: cap.thresholds.maxMidSetupRatio,
    minActionChars: cap.thresholds.minActionChars,
    unlabeledSpeechMin: cap.thresholds.unlabeledSpeechMin,
  } as Required<HookHardDetailCapOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mix.metrics,
      midSeconds: cap.metrics.midSeconds,
      midSetupSeconds: cap.metrics.midSetupSeconds,
      midSetupRatio: cap.metrics.midSetupRatio,
      maxMidSetupRatio: cap.metrics.maxMidSetupRatio,
      plotShots: cap.metrics.plotShots,
      dialogueOnlyPlotShots: cap.metrics.dialogueOnlyPlotShots,
      unlabeledExpositionShots: cap.metrics.unlabeledExpositionShots,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
