/**
 * V12 · Tail Cold-Close × Hook-Window Hard Dual Gate (冷收尾 + 硬钩窗 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开头更快抛冲突，且尾窗冷收在最大悬念处.
 * Embeds evaluateTailColdClose + evaluateHookWindowHard; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  SETUP_AFTER_CLIFF / TAIL_NOT_COLD / HOOK_WINDOW_HARD (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateTailColdClose,
  type TailColdCloseFinding,
  type TailColdCloseOptions,
  type TailColdCloseReport,
} from './tail-cold-close-gate';
import {
  evaluateHookWindowHard,
  type HookWindowHardFinding,
  type HookWindowHardOptions,
} from './hook-window-hard-gate';

export interface ColdCloseHookWindowOptions extends TailColdCloseOptions {
  hardHookWindowSec?: number;
}

export type ColdCloseHookWindowFinding = {
  code: TailColdCloseFinding['code'] | HookWindowHardFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface ColdCloseHookWindowReport {
  verdict: 'PASS' | 'FAIL';
  metrics: TailColdCloseReport['metrics'] & {
    hardHookWindowSec: number;
  };
  findings: ColdCloseHookWindowFinding[];
  thresholds: Required<ColdCloseHookWindowOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateColdCloseHookWindow(
  shotSpecRaw: unknown,
  opts: ColdCloseHookWindowOptions = {},
): ColdCloseHookWindowReport {
  const cold = evaluateTailColdClose(shotSpecRaw, opts);
  const hardOpts: HookWindowHardOptions = {
    ...opts,
    hardHookWindowSec: opts.hardHookWindowSec,
  };
  const hard = evaluateHookWindowHard(shotSpecRaw, hardOpts);

  const findings: ColdCloseHookWindowFinding[] = [...(cold.findings as ColdCloseHookWindowFinding[])];
  for (const f of hard.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'HOOK_WINDOW_HARD' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as ColdCloseHookWindowFinding);
    }
  }

  const thresholds = {
    ...cold.thresholds,
    hardHookWindowSec: hard.thresholds.hardHookWindowSec,
  } as Required<ColdCloseHookWindowOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...cold.metrics,
      hardHookWindowSec: hard.metrics.hardHookWindowSec ?? hard.thresholds.hardHookWindowSec,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
