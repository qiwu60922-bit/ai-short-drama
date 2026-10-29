/**
 * V12 · Cliff-Tail Tight × Mid-Hook Early Dual Gate (紧尾悬念 + 中段早钩 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 尾窗须卡在最大悬念处，且中段尽快再抛钩.
 * Embeds evaluateCliffTailTight + evaluateMidHookEarly; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  CLIFF_TAIL_TIGHT / MID_HOOK_MISSING / MID_HOOK_LATE (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateCliffTailTight,
  type CliffTailTightFinding,
  type CliffTailTightOptions,
  type CliffTailTightReport,
} from './cliff-tail-tight-gate';
import {
  evaluateMidHookEarly,
  type MidHookEarlyFinding,
  type MidHookEarlyOptions,
} from './mid-hook-early-gate';

export interface CliffTailMidHookOptions extends CliffTailTightOptions {
  midHookByRatio?: number;
}

export type CliffTailMidHookFinding = {
  code: CliffTailTightFinding['code'] | MidHookEarlyFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface CliffTailMidHookReport {
  verdict: 'PASS' | 'FAIL';
  metrics: CliffTailTightReport['metrics'] & {
    midHookAtSec: number;
    midHookByRatio: number;
  };
  findings: CliffTailMidHookFinding[];
  thresholds: Required<CliffTailMidHookOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateCliffTailMidHook(
  shotSpecRaw: unknown,
  opts: CliffTailMidHookOptions = {},
): CliffTailMidHookReport {
  const tight = evaluateCliffTailTight(shotSpecRaw, opts);
  const midOpts: MidHookEarlyOptions = {
    ...opts,
    midHookByRatio: opts.midHookByRatio,
  };
  const mid = evaluateMidHookEarly(shotSpecRaw, midOpts);

  const findings: CliffTailMidHookFinding[] = [...(tight.findings as CliffTailMidHookFinding[])];
  for (const f of mid.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'MID_HOOK_MISSING' ||
      f.code === 'MID_HOOK_LATE' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as CliffTailMidHookFinding);
    }
  }

  const thresholds = {
    ...tight.thresholds,
    midHookByRatio: mid.thresholds.midHookByRatio,
  } as Required<CliffTailMidHookOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...tight.metrics,
      midHookAtSec: mid.metrics.midHookAtSec,
      midHookByRatio: mid.metrics.midHookByRatio,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
