/**
 * V12 · Mid-Turn Setup Cap Gate (中段反转密度 + 铺垫占比双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《万妖图录传》/密爽向: 中段须有反转密度，且 setup 不可吃掉大半中段.
 * Embeds evaluateMidTurnDensity + evaluateSetupMidCap; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  MID_TURN_SPARSE / SETUP_MID_CAP (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateMidTurnDensity,
  type MidTurnDensityFinding,
  type MidTurnDensityOptions,
  type MidTurnDensityReport,
} from './mid-turn-density-gate';
import {
  evaluateSetupMidCap,
  type SetupMidCapFinding,
  type SetupMidCapOptions,
} from './setup-mid-cap-gate';

export interface MidTurnSetupCapOptions extends MidTurnDensityOptions {
  /** Max setup share of mid-window seconds (default 0.4). */
  maxMidSetupRatio?: number;
}

export type MidTurnSetupCapFinding = {
  code: MidTurnDensityFinding['code'] | SetupMidCapFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface MidTurnSetupCapReport {
  verdict: 'PASS' | 'FAIL';
  metrics: MidTurnDensityReport['metrics'] & {
    midSeconds: number;
    midSetupSeconds: number;
    midSetupRatio: number;
    maxMidSetupRatio: number;
  };
  findings: MidTurnSetupCapFinding[];
  thresholds: Required<MidTurnSetupCapOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateMidTurnSetupCap(
  shotSpecRaw: unknown,
  opts: MidTurnSetupCapOptions = {},
): MidTurnSetupCapReport {
  const minTurns = opts.minTurns ?? 2;
  const maxMidSetupRatio = opts.maxMidSetupRatio ?? 0.4;

  const densOpts: MidTurnDensityOptions = {
    minTurns,
    midWindow: opts.midWindow ?? [0.25, 0.75],
  };
  if (opts.hookWindowSec !== undefined) densOpts.hookWindowSec = opts.hookWindowSec;
  if (opts.maxFirstShotSec !== undefined) densOpts.maxFirstShotSec = opts.maxFirstShotSec;
  if (opts.tailToleranceSec !== undefined) densOpts.tailToleranceSec = opts.tailToleranceSec;
  if (opts.maxSetupRatio !== undefined) densOpts.maxSetupRatio = opts.maxSetupRatio;
  if (opts.requireAllTagged !== undefined) densOpts.requireAllTagged = opts.requireAllTagged;
  if (opts.requireHookKind !== undefined) densOpts.requireHookKind = opts.requireHookKind;

  const dens = evaluateMidTurnDensity(shotSpecRaw, densOpts);

  const capOpts: SetupMidCapOptions = {
    maxMidSetupRatio,
    midWindow: dens.thresholds.midWindow,
  };
  if (opts.hookWindowSec !== undefined) capOpts.hookWindowSec = opts.hookWindowSec;
  if (opts.maxFirstShotSec !== undefined) capOpts.maxFirstShotSec = opts.maxFirstShotSec;
  if (opts.tailToleranceSec !== undefined) capOpts.tailToleranceSec = opts.tailToleranceSec;
  if (opts.maxSetupRatio !== undefined) capOpts.maxSetupRatio = opts.maxSetupRatio;
  if (opts.requireAllTagged !== undefined) capOpts.requireAllTagged = opts.requireAllTagged;
  if (opts.requireHookKind !== undefined) capOpts.requireHookKind = opts.requireHookKind;

  const cap = evaluateSetupMidCap(shotSpecRaw, capOpts);

  const findings: MidTurnSetupCapFinding[] = [
    ...(dens.findings as MidTurnSetupCapFinding[]),
  ];
  for (const f of cap.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'SETUP_MID_CAP' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as MidTurnSetupCapFinding);
    }
  }

  const thresholds: Required<MidTurnSetupCapOptions> = {
    ...dens.thresholds,
    maxMidSetupRatio,
  };

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...dens.metrics,
      midSeconds: cap.metrics.midSeconds,
      midSetupSeconds: cap.metrics.midSetupSeconds,
      midSetupRatio: cap.metrics.midSetupRatio,
      maxMidSetupRatio,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
