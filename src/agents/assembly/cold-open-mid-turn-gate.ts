/**
 * V12 · Cold-Open Hook × Mid-Turn Density Dual Gate (冷开场钩 + 中段反转密度 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场即危机，且中段须有足够反转/增量密度.
 * Embeds evaluateColdOpenHook + evaluateMidTurnDensity; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  COLD_OPEN_LATE / SETUP_BEFORE_HOOK / MID_TURN_SPARSE (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateColdOpenHook,
  type ColdOpenHookFinding,
  type ColdOpenHookOptions,
  type ColdOpenHookReport,
} from './cold-open-hook-gate';
import {
  evaluateMidTurnDensity,
  type MidTurnDensityFinding,
} from './mid-turn-density-gate';

export interface ColdOpenMidTurnOptions extends ColdOpenHookOptions {
  minTurns?: number;
}

export type ColdOpenMidTurnFinding = {
  code: ColdOpenHookFinding['code'] | MidTurnDensityFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface ColdOpenMidTurnReport {
  verdict: 'PASS' | 'FAIL';
  metrics: ColdOpenHookReport['metrics'] & {
    midTurnCount: number;
    minTurns: number;
  };
  findings: ColdOpenMidTurnFinding[];
  thresholds: Required<ColdOpenMidTurnOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateColdOpenMidTurn(
  shotSpecRaw: unknown,
  opts: ColdOpenMidTurnOptions = {},
): ColdOpenMidTurnReport {
  const cold = evaluateColdOpenHook(shotSpecRaw, opts);
  const dens = evaluateMidTurnDensity(shotSpecRaw, { ...opts, minTurns: opts.minTurns });

  const findings: ColdOpenMidTurnFinding[] = [...(cold.findings as ColdOpenMidTurnFinding[])];
  for (const f of dens.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'MID_TURN_SPARSE' ||
      f.code === 'MID_TURN_SOFT' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as ColdOpenMidTurnFinding);
    }
  }

  const thresholds = {
    ...cold.thresholds,
    minTurns: dens.thresholds.minTurns,
  } as Required<ColdOpenMidTurnOptions>;

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
