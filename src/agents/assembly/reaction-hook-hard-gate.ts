/**
 * V12 · Reaction-After-Reversal × Hook-Window Hard Gate (反转后反应 + 硬钩窗 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽/悬疑向: 开场钩窗要紧，且反转后须立刻给反应镜.
 * Embeds evaluateReactionAfterReversal + evaluateHookWindowHard; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  REVERSAL_NO_REACTION / HOOK_WINDOW_HARD (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateReactionAfterReversal,
  type ReactionAfterReversalFinding,
  type ReactionAfterReversalOptions,
  type ReactionAfterReversalReport,
} from './reaction-after-reversal-gate';
import {
  evaluateHookWindowHard,
  type HookWindowHardFinding,
} from './hook-window-hard-gate';

export interface ReactionHookHardOptions extends ReactionAfterReversalOptions {
  hardHookWindowSec?: number;
  hookWindowSec?: number;
  maxFirstShotSec?: number;
  midWindow?: [number, number];
  tailToleranceSec?: number;
  maxSetupRatio?: number;
  requireAllTagged?: boolean;
  requireHookKind?: boolean;
}

export type ReactionHookHardFinding = {
  code: ReactionAfterReversalFinding['code'] | HookWindowHardFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface ReactionHookHardReport {
  verdict: 'PASS' | 'FAIL';
  metrics: ReactionAfterReversalReport['metrics'] & { hardHookWindowSec: number };
  findings: ReactionHookHardFinding[];
  thresholds: Required<ReactionHookHardOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateReactionHookHard(
  shotSpecRaw: unknown,
  opts: ReactionHookHardOptions = {},
): ReactionHookHardReport {
  const hardHookWindowSec = opts.hardHookWindowSec ?? opts.hookWindowSec ?? 2;
  const hard = evaluateHookWindowHard(shotSpecRaw, {
    ...opts,
    hardHookWindowSec,
    hookWindowSec: hardHookWindowSec,
  });
  const rx = evaluateReactionAfterReversal(shotSpecRaw, opts);

  const findings: ReactionHookHardFinding[] = [...(rx.findings as ReactionHookHardFinding[])];
  for (const f of hard.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (f.code === 'SCHEMA' || f.code === 'HOOK_WINDOW_HARD' || !findings.some((x) => x.code === f.code)) {
      findings.push(f as ReactionHookHardFinding);
    }
  }

  const thresholds = {
    ...rx.thresholds,
    hardHookWindowSec,
    hookWindowSec: hardHookWindowSec,
    maxFirstShotSec: hard.thresholds.maxFirstShotSec,
    midWindow: hard.thresholds.midWindow,
    tailToleranceSec: hard.thresholds.tailToleranceSec,
    maxSetupRatio: hard.thresholds.maxSetupRatio,
    requireAllTagged: hard.thresholds.requireAllTagged,
    requireHookKind: hard.thresholds.requireHookKind,
  } as Required<ReactionHookHardOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { ...rx.metrics, hardHookWindowSec: hard.metrics.hardHookWindowSec },
    findings,
    thresholds,
    gates: GATES,
  };
}
