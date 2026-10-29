/**
 * V12 · Hook-Kind Mix Hard × Cold-Open × Face Cap Dual Gate
 * (钩种多样 + 冷开快入 + 脸钩占比封顶 双闸), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩种不宜单一，须冷开快入，且脸钩占比硬封顶（ColdFaceCap）.
 *  - 与 hookHardColdCap 互补：本 gate 以 ColdFaceCap 命名强调冷开+脸钩.
 * Embeds evaluateHookKindMix + evaluateColdOpenHook; merges FAIL findings.
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
  evaluateColdOpenHook,
  type ColdOpenHookFinding,
  type ColdOpenHookOptions,
} from './cold-open-hook-gate';

export interface HookHardColdFaceCapOptions extends HookKindMixOptions {
  coldOpenWindowSec?: number;
}

export type HookHardColdFaceCapFinding = {
  code: HookKindMixFinding['code'] | ColdOpenHookFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardColdFaceCapReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    coldOpenWindowSec: number;
    firstShotRole: string | null;
  };
  findings: HookHardColdFaceCapFinding[];
  thresholds: Required<HookHardColdFaceCapOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardColdFaceCap(
  shotSpecRaw: unknown,
  opts: HookHardColdFaceCapOptions = {},
): HookHardColdFaceCapReport {
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

  const findings: HookHardColdFaceCapFinding[] = [...(mix.findings as HookHardColdFaceCapFinding[])];
  for (const f of cold.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'COLD_OPEN_LATE' ||
      f.code === 'FIRST_NOT_HOOK' ||
      f.code === 'SETUP_BEFORE_HOOK' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardColdFaceCapFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
    coldOpenWindowSec: cold.thresholds.coldOpenWindowSec,
  } as Required<HookHardColdFaceCapOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mix.metrics,
      coldOpenWindowSec: cold.metrics.coldOpenWindowSec,
      firstShotRole: cold.metrics.firstShotRole,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
