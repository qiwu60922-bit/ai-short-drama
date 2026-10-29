/**
 * V12 · Setup-Mid Cap × Dialogue-Exposition Gate (中段铺垫占比 + 台词带过剧情 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《万妖图录》/《不候》: 中段 setup 不可过半，且情节镜对白须有可见动作.
 * Embeds evaluateSetupMidCap + evaluateDialogueExposition; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  SETUP_MID_CAP / DIALOGUE_ONLY_PLOT (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateSetupMidCap,
  type SetupMidCapFinding,
  type SetupMidCapOptions,
  type SetupMidCapReport,
} from './setup-mid-cap-gate';
import {
  evaluateDialogueExposition,
  type DialogueExpositionFinding,
  type DialogueExpositionOptions,
} from './dialogue-exposition-gate';

export interface SetupDialogueCapOptions extends SetupMidCapOptions {
  minActionChars?: number;
  unlabeledSpeechMin?: number;
}

export type SetupDialogueCapFinding = {
  code: SetupMidCapFinding['code'] | DialogueExpositionFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface SetupDialogueCapReport {
  verdict: 'PASS' | 'FAIL';
  metrics: SetupMidCapReport['metrics'] & {
    plotShots: number;
    dialogueOnlyPlotShots: number;
    unlabeledExpositionShots: number;
  };
  findings: SetupDialogueCapFinding[];
  thresholds: Required<SetupDialogueCapOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateSetupDialogueCap(
  shotSpecRaw: unknown,
  opts: SetupDialogueCapOptions = {},
): SetupDialogueCapReport {
  const maxMidSetupRatio = opts.maxMidSetupRatio ?? 0.4;
  const setup = evaluateSetupMidCap(shotSpecRaw, { ...opts, maxMidSetupRatio });
  const dlgOpts: DialogueExpositionOptions = {
    minActionChars: opts.minActionChars,
    midWindow: opts.midWindow,
    unlabeledSpeechMin: opts.unlabeledSpeechMin,
  };
  const dlg = evaluateDialogueExposition(shotSpecRaw, dlgOpts);

  const findings: SetupDialogueCapFinding[] = [
    ...(setup.findings as SetupDialogueCapFinding[]),
  ];
  for (const f of dlg.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'DIALOGUE_ONLY_PLOT' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as SetupDialogueCapFinding);
    }
  }

  const thresholds: Required<SetupDialogueCapOptions> = {
    ...setup.thresholds,
    minActionChars: dlg.thresholds.minActionChars,
    unlabeledSpeechMin: dlg.thresholds.unlabeledSpeechMin,
  };

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...setup.metrics,
      plotShots: dlg.metrics.plotShots,
      dialogueOnlyPlotShots: dlg.metrics.dialogueOnlyPlotShots,
      unlabeledExpositionShots: dlg.metrics.unlabeledExpositionShots,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
