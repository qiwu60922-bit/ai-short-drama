/**
 * V12 · Reaction-Before-Cliff × Hook-Window Hard Dual Gate (悬念前反应 + 硬钩窗 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽/悬疑向: cliff 前须有反应镜，且开场钩窗要紧.
 * Embeds evaluateReactionBeforeCliff + evaluateHookWindowHard; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  CLIFF_NO_PRIOR_REACTION / HOOK_WINDOW_HARD (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateReactionBeforeCliff,
  type ReactionBeforeCliffFinding,
  type ReactionBeforeCliffOptions,
  type ReactionBeforeCliffReport,
} from './reaction-before-cliff-gate';
import {
  evaluateHookWindowHard,
  type HookWindowHardFinding,
  type HookWindowHardOptions,
} from './hook-window-hard-gate';

export interface ReactionHookWindowOptions extends ReactionBeforeCliffOptions {
  hardHookWindowSec?: number;
  hookWindowSec?: number;
  maxFirstShotSec?: number;
  midWindow?: [number, number];
  midWindowHook?: [number, number];
  tailToleranceSec?: number;
  maxSetupRatio?: number;
  requireAllTagged?: boolean;
  requireHookKind?: boolean;
}

export type ReactionHookWindowFinding = {
  code: ReactionBeforeCliffFinding['code'] | HookWindowHardFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface ReactionHookWindowReport {
  verdict: 'PASS' | 'FAIL';
  metrics: ReactionBeforeCliffReport['metrics'] & {
    hardHookWindowSec: number;
  };
  findings: ReactionHookWindowFinding[];
  thresholds: Required<ReactionHookWindowOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateReactionHookWindow(
  shotSpecRaw: unknown,
  opts: ReactionHookWindowOptions = {},
): ReactionHookWindowReport {
  const rx = evaluateReactionBeforeCliff(shotSpecRaw, opts);
  const hardOpts: HookWindowHardOptions = {
    ...opts,
    hardHookWindowSec: opts.hardHookWindowSec,
  };
  const hard = evaluateHookWindowHard(shotSpecRaw, hardOpts);

  const findings: ReactionHookWindowFinding[] = [...(rx.findings as ReactionHookWindowFinding[])];
  for (const f of hard.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'HOOK_WINDOW_HARD' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as ReactionHookWindowFinding);
    }
  }

  const thresholds = {
    ...rx.thresholds,
    hardHookWindowSec: hard.thresholds.hardHookWindowSec,
    hookWindowSec: hard.thresholds.hookWindowSec,
    maxFirstShotSec: hard.thresholds.maxFirstShotSec,
    midWindow: hard.thresholds.midWindow,
    midWindowHook: hard.thresholds.midWindowHook,
    tailToleranceSec: hard.thresholds.tailToleranceSec,
    maxSetupRatio: hard.thresholds.maxSetupRatio,
    requireAllTagged: hard.thresholds.requireAllTagged,
    requireHookKind: hard.thresholds.requireHookKind,
  } as Required<ReactionHookWindowOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...rx.metrics,
      hardHookWindowSec: hard.metrics.hardHookWindowSec ?? hard.thresholds.hardHookWindowSec,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
