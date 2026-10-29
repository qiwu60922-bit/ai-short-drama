/**
 * V12 · Hook-Window Hard × Mid-Hook Early Dual Gate (硬钩窗 + 中段早钩 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开头更快抛冲突，且中段尽快再抛钩.
 * Embeds evaluateHookWindowHard + evaluateMidHookEarly; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  HOOK_WINDOW_HARD / MID_HOOK_MISSING / MID_HOOK_LATE (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateHookWindowHard,
  type HookWindowHardFinding,
  type HookWindowHardOptions,
  type HookWindowHardReport,
} from './hook-window-hard-gate';
import {
  evaluateMidHookEarly,
  type MidHookEarlyFinding,
  type MidHookEarlyOptions,
} from './mid-hook-early-gate';

export interface HookWindowMidHookOptions extends HookWindowHardOptions {
  midHookByRatio?: number;
}

export type HookWindowMidHookFinding = {
  code: HookWindowHardFinding['code'] | MidHookEarlyFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookWindowMidHookReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookWindowHardReport['metrics'] & {
    midHookAtSec: number;
    midHookByRatio: number;
  };
  findings: HookWindowMidHookFinding[];
  thresholds: Required<HookWindowMidHookOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookWindowMidHook(
  shotSpecRaw: unknown,
  opts: HookWindowMidHookOptions = {},
): HookWindowMidHookReport {
  const hard = evaluateHookWindowHard(shotSpecRaw, opts);
  const midOpts: MidHookEarlyOptions = {
    ...opts,
    midHookByRatio: opts.midHookByRatio,
  };
  const mid = evaluateMidHookEarly(shotSpecRaw, midOpts);

  const findings: HookWindowMidHookFinding[] = [...(hard.findings as HookWindowMidHookFinding[])];
  for (const f of mid.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'MID_HOOK_MISSING' ||
      f.code === 'MID_HOOK_LATE' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookWindowMidHookFinding);
    }
  }

  const thresholds = {
    ...hard.thresholds,
    midHookByRatio: mid.thresholds.midHookByRatio,
  } as Required<HookWindowMidHookOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...hard.metrics,
      midHookAtSec: mid.metrics.midHookAtSec,
      midHookByRatio: mid.metrics.midHookByRatio,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
