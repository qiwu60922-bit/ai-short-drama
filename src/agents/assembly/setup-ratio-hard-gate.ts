/**
 * V12 · Setup-Ratio Hard Gate (铺垫占比硬闸), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《不候，过期离婚》/密爽向: 铺垫秒数不可吃掉大半 runtime.
 * Wraps evaluateHookStructure with stricter maxSetupRatio (default 0.35);
 * escalates SETUP_HEAVY WARN → SETUP_RATIO_HARD FAIL.
 *
 *  SCHEMA (+ child hook findings)
 *  SETUP_RATIO_HARD (FAIL) — setup seconds > maxSetupRatio
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import {
  evaluateHookStructure,
  type HookFinding,
  type HookStructureOptions,
  type HookStructureReport,
} from './hook-structure-gate';

export interface SetupRatioHardOptions extends HookStructureOptions {
  /** Hard ceiling for setup share (default 0.35). */
  hardMaxSetupRatio?: number;
}

export type SetupRatioHardFinding = {
  code: 'SCHEMA' | 'SETUP_RATIO_HARD' | HookFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface SetupRatioHardReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookStructureReport['metrics'] & {
    setupSeconds: number;
    setupRatio: number;
    hardMaxSetupRatio: number;
  };
  findings: SetupRatioHardFinding[];
  thresholds: Required<SetupRatioHardOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };
const r2 = (n: number) => Math.round(n * 100) / 100;

export function evaluateSetupRatioHard(
  shotSpecRaw: unknown,
  opts: SetupRatioHardOptions = {},
): SetupRatioHardReport {
  const hardMaxSetupRatio = opts.hardMaxSetupRatio ?? opts.maxSetupRatio ?? 0.35;
  const hookOpts: HookStructureOptions = {
    maxSetupRatio: hardMaxSetupRatio,
  };
  if (opts.hookWindowSec !== undefined) hookOpts.hookWindowSec = opts.hookWindowSec;
  if (opts.maxFirstShotSec !== undefined) hookOpts.maxFirstShotSec = opts.maxFirstShotSec;
  if (opts.midWindow !== undefined) hookOpts.midWindow = opts.midWindow;
  if (opts.tailToleranceSec !== undefined) hookOpts.tailToleranceSec = opts.tailToleranceSec;
  if (opts.requireAllTagged !== undefined) hookOpts.requireAllTagged = opts.requireAllTagged;
  if (opts.requireHookKind !== undefined) hookOpts.requireHookKind = opts.requireHookKind;

  const child = evaluateHookStructure(shotSpecRaw, hookOpts);
  const thresholds: Required<SetupRatioHardOptions> = {
    ...child.thresholds,
    hardMaxSetupRatio,
  };

  const findings: SetupRatioHardFinding[] = [];
  for (const f of child.findings) {
    if (f.code === 'SETUP_HEAVY') {
      findings.push({
        code: 'SETUP_RATIO_HARD',
        severity: 'FAIL',
        message: f.message.replace('SETUP_HEAVY', 'SETUP_RATIO_HARD'),
        shotIds: f.shotIds,
      });
    } else {
      findings.push(f as SetupRatioHardFinding);
    }
  }

  let setupSeconds = 0;
  let total = 0;
  const p = ShotSpecDocSchema.safeParse(shotSpecRaw);
  if (p.success) {
    for (const s of p.data.shots) {
      total += s.durSec;
      if ((s as { beatRole?: string }).beatRole === 'setup') setupSeconds += s.durSec;
    }
  }
  const setupRatio = total > 0 ? setupSeconds / total : 0;

  if (
    total > 0 &&
    setupRatio > hardMaxSetupRatio &&
    !findings.some((f) => f.code === 'SETUP_RATIO_HARD' || f.code === 'SCHEMA')
  ) {
    findings.push({
      code: 'SETUP_RATIO_HARD',
      severity: 'FAIL',
      message: `setup ${r2(setupSeconds)}s = ${r2(setupRatio * 100)}% > hardMaxSetupRatio=${hardMaxSetupRatio * 100}%`,
    });
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...child.metrics,
      setupSeconds,
      setupRatio: r2(setupRatio),
      hardMaxSetupRatio,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
