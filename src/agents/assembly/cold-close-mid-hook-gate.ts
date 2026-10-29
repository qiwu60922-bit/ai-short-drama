/**
 * V12 · Tail Cold-Close × Mid-Hook Early Dual Gate (冷收尾 + 中段早钩 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 中段尽快再抛钩，且尾窗冷收在最大悬念处.
 * Embeds evaluateTailColdClose + evaluateMidHookEarly; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  SETUP_AFTER_CLIFF / TAIL_NOT_COLD / MID_HOOK_MISSING / MID_HOOK_LATE (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateTailColdClose,
  type TailColdCloseFinding,
  type TailColdCloseOptions,
  type TailColdCloseReport,
} from './tail-cold-close-gate';
import {
  evaluateMidHookEarly,
  type MidHookEarlyFinding,
  type MidHookEarlyOptions,
} from './mid-hook-early-gate';

export interface ColdCloseMidHookOptions extends TailColdCloseOptions {
  midHookByRatio?: number;
}

export type ColdCloseMidHookFinding = {
  code: TailColdCloseFinding['code'] | MidHookEarlyFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface ColdCloseMidHookReport {
  verdict: 'PASS' | 'FAIL';
  metrics: TailColdCloseReport['metrics'] & {
    midHookAtSec: number | null;
    midHookByRatio: number;
  };
  findings: ColdCloseMidHookFinding[];
  thresholds: Required<ColdCloseMidHookOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateColdCloseMidHook(
  shotSpecRaw: unknown,
  opts: ColdCloseMidHookOptions = {},
): ColdCloseMidHookReport {
  const cold = evaluateTailColdClose(shotSpecRaw, opts);
  const midOpts: MidHookEarlyOptions = {
    ...opts,
    midHookByRatio: opts.midHookByRatio,
  };
  const mid = evaluateMidHookEarly(shotSpecRaw, midOpts);

  const findings: ColdCloseMidHookFinding[] = [...(cold.findings as ColdCloseMidHookFinding[])];
  for (const f of mid.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'MID_HOOK_MISSING' ||
      f.code === 'MID_HOOK_LATE' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as ColdCloseMidHookFinding);
    }
  }

  const thresholds = {
    ...cold.thresholds,
    midHookByRatio: mid.thresholds.midHookByRatio,
  } as Required<ColdCloseMidHookOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...cold.metrics,
      midHookAtSec: mid.metrics.midHookAtSec,
      midHookByRatio: mid.metrics.midHookByRatio,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
