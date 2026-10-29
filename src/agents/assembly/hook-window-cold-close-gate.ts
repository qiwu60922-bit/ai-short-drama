/**
 * V12 · Hook-Window Hard × Tail Cold-Close Dual Gate (硬钩窗 + 冷收尾 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开头更快抛冲突，且尾窗冷收在最大悬念处.
 * Embeds evaluateHookWindowHard + evaluateTailColdClose; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  HOOK_WINDOW_HARD / SETUP_AFTER_CLIFF / TAIL_NOT_COLD (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateHookWindowHard,
  type HookWindowHardFinding,
  type HookWindowHardOptions,
  type HookWindowHardReport,
} from './hook-window-hard-gate';
import {
  evaluateTailColdClose,
  type TailColdCloseFinding,
  type TailColdCloseOptions,
} from './tail-cold-close-gate';

export interface HookWindowColdCloseOptions extends HookWindowHardOptions {
  coldTailSec?: number;
}

export type HookWindowColdCloseFinding = {
  code: HookWindowHardFinding['code'] | TailColdCloseFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookWindowColdCloseReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookWindowHardReport['metrics'] & {
    coldTailSec: number;
  };
  findings: HookWindowColdCloseFinding[];
  thresholds: Required<HookWindowColdCloseOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookWindowColdClose(
  shotSpecRaw: unknown,
  opts: HookWindowColdCloseOptions = {},
): HookWindowColdCloseReport {
  const hard = evaluateHookWindowHard(shotSpecRaw, opts);
  const coldOpts: TailColdCloseOptions = {
    ...opts,
    coldTailSec: opts.coldTailSec,
  };
  const cold = evaluateTailColdClose(shotSpecRaw, coldOpts);

  const findings: HookWindowColdCloseFinding[] = [...(hard.findings as HookWindowColdCloseFinding[])];
  for (const f of cold.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'SETUP_AFTER_CLIFF' ||
      f.code === 'TAIL_NOT_COLD' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookWindowColdCloseFinding);
    }
  }

  const thresholds = {
    ...hard.thresholds,
    coldTailSec: cold.thresholds.coldTailSec,
  } as Required<HookWindowColdCloseOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...hard.metrics,
      coldTailSec: cold.metrics.coldTailSec ?? cold.thresholds.coldTailSec,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
