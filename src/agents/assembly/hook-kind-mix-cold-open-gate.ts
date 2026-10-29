/**
 * V12 · Hook-Kind Mix × Cold-Open Gate (钩种多样 + 冷开双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《盛夏芬德拉》detail_cu + 《万妖图录》situation — 冷开同时须钩种不单调.
 * Embeds evaluateColdOpenHook + evaluateHookKindMix; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  HOOK_KIND_MONOTONE / COLD_OPEN_LATE / SETUP_BEFORE_HOOK (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateColdOpenHook,
  type ColdOpenHookFinding,
  type ColdOpenHookOptions,
  type ColdOpenHookReport,
} from './cold-open-hook-gate';
import {
  evaluateHookKindMix,
  type HookKindMixFinding,
  type HookKindMixOptions,
} from './hook-kind-mix-gate';

export interface HookKindMixColdOpenOptions extends ColdOpenHookOptions {
  minDistinctKinds?: number;
  maxFaceRatio?: number;
  earlyHooksOnly?: boolean;
}

export type HookKindMixColdOpenFinding = {
  code: ColdOpenHookFinding['code'] | HookKindMixFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookKindMixColdOpenReport {
  verdict: 'PASS' | 'FAIL';
  metrics: ColdOpenHookReport['metrics'] & {
    distinctKinds: number;
    faceHookCount: number;
    hookKindCount: number;
  };
  findings: HookKindMixColdOpenFinding[];
  thresholds: Required<HookKindMixColdOpenOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookKindMixColdOpen(
  shotSpecRaw: unknown,
  opts: HookKindMixColdOpenOptions = {},
): HookKindMixColdOpenReport {
  const minDistinctKinds = opts.minDistinctKinds ?? 2;
  const maxFaceRatio = opts.maxFaceRatio ?? 0.6;
  const earlyHooksOnly = opts.earlyHooksOnly ?? true;

  const cold = evaluateColdOpenHook(shotSpecRaw, opts);
  const mixOpts: HookKindMixOptions = {
    minDistinctKinds,
    maxFaceRatio,
    earlyHooksOnly,
    requireHookKind: opts.requireHookKind ?? true,
    hookWindowSec: opts.hookWindowSec ?? cold.thresholds.hookWindowSec,
  };
  if (opts.maxFirstShotSec !== undefined) mixOpts.maxFirstShotSec = opts.maxFirstShotSec;
  if (opts.midWindow !== undefined) mixOpts.midWindow = opts.midWindow;
  if (opts.tailToleranceSec !== undefined) mixOpts.tailToleranceSec = opts.tailToleranceSec;
  if (opts.maxSetupRatio !== undefined) mixOpts.maxSetupRatio = opts.maxSetupRatio;
  if (opts.requireAllTagged !== undefined) mixOpts.requireAllTagged = opts.requireAllTagged;

  const mix = evaluateHookKindMix(shotSpecRaw, mixOpts);

  const findings: HookKindMixColdOpenFinding[] = [
    ...(cold.findings as HookKindMixColdOpenFinding[]),
  ];
  for (const f of mix.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'HOOK_KIND_MONOTONE' ||
      f.code === 'HOOK_KIND_FACE_HEAVY' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookKindMixColdOpenFinding);
    }
  }

  const thresholds: Required<HookKindMixColdOpenOptions> = {
    ...cold.thresholds,
    minDistinctKinds,
    maxFaceRatio,
    earlyHooksOnly,
  };

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...cold.metrics,
      distinctKinds: mix.metrics.distinctKinds,
      faceHookCount: mix.metrics.faceHookCount,
      hookKindCount: mix.metrics.hookKindCount,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
