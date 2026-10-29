/**
 * V12 · Hook-Kind Mix Hard × 钩种多样 + 中段铺垫封顶 Dual Gate,
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩种不宜单一，且须过 setupMidCap 门.
 * Embeds evaluateHookKindMix + evaluateSetupMidCap; merges FAIL findings.
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

export interface HookHardMidCapOptions extends HookKindMixOptions {
  maxMidSetupRatio?: number;
}

export type HookHardMidCapFinding = {
  code: HookKindMixFinding['code'] | SetupMidCapFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardMidCapReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    midSeconds: number;
    midSetupSeconds: number;
    midSetupRatio: number;
    maxMidSetupRatio: number;
  };
  findings: HookHardMidCapFinding[];
  thresholds: Required<HookHardMidCapOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardMidCap(
  shotSpecRaw: unknown,
  opts: HookHardMidCapOptions = {},
): HookHardMidCapReport {
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
  const midOpts: SetupMidCapOptions = {
    maxMidSetupRatio: opts.maxMidSetupRatio,
    hookWindowSec: opts.hookWindowSec,
    maxFirstShotSec: opts.maxFirstShotSec,
    midWindow: opts.midWindow,
    tailToleranceSec: opts.tailToleranceSec,
    maxSetupRatio: opts.maxSetupRatio,
    requireAllTagged: opts.requireAllTagged,
    requireHookKind: opts.requireHookKind,
  };
  const child = evaluateSetupMidCap(shotSpecRaw, midOpts);

  const findings: HookHardMidCapFinding[] = [...(mix.findings as HookHardMidCapFinding[])];
  for (const f of child.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'SETUP_MID_CAP' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardMidCapFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
    maxMidSetupRatio: child.thresholds.maxMidSetupRatio,
  } as Required<HookHardMidCapOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mix.metrics,
      midSeconds: child.metrics.midSeconds,
      midSetupSeconds: child.metrics.midSetupSeconds,
      midSetupRatio: child.metrics.midSetupRatio,
      maxMidSetupRatio: child.metrics.maxMidSetupRatio,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
