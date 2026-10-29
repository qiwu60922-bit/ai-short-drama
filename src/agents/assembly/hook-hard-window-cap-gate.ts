/**
 * V12 · Hook-Kind Mix Hard × Hook-Window Cap Dual Gate
 * (钩种多样 + 钩窗硬封顶 双闸), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩种不宜单一，且钩窗须更快抛冲突（Window Cap）.
 * Embeds evaluateHookKindMix + evaluateHookWindowHard; merges FAIL findings.
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
  evaluateHookWindowHard,
  type HookWindowHardFinding,
  type HookWindowHardOptions,
} from './hook-window-hard-gate';

export interface HookHardWindowCapOptions extends HookKindMixOptions {
  hardHookWindowSec?: number;
}

export type HookHardWindowCapFinding = {
  code: HookKindMixFinding['code'] | HookWindowHardFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardWindowCapReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    hardHookWindowSec: number;
  };
  findings: HookHardWindowCapFinding[];
  thresholds: Required<HookHardWindowCapOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardWindowCap(
  shotSpecRaw: unknown,
  opts: HookHardWindowCapOptions = {},
): HookHardWindowCapReport {
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
  const winOpts: HookWindowHardOptions = {
    ...(opts.hardHookWindowSec !== undefined ? { hardHookWindowSec: opts.hardHookWindowSec } : {}),
    ...(opts.hookWindowSec !== undefined ? { hookWindowSec: opts.hookWindowSec } : {}),
    ...(opts.maxFirstShotSec !== undefined ? { maxFirstShotSec: opts.maxFirstShotSec } : {}),
    ...(opts.midWindow !== undefined ? { midWindow: opts.midWindow } : {}),
    ...(opts.tailToleranceSec !== undefined ? { tailToleranceSec: opts.tailToleranceSec } : {}),
    ...(opts.maxSetupRatio !== undefined ? { maxSetupRatio: opts.maxSetupRatio } : {}),
    ...(opts.requireAllTagged !== undefined ? { requireAllTagged: opts.requireAllTagged } : {}),
    ...(opts.requireHookKind !== undefined ? { requireHookKind: opts.requireHookKind } : {}),
  };
  const win = evaluateHookWindowHard(shotSpecRaw, winOpts);

  const findings: HookHardWindowCapFinding[] = [...(mix.findings as HookHardWindowCapFinding[])];
  for (const f of win.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'HOOK_WINDOW_HARD' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardWindowCapFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
    hardHookWindowSec: win.thresholds.hardHookWindowSec,
  } as Required<HookHardWindowCapOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mix.metrics,
      hardHookWindowSec: win.metrics.hardHookWindowSec,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
