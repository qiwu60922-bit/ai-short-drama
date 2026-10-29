/**
 * V12 · Mid-Hook Early Gate (中段钩子前置闸), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《万妖图录传》/密爽向: 中段窗内须尽快再抛钩子，避免中段温吞.
 * Requires ≥1 beatRole=hook whose start falls in midWindow and ≤ midHookByRatio of runtime
 * (default midWindow=[0.25,0.75], midHookByRatio=0.45).
 *
 *  SCHEMA (+ child hook findings)
 *  MID_HOOK_MISSING (FAIL) — no hook in midWindow
 *  MID_HOOK_LATE (FAIL) — first mid-window hook starts after midHookByRatio*total
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import {
  evaluateHookStructure,
  type HookFinding,
  type HookStructureOptions,
  type HookStructureReport,
} from './hook-structure-gate';

export interface MidHookEarlyOptions extends HookStructureOptions {
  /** First mid-window hook must start by this runtime ratio (default 0.45). */
  midHookByRatio?: number;
}

export type MidHookEarlyFinding = {
  code: 'SCHEMA' | 'MID_HOOK_MISSING' | 'MID_HOOK_LATE' | HookFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface MidHookEarlyReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookStructureReport['metrics'] & {
    midHookAtSec: number | null;
    midHookByRatio: number;
  };
  findings: MidHookEarlyFinding[];
  thresholds: Required<MidHookEarlyOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };
const r2 = (n: number) => Math.round(n * 100) / 100;

export function evaluateMidHookEarly(
  shotSpecRaw: unknown,
  opts: MidHookEarlyOptions = {},
): MidHookEarlyReport {
  const midHookByRatio = opts.midHookByRatio ?? 0.45;
  const hookOpts: HookStructureOptions = {
    midWindow: opts.midWindow ?? [0.25, 0.75],
  };
  if (opts.hookWindowSec !== undefined) hookOpts.hookWindowSec = opts.hookWindowSec;
  if (opts.maxFirstShotSec !== undefined) hookOpts.maxFirstShotSec = opts.maxFirstShotSec;
  if (opts.tailToleranceSec !== undefined) hookOpts.tailToleranceSec = opts.tailToleranceSec;
  if (opts.maxSetupRatio !== undefined) hookOpts.maxSetupRatio = opts.maxSetupRatio;
  if (opts.requireAllTagged !== undefined) hookOpts.requireAllTagged = opts.requireAllTagged;
  if (opts.requireHookKind !== undefined) hookOpts.requireHookKind = opts.requireHookKind;

  const child = evaluateHookStructure(shotSpecRaw, hookOpts);
  const thresholds: Required<MidHookEarlyOptions> = {
    ...child.thresholds,
    midHookByRatio,
  };
  const findings: MidHookEarlyFinding[] = [...(child.findings as MidHookEarlyFinding[])];

  let midHookAtSec: number | null = null;
  const p = ShotSpecDocSchema.safeParse(shotSpecRaw);
  if (p.success) {
    let clock = 0;
    const total = p.data.shots.reduce((a, s) => a + s.durSec, 0);
    const [lo, hi] = [total * thresholds.midWindow[0], total * thresholds.midWindow[1]];
    const deadline = total * midHookByRatio;
    for (const s of p.data.shots) {
      const start = clock;
      clock += s.durSec;
      if ((s as { beatRole?: string }).beatRole === 'hook' && start >= lo && start <= hi) {
        midHookAtSec = r2(start);
        if (start > deadline && !findings.some((f) => f.code === 'SCHEMA')) {
          findings.push({
            code: 'MID_HOOK_LATE',
            severity: 'FAIL',
            shotIds: [s.shotId],
            message: `mid-window hook ${s.shotId} @${r2(start)}s > midHookByRatio=${midHookByRatio}*${r2(total)}s=${r2(deadline)}s`,
          });
        }
        break;
      }
    }
    if (midHookAtSec === null && !findings.some((f) => f.code === 'SCHEMA')) {
      findings.push({
        code: 'MID_HOOK_MISSING',
        severity: 'FAIL',
        message: `midWindow[${thresholds.midWindow.join(',')}] 内无 beatRole=hook`,
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { ...child.metrics, midHookAtSec, midHookByRatio },
    findings,
    thresholds,
    gates: GATES,
  };
}
