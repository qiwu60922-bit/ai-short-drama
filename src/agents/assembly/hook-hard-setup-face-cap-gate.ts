/**
 * V12 · Hook-Kind Mix Hard × Setup Mid Cap × Face Cap Dual Gate
 * (钩种多样 + 中段铺垫占比 + 脸钩占比封顶 双闸), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩种不宜单一，中段 setup 不可吃掉大半，且脸钩占比硬封顶（SetupFaceCap）.
 * Embeds evaluateHookKindMix + evaluateSetupMidCap; merges FAIL findings.
 * Default maxFaceRatio=0.5.
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
  evaluateSetupMidCap,
  type SetupMidCapFinding,
  type SetupMidCapOptions,
} from './setup-mid-cap-gate';

export interface HookHardSetupFaceCapOptions extends HookKindMixOptions {
  maxMidSetupRatio?: number;
}

export type HookHardSetupFaceCapFinding = {
  code: HookKindMixFinding['code'] | SetupMidCapFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardSetupFaceCapReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    midSeconds: number;
    midSetupSeconds: number;
    midSetupRatio: number;
    maxMidSetupRatio: number;
  };
  findings: HookHardSetupFaceCapFinding[];
  thresholds: Required<HookHardSetupFaceCapOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardSetupFaceCap(
  shotSpecRaw: unknown,
  opts: HookHardSetupFaceCapOptions = {},
): HookHardSetupFaceCapReport {
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
  const capOpts: SetupMidCapOptions = {
    maxMidSetupRatio: opts.maxMidSetupRatio,
    midWindow: opts.midWindow,
    hookWindowSec: opts.hookWindowSec,
    maxFirstShotSec: opts.maxFirstShotSec,
    tailToleranceSec: opts.tailToleranceSec,
    maxSetupRatio: opts.maxSetupRatio,
    requireAllTagged: opts.requireAllTagged,
    requireHookKind: opts.requireHookKind,
  };
  const cap = evaluateSetupMidCap(shotSpecRaw, capOpts);

  const findings: HookHardSetupFaceCapFinding[] = [...(mix.findings as HookHardSetupFaceCapFinding[])];
  for (const f of cap.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'SETUP_MID_CAP' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardSetupFaceCapFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
    maxMidSetupRatio: cap.thresholds.maxMidSetupRatio,
  } as Required<HookHardSetupFaceCapOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mix.metrics,
      midSeconds: cap.metrics.midSeconds,
      midSetupSeconds: cap.metrics.midSetupSeconds,
      midSetupRatio: cap.metrics.midSetupRatio,
      maxMidSetupRatio: cap.metrics.maxMidSetupRatio,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
