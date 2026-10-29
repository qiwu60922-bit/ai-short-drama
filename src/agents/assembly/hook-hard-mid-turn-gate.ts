/**
 * V12 · Hook-Kind Mix Hard × Mid-Turn Density Dual Gate (钩种多样 + 中段密度 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《万妖图录》/密爽向: 开场钩种不宜单一，且中段须有足够反转/增量.
 *  - 与 midTurnHookHard（midTurn 主键）互补：本 gate 以 hookKindMix 为主键.
 * Embeds evaluateHookKindMix + evaluateMidTurnDensity; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateHookKindMix,
  type HookKindMixFinding,
  type HookKindMixOptions,
  type HookKindMixReport,
} from './hook-kind-mix-gate';
import {
  evaluateMidTurnDensity,
  type MidTurnDensityFinding,
  type MidTurnDensityOptions,
} from './mid-turn-density-gate';

export interface HookHardMidTurnOptions extends HookKindMixOptions {
  midWindow?: MidTurnDensityOptions['midWindow'];
  minTurns?: number;
}

export type HookHardMidTurnFinding = {
  code: HookKindMixFinding['code'] | MidTurnDensityFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardMidTurnReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    midTurnCount: number;
    minTurns: number;
  };
  findings: HookHardMidTurnFinding[];
  thresholds: Required<HookHardMidTurnOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardMidTurn(
  shotSpecRaw: unknown,
  opts: HookHardMidTurnOptions = {},
): HookHardMidTurnReport {
  const mixOpts: HookKindMixOptions = {
    hookWindowSec: opts.hookWindowSec,
    maxFirstShotSec: opts.maxFirstShotSec,
    midWindow: opts.midWindow,
    tailToleranceSec: opts.tailToleranceSec,
    maxSetupRatio: opts.maxSetupRatio,
    requireAllTagged: opts.requireAllTagged,
    requireHookKind: opts.requireHookKind ?? true,
    minDistinctKinds: opts.minDistinctKinds,
    maxFaceRatio: opts.maxFaceRatio,
    earlyHooksOnly: opts.earlyHooksOnly,
  };
  const mix = evaluateHookKindMix(shotSpecRaw, mixOpts);
  const mid = evaluateMidTurnDensity(shotSpecRaw, {
    hookWindowSec: opts.hookWindowSec,
    maxFirstShotSec: opts.maxFirstShotSec,
    midWindow: opts.midWindow,
    tailToleranceSec: opts.tailToleranceSec,
    maxSetupRatio: opts.maxSetupRatio,
    requireAllTagged: opts.requireAllTagged,
    requireHookKind: opts.requireHookKind,
    minTurns: opts.minTurns,
  });

  const findings: HookHardMidTurnFinding[] = [...(mix.findings as HookHardMidTurnFinding[])];
  for (const f of mid.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'MID_TURN_SPARSE' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardMidTurnFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
    minTurns: mid.thresholds.minTurns,
  } as Required<HookHardMidTurnOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mix.metrics,
      midTurnCount: mid.metrics.midTurnCount,
      minTurns: mid.metrics.minTurns,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
