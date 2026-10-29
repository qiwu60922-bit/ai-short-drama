/**
 * V12 · Cold-Open × Detail-Hook Gate (冷开 + 细节特写钩 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《盛夏芬德拉》: 冷开危机同时须有 detail_cu 钩，推迟正脸.
 * Embeds evaluateColdOpenHook + evaluateDetailHookKind; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  DETAIL_HOOK_MISSING / COLD_OPEN_LATE / SETUP_BEFORE_HOOK (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateColdOpenHook,
  type ColdOpenHookFinding,
  type ColdOpenHookOptions,
  type ColdOpenHookReport,
} from './cold-open-hook-gate';
import {
  evaluateDetailHookKind,
  type DetailHookKindFinding,
  type DetailHookKindOptions,
} from './detail-hook-kind-gate';

export interface ColdOpenDetailHookOptions extends ColdOpenHookOptions {
  requireDetailCu?: boolean;
}

export type ColdOpenDetailHookFinding = {
  code: ColdOpenHookFinding['code'] | DetailHookKindFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface ColdOpenDetailHookReport {
  verdict: 'PASS' | 'FAIL';
  metrics: ColdOpenHookReport['metrics'] & {
    detailHookCount: number;
    firstDetailHookAtSec: number | null;
  };
  findings: ColdOpenDetailHookFinding[];
  thresholds: Required<ColdOpenDetailHookOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateColdOpenDetailHook(
  shotSpecRaw: unknown,
  opts: ColdOpenDetailHookOptions = {},
): ColdOpenDetailHookReport {
  const requireDetailCu = opts.requireDetailCu ?? true;
  const cold = evaluateColdOpenHook(shotSpecRaw, opts);
  const detailOpts: DetailHookKindOptions = {
    requireDetailCu,
    requireHookKind: opts.requireHookKind ?? true,
    hookWindowSec: opts.hookWindowSec ?? cold.thresholds.hookWindowSec,
  };
  if (opts.maxFirstShotSec !== undefined) detailOpts.maxFirstShotSec = opts.maxFirstShotSec;
  if (opts.midWindow !== undefined) detailOpts.midWindow = opts.midWindow;
  if (opts.tailToleranceSec !== undefined) detailOpts.tailToleranceSec = opts.tailToleranceSec;
  if (opts.maxSetupRatio !== undefined) detailOpts.maxSetupRatio = opts.maxSetupRatio;
  if (opts.requireAllTagged !== undefined) detailOpts.requireAllTagged = opts.requireAllTagged;

  const detail = evaluateDetailHookKind(shotSpecRaw, detailOpts);

  const findings: ColdOpenDetailHookFinding[] = [
    ...(cold.findings as ColdOpenDetailHookFinding[]),
  ];
  for (const f of detail.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'DETAIL_HOOK_MISSING' ||
      f.code === 'DETAIL_HOOK_LATE' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as ColdOpenDetailHookFinding);
    }
  }

  const thresholds: Required<ColdOpenDetailHookOptions> = {
    ...cold.thresholds,
    requireDetailCu,
  };

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...cold.metrics,
      detailHookCount: detail.metrics.detailHookCount,
      firstDetailHookAtSec: detail.metrics.firstDetailHookAtSec,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
