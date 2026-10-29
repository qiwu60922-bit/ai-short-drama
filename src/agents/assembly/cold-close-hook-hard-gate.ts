/**
 * V12 · Tail Cold-Close × Hook-Kind Mix Hard Gate (冷收尾 + 钩种多样 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 尾窗冷收在最大悬念处，且开场钩种不宜单一.
 * Embeds evaluateTailColdClose + evaluateHookKindMix; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateTailColdClose,
  type TailColdCloseFinding,
  type TailColdCloseOptions,
  type TailColdCloseReport,
} from './tail-cold-close-gate';
import {
  evaluateHookKindMix,
  type HookKindMixFinding,
  type HookKindMixOptions,
} from './hook-kind-mix-gate';

export interface ColdCloseHookHardOptions extends TailColdCloseOptions {
  minDistinctKinds?: number;
  maxFaceRatio?: number;
  earlyHooksOnly?: boolean;
}

export type ColdCloseHookHardFinding = {
  code: TailColdCloseFinding['code'] | HookKindMixFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface ColdCloseHookHardReport {
  verdict: 'PASS' | 'FAIL';
  metrics: TailColdCloseReport['metrics'] & {
    distinctKinds: number;
    faceHookCount: number;
  };
  findings: ColdCloseHookHardFinding[];
  thresholds: Required<ColdCloseHookHardOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateColdCloseHookHard(
  shotSpecRaw: unknown,
  opts: ColdCloseHookHardOptions = {},
): ColdCloseHookHardReport {
  const cold = evaluateTailColdClose(shotSpecRaw, opts);
  const mixOpts: HookKindMixOptions = {
    hookWindowSec: opts.hookWindowSec,
    maxFirstShotSec: opts.maxFirstShotSec,
    midWindow: opts.midWindow,
    tailToleranceSec: opts.tailToleranceSec ?? cold.thresholds.tailToleranceSec,
    maxSetupRatio: opts.maxSetupRatio,
    requireAllTagged: opts.requireAllTagged,
    requireHookKind: opts.requireHookKind ?? true,
    minDistinctKinds: opts.minDistinctKinds,
    maxFaceRatio: opts.maxFaceRatio,
    earlyHooksOnly: opts.earlyHooksOnly,
  };
  const mix = evaluateHookKindMix(shotSpecRaw, mixOpts);

  const findings: ColdCloseHookHardFinding[] = [...(cold.findings as ColdCloseHookHardFinding[])];
  for (const f of mix.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'HOOK_KIND_MONOTONE' ||
      f.code === 'HOOK_KIND_FACE_HEAVY' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as ColdCloseHookHardFinding);
    }
  }

  const thresholds = {
    ...cold.thresholds,
    minDistinctKinds: mix.thresholds.minDistinctKinds,
    maxFaceRatio: mix.thresholds.maxFaceRatio,
    earlyHooksOnly: mix.thresholds.earlyHooksOnly,
  } as Required<ColdCloseHookHardOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...cold.metrics,
      distinctKinds: mix.metrics.distinctKinds,
      faceHookCount: mix.metrics.faceHookCount,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
