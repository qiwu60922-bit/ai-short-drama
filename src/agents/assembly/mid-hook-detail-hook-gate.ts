/**
 * V12 · Mid-Hook Early × Detail-Hook Dual Gate (中段早钩 + 细节特写钩 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《盛夏芬德拉》: 中段尽快再抛钩，同时开钩须 detail_cu.
 * Embeds evaluateMidHookEarly + evaluateDetailHookKind; merges FAIL findings.
 * Invert of detailHookMidHook (detail primary → mid primary).
 *
 *  SCHEMA (+ child findings)
 *  MID_HOOK_MISSING / MID_HOOK_LATE / DETAIL_HOOK_MISSING (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateMidHookEarly,
  type MidHookEarlyFinding,
  type MidHookEarlyOptions,
  type MidHookEarlyReport,
} from './mid-hook-early-gate';
import {
  evaluateDetailHookKind,
  type DetailHookKindFinding,
  type DetailHookKindOptions,
} from './detail-hook-kind-gate';

export interface MidHookDetailHookOptions extends MidHookEarlyOptions {
  requireDetailCu?: boolean;
}

export type MidHookDetailHookFinding = {
  code: MidHookEarlyFinding['code'] | DetailHookKindFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface MidHookDetailHookReport {
  verdict: 'PASS' | 'FAIL';
  metrics: MidHookEarlyReport['metrics'] & {
    detailHookCount: number;
  };
  findings: MidHookDetailHookFinding[];
  thresholds: Required<MidHookDetailHookOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateMidHookDetailHook(
  shotSpecRaw: unknown,
  opts: MidHookDetailHookOptions = {},
): MidHookDetailHookReport {
  const mid = evaluateMidHookEarly(shotSpecRaw, opts);
  const detailOpts: DetailHookKindOptions = {
    ...opts,
    requireDetailCu: opts.requireDetailCu,
  };
  const detail = evaluateDetailHookKind(shotSpecRaw, detailOpts);

  const findings: MidHookDetailHookFinding[] = [...(mid.findings as MidHookDetailHookFinding[])];
  for (const f of detail.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'DETAIL_HOOK_MISSING' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as MidHookDetailHookFinding);
    }
  }

  const thresholds = {
    ...mid.thresholds,
    requireDetailCu: detail.thresholds.requireDetailCu,
  } as Required<MidHookDetailHookOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mid.metrics,
      detailHookCount: detail.metrics.detailHookCount ?? 0,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
