/**
 * V12 · Mid-Turn Density × Mid-Hook Early Dual Gate (中段反转密度 + 中段早钩 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 中段须有足够反转密度，且尽快再抛钩.
 * Embeds evaluateMidTurnDensity + evaluateMidHookEarly; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateMidTurnDensity,
  type MidTurnDensityFinding,
  type MidTurnDensityOptions,
  type MidTurnDensityReport,
} from './mid-turn-density-gate';
import {
  evaluateMidHookEarly,
  type MidHookEarlyFinding,
  type MidHookEarlyOptions,
} from './mid-hook-early-gate';

export interface MidTurnMidHookOptions extends MidTurnDensityOptions {
  midHookByRatio?: number;
}

export type MidTurnMidHookFinding = {
  code: MidTurnDensityFinding['code'] | MidHookEarlyFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface MidTurnMidHookReport {
  verdict: 'PASS' | 'FAIL';
  metrics: MidTurnDensityReport['metrics'] & {
    midHookAtSec: number;
    midHookByRatio: number;
  };
  findings: MidTurnMidHookFinding[];
  thresholds: Required<MidTurnMidHookOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateMidTurnMidHook(
  shotSpecRaw: unknown,
  opts: MidTurnMidHookOptions = {},
): MidTurnMidHookReport {
  const mid = evaluateMidTurnDensity(shotSpecRaw, opts);
  const hookOpts: MidHookEarlyOptions = {
    ...opts,
    midHookByRatio: opts.midHookByRatio,
  };
  const hook = evaluateMidHookEarly(shotSpecRaw, hookOpts);

  const findings: MidTurnMidHookFinding[] = [...(mid.findings as MidTurnMidHookFinding[])];
  for (const f of hook.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'MID_HOOK_MISSING' ||
      f.code === 'MID_HOOK_LATE' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as MidTurnMidHookFinding);
    }
  }

  const thresholds = {
    ...mid.thresholds,
    midHookByRatio: hook.thresholds.midHookByRatio,
  } as Required<MidTurnMidHookOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mid.metrics,
      midHookAtSec: hook.metrics.midHookAtSec,
      midHookByRatio: hook.metrics.midHookByRatio,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
