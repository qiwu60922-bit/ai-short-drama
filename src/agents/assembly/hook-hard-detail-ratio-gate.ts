/**
 * V12 · Hook-Kind Mix Hard × Dialogue-Setup Ban Dual Gate (钩种多样 + 钩后对白/禁铺垫细比重 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩种不宜单一，且钩后对白不得抢戏、不得回 setup.
 * Embeds evaluateHookKindMix + evaluateDialogueSetupBan; merges FAIL findings.
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
  evaluateDialogueSetupBan,
  type DialogueSetupBanFinding,
  type DialogueSetupBanOptions,
} from './dialogue-setup-ban-gate';

export type HookHardDetailRatioOptions = HookKindMixOptions;

export type HookHardDetailRatioFinding = {
  code: HookKindMixFinding['code'] | DialogueSetupBanFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookHardDetailRatioReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookKindMixReport['metrics'] & {
    setupAfterHookShots: number;
  };
  findings: HookHardDetailRatioFinding[];
  thresholds: Required<HookHardDetailRatioOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookHardDetailRatio(
  shotSpecRaw: unknown,
  opts: HookHardDetailRatioOptions = {},
): HookHardDetailRatioReport {
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
  const banOpts: DialogueSetupBanOptions = {};
  if (opts.hookWindowSec !== undefined) banOpts.hookWindowSec = opts.hookWindowSec;
  if (opts.maxFirstShotSec !== undefined) banOpts.maxFirstShotSec = opts.maxFirstShotSec;
  if (opts.midWindow !== undefined) banOpts.midWindow = opts.midWindow;
  if (opts.tailToleranceSec !== undefined) banOpts.tailToleranceSec = opts.tailToleranceSec;
  if (opts.maxSetupRatio !== undefined) banOpts.maxSetupRatio = opts.maxSetupRatio;
  if (opts.requireAllTagged !== undefined) banOpts.requireAllTagged = opts.requireAllTagged;
  if (opts.requireHookKind !== undefined) banOpts.requireHookKind = opts.requireHookKind;
  const ban = evaluateDialogueSetupBan(shotSpecRaw, banOpts);

  const findings: HookHardDetailRatioFinding[] = [...(mix.findings as HookHardDetailRatioFinding[])];
  for (const f of ban.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'DIALOGUE_BEFORE_HOOK' ||
      f.code === 'SETUP_AFTER_HOOK' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookHardDetailRatioFinding);
    }
  }

  const thresholds = {
    ...mix.thresholds,
  } as Required<HookHardDetailRatioOptions>;

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
