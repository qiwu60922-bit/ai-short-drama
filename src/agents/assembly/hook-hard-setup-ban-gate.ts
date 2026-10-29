/**
 * V12 · Hook-Kind Mix Hard × Setup-After-Hook Ban Dual Gate (钩种多样 + 钩后禁铺垫 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩种不宜单一，且第一钩后不得回 setup 温吞.
 * Embeds evaluateHookKindMix + evaluateSetupAfterHookBan; merges FAIL findings.
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
  evaluateSetupAfterHookBan,
  type SetupAfterHookBanFinding,
  type SetupAfterHookBanOptions,
} from './setup-after-hook-ban-gate';

export type HookHardSetupBanOptions = HookKindMixOptions;

export type HookHardSetupBanFinding = {
  code: HookKindMixFinding['code'] | SetupAfterHookBanFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardSetupBanReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    setupAfterHookShots: number;
  };
  findings: HookHardSetupBanFinding[];
  thresholds: Required<HookHardSetupBanOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardSetupBan(
  shotSpecRaw: unknown,
  opts: HookHardSetupBanOptions = {},
): HookHardSetupBanReport {
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
  const banOpts: SetupAfterHookBanOptions = {};
  if (opts.hookWindowSec !== undefined) banOpts.hookWindowSec = opts.hookWindowSec;
  if (opts.maxFirstShotSec !== undefined) banOpts.maxFirstShotSec = opts.maxFirstShotSec;
  if (opts.midWindow !== undefined) banOpts.midWindow = opts.midWindow;
  if (opts.tailToleranceSec !== undefined) banOpts.tailToleranceSec = opts.tailToleranceSec;
  if (opts.maxSetupRatio !== undefined) banOpts.maxSetupRatio = opts.maxSetupRatio;
  if (opts.requireAllTagged !== undefined) banOpts.requireAllTagged = opts.requireAllTagged;
  if (opts.requireHookKind !== undefined) banOpts.requireHookKind = opts.requireHookKind;
  const ban = evaluateSetupAfterHookBan(shotSpecRaw, banOpts);

  const findings: HookHardSetupBanFinding[] = [...(mix.findings as HookHardSetupBanFinding[])];
  for (const f of ban.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'SETUP_AFTER_HOOK' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardSetupBanFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
  } as Required<HookHardSetupBanOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mix.metrics,
      setupAfterHookShots: ban.metrics.setupAfterHookShots,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
