/**
 * V12 · Hook-Kind Mix Hard × Dialogue Exposition Cap Dual Gate (钩种多样 + 台词带过剧情封顶 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩种不宜单一，且情节镜不得靠对白空壳带过.
 * Embeds evaluateHookKindMix + evaluateDialogueExposition; merges FAIL findings.
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
  evaluateDialogueExposition,
  type DialogueExpositionFinding,
  type DialogueExpositionOptions,
} from './dialogue-exposition-gate';

export interface HookHardDialogueCapOptions extends HookKindMixOptions {
  minActionChars?: number;
  unlabeledSpeechMin?: number;
}

export type HookHardDialogueCapFinding = {
  code: HookKindMixFinding['code'] | DialogueExpositionFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardDialogueCapReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    plotShots: number;
    dialogueOnlyPlotShots: number;
    unlabeledExpositionShots: number;
  };
  findings: HookHardDialogueCapFinding[];
  thresholds: Required<HookHardDialogueCapOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardDialogueCap(
  shotSpecRaw: unknown,
  opts: HookHardDialogueCapOptions = {},
): HookHardDialogueCapReport {
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
  const dlgOpts: DialogueExpositionOptions = {
    minActionChars: opts.minActionChars,
    unlabeledSpeechMin: opts.unlabeledSpeechMin,
    midWindow: opts.midWindow,
  };
  const dlg = evaluateDialogueExposition(shotSpecRaw, dlgOpts);

  const findings: HookHardDialogueCapFinding[] = [...(mix.findings as HookHardDialogueCapFinding[])];
  for (const f of dlg.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'DIALOGUE_ONLY_PLOT' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardDialogueCapFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
    minActionChars: dlg.thresholds.minActionChars,
    unlabeledSpeechMin: dlg.thresholds.unlabeledSpeechMin,
  } as Required<HookHardDialogueCapOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mix.metrics,
      plotShots: dlg.metrics.plotShots,
      dialogueOnlyPlotShots: dlg.metrics.dialogueOnlyPlotShots,
      unlabeledExpositionShots: dlg.metrics.unlabeledExpositionShots,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
