/**
 * V12 · Dialogue-After-Hook Gate (钩后对白闸), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《不候，过期离婚》: 对白不得抢在第一钩之前灌剧情；钩后对白仍须有可见动作.
 * Embeds evaluateDialogueExposition + evaluateHookStructure timing.
 *
 *  SCHEMA (+ child findings)
 *  DIALOGUE_BEFORE_HOOK (FAIL) — 带台词镜起点早于 firstHookAtSec
 *  DIALOGUE_ONLY_PLOT / EXPOSITION_UNLABELED (from child)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { speechUnits } from './shot-prompt-gate';
import {
  evaluateDialogueExposition,
  type DialogueExpositionFinding,
  type DialogueExpositionOptions,
  type DialogueExpositionReport,
} from './dialogue-exposition-gate';
import {
  evaluateHookStructure,
  type HookStructureOptions,
} from './hook-structure-gate';

export interface DialogueAfterHookOptions extends DialogueExpositionOptions {
  hookWindowSec?: number;
  maxFirstShotSec?: number;
  midWindowHook?: [number, number];
  tailToleranceSec?: number;
  maxSetupRatio?: number;
  requireAllTagged?: boolean;
  requireHookKind?: boolean;
}

export type DialogueAfterHookFinding = {
  code: 'SCHEMA' | 'DIALOGUE_BEFORE_HOOK' | DialogueExpositionFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface DialogueAfterHookReport {
  verdict: 'PASS' | 'FAIL';
  metrics: DialogueExpositionReport['metrics'] & {
    firstHookAtSec: number | null;
    dialogueBeforeHookShots: number;
  };
  findings: DialogueAfterHookFinding[];
  thresholds: Required<DialogueAfterHookOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };
const r2 = (n: number) => Math.round(n * 100) / 100;

export function evaluateDialogueAfterHook(
  shotSpecRaw: unknown,
  opts: DialogueAfterHookOptions = {},
): DialogueAfterHookReport {
  const dialogueOpts: DialogueExpositionOptions = {
    minActionChars: opts.minActionChars,
    midWindow: opts.midWindow,
    unlabeledSpeechMin: opts.unlabeledSpeechMin,
  };
  const child = evaluateDialogueExposition(shotSpecRaw, dialogueOpts);

  const hookOpts: HookStructureOptions = {};
  if (opts.hookWindowSec !== undefined) hookOpts.hookWindowSec = opts.hookWindowSec;
  if (opts.maxFirstShotSec !== undefined) hookOpts.maxFirstShotSec = opts.maxFirstShotSec;
  if (opts.midWindowHook !== undefined) hookOpts.midWindow = opts.midWindowHook;
  if (opts.tailToleranceSec !== undefined) hookOpts.tailToleranceSec = opts.tailToleranceSec;
  if (opts.maxSetupRatio !== undefined) hookOpts.maxSetupRatio = opts.maxSetupRatio;
  if (opts.requireAllTagged !== undefined) hookOpts.requireAllTagged = opts.requireAllTagged;
  if (opts.requireHookKind !== undefined) hookOpts.requireHookKind = opts.requireHookKind;

  const hook = evaluateHookStructure(shotSpecRaw, hookOpts);
  const firstHookAtSec = hook.metrics.firstHookAtSec;

  const thresholds: Required<DialogueAfterHookOptions> = {
    minActionChars: child.thresholds.minActionChars,
    midWindow: child.thresholds.midWindow,
    unlabeledSpeechMin: child.thresholds.unlabeledSpeechMin,
    hookWindowSec: hook.thresholds.hookWindowSec,
    maxFirstShotSec: hook.thresholds.maxFirstShotSec,
    midWindowHook: hook.thresholds.midWindow,
    tailToleranceSec: hook.thresholds.tailToleranceSec,
    maxSetupRatio: hook.thresholds.maxSetupRatio,
    requireAllTagged: hook.thresholds.requireAllTagged,
    requireHookKind: hook.thresholds.requireHookKind,
  };

  const findings: DialogueAfterHookFinding[] = child.findings.map((f) => f as DialogueAfterHookFinding);

  let dialogueBeforeHookShots = 0;
  const p = ShotSpecDocSchema.safeParse(shotSpecRaw);
  if (p.success && firstHookAtSec !== null) {
    let clock = 0;
    const early: string[] = [];
    for (const s of p.data.shots) {
      const start = clock;
      clock += s.durSec;
      const spoken = speechUnits(s.dialogue) + speechUnits(s.vo ?? null);
      if (spoken > 0 && start < firstHookAtSec) {
        early.push(s.shotId);
      }
    }
    if (early.length > 0) {
      dialogueBeforeHookShots = early.length;
      findings.push({
        code: 'DIALOGUE_BEFORE_HOOK',
        severity: 'FAIL',
        shotIds: early,
        message: `${early.length} 镜台词起点早于 firstHook@${r2(firstHookAtSec)}s`,
      });
    }
  }

  // bubble SCHEMA from hook if dialogue child passed schema but hook failed schema
  if (hook.findings.some((f) => f.code === 'SCHEMA') && !findings.some((f) => f.code === 'SCHEMA')) {
    const sf = hook.findings.find((f) => f.code === 'SCHEMA')!;
    findings.unshift({ code: 'SCHEMA', severity: 'FAIL', message: sf.message });
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...child.metrics,
      firstHookAtSec,
      dialogueBeforeHookShots,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
