/**
 * V12 · Mid-Hook Early × Hook-Kind Mix Hard Gate (中段早钩 + 钩种多样 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 中段尽快再抛钩，且开场钩种不宜单一.
 * Embeds evaluateMidHookEarly + evaluateHookKindMix; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateMidHookEarly,
  type MidHookEarlyFinding,
  type MidHookEarlyOptions,
  type MidHookEarlyReport,
} from './mid-hook-early-gate';
import {
  evaluateHookKindMix,
  type HookKindMixFinding,
  type HookKindMixOptions,
} from './hook-kind-mix-gate';

export interface MidHookHookHardOptions extends MidHookEarlyOptions {
  minDistinctKinds?: number;
  maxFaceRatio?: number;
  earlyHooksOnly?: boolean;
}

export type MidHookHookHardFinding = {
  code: MidHookEarlyFinding['code'] | HookKindMixFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface MidHookHookHardReport {
  verdict: 'PASS' | 'FAIL';
  metrics: MidHookEarlyReport['metrics'] & {
    distinctKinds: number;
    faceHookCount: number;
  };
  findings: MidHookHookHardFinding[];
  thresholds: Required<MidHookHookHardOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateMidHookHookHard(
  shotSpecRaw: unknown,
  opts: MidHookHookHardOptions = {},
): MidHookHookHardReport {
  const mid = evaluateMidHookEarly(shotSpecRaw, opts);
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

  const findings: MidHookHookHardFinding[] = [...(mid.findings as MidHookHookHardFinding[])];
  for (const f of mix.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'HOOK_KIND_MONOTONE' ||
      f.code === 'HOOK_KIND_FACE_HEAVY' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as MidHookHookHardFinding);
    }
  }

  const thresholds = {
    ...mid.thresholds,
    minDistinctKinds: mix.thresholds.minDistinctKinds,
    maxFaceRatio: mix.thresholds.maxFaceRatio,
    earlyHooksOnly: mix.thresholds.earlyHooksOnly,
  } as Required<MidHookHookHardOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mid.metrics,
      distinctKinds: mix.metrics.distinctKinds,
      faceHookCount: mix.metrics.faceHookCount,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
