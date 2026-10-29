/**
 * V12 · Hook-Kind Mix Hard × Tail Cap Dual Gate (钩种多样 + 脸钩占比封顶 + 尾窗冷收 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩种不宜单一，脸钩占比硬封顶，且尾窗冷收（FaceTailCap）.
 *  - 与 hookHardColdClose 互补：本 gate 以 FaceTailCap 命名强调脸钩+尾窗；仍以 hookKindMix 为主键.
 * Embeds evaluateHookKindMix + evaluateTailColdClose; merges FAIL findings.
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
  evaluateTailColdClose,
  type TailColdCloseFinding,
  type TailColdCloseOptions,
} from './tail-cold-close-gate';

export interface HookHardFaceTailCapOptions extends HookKindMixOptions {
  coldTailSec?: number;
}

export type HookHardFaceTailCapFinding = {
  code: HookKindMixFinding['code'] | TailColdCloseFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardFaceTailCapReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    coldTailSec: number;
    lastShotRole: string | null;
  };
  findings: HookHardFaceTailCapFinding[];
  thresholds: Required<HookHardFaceTailCapOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardFaceTailCap(
  shotSpecRaw: unknown,
  opts: HookHardFaceTailCapOptions = {},
): HookHardFaceTailCapReport {
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
  const coldOpts: TailColdCloseOptions = {
    hookWindowSec: opts.hookWindowSec,
    maxFirstShotSec: opts.maxFirstShotSec,
    midWindow: opts.midWindow,
    tailToleranceSec: opts.tailToleranceSec,
    maxSetupRatio: opts.maxSetupRatio,
    requireAllTagged: opts.requireAllTagged,
    requireHookKind: opts.requireHookKind,
    coldTailSec: opts.coldTailSec,
  };
  const cold = evaluateTailColdClose(shotSpecRaw, coldOpts);

  const findings: HookHardFaceTailCapFinding[] = [...(mix.findings as HookHardFaceTailCapFinding[])];
  for (const f of cold.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'TAIL_NOT_COLD' ||
      f.code === 'SETUP_AFTER_CLIFF' ||
      f.code === 'TAIL_GAP_WIDE' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardFaceTailCapFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
    coldTailSec: cold.thresholds.coldTailSec,
  } as Required<HookHardFaceTailCapOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mix.metrics,
      coldTailSec: cold.metrics.coldTailSec,
      lastShotRole: cold.metrics.lastShotRole,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
