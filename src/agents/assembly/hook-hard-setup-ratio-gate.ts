/**
 * V12 · Hook-Kind Mix Hard × Setup-Ratio Hard Dual Gate (钩种多样 + 铺垫占比硬闸 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩种不宜单一，且全片 setup 占比须硬封顶.
 * Embeds evaluateHookKindMix + evaluateSetupRatioHard; merges FAIL findings.
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
  evaluateSetupRatioHard,
  type SetupRatioHardFinding,
  type SetupRatioHardOptions,
} from './setup-ratio-hard-gate';

export interface HookHardSetupRatioOptions extends HookKindMixOptions {
  hardMaxSetupRatio?: number;
}

export type HookHardSetupRatioFinding = {
  code: HookKindMixFinding['code'] | SetupRatioHardFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardSetupRatioReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    setupSeconds: number;
    setupRatio: number;
    hardMaxSetupRatio: number;
  };
  findings: HookHardSetupRatioFinding[];
  thresholds: Required<HookHardSetupRatioOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardSetupRatio(
  shotSpecRaw: unknown,
  opts: HookHardSetupRatioOptions = {},
): HookHardSetupRatioReport {
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
  const hardOpts: SetupRatioHardOptions = {
    hardMaxSetupRatio: opts.hardMaxSetupRatio,
    maxSetupRatio: opts.hardMaxSetupRatio ?? opts.maxSetupRatio,
    hookWindowSec: opts.hookWindowSec,
    maxFirstShotSec: opts.maxFirstShotSec,
    midWindow: opts.midWindow,
    tailToleranceSec: opts.tailToleranceSec,
    requireAllTagged: opts.requireAllTagged,
    requireHookKind: opts.requireHookKind,
  };
  const hard = evaluateSetupRatioHard(shotSpecRaw, hardOpts);

  const findings: HookHardSetupRatioFinding[] = [...(mix.findings as HookHardSetupRatioFinding[])];
  for (const f of hard.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'SETUP_RATIO_HARD' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardSetupRatioFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
    hardMaxSetupRatio: hard.thresholds.hardMaxSetupRatio,
  } as Required<HookHardSetupRatioOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mix.metrics,
      setupSeconds: hard.metrics.setupSeconds,
      setupRatio: hard.metrics.setupRatio,
      hardMaxSetupRatio: hard.metrics.hardMaxSetupRatio,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
