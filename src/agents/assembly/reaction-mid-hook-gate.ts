/**
 * V12 · Reaction-Before-Cliff × Mid-Hook Early Dual Gate (悬念前反应 + 中段早钩 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: cliff 前须有反应镜，且中段尽快再抛钩.
 * Embeds evaluateReactionBeforeCliff + evaluateMidHookEarly; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  CLIFF_NO_PRIOR_REACTION / MID_HOOK_MISSING / MID_HOOK_LATE (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateReactionBeforeCliff,
  type ReactionBeforeCliffFinding,
  type ReactionBeforeCliffOptions,
  type ReactionBeforeCliffReport,
} from './reaction-before-cliff-gate';
import {
  evaluateMidHookEarly,
  type MidHookEarlyFinding,
  type MidHookEarlyOptions,
} from './mid-hook-early-gate';

export interface ReactionMidHookOptions extends ReactionBeforeCliffOptions {
  midHookByRatio?: number;
}

export type ReactionMidHookFinding = {
  code: ReactionBeforeCliffFinding['code'] | MidHookEarlyFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface ReactionMidHookReport {
  verdict: 'PASS' | 'FAIL';
  metrics: ReactionBeforeCliffReport['metrics'] & {
    midHookAtSec: number;
    midHookByRatio: number;
  };
  findings: ReactionMidHookFinding[];
  thresholds: Required<ReactionMidHookOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateReactionMidHook(
  shotSpecRaw: unknown,
  opts: ReactionMidHookOptions = {},
): ReactionMidHookReport {
  const rx = evaluateReactionBeforeCliff(shotSpecRaw, opts);
  const midOpts: MidHookEarlyOptions = {
    ...opts,
    midHookByRatio: opts.midHookByRatio,
  };
  const mid = evaluateMidHookEarly(shotSpecRaw, midOpts);

  const findings: ReactionMidHookFinding[] = [...(rx.findings as ReactionMidHookFinding[])];
  for (const f of mid.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'MID_HOOK_MISSING' ||
      f.code === 'MID_HOOK_LATE' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as ReactionMidHookFinding);
    }
  }

  const thresholds = {
    ...rx.thresholds,
    midHookByRatio: mid.thresholds.midHookByRatio,
  } as Required<ReactionMidHookOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...rx.metrics,
      midHookAtSec: mid.metrics.midHookAtSec,
      midHookByRatio: mid.metrics.midHookByRatio,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
