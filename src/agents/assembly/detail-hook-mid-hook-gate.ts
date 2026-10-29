/**
 * V12 · Detail-Hook × Mid-Hook Early Dual Gate (细节特写钩 + 中段早钩 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《盛夏芬德拉》: detail_cu 开钩同时中段尽快再抛钩.
 * Embeds evaluateDetailHookKind + evaluateMidHookEarly; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  DETAIL_HOOK_MISSING / MID_HOOK_MISSING / MID_HOOK_LATE (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateDetailHookKind,
  type DetailHookKindFinding,
  type DetailHookKindOptions,
  type DetailHookKindReport,
} from './detail-hook-kind-gate';
import {
  evaluateMidHookEarly,
  type MidHookEarlyFinding,
  type MidHookEarlyOptions,
} from './mid-hook-early-gate';

export interface DetailHookMidHookOptions extends DetailHookKindOptions {
  midHookByRatio?: number;
}

export type DetailHookMidHookFinding = {
  code: DetailHookKindFinding['code'] | MidHookEarlyFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface DetailHookMidHookReport {
  verdict: 'PASS' | 'FAIL';
  metrics: DetailHookKindReport['metrics'] & {
    midHookAtSec: number | null;
    midHookByRatio: number;
  };
  findings: DetailHookMidHookFinding[];
  thresholds: Required<DetailHookMidHookOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateDetailHookMidHook(
  shotSpecRaw: unknown,
  opts: DetailHookMidHookOptions = {},
): DetailHookMidHookReport {
  const detail = evaluateDetailHookKind(shotSpecRaw, opts);
  const midOpts: MidHookEarlyOptions = {
    ...opts,
    midHookByRatio: opts.midHookByRatio,
  };
  const mid = evaluateMidHookEarly(shotSpecRaw, midOpts);

  const findings: DetailHookMidHookFinding[] = [...(detail.findings as DetailHookMidHookFinding[])];
  for (const f of mid.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'MID_HOOK_MISSING' ||
      f.code === 'MID_HOOK_LATE' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as DetailHookMidHookFinding);
    }
  }

  const thresholds = {
    ...detail.thresholds,
    midHookByRatio: mid.thresholds.midHookByRatio,
  } as Required<DetailHookMidHookOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...detail.metrics,
      midHookAtSec: mid.metrics.midHookAtSec,
      midHookByRatio: mid.metrics.midHookByRatio,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
