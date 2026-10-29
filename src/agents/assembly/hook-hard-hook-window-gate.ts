/**
 * V12 · Hook-Kind Mix Hard × Hook-Window Hard Dual Gate (钩种多样 + 硬钩窗 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩种不宜单一，且配合对应结构闸.
 *  - 与 hookWindowHookHard（对侧主键）互补：本 gate 以 hookKindMix 为主键.
 * Embeds child evaluators; merges FAIL findings.
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

export interface HookHardHookWindowOptions extends HookKindMixOptions {
  hardHookWindowSec?: number;
}

export type HookHardHookWindowFinding = {
  code: HookKindMixFinding['code'] | HookWindowHardFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardHookWindowReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & { hardHookWindowSec: number };
  findings: HookHardHookWindowFinding[];
  thresholds: Required<HookHardHookWindowOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardHookWindow(
  shotSpecRaw: unknown,
  opts: HookHardHookWindowOptions = {},
): HookHardHookWindowReport {
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
  const hardHookWindowSec = opts.hardHookWindowSec ?? opts.hookWindowSec ?? 2;
  const hard = evaluateHookWindowHard(shotSpecRaw, {
    ...opts,
    hardHookWindowSec,
    hookWindowSec: hardHookWindowSec,
  });

  const findings: HookHardHookWindowFinding[] = [...(mix.findings as HookHardHookWindowFinding[])];
  for (const f of hard.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'HOOK_WINDOW_HARD' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardHookWindowFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
    hardHookWindowSec: hard.thresholds.hardHookWindowSec,
  } as Required<HookHardHookWindowOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mix.metrics,
      hardHookWindowSec: hard.metrics.hardHookWindowSec,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
