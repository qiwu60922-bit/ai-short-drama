/**
 * V12 · Detail-Hook × Hook-Kind Mix Hard Gate (细节特写钩 + 钩种多样 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开钩须 detail_cu，且开场钩种不宜单一.
 * Embeds evaluateDetailHookKind + evaluateHookKindMix; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateDetailHookKind,
  type DetailHookKindFinding,
  type DetailHookKindOptions,
  type DetailHookKindReport,
} from './detail-hook-kind-gate';
import {
  evaluateHookKindMix,
  type HookKindMixFinding,
  type HookKindMixOptions,
} from './hook-kind-mix-gate';

export interface DetailHookHookHardOptions extends DetailHookKindOptions {
  minDistinctKinds?: number;
  maxFaceRatio?: number;
  earlyHooksOnly?: boolean;
}

export type DetailHookHookHardFinding = {
  code: DetailHookKindFinding['code'] | HookKindMixFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface DetailHookHookHardReport {
  verdict: 'PASS' | 'FAIL';
  metrics: DetailHookKindReport['metrics'] & {
    distinctKinds: number;
    faceHookCount: number;
  };
  findings: DetailHookHookHardFinding[];
  thresholds: Required<DetailHookHookHardOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateDetailHookHookHard(
  shotSpecRaw: unknown,
  opts: DetailHookHookHardOptions = {},
): DetailHookHookHardReport {
  const detail = evaluateDetailHookKind(shotSpecRaw, opts);
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

  const findings: DetailHookHookHardFinding[] = [...(detail.findings as DetailHookHookHardFinding[])];
  for (const f of mix.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'HOOK_KIND_MONOTONE' ||
      f.code === 'HOOK_KIND_FACE_HEAVY' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as DetailHookHookHardFinding);
    }
  }

  const thresholds = {
    ...detail.thresholds,
    minDistinctKinds: mix.thresholds.minDistinctKinds,
    maxFaceRatio: mix.thresholds.maxFaceRatio,
    earlyHooksOnly: mix.thresholds.earlyHooksOnly,
  } as Required<DetailHookHookHardOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...detail.metrics,
      distinctKinds: mix.metrics.distinctKinds,
      faceHookCount: mix.metrics.faceHookCount,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
