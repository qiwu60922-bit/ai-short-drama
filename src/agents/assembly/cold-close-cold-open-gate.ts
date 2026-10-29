/**
 * V12 · Tail-Cold-Close × Cold-Open Dual Gate (冷收尾 + 冷开 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 尾镜冷收同时冷开危机.
 * Embeds evaluateTailColdClose + evaluateColdOpenHook; merges FAIL findings.
 * Invert of coldOpenColdClose (coldOpen primary → coldClose primary).
 *
 *  SCHEMA (+ child findings)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateTailColdClose,
  type TailColdCloseFinding,
  type TailColdCloseOptions,
  type TailColdCloseReport,
} from './tail-cold-close-gate';
import {
  evaluateColdOpenHook,
  type ColdOpenHookFinding,
  type ColdOpenHookOptions,
} from './cold-open-hook-gate';

export interface ColdCloseColdOpenOptions extends TailColdCloseOptions {
  coldOpenWindowSec?: number;
}

export type ColdCloseColdOpenFinding = {
  code: TailColdCloseFinding['code'] | ColdOpenHookFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface ColdCloseColdOpenReport {
  verdict: 'PASS' | 'FAIL';
  metrics: TailColdCloseReport['metrics'] & {
    coldOpenAtSec: number | null;
  };
  findings: ColdCloseColdOpenFinding[];
  thresholds: Required<ColdCloseColdOpenOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateColdCloseColdOpen(
  shotSpecRaw: unknown,
  opts: ColdCloseColdOpenOptions = {},
): ColdCloseColdOpenReport {
  const close = evaluateTailColdClose(shotSpecRaw, opts);
  const coldOpts: ColdOpenHookOptions = {
    ...opts,
    coldOpenWindowSec: opts.coldOpenWindowSec,
  };
  const cold = evaluateColdOpenHook(shotSpecRaw, coldOpts);

  const findings: ColdCloseColdOpenFinding[] = [...(close.findings as ColdCloseColdOpenFinding[])];
  for (const f of cold.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'COLD_OPEN_LATE' ||
      f.code === 'SETUP_BEFORE_HOOK' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as ColdCloseColdOpenFinding);
    }
  }

  const thresholds = {
    ...close.thresholds,
    coldOpenWindowSec: cold.thresholds.coldOpenWindowSec,
  } as Required<ColdCloseColdOpenOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...close.metrics,
      coldOpenAtSec: cold.metrics.firstHookAtSec ?? null,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
