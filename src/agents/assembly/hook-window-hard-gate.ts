/**
 * V12 · Hook-Window Hard Gate (钩子窗口硬闸), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《万妖图录传》/密爽向: 开头须更快抛冲突；默认 hookWindowSec=2（严于 hook-structure 的 3s）.
 * Wraps evaluateHookStructure; escalates HOOK_LATE → HOOK_WINDOW_HARD FAIL.
 *
 *  SCHEMA (+ child hook findings)
 *  HOOK_WINDOW_HARD (FAIL)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateHookStructure,
  type HookFinding,
  type HookStructureOptions,
  type HookStructureReport,
} from './hook-structure-gate';

export interface HookWindowHardOptions extends HookStructureOptions {
  /** Hard hook window in seconds (default 2). */
  hardHookWindowSec?: number;
}

export type HookWindowHardFinding = {
  code: 'SCHEMA' | 'HOOK_WINDOW_HARD' | HookFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookWindowHardReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookStructureReport['metrics'] & {
    hardHookWindowSec: number;
  };
  findings: HookWindowHardFinding[];
  thresholds: Required<HookWindowHardOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookWindowHard(
  shotSpecRaw: unknown,
  opts: HookWindowHardOptions = {},
): HookWindowHardReport {
  const hardHookWindowSec = opts.hardHookWindowSec ?? opts.hookWindowSec ?? 2;
  const hookOpts: HookStructureOptions = { ...opts, hookWindowSec: hardHookWindowSec };
  const child = evaluateHookStructure(shotSpecRaw, hookOpts);
  const thresholds: Required<HookWindowHardOptions> = {
    ...child.thresholds,
    hardHookWindowSec,
  };

  const findings: HookWindowHardFinding[] = [];
  for (const f of child.findings) {
    if (f.code === 'HOOK_LATE') {
      findings.push({
        code: 'HOOK_WINDOW_HARD',
        severity: 'FAIL',
        message: f.message.replace('HOOK_LATE', 'HOOK_WINDOW_HARD'),
        shotIds: f.shotIds,
      });
    } else {
      findings.push(f as HookWindowHardFinding);
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { ...child.metrics, hardHookWindowSec },
    findings,
    thresholds,
    gates: GATES,
  };
}
