/**
 * V12 · Cold-Open × Mid-Hook Gate (冷开 + 中段再钩 双闸), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《不候，过期离婚》: 冷开即危机，中段仍须尽快再抛钩，避免中温.
 * Embeds evaluateColdOpenHook + evaluateMidHookEarly; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  MID_HOOK_MISSING / MID_HOOK_LATE / COLD_OPEN_LATE / SETUP_BEFORE_HOOK (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateColdOpenHook,
  type ColdOpenHookFinding,
  type ColdOpenHookOptions,
  type ColdOpenHookReport,
} from './cold-open-hook-gate';
import {
  evaluateMidHookEarly,
  type MidHookEarlyFinding,
  type MidHookEarlyOptions,
} from './mid-hook-early-gate';

export interface ColdOpenMidHookOptions extends ColdOpenHookOptions {
  /** First mid-window hook must start by this runtime ratio (default 0.45). */
  midHookByRatio?: number;
}

export type ColdOpenMidHookFinding = {
  code: ColdOpenHookFinding['code'] | MidHookEarlyFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface ColdOpenMidHookReport {
  verdict: 'PASS' | 'FAIL';
  metrics: ColdOpenHookReport['metrics'] & {
    midHookAtSec: number | null;
    midHookByRatio: number;
  };
  findings: ColdOpenMidHookFinding[];
  thresholds: Required<ColdOpenMidHookOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateColdOpenMidHook(
  shotSpecRaw: unknown,
  opts: ColdOpenMidHookOptions = {},
): ColdOpenMidHookReport {
  const midHookByRatio = opts.midHookByRatio ?? 0.45;
  const cold = evaluateColdOpenHook(shotSpecRaw, opts);
  const midOpts: MidHookEarlyOptions = {
    midHookByRatio,
    midWindow: opts.midWindow ?? cold.thresholds.midWindow,
  };
  if (opts.hookWindowSec !== undefined) midOpts.hookWindowSec = opts.hookWindowSec;
  if (opts.maxFirstShotSec !== undefined) midOpts.maxFirstShotSec = opts.maxFirstShotSec;
  if (opts.tailToleranceSec !== undefined) midOpts.tailToleranceSec = opts.tailToleranceSec;
  if (opts.maxSetupRatio !== undefined) midOpts.maxSetupRatio = opts.maxSetupRatio;
  if (opts.requireAllTagged !== undefined) midOpts.requireAllTagged = opts.requireAllTagged;
  if (opts.requireHookKind !== undefined) midOpts.requireHookKind = opts.requireHookKind;

  const mid = evaluateMidHookEarly(shotSpecRaw, midOpts);

  const findings: ColdOpenMidHookFinding[] = [
    ...(cold.findings as ColdOpenMidHookFinding[]),
  ];
  for (const f of mid.findings) {
    // avoid duplicating shared SCHEMA / hook-structure codes already bubbled by cold
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'MID_HOOK_MISSING' ||
      f.code === 'MID_HOOK_LATE' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as ColdOpenMidHookFinding);
    }
  }

  const thresholds: Required<ColdOpenMidHookOptions> = {
    ...cold.thresholds,
    midHookByRatio,
  };

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...cold.metrics,
      midHookAtSec: mid.metrics.midHookAtSec,
      midHookByRatio,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
