/**
 * V12 · Detail-Hook × Cold-Open Dual Gate (细节特写钩 + 冷开 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《盛夏芬德拉》: detail_cu 开钩同时冷开危机，推迟正脸.
 * Embeds evaluateDetailHookKind + evaluateColdOpenHook; merges FAIL findings.
 * Invert of coldOpenDetailHook (cold primary → detail primary).
 *
 *  SCHEMA (+ child findings)
 *  DETAIL_HOOK_MISSING / COLD_OPEN_LATE / SETUP_BEFORE_HOOK (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateDetailHookKind,
  type DetailHookKindFinding,
  type DetailHookKindOptions,
  type DetailHookKindReport,
} from './detail-hook-kind-gate';
import {
  evaluateColdOpenHook,
  type ColdOpenHookFinding,
  type ColdOpenHookOptions,
} from './cold-open-hook-gate';

export interface DetailHookColdOpenOptions extends DetailHookKindOptions {
  coldOpenWindowSec?: number;
}

export type DetailHookColdOpenFinding = {
  code: DetailHookKindFinding['code'] | ColdOpenHookFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface DetailHookColdOpenReport {
  verdict: 'PASS' | 'FAIL';
  metrics: DetailHookKindReport['metrics'] & {
    coldOpenAtSec: number | null;
  };
  findings: DetailHookColdOpenFinding[];
  thresholds: Required<DetailHookColdOpenOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateDetailHookColdOpen(
  shotSpecRaw: unknown,
  opts: DetailHookColdOpenOptions = {},
): DetailHookColdOpenReport {
  const detail = evaluateDetailHookKind(shotSpecRaw, opts);
  const coldOpts: ColdOpenHookOptions = {
    ...opts,
    coldOpenWindowSec: opts.coldOpenWindowSec,
  };
  const cold = evaluateColdOpenHook(shotSpecRaw, coldOpts);

  const findings: DetailHookColdOpenFinding[] = [...(detail.findings as DetailHookColdOpenFinding[])];
  for (const f of cold.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'COLD_OPEN_LATE' ||
      f.code === 'SETUP_BEFORE_HOOK' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as DetailHookColdOpenFinding);
    }
  }

  const thresholds = {
    ...detail.thresholds,
    coldOpenWindowSec: cold.thresholds.coldOpenWindowSec,
  } as Required<DetailHookColdOpenOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...detail.metrics,
      coldOpenAtSec: cold.metrics.firstHookAtSec ?? null,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
