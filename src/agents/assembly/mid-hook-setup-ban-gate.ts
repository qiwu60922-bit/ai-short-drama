/**
 * V12 · Mid-Hook Early × Setup-After-Hook Ban Gate (中段再钩 + 钩后禁铺垫 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《万妖图录》/密爽向: 中段须尽快再抛钩，且第一钩后不得回 setup 温吞.
 * Embeds evaluateMidHookEarly + evaluateSetupAfterHookBan; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  MID_HOOK_MISSING / MID_HOOK_LATE / SETUP_AFTER_HOOK (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateMidHookEarly,
  type MidHookEarlyFinding,
  type MidHookEarlyOptions,
  type MidHookEarlyReport,
} from './mid-hook-early-gate';
import {
  evaluateSetupAfterHookBan,
  type SetupAfterHookBanFinding,
  type SetupAfterHookBanOptions,
} from './setup-after-hook-ban-gate';

export type MidHookSetupBanOptions = MidHookEarlyOptions;

export type MidHookSetupBanFinding = {
  code: MidHookEarlyFinding['code'] | SetupAfterHookBanFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface MidHookSetupBanReport {
  verdict: 'PASS' | 'FAIL';
  metrics: MidHookEarlyReport['metrics'] & {
    setupAfterHookShots: number;
  };
  findings: MidHookSetupBanFinding[];
  thresholds: Required<MidHookSetupBanOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateMidHookSetupBan(
  shotSpecRaw: unknown,
  opts: MidHookSetupBanOptions = {},
): MidHookSetupBanReport {
  const midHookByRatio = opts.midHookByRatio ?? 0.45;
  const mid = evaluateMidHookEarly(shotSpecRaw, { ...opts, midHookByRatio });

  const banOpts: SetupAfterHookBanOptions = { ...opts };
  const ban = evaluateSetupAfterHookBan(shotSpecRaw, banOpts);

  const findings: MidHookSetupBanFinding[] = [
    ...(mid.findings as MidHookSetupBanFinding[]),
  ];
  for (const f of ban.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'SETUP_AFTER_HOOK' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as MidHookSetupBanFinding);
    }
  }

  const thresholds: Required<MidHookSetupBanOptions> = {
    ...mid.thresholds,
  };

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mid.metrics,
      setupAfterHookShots: ban.metrics.setupAfterHookShots,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
