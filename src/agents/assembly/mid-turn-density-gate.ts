/**
 * V12 · Mid-Turn Density Gate (中段反转/增量密度闸门), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《万妖图录传》: 中段至少一个反转或信息增量；密爽向需要更高中段事件密度.
 * Wraps evaluateHookStructure + counts increment/reversal in midWindow; enforces minTurns.
 *
 *  SCHEMA (+ child hook findings)
 *  MID_TURN_SPARSE (FAIL) — mid-window turn count < minTurns (default 2)
 *  MID_TURN_SOFT (WARN) — turn count == minTurns (刚好踩线)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import {
  evaluateHookStructure,
  type HookFinding,
  type HookStructureOptions,
  type HookStructureReport,
} from './hook-structure-gate';

export interface MidTurnDensityOptions extends HookStructureOptions {
  /** Minimum increment+reversal starts in midWindow (default 2). */
  minTurns?: number;
}

export type MidTurnDensityFinding = {
  code: 'SCHEMA' | 'MID_TURN_SPARSE' | 'MID_TURN_SOFT' | HookFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface MidTurnDensityReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookStructureReport['metrics'] & {
    midTurnCount: number;
    minTurns: number;
  };
  findings: MidTurnDensityFinding[];
  thresholds: Required<MidTurnDensityOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateMidTurnDensity(
  shotSpecRaw: unknown,
  opts: MidTurnDensityOptions = {},
): MidTurnDensityReport {
  const minTurns = opts.minTurns ?? 2;
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
  const thresholds: Required<MidTurnDensityOptions> = {
    ...child.thresholds,
    minTurns,
  };
  const findings: MidTurnDensityFinding[] = [...(child.findings as MidTurnDensityFinding[])];

  let midTurnCount = 0;
  const p = ShotSpecDocSchema.safeParse(shotSpecRaw);
  if (p.success) {
    let clock = 0;
    const total = p.data.shots.reduce((a, s) => a + s.durSec, 0);
    const [lo, hi] = [
      total * thresholds.midWindow[0],
      total * thresholds.midWindow[1],
    ];
    const ids: string[] = [];
    for (const s of p.data.shots) {
      const start = clock;
      clock += s.durSec;
      const role = (s as { beatRole?: string }).beatRole;
      if (
        (role === 'increment' || role === 'reversal') &&
        start >= lo &&
        start <= hi
      ) {
        midTurnCount += 1;
        if (s.shotId) ids.push(s.shotId);
      }
    }
    if (midTurnCount < minTurns && !findings.some((f) => f.code === 'SCHEMA')) {
      findings.push({
        code: 'MID_TURN_SPARSE',
        severity: 'FAIL',
        message: `中段反转/增量 ${midTurnCount} < minTurns=${minTurns}`,
        shotIds: ids,
      });
    } else if (midTurnCount === minTurns) {
      findings.push({
        code: 'MID_TURN_SOFT',
        severity: 'WARN',
        message: `中段反转/增量刚好 ${minTurns}（踩线）`,
        shotIds: ids,
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { ...child.metrics, midTurnCount, minTurns },
    findings,
    thresholds,
    gates: GATES,
  };
}
