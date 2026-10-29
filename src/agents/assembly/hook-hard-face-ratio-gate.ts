/**
 * V12 · Hook-Kind Mix Hard × Face/Setup Ratio Dual Gate
 * (钩种多样 + 脸钩/铺垫占比 双闸), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩种不宜单一，脸钩占比与 setup 占比须硬封顶（FaceRatio）.
 * Embeds evaluateHookKindMix + evaluateSetupRatioHard; merges FAIL findings.
 * Default maxFaceRatio=0.5 (stricter than mix default 0.6).
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

export interface HookHardFaceRatioOptions extends HookKindMixOptions {
  hardMaxSetupRatio?: number;
}

export type HookHardFaceRatioFinding = {
  code: HookKindMixFinding['code'] | SetupRatioHardFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardFaceRatioReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    setupSeconds: number;
    setupRatio: number;
    hardMaxSetupRatio: number;
  };
  findings: HookHardFaceRatioFinding[];
  thresholds: Required<HookHardFaceRatioOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardFaceRatio(
  shotSpecRaw: unknown,
  opts: HookHardFaceRatioOptions = {},
): HookHardFaceRatioReport {
  const mixOpts: HookKindMixOptions = {
    hookWindowSec: opts.hookWindowSec,
    maxFirstShotSec: opts.maxFirstShotSec,
    midWindow: opts.midWindow,
    tailToleranceSec: opts.tailToleranceSec,
    maxSetupRatio: opts.maxSetupRatio,
    requireAllTagged: opts.requireAllTagged,
    requireHookKind: opts.requireHookKind ?? true,
    minDistinctKinds: opts.minDistinctKinds,
    maxFaceRatio: opts.maxFaceRatio ?? 0.5,
    earlyHooksOnly: opts.earlyHooksOnly,
  };
  const mix = evaluateHookKindMix(shotSpecRaw, mixOpts);
  const ratioOpts: SetupRatioHardOptions = {
    hardMaxSetupRatio: opts.hardMaxSetupRatio,
    hookWindowSec: opts.hookWindowSec,
    maxFirstShotSec: opts.maxFirstShotSec,
    midWindow: opts.midWindow,
    tailToleranceSec: opts.tailToleranceSec,
    maxSetupRatio: opts.maxSetupRatio,
    requireAllTagged: opts.requireAllTagged,
    requireHookKind: opts.requireHookKind,
  };
  const ratio = evaluateSetupRatioHard(shotSpecRaw, ratioOpts);

  const findings: HookHardFaceRatioFinding[] = [...(mix.findings as HookHardFaceRatioFinding[])];
  for (const f of ratio.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'SETUP_RATIO_HARD' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardFaceRatioFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
    hardMaxSetupRatio: ratio.thresholds.hardMaxSetupRatio,
  } as Required<HookHardFaceRatioOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mix.metrics,
      setupSeconds: ratio.metrics.setupSeconds,
      setupRatio: ratio.metrics.setupRatio,
      hardMaxSetupRatio: ratio.metrics.hardMaxSetupRatio,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
