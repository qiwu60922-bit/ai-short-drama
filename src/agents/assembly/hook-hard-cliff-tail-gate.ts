/**
 * V12 · Hook-Kind Mix Hard × Cliff-Tail Tight Dual Gate (钩种多样 + 紧尾悬念 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩种不宜单一，且结尾悬念尾窗须紧.
 *  - 与 cliffTailHookHard（cliffTail 主键）互补：本 gate 以 hookKindMix 为主键.
 * Embeds evaluateHookKindMix + evaluateCliffTailTight; merges FAIL findings.
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
  evaluateCliffTailTight,
  type CliffTailTightFinding,
  type CliffTailTightOptions,
} from './cliff-tail-tight-gate';

export interface HookHardCliffTailOptions extends HookKindMixOptions {
  hardTailToleranceSec?: number;
}

export type HookHardCliffTailFinding = {
  code: HookKindMixFinding['code'] | CliffTailTightFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardCliffTailReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    hardTailToleranceSec: number;
  };
  findings: HookHardCliffTailFinding[];
  thresholds: Required<HookHardCliffTailOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardCliffTail(
  shotSpecRaw: unknown,
  opts: HookHardCliffTailOptions = {},
): HookHardCliffTailReport {
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
  const tightOpts: CliffTailTightOptions = {};
  if (opts.hardTailToleranceSec !== undefined) tightOpts.hardTailToleranceSec = opts.hardTailToleranceSec;
  if (opts.hookWindowSec !== undefined) tightOpts.hookWindowSec = opts.hookWindowSec;
  if (opts.maxFirstShotSec !== undefined) tightOpts.maxFirstShotSec = opts.maxFirstShotSec;
  if (opts.midWindow !== undefined) tightOpts.midWindow = opts.midWindow;
  if (opts.tailToleranceSec !== undefined) tightOpts.tailToleranceSec = opts.tailToleranceSec;
  if (opts.maxSetupRatio !== undefined) tightOpts.maxSetupRatio = opts.maxSetupRatio;
  if (opts.requireAllTagged !== undefined) tightOpts.requireAllTagged = opts.requireAllTagged;
  if (opts.requireHookKind !== undefined) tightOpts.requireHookKind = opts.requireHookKind;
  const tight = evaluateCliffTailTight(shotSpecRaw, tightOpts);

  const findings: HookHardCliffTailFinding[] = [...(mix.findings as HookHardCliffTailFinding[])];
  for (const f of tight.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'CLIFF_TAIL_TIGHT' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardCliffTailFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
    hardTailToleranceSec: tight.thresholds.hardTailToleranceSec,
  } as Required<HookHardCliffTailOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mix.metrics,
      hardTailToleranceSec: tight.metrics.hardTailToleranceSec,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
