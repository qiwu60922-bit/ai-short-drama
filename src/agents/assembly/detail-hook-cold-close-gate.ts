/**
 * V12 · Detail-Hook × Tail-Cold-Close Dual Gate (细节特写钩 + 冷收尾 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《盛夏芬德拉》: detail_cu 钩同时尾镜冷收不收 setup.
 * Embeds evaluateDetailHookKind + evaluateTailColdClose; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  DETAIL_HOOK_MISSING / TAIL_NOT_COLD / SETUP_AFTER_CLIFF (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateDetailHookKind,
  type DetailHookKindFinding,
  type DetailHookKindOptions,
  type DetailHookKindReport,
} from './detail-hook-kind-gate';
import {
  evaluateTailColdClose,
  type TailColdCloseFinding,
  type TailColdCloseOptions,
} from './tail-cold-close-gate';

export interface DetailHookColdCloseOptions extends DetailHookKindOptions {
  coldTailSec?: number;
}

export type DetailHookColdCloseFinding = {
  code: DetailHookKindFinding['code'] | TailColdCloseFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface DetailHookColdCloseReport {
  verdict: 'PASS' | 'FAIL';
  metrics: DetailHookKindReport['metrics'] & {
    coldTailSec: number;
  };
  findings: DetailHookColdCloseFinding[];
  thresholds: Required<DetailHookColdCloseOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateDetailHookColdClose(
  shotSpecRaw: unknown,
  opts: DetailHookColdCloseOptions = {},
): DetailHookColdCloseReport {
  const detail = evaluateDetailHookKind(shotSpecRaw, opts);
  const closeOpts: TailColdCloseOptions = {
    ...opts,
    coldTailSec: opts.coldTailSec,
  };
  const close = evaluateTailColdClose(shotSpecRaw, closeOpts);

  const findings: DetailHookColdCloseFinding[] = [...(detail.findings as DetailHookColdCloseFinding[])];
  for (const f of close.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'TAIL_NOT_COLD' ||
      f.code === 'SETUP_AFTER_CLIFF' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as DetailHookColdCloseFinding);
    }
  }

  const thresholds = {
    ...detail.thresholds,
    coldTailSec: close.thresholds.coldTailSec,
  } as Required<DetailHookColdCloseOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...detail.metrics,
      coldTailSec: close.metrics.coldTailSec ?? close.thresholds.coldTailSec,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
