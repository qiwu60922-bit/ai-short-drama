/**
 * V12 · Mid-Hook Early × Cold-Open Dual Gate (中段早钩 + 冷开 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《不候，过期离婚》: 中段尽快再抛钩，同时冷开即危机.
 * Embeds evaluateMidHookEarly + evaluateColdOpenHook; merges FAIL findings.
 * Invert of coldOpenMidHook (cold primary → mid primary).
 *
 *  SCHEMA (+ child findings)
 *  MID_HOOK_MISSING / MID_HOOK_LATE / COLD_OPEN_LATE / SETUP_BEFORE_HOOK (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateMidHookEarly,
  type MidHookEarlyFinding,
  type MidHookEarlyOptions,
  type MidHookEarlyReport,
} from './mid-hook-early-gate';
import {
  evaluateColdOpenHook,
  type ColdOpenHookFinding,
  type ColdOpenHookOptions,
} from './cold-open-hook-gate';

export interface MidHookColdOpenOptions extends MidHookEarlyOptions {
  coldOpenWindowSec?: number;
}

export type MidHookColdOpenFinding = {
  code: MidHookEarlyFinding['code'] | ColdOpenHookFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface MidHookColdOpenReport {
  verdict: 'PASS' | 'FAIL';
  metrics: MidHookEarlyReport['metrics'] & {
    coldOpenAtSec: number | null;
  };
  findings: MidHookColdOpenFinding[];
  thresholds: Required<MidHookColdOpenOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateMidHookColdOpen(
  shotSpecRaw: unknown,
  opts: MidHookColdOpenOptions = {},
): MidHookColdOpenReport {
  const mid = evaluateMidHookEarly(shotSpecRaw, opts);
  const coldOpts: ColdOpenHookOptions = {
    ...opts,
    coldOpenWindowSec: opts.coldOpenWindowSec,
  };
  const cold = evaluateColdOpenHook(shotSpecRaw, coldOpts);

  const findings: MidHookColdOpenFinding[] = [...(mid.findings as MidHookColdOpenFinding[])];
  for (const f of cold.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'COLD_OPEN_LATE' ||
      f.code === 'SETUP_BEFORE_HOOK' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as MidHookColdOpenFinding);
    }
  }

  const thresholds = {
    ...mid.thresholds,
    coldOpenWindowSec: cold.thresholds.coldOpenWindowSec,
  } as Required<MidHookColdOpenOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mid.metrics,
      coldOpenAtSec: cold.metrics.firstHookAtSec ?? null,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
