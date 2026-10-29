/**
 * V12 · Cold-Open × Hook-Window Hard Gate (冷开 + 钩窗硬闸 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《万妖图录》/密爽向: 冷开危机同时须更快抛冲突（硬钩窗）.
 * Embeds evaluateColdOpenHook + evaluateHookWindowHard; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  HOOK_WINDOW_HARD / COLD_OPEN_LATE / SETUP_BEFORE_HOOK (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateColdOpenHook,
  type ColdOpenHookFinding,
  type ColdOpenHookOptions,
  type ColdOpenHookReport,
} from './cold-open-hook-gate';
import {
  evaluateHookWindowHard,
  type HookWindowHardFinding,
  type HookWindowHardOptions,
} from './hook-window-hard-gate';

export interface ColdOpenHookWindowOptions extends ColdOpenHookOptions {
  hardHookWindowSec?: number;
}

export type ColdOpenHookWindowFinding = {
  code: ColdOpenHookFinding['code'] | HookWindowHardFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface ColdOpenHookWindowReport {
  verdict: 'PASS' | 'FAIL';
  metrics: ColdOpenHookReport['metrics'] & {
    hardHookWindowSec: number;
  };
  findings: ColdOpenHookWindowFinding[];
  thresholds: Required<ColdOpenHookWindowOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateColdOpenHookWindow(
  shotSpecRaw: unknown,
  opts: ColdOpenHookWindowOptions = {},
): ColdOpenHookWindowReport {
  const hardHookWindowSec = opts.hardHookWindowSec ?? opts.hookWindowSec ?? 2;
  const cold = evaluateColdOpenHook(shotSpecRaw, { ...opts, hookWindowSec: hardHookWindowSec });
  const hardOpts: HookWindowHardOptions = { ...opts, hardHookWindowSec, hookWindowSec: hardHookWindowSec };
  const hard = evaluateHookWindowHard(shotSpecRaw, hardOpts);

  const findings: ColdOpenHookWindowFinding[] = [
    ...(cold.findings as ColdOpenHookWindowFinding[]),
  ];
  for (const f of hard.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'HOOK_WINDOW_HARD' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as ColdOpenHookWindowFinding);
    }
  }

  const thresholds: Required<ColdOpenHookWindowOptions> = {
    ...cold.thresholds,
    hardHookWindowSec,
  };

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...cold.metrics,
      hardHookWindowSec: hard.metrics.hardHookWindowSec,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
