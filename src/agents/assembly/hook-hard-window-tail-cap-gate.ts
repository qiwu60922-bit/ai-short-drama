/**
 * V12 · Hook-Kind Mix Hard × Hook-Window Cap × Tail Cap Dual Gate
 * (钩种多样 + 钩窗硬封顶 + 尾窗冷收封顶 双闸), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩种不宜单一，钩窗须更快抛冲突，且尾窗冷收在最大悬念处（WindowTailCap）.
 * Embeds evaluateHookKindMix + evaluateHookWindowHard + evaluateTailColdClose; merges FAIL findings.
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
import {
  evaluateTailColdClose,
  type TailColdCloseFinding,
  type TailColdCloseOptions,
} from './tail-cold-close-gate';

export interface HookHardWindowTailCapOptions extends HookKindMixOptions {
  hardHookWindowSec?: number;
  coldTailSec?: number;
}

export type HookHardWindowTailCapFinding = {
  code: HookKindMixFinding['code'] | HookWindowHardFinding['code'] | TailColdCloseFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardWindowTailCapReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    hardHookWindowSec: number;
    coldTailSec: number;
    lastShotRole: string | null;
  };
  findings: HookHardWindowTailCapFinding[];
  thresholds: Required<HookHardWindowTailCapOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardWindowTailCap(
  shotSpecRaw: unknown,
  opts: HookHardWindowTailCapOptions = {},
): HookHardWindowTailCapReport {
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

  const findings: HookHardWindowTailCapFinding[] = [...(mix.findings as HookHardWindowTailCapFinding[])];
  for (const f of [...win.findings, ...cold.findings]) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'HOOK_WINDOW_HARD' ||
      f.code === 'TAIL_NOT_COLD' ||
      f.code === 'SETUP_AFTER_CLIFF' ||
      f.code === 'TAIL_GAP_WIDE' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardWindowTailCapFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
    hardHookWindowSec: win.thresholds.hardHookWindowSec,
    coldTailSec: cold.thresholds.coldTailSec,
  } as Required<HookHardWindowTailCapOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mix.metrics,
      hardHookWindowSec: win.metrics.hardHookWindowSec,
      coldTailSec: cold.metrics.coldTailSec,
      lastShotRole: cold.metrics.lastShotRole,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
