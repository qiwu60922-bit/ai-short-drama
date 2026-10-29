/**
 * V12 · Mid-Hook Early × Mid-Turn Density Dual Gate (中段早钩 + 中段反转密度 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 中段尽快再抛钩，且须有足够反转密度.
 * Embeds evaluateMidHookEarly + evaluateMidTurnDensity; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateMidHookEarly,
  type MidHookEarlyFinding,
  type MidHookEarlyOptions,
  type MidHookEarlyReport,
} from './mid-hook-early-gate';
import {
  evaluateMidTurnDensity,
  type MidTurnDensityFinding,
  type MidTurnDensityOptions,
} from './mid-turn-density-gate';

export interface MidHookMidTurnOptions extends MidHookEarlyOptions {
  minTurns?: number;
}

export type MidHookMidTurnFinding = {
  code: MidHookEarlyFinding['code'] | MidTurnDensityFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface MidHookMidTurnReport {
  verdict: 'PASS' | 'FAIL';
  metrics: MidHookEarlyReport['metrics'] & {
    midTurnCount: number;
  };
  findings: MidHookMidTurnFinding[];
  thresholds: Required<MidHookMidTurnOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateMidHookMidTurn(
  shotSpecRaw: unknown,
  opts: MidHookMidTurnOptions = {},
): MidHookMidTurnReport {
  const mid = evaluateMidHookEarly(shotSpecRaw, opts);
  const turnOpts: MidTurnDensityOptions = {
    ...opts,
    minTurns: opts.minTurns,
  };
  const turn = evaluateMidTurnDensity(shotSpecRaw, turnOpts);

  const findings: MidHookMidTurnFinding[] = [...(mid.findings as MidHookMidTurnFinding[])];
  for (const f of turn.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'MID_TURN_SPARSE' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as MidHookMidTurnFinding);
    }
  }

  const thresholds = {
    ...mid.thresholds,
    minTurns: turn.thresholds.minTurns,
  } as Required<MidHookMidTurnOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mid.metrics,
      midTurnCount: turn.metrics.midTurnCount ?? 0,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
