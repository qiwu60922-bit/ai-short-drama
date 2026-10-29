/**
 * V12 · Mid-Turn Density × Tail Cold-Close Dual Gate (中段密度 + 冷收尾 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 中段反转够密，且尾窗冷收在最大悬念处.
 * Embeds evaluateMidTurnDensity + evaluateTailColdClose; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  MID_TURN_SPARSE / SETUP_AFTER_CLIFF / TAIL_NOT_COLD (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateMidTurnDensity,
  type MidTurnDensityFinding,
  type MidTurnDensityOptions,
  type MidTurnDensityReport,
} from './mid-turn-density-gate';
import {
  evaluateTailColdClose,
  type TailColdCloseFinding,
  type TailColdCloseOptions,
} from './tail-cold-close-gate';

export interface MidTurnColdCloseOptions extends MidTurnDensityOptions {
  coldTailSec?: number;
}

export type MidTurnColdCloseFinding = {
  code: MidTurnDensityFinding['code'] | TailColdCloseFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface MidTurnColdCloseReport {
  verdict: 'PASS' | 'FAIL';
  metrics: MidTurnDensityReport['metrics'] & {
    coldTailSec: number;
  };
  findings: MidTurnColdCloseFinding[];
  thresholds: Required<MidTurnColdCloseOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateMidTurnColdClose(
  shotSpecRaw: unknown,
  opts: MidTurnColdCloseOptions = {},
): MidTurnColdCloseReport {
  const dens = evaluateMidTurnDensity(shotSpecRaw, opts);
  const coldOpts: TailColdCloseOptions = {
    ...opts,
    coldTailSec: opts.coldTailSec,
  };
  const cold = evaluateTailColdClose(shotSpecRaw, coldOpts);

  const findings: MidTurnColdCloseFinding[] = [...(dens.findings as MidTurnColdCloseFinding[])];
  for (const f of cold.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'SETUP_AFTER_CLIFF' ||
      f.code === 'TAIL_NOT_COLD' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as MidTurnColdCloseFinding);
    }
  }

  const thresholds = {
    ...dens.thresholds,
    coldTailSec: cold.thresholds.coldTailSec,
  } as Required<MidTurnColdCloseOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...dens.metrics,
      coldTailSec: cold.metrics.coldTailSec ?? cold.thresholds.coldTailSec,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
