/**
 * V12 · Hook-Kind Mix Hard × Setup Mid Cap × Cold-Open Cap Dual Gate
 * (钩种多样 + 中段铺垫占比 + 冷开快入 双闸), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩种不宜单一，中段 setup 不可吃掉大半，且须冷开快入（SetupColdCap）.
 * Embeds evaluateHookKindMix + evaluateSetupMidCap + evaluateColdOpenHook; merges FAIL findings.
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
import {
  evaluateColdOpenHook,
  type ColdOpenHookFinding,
  type ColdOpenHookOptions,
} from './cold-open-hook-gate';

export interface HookHardSetupColdCapOptions extends HookKindMixOptions {
  maxMidSetupRatio?: number;
  coldOpenWindowSec?: number;
}

export type HookHardSetupColdCapFinding = {
  code: HookKindMixFinding['code'] | SetupMidCapFinding['code'] | ColdOpenHookFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardSetupColdCapReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    midSeconds: number;
    midSetupSeconds: number;
    midSetupRatio: number;
    maxMidSetupRatio: number;
    coldOpenWindowSec: number;
    firstShotRole: string | null;
  };
  findings: HookHardSetupColdCapFinding[];
  thresholds: Required<HookHardSetupColdCapOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardSetupColdCap(
  shotSpecRaw: unknown,
  opts: HookHardSetupColdCapOptions = {},
): HookHardSetupColdCapReport {
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
  const coldOpts: ColdOpenHookOptions = {
    hookWindowSec: opts.hookWindowSec,
    maxFirstShotSec: opts.maxFirstShotSec,
    midWindow: opts.midWindow,
    tailToleranceSec: opts.tailToleranceSec,
    maxSetupRatio: opts.maxSetupRatio,
    requireAllTagged: opts.requireAllTagged,
    requireHookKind: opts.requireHookKind,
    coldOpenWindowSec: opts.coldOpenWindowSec,
  };
  const cold = evaluateColdOpenHook(shotSpecRaw, coldOpts);

  const findings: HookHardSetupColdCapFinding[] = [...(mix.findings as HookHardSetupColdCapFinding[])];
  for (const f of [...child.findings, ...cold.findings]) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'SETUP_MID_CAP' ||
      f.code === 'COLD_OPEN_MISS' ||
      f.code === 'FIRST_TOO_LONG' ||
      f.code === 'SETUP_AFTER_CLIFF' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardSetupColdCapFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
    maxMidSetupRatio: child.thresholds.maxMidSetupRatio,
    coldOpenWindowSec: cold.thresholds.coldOpenWindowSec,
  } as Required<HookHardSetupColdCapOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mix.metrics,
      midSeconds: child.metrics.midSeconds,
      midSetupSeconds: child.metrics.midSetupSeconds,
      midSetupRatio: child.metrics.midSetupRatio,
      maxMidSetupRatio: child.metrics.maxMidSetupRatio,
      coldOpenWindowSec: cold.metrics.coldOpenWindowSec,
      firstShotRole: cold.metrics.firstShotRole,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
