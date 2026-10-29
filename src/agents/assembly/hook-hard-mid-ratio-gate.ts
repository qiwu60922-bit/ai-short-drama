/**
 * V12 · Hook-Kind Mix Hard × Mid-Turn Setup Ratio Dual Gate (钩种多样 + 中段反转密度/铺垫占比 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩种不宜单一，且中段须有反转密度并封顶 setup 占比.
 * Embeds evaluateHookKindMix + evaluateMidTurnSetupCap; merges FAIL findings.
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
  evaluateMidTurnSetupCap,
  type MidTurnSetupCapFinding,
  type MidTurnSetupCapOptions,
} from './mid-turn-setup-cap-gate';

export interface HookHardMidRatioOptions extends HookKindMixOptions {
  minTurns?: number;
  maxMidSetupRatio?: number;
}

export type HookHardMidRatioFinding = {
  code: HookKindMixFinding['code'] | MidTurnSetupCapFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardMidRatioReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    midSeconds: number;
    midSetupSeconds: number;
    midSetupRatio: number;
    maxMidSetupRatio: number;
  };
  findings: HookHardMidRatioFinding[];
  thresholds: Required<HookHardMidRatioOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardMidRatio(
  shotSpecRaw: unknown,
  opts: HookHardMidRatioOptions = {},
): HookHardMidRatioReport {
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
  const midOpts: MidTurnSetupCapOptions = {
    minTurns: opts.minTurns,
    maxMidSetupRatio: opts.maxMidSetupRatio,
    midWindow: opts.midWindow,
    hookWindowSec: opts.hookWindowSec,
    maxFirstShotSec: opts.maxFirstShotSec,
    tailToleranceSec: opts.tailToleranceSec,
    maxSetupRatio: opts.maxSetupRatio,
    requireAllTagged: opts.requireAllTagged,
    requireHookKind: opts.requireHookKind,
  };
  const mid = evaluateMidTurnSetupCap(shotSpecRaw, midOpts);

  const findings: HookHardMidRatioFinding[] = [...(mix.findings as HookHardMidRatioFinding[])];
  for (const f of mid.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'MID_TURN_SPARSE' ||
      f.code === 'SETUP_MID_CAP' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardMidRatioFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
    minTurns: mid.thresholds.minTurns,
    maxMidSetupRatio: mid.thresholds.maxMidSetupRatio,
  } as Required<HookHardMidRatioOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mix.metrics,
      midSeconds: mid.metrics.midSeconds,
      midSetupSeconds: mid.metrics.midSetupSeconds,
      midSetupRatio: mid.metrics.midSetupRatio,
      maxMidSetupRatio: mid.metrics.maxMidSetupRatio,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
