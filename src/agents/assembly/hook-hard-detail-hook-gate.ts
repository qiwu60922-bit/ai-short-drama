/**
 * V12 · Hook-Kind Mix Hard × Detail-Hook Dual Gate (钩种多样 + 细节特写钩 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩种不宜单一，且开钩须 detail_cu.
 *  - 与 detailHookHookHard（detailHook 主键）互补：本 gate 以 hookKindMix 为主键.
 * Embeds evaluateHookKindMix + evaluateDetailHookKind; merges FAIL findings.
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
  evaluateDetailHookKind,
  type DetailHookKindFinding,
  type DetailHookKindOptions,
} from './detail-hook-kind-gate';

export interface HookHardDetailHookOptions extends HookKindMixOptions {
  requireDetailCu?: boolean;
}

export type HookHardDetailHookFinding = {
  code: HookKindMixFinding['code'] | DetailHookKindFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardDetailHookReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    detailHookCount: number;
    firstDetailHookAtSec: number | null;
  };
  findings: HookHardDetailHookFinding[];
  thresholds: Required<HookHardDetailHookOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardDetailHook(
  shotSpecRaw: unknown,
  opts: HookHardDetailHookOptions = {},
): HookHardDetailHookReport {
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
  const detailOpts: DetailHookKindOptions = {
    hookWindowSec: opts.hookWindowSec,
    maxFirstShotSec: opts.maxFirstShotSec,
    midWindow: opts.midWindow,
    tailToleranceSec: opts.tailToleranceSec,
    maxSetupRatio: opts.maxSetupRatio,
    requireAllTagged: opts.requireAllTagged,
    requireHookKind: opts.requireHookKind,
    requireDetailCu: opts.requireDetailCu,
  };
  const detail = evaluateDetailHookKind(shotSpecRaw, detailOpts);

  const findings: HookHardDetailHookFinding[] = [...(mix.findings as HookHardDetailHookFinding[])];
  for (const f of detail.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'DETAIL_HOOK_MISSING' ||
      f.code === 'DETAIL_HOOK_LATE' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardDetailHookFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
    requireDetailCu: detail.thresholds.requireDetailCu,
  } as Required<HookHardDetailHookOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mix.metrics,
      detailHookCount: detail.metrics.detailHookCount,
      firstDetailHookAtSec: detail.metrics.firstDetailHookAtSec,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
