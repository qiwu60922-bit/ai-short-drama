/**
 * V12 · Hook-Kind Mix Hard × Mid-Hook Early Dual Gate (钩种多样 + 中段早钩 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩种不宜单一，且中段尽快再抛钩.
 *  - 与 midHookHookHard（midHook 主键）互补：本 gate 以 hookKindMix 为主键.
 * Embeds evaluateHookKindMix + evaluateMidHookEarly; merges FAIL findings.
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
  evaluateMidHookEarly,
  type MidHookEarlyFinding,
  type MidHookEarlyOptions,
} from './mid-hook-early-gate';

export interface HookHardMidHookOptions extends HookKindMixOptions {
  midHookByRatio?: number;
  midWindow?: MidHookEarlyOptions['midWindow'];
  hookWindowSec?: number;
  maxFirstShotSec?: number;
  tailToleranceSec?: number;
  maxSetupRatio?: number;
  requireAllTagged?: boolean;
  requireHookKind?: boolean;
}

export type HookHardMidHookFinding = {
  code: HookKindMixFinding['code'] | MidHookEarlyFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardMidHookReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    midHookAtSec: number | null;
    midHookByRatio: number;
  };
  findings: HookHardMidHookFinding[];
  thresholds: Required<HookHardMidHookOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardMidHook(
  shotSpecRaw: unknown,
  opts: HookHardMidHookOptions = {},
): HookHardMidHookReport {
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
  const midOpts: MidHookEarlyOptions = {
    hookWindowSec: opts.hookWindowSec,
    maxFirstShotSec: opts.maxFirstShotSec,
    midWindow: opts.midWindow,
    tailToleranceSec: opts.tailToleranceSec,
    maxSetupRatio: opts.maxSetupRatio,
    requireAllTagged: opts.requireAllTagged,
    requireHookKind: opts.requireHookKind,
    midHookByRatio: opts.midHookByRatio,
  };
  const mid = evaluateMidHookEarly(shotSpecRaw, midOpts);

  const findings: HookHardMidHookFinding[] = [...(mix.findings as HookHardMidHookFinding[])];
  for (const f of mid.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'MID_HOOK_MISSING' ||
      f.code === 'MID_HOOK_LATE' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardMidHookFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
    midHookByRatio: mid.thresholds.midHookByRatio,
  } as Required<HookHardMidHookOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mix.metrics,
      midHookAtSec: mid.metrics.midHookAtSec,
      midHookByRatio: mid.metrics.midHookByRatio,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
