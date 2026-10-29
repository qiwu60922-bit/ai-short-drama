/**
 * V12 · Mid-Hook Early × Hook-Window Hard Dual Gate (中段早钩 + 硬钩窗 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩窗要紧，且中段尽快再抛钩.
 * Embeds evaluateMidHookEarly + evaluateHookWindowHard; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateMidHookEarly,
  type MidHookEarlyFinding,
  type MidHookEarlyOptions,
  type MidHookEarlyReport,
} from './mid-hook-early-gate';
import {
  evaluateHookWindowHard,
  type HookWindowHardFinding,
  type HookWindowHardOptions,
} from './hook-window-hard-gate';

export interface MidHookHookWindowOptions extends MidHookEarlyOptions {
  hardHookWindowSec?: number;
}

export type MidHookHookWindowFinding = {
  code: MidHookEarlyFinding['code'] | HookWindowHardFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface MidHookHookWindowReport {
  verdict: 'PASS' | 'FAIL';
  metrics: MidHookEarlyReport['metrics'] & {
    hardHookAtSec: number | null;
  };
  findings: MidHookHookWindowFinding[];
  thresholds: Required<MidHookHookWindowOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateMidHookHookWindow(
  shotSpecRaw: unknown,
  opts: MidHookHookWindowOptions = {},
): MidHookHookWindowReport {
  const mid = evaluateMidHookEarly(shotSpecRaw, opts);
  const hardHookWindowSec = opts.hardHookWindowSec ?? opts.hookWindowSec ?? 2;
  const hard = evaluateHookWindowHard(shotSpecRaw, {
    ...opts,
    hardHookWindowSec,
    hookWindowSec: hardHookWindowSec,
  } as HookWindowHardOptions);

  const findings: MidHookHookWindowFinding[] = [...(mid.findings as MidHookHookWindowFinding[])];
  for (const f of hard.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'HOOK_WINDOW_HARD' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as MidHookHookWindowFinding);
    }
  }

  const thresholds = {
    ...mid.thresholds,
    hardHookWindowSec: hard.thresholds.hardHookWindowSec,
  } as Required<MidHookHookWindowOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mid.metrics,
      hardHookAtSec: (hard.metrics as { firstHookAtSec?: number | null }).firstHookAtSec ?? null,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
