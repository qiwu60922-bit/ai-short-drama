/**
 * V12 · Cold-Open × Tail-Cold-Close Dual Gate (冷开 + 冷收尾 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 冷开危机同时尾镜冷收不收 setup.
 * Embeds evaluateColdOpenHook + evaluateTailColdClose; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  COLD_OPEN_LATE / SETUP_BEFORE_HOOK / TAIL_NOT_COLD / SETUP_AFTER_CLIFF (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateColdOpenHook,
  type ColdOpenHookFinding,
  type ColdOpenHookOptions,
  type ColdOpenHookReport,
} from './cold-open-hook-gate';
import {
  evaluateTailColdClose,
  type TailColdCloseFinding,
  type TailColdCloseOptions,
} from './tail-cold-close-gate';

export interface ColdOpenColdCloseOptions extends ColdOpenHookOptions {
  coldTailSec?: number;
}

export type ColdOpenColdCloseFinding = {
  code: ColdOpenHookFinding['code'] | TailColdCloseFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface ColdOpenColdCloseReport {
  verdict: 'PASS' | 'FAIL';
  metrics: ColdOpenHookReport['metrics'] & {
    coldTailSec: number;
  };
  findings: ColdOpenColdCloseFinding[];
  thresholds: Required<ColdOpenColdCloseOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateColdOpenColdClose(
  shotSpecRaw: unknown,
  opts: ColdOpenColdCloseOptions = {},
): ColdOpenColdCloseReport {
  const cold = evaluateColdOpenHook(shotSpecRaw, opts);
  const closeOpts: TailColdCloseOptions = {
    ...opts,
    coldTailSec: opts.coldTailSec,
  };
  const close = evaluateTailColdClose(shotSpecRaw, closeOpts);

  const findings: ColdOpenColdCloseFinding[] = [...(cold.findings as ColdOpenColdCloseFinding[])];
  for (const f of close.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'TAIL_NOT_COLD' ||
      f.code === 'SETUP_AFTER_CLIFF' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as ColdOpenColdCloseFinding);
    }
  }

  const thresholds = {
    ...cold.thresholds,
    coldTailSec: close.thresholds.coldTailSec,
  } as Required<ColdOpenColdCloseOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...cold.metrics,
      coldTailSec: close.metrics.coldTailSec ?? close.thresholds.coldTailSec,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
