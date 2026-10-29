/**
 * V12 · Hook-Window Hard × Hook-Kind Mix Dual Gate (硬钩窗 + 钩种多样 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩窗要紧，且钩种不宜单一.
 * Embeds evaluateHookWindowHard + evaluateHookKindMix; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  HOOK_WINDOW_HARD / HOOK_KIND_MONOTONE (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateHookWindowHard,
  type HookWindowHardFinding,
  type HookWindowHardOptions,
  type HookWindowHardReport,
} from './hook-window-hard-gate';
import {
  evaluateHookKindMix,
  type HookKindMixFinding,
  type HookKindMixOptions,
} from './hook-kind-mix-gate';

export interface HookWindowHookHardOptions extends HookWindowHardOptions {
  minDistinctKinds?: number;
  maxFaceRatio?: number;
  earlyHooksOnly?: boolean;
}

export type HookWindowHookHardFinding = {
  code: HookWindowHardFinding['code'] | HookKindMixFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookWindowHookHardReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookWindowHardReport['metrics'] & {
    distinctKinds: number;
    faceHookCount: number;
  };
  findings: HookWindowHookHardFinding[];
  thresholds: Required<HookWindowHookHardOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookWindowHookHard(
  shotSpecRaw: unknown,
  opts: HookWindowHookHardOptions = {},
): HookWindowHookHardReport {
  const hardHookWindowSec = opts.hardHookWindowSec ?? opts.hookWindowSec ?? 2;
  const hardOpts: HookWindowHardOptions = {
    ...opts,
    hardHookWindowSec,
    hookWindowSec: hardHookWindowSec,
  };
  const hard = evaluateHookWindowHard(shotSpecRaw, hardOpts);
  const mixOpts: HookKindMixOptions = {
    hookWindowSec: hardHookWindowSec,
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

  const findings: HookWindowHookHardFinding[] = [...(hard.findings as HookWindowHookHardFinding[])];
  for (const f of mix.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'HOOK_KIND_MONOTONE' ||
      f.code === 'HOOK_KIND_FACE_HEAVY' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookWindowHookHardFinding);
    }
  }

  const thresholds = {
    ...hard.thresholds,
    minDistinctKinds: mix.thresholds.minDistinctKinds,
    maxFaceRatio: mix.thresholds.maxFaceRatio,
    earlyHooksOnly: mix.thresholds.earlyHooksOnly,
  } as Required<HookWindowHookHardOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...hard.metrics,
      distinctKinds: mix.metrics.distinctKinds,
      faceHookCount: mix.metrics.faceHookCount,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
