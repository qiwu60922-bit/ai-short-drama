/**
 * V12 · Mid-Hook Early × Tail-Cold-Close Dual Gate (中段早钩 + 冷收尾 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 中段尽快再抛钩，且尾镜冷收不收 setup.
 * Embeds evaluateMidHookEarly + evaluateTailColdClose; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  MID_HOOK_MISSING / MID_HOOK_LATE / TAIL_NOT_COLD (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateMidHookEarly,
  type MidHookEarlyFinding,
  type MidHookEarlyOptions,
  type MidHookEarlyReport,
} from './mid-hook-early-gate';
import {
  evaluateTailColdClose,
  type TailColdCloseFinding,
  type TailColdCloseOptions,
} from './tail-cold-close-gate';

export interface MidHookColdCloseOptions extends MidHookEarlyOptions {
  coldTailSec?: number;
}

export type MidHookColdCloseFinding = {
  code: MidHookEarlyFinding['code'] | TailColdCloseFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface MidHookColdCloseReport {
  verdict: 'PASS' | 'FAIL';
  metrics: MidHookEarlyReport['metrics'] & {
    coldTailSec: number;
  };
  findings: MidHookColdCloseFinding[];
  thresholds: Required<MidHookColdCloseOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateMidHookColdClose(
  shotSpecRaw: unknown,
  opts: MidHookColdCloseOptions = {},
): MidHookColdCloseReport {
  const mid = evaluateMidHookEarly(shotSpecRaw, opts);
  const coldOpts: TailColdCloseOptions = {
    ...opts,
    coldTailSec: opts.coldTailSec,
  };
  const cold = evaluateTailColdClose(shotSpecRaw, coldOpts);

  const findings: MidHookColdCloseFinding[] = [...(mid.findings as MidHookColdCloseFinding[])];
  for (const f of cold.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'TAIL_NOT_COLD' ||
      f.code === 'SETUP_AFTER_CLIFF' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as MidHookColdCloseFinding);
    }
  }

  const thresholds = {
    ...mid.thresholds,
    coldTailSec: cold.thresholds.coldTailSec,
  } as Required<MidHookColdCloseOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mid.metrics,
      coldTailSec: cold.metrics.coldTailSec ?? cold.thresholds.coldTailSec,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
