/**
 * V12 · Mid-Hook Early × Dialogue-After-Hook Gate (中段再钩 + 钩后对白 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《万妖图录》/密爽向: 中段须尽快再抛钩，且对白不得抢在第一钩之前灌剧情.
 * Embeds evaluateMidHookEarly + evaluateDialogueAfterHook; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  MID_HOOK_MISSING / MID_HOOK_LATE / DIALOGUE_BEFORE_HOOK (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateMidHookEarly,
  type MidHookEarlyFinding,
  type MidHookEarlyOptions,
  type MidHookEarlyReport,
} from './mid-hook-early-gate';
import {
  evaluateDialogueAfterHook,
  type DialogueAfterHookFinding,
  type DialogueAfterHookOptions,
} from './dialogue-after-hook-gate';

export interface MidHookDialogueBanOptions extends MidHookEarlyOptions {
  minActionChars?: number;
  unlabeledSpeechMin?: number;
}

export type MidHookDialogueBanFinding = {
  code: MidHookEarlyFinding['code'] | DialogueAfterHookFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface MidHookDialogueBanReport {
  verdict: 'PASS' | 'FAIL';
  metrics: MidHookEarlyReport['metrics'] & {
    firstHookAtSec: number | null;
    dialogueBeforeHookShots: number;
  };
  findings: MidHookDialogueBanFinding[];
  thresholds: Required<MidHookDialogueBanOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateMidHookDialogueBan(
  shotSpecRaw: unknown,
  opts: MidHookDialogueBanOptions = {},
): MidHookDialogueBanReport {
  const midHookByRatio = opts.midHookByRatio ?? 0.45;
  const mid = evaluateMidHookEarly(shotSpecRaw, { ...opts, midHookByRatio });
  const dlgOpts: DialogueAfterHookOptions = { ...opts };
  const dlg = evaluateDialogueAfterHook(shotSpecRaw, dlgOpts);

  const findings: MidHookDialogueBanFinding[] = [
    ...(mid.findings as MidHookDialogueBanFinding[]),
  ];
  for (const f of dlg.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'DIALOGUE_BEFORE_HOOK' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as MidHookDialogueBanFinding);
    }
  }

  const thresholds: Required<MidHookDialogueBanOptions> = {
    ...mid.thresholds,
    minActionChars: dlg.thresholds.minActionChars,
    unlabeledSpeechMin: dlg.thresholds.unlabeledSpeechMin,
  };

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mid.metrics,
      firstHookAtSec: dlg.metrics.firstHookAtSec,
      dialogueBeforeHookShots: dlg.metrics.dialogueBeforeHookShots,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
