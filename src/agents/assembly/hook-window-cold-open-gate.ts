/**
 * V12 · Hook-Window Hard × Cold-Open Dual Gate (硬钩窗 + 冷开 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向结构双闸.
 * Embeds evaluateHookWindowHard + evaluateColdOpenHook; merges FAIL findings.
 * Invert of coldOpenHookWindow (cold primary → hookWindow primary).
 *
 *  SCHEMA (+ child findings)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateHookWindowHard,
  type HookWindowHardFinding,
  type HookWindowHardOptions,
  type HookWindowHardReport,
} from './hook-window-hard-gate';
import {
  evaluateColdOpenHook,
  type ColdOpenHookFinding,
  type ColdOpenHookOptions,
} from './cold-open-hook-gate';

export interface HookWindowColdOpenOptions extends HookWindowHardOptions {
  coldOpenWindowSec?: number;
}

export type HookWindowColdOpenFinding = {
  code: HookWindowHardFinding['code'] | ColdOpenHookFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookWindowColdOpenReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookWindowHardReport['metrics'] & {
    coldOpenAtSec: number | null;
  };
  findings: HookWindowColdOpenFinding[];
  thresholds: Required<HookWindowColdOpenOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookWindowColdOpen(
  shotSpecRaw: unknown,
  opts: HookWindowColdOpenOptions = {},
): HookWindowColdOpenReport {
  const primary = evaluateHookWindowHard(shotSpecRaw, opts);
  const coldOpts: ColdOpenHookOptions = {
    ...opts,
    coldOpenWindowSec: opts.coldOpenWindowSec,
  };
  const cold = evaluateColdOpenHook(shotSpecRaw, coldOpts);

  const findings: HookWindowColdOpenFinding[] = [...(primary.findings as HookWindowColdOpenFinding[])];
  for (const f of cold.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'COLD_OPEN_LATE' ||
      f.code === 'SETUP_BEFORE_HOOK' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookWindowColdOpenFinding);
    }
  }

  const thresholds = {
    ...primary.thresholds,
    coldOpenWindowSec: cold.thresholds.coldOpenWindowSec,
  } as Required<HookWindowColdOpenOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...primary.metrics,
      coldOpenAtSec: cold.metrics.firstHookAtSec ?? null,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
