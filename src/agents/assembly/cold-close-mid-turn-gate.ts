/**
 * V12 · Tail Cold-Close × Mid-Turn Density Dual Gate (冷收尾 + 中段密度 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 尾窗冷收在最大悬念处，且中段反转够密.
 * Embeds evaluateTailColdClose + evaluateMidTurnDensity; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  SETUP_AFTER_CLIFF / TAIL_NOT_COLD / MID_TURN_SPARSE (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateTailColdClose,
  type TailColdCloseFinding,
  type TailColdCloseOptions,
  type TailColdCloseReport,
} from './tail-cold-close-gate';
import {
  evaluateMidTurnDensity,
  type MidTurnDensityFinding,
  type MidTurnDensityOptions,
} from './mid-turn-density-gate';

export interface ColdCloseMidTurnOptions extends TailColdCloseOptions {
  minTurns?: number;
}

export type ColdCloseMidTurnFinding = {
  code: TailColdCloseFinding['code'] | MidTurnDensityFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface ColdCloseMidTurnReport {
  verdict: 'PASS' | 'FAIL';
  metrics: TailColdCloseReport['metrics'] & {
    midTurnCount: number;
    minTurns: number;
  };
  findings: ColdCloseMidTurnFinding[];
  thresholds: Required<ColdCloseMidTurnOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateColdCloseMidTurn(
  shotSpecRaw: unknown,
  opts: ColdCloseMidTurnOptions = {},
): ColdCloseMidTurnReport {
  const cold = evaluateTailColdClose(shotSpecRaw, opts);
  const densOpts: MidTurnDensityOptions = {
    ...opts,
    minTurns: opts.minTurns,
  };
  const dens = evaluateMidTurnDensity(shotSpecRaw, densOpts);

  const findings: ColdCloseMidTurnFinding[] = [...(cold.findings as ColdCloseMidTurnFinding[])];
  for (const f of dens.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'MID_TURN_SPARSE' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as ColdCloseMidTurnFinding);
    }
  }

  const thresholds = {
    ...cold.thresholds,
    minTurns: dens.thresholds.minTurns,
  } as Required<ColdCloseMidTurnOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...cold.metrics,
      midTurnCount: dens.metrics.midTurnCount,
      minTurns: dens.metrics.minTurns,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
