/**
 * V12 · Setup-Mid Cap Gate (中段铺垫占比上限闸), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《万妖图录传》/密爽向: 中段窗内 setup 不可吃掉大半中段时长，否则钩子/反转被冲淡.
 * Embeds evaluateHookStructure; FAIL when setup share inside midWindow > maxMidSetupRatio
 * (default midWindow=[0.25,0.75], maxMidSetupRatio=0.4).
 *
 *  SCHEMA (+ child hook findings)
 *  SETUP_MID_CAP (FAIL)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import {
  evaluateHookStructure,
  type HookFinding,
  type HookStructureOptions,
  type HookStructureReport,
} from './hook-structure-gate';

export interface SetupMidCapOptions extends HookStructureOptions {
  /** Max setup share of mid-window seconds (default 0.4). */
  maxMidSetupRatio?: number;
}

export type SetupMidCapFinding = {
  code: 'SCHEMA' | 'SETUP_MID_CAP' | HookFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface SetupMidCapReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookStructureReport['metrics'] & {
    midSeconds: number;
    midSetupSeconds: number;
    midSetupRatio: number;
    maxMidSetupRatio: number;
  };
  findings: SetupMidCapFinding[];
  thresholds: Required<SetupMidCapOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };
const r2 = (n: number) => Math.round(n * 100) / 100;

export function evaluateSetupMidCap(
  shotSpecRaw: unknown,
  opts: SetupMidCapOptions = {},
): SetupMidCapReport {
  const maxMidSetupRatio = opts.maxMidSetupRatio ?? 0.4;
  const hookOpts: HookStructureOptions = {
    midWindow: opts.midWindow ?? [0.25, 0.75],
  };
  if (opts.hookWindowSec !== undefined) hookOpts.hookWindowSec = opts.hookWindowSec;
  if (opts.maxFirstShotSec !== undefined) hookOpts.maxFirstShotSec = opts.maxFirstShotSec;
  if (opts.tailToleranceSec !== undefined) hookOpts.tailToleranceSec = opts.tailToleranceSec;
  if (opts.maxSetupRatio !== undefined) hookOpts.maxSetupRatio = opts.maxSetupRatio;
  if (opts.requireAllTagged !== undefined) hookOpts.requireAllTagged = opts.requireAllTagged;
  if (opts.requireHookKind !== undefined) hookOpts.requireHookKind = opts.requireHookKind;

  const child = evaluateHookStructure(shotSpecRaw, hookOpts);
  const thresholds: Required<SetupMidCapOptions> = {
    ...child.thresholds,
    maxMidSetupRatio,
  };
  const findings: SetupMidCapFinding[] = [...(child.findings as SetupMidCapFinding[])];

  let midSeconds = 0;
  let midSetupSeconds = 0;
  const p = ShotSpecDocSchema.safeParse(shotSpecRaw);
  if (p.success) {
    const total = p.data.shots.reduce((a, s) => a + s.durSec, 0);
    const [loR, hiR] = thresholds.midWindow;
    const lo = total * loR;
    const hi = total * hiR;
    midSeconds = Math.max(0, hi - lo);
    let clock = 0;
    const bad: string[] = [];
    for (const s of p.data.shots) {
      const start = clock;
      const end = clock + s.durSec;
      clock = end;
      const overlap = Math.max(0, Math.min(end, hi) - Math.max(start, lo));
      if (overlap <= 0) continue;
      if ((s as { beatRole?: string }).beatRole === 'setup') {
        midSetupSeconds += overlap;
        bad.push(s.shotId);
      }
    }
    const midSetupRatio = midSeconds > 0 ? midSetupSeconds / midSeconds : 0;
    if (
      midSeconds > 0 &&
      midSetupRatio > maxMidSetupRatio &&
      !findings.some((f) => f.code === 'SCHEMA')
    ) {
      findings.push({
        code: 'SETUP_MID_CAP',
        severity: 'FAIL',
        shotIds: bad,
        message: `midWindow setup ${r2(midSetupSeconds)}s / mid ${r2(midSeconds)}s = ${r2(midSetupRatio * 100)}% > maxMidSetupRatio=${maxMidSetupRatio * 100}%`,
      });
    }

    return {
      verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
      metrics: {
        ...child.metrics,
        midSeconds: r2(midSeconds),
        midSetupSeconds: r2(midSetupSeconds),
        midSetupRatio: r2(midSetupRatio),
        maxMidSetupRatio,
      },
      findings,
      thresholds,
      gates: GATES,
    };
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...child.metrics,
      midSeconds: 0,
      midSetupSeconds: 0,
      midSetupRatio: 0,
      maxMidSetupRatio,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
