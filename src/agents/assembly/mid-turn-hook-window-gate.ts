/**
 * V12 · Mid-Turn Density × Hook-Window Hard Gate (中段密度 + 硬钩窗 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《万妖图录》/密爽向: 中段须有足够反转/增量，且开场钩窗更紧.
 * Embeds evaluateMidTurnDensity + evaluateHookWindowHard; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  MID_TURN_SPARSE / HOOK_WINDOW_HARD (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateMidTurnDensity,
  type MidTurnDensityFinding,
  type MidTurnDensityOptions,
  type MidTurnDensityReport,
} from './mid-turn-density-gate';
import {
  evaluateHookWindowHard,
  type HookWindowHardFinding,
  type HookWindowHardOptions,
} from './hook-window-hard-gate';

export interface MidTurnHookWindowOptions extends MidTurnDensityOptions {
  hardHookWindowSec?: number;
}

export type MidTurnHookWindowFinding = {
  code: MidTurnDensityFinding['code'] | HookWindowHardFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface MidTurnHookWindowReport {
  verdict: 'PASS' | 'FAIL';
  metrics: MidTurnDensityReport['metrics'] & { hardHookWindowSec: number };
  findings: MidTurnHookWindowFinding[];
  thresholds: Required<MidTurnHookWindowOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateMidTurnHookWindow(
  shotSpecRaw: unknown,
  opts: MidTurnHookWindowOptions = {},
): MidTurnHookWindowReport {
  const hardHookWindowSec = opts.hardHookWindowSec ?? opts.hookWindowSec ?? 2;
  const mid = evaluateMidTurnDensity(shotSpecRaw, { ...opts, hookWindowSec: hardHookWindowSec });
  const hardOpts: HookWindowHardOptions = { ...opts, hardHookWindowSec, hookWindowSec: hardHookWindowSec };
  const hard = evaluateHookWindowHard(shotSpecRaw, hardOpts);

  const findings: MidTurnHookWindowFinding[] = [...(mid.findings as MidTurnHookWindowFinding[])];
  for (const f of hard.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (f.code === 'SCHEMA' || f.code === 'HOOK_WINDOW_HARD' || !findings.some((x) => x.code === f.code)) {
      findings.push(f as MidTurnHookWindowFinding);
    }
  }

  const thresholds: Required<MidTurnHookWindowOptions> = {
    ...mid.thresholds,
    hardHookWindowSec,
  };

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { ...mid.metrics, hardHookWindowSec: hard.metrics.hardHookWindowSec },
    findings,
    thresholds,
    gates: GATES,
  };
}
