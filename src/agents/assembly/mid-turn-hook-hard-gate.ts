/**
 * V12 · Mid-Turn Density × Hook-Kind Mix Hard Gate (中段密度 + 钩种多样 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《万妖图录》/密爽向: 中段须有足够反转/增量，且开场钩种不宜单一.
 * Embeds evaluateMidTurnDensity + evaluateHookKindMix; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  MID_TURN_SPARSE / HOOK_KIND_MONOTONE (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateMidTurnDensity,
  type MidTurnDensityFinding,
  type MidTurnDensityOptions,
  type MidTurnDensityReport,
} from './mid-turn-density-gate';
import {
  evaluateHookKindMix,
  type HookKindMixFinding,
  type HookKindMixOptions,
} from './hook-kind-mix-gate';

export interface MidTurnHookHardOptions extends MidTurnDensityOptions {
  minDistinctKinds?: number;
  maxFaceRatio?: number;
  earlyHooksOnly?: boolean;
}

export type MidTurnHookHardFinding = {
  code: MidTurnDensityFinding['code'] | HookKindMixFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface MidTurnHookHardReport {
  verdict: 'PASS' | 'FAIL';
  metrics: MidTurnDensityReport['metrics'] & {
    distinctKinds: number;
    faceHookCount: number;
  };
  findings: MidTurnHookHardFinding[];
  thresholds: Required<MidTurnHookHardOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateMidTurnHookHard(
  shotSpecRaw: unknown,
  opts: MidTurnHookHardOptions = {},
): MidTurnHookHardReport {
  const mid = evaluateMidTurnDensity(shotSpecRaw, opts);
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

  const findings: MidTurnHookHardFinding[] = [...(mid.findings as MidTurnHookHardFinding[])];
  for (const f of mix.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'HOOK_KIND_MONOTONE' ||
      f.code === 'HOOK_KIND_FACE_HEAVY' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as MidTurnHookHardFinding);
    }
  }

  const thresholds = {
    ...mid.thresholds,
    minDistinctKinds: mix.thresholds.minDistinctKinds,
    maxFaceRatio: mix.thresholds.maxFaceRatio,
    earlyHooksOnly: mix.thresholds.earlyHooksOnly,
  } as Required<MidTurnHookHardOptions>;

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
