/**
 * V12 · Reaction-After-Reversal × Cold-Open Dual Gate (反转后反应 + 冷开 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向结构双闸.
 * Embeds evaluateReactionAfterReversal + evaluateColdOpenHook; merges FAIL findings.
 * Invert of coldOpenReaction (cold primary → reaction primary).
 *
 *  SCHEMA (+ child findings)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateReactionAfterReversal,
  type ReactionAfterReversalFinding,
  type ReactionAfterReversalOptions,
  type ReactionAfterReversalReport,
} from './reaction-after-reversal-gate';
import {
  evaluateColdOpenHook,
  type ColdOpenHookFinding,
  type ColdOpenHookOptions,
} from './cold-open-hook-gate';

export interface ReactionColdOpenOptions extends ReactionAfterReversalOptions {
  coldOpenWindowSec?: number;
}

export type ReactionColdOpenFinding = {
  code: ReactionAfterReversalFinding['code'] | ColdOpenHookFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface ReactionColdOpenReport {
  verdict: 'PASS' | 'FAIL';
  metrics: ReactionAfterReversalReport['metrics'] & {
    coldOpenAtSec: number | null;
  };
  findings: ReactionColdOpenFinding[];
  thresholds: Required<ReactionColdOpenOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateReactionColdOpen(
  shotSpecRaw: unknown,
  opts: ReactionColdOpenOptions = {},
): ReactionColdOpenReport {
  const primary = evaluateReactionAfterReversal(shotSpecRaw, opts);
  const coldOpts: ColdOpenHookOptions = {
    ...opts,
    coldOpenWindowSec: opts.coldOpenWindowSec,
  };
  const cold = evaluateColdOpenHook(shotSpecRaw, coldOpts);

  const findings: ReactionColdOpenFinding[] = [...(primary.findings as ReactionColdOpenFinding[])];
  for (const f of cold.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'COLD_OPEN_LATE' ||
      f.code === 'SETUP_BEFORE_HOOK' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as ReactionColdOpenFinding);
    }
  }

  const thresholds = {
    ...primary.thresholds,
    coldOpenWindowSec: cold.thresholds.coldOpenWindowSec,
  } as Required<ReactionColdOpenOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...primary.metrics,
      coldOpenAtSec: cold.metrics.firstHookAtSec ?? null,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
