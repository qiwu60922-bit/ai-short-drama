/**
 * V12 · Setup-Mid Cap × Mid-Turn Density Dual Gate (中段铺垫上限 + 中段反转密度 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《万妖图录》/密爽向: 中段 setup 不可吃掉大半，且须有足够反转/增量.
 * Embeds evaluateSetupMidCap + evaluateMidTurnDensity; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  SETUP_MID_CAP / MID_TURN_SPARSE (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateSetupMidCap,
  type SetupMidCapFinding,
  type SetupMidCapOptions,
  type SetupMidCapReport,
} from './setup-mid-cap-gate';
import {
  evaluateMidTurnDensity,
  type MidTurnDensityFinding,
  type MidTurnDensityOptions,
} from './mid-turn-density-gate';

export interface SetupMidTurnOptions extends SetupMidCapOptions {
  minTurns?: number;
}

export type SetupMidTurnFinding = {
  code: SetupMidCapFinding['code'] | MidTurnDensityFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface SetupMidTurnReport {
  verdict: 'PASS' | 'FAIL';
  metrics: SetupMidCapReport['metrics'] & {
    midTurnCount: number;
    minTurns: number;
  };
  findings: SetupMidTurnFinding[];
  thresholds: Required<SetupMidTurnOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateSetupMidTurn(
  shotSpecRaw: unknown,
  opts: SetupMidTurnOptions = {},
): SetupMidTurnReport {
  const midCap = evaluateSetupMidCap(shotSpecRaw, opts);
  const densOpts: MidTurnDensityOptions = {
    ...opts,
    minTurns: opts.minTurns,
  };
  const dens = evaluateMidTurnDensity(shotSpecRaw, densOpts);

  const findings: SetupMidTurnFinding[] = [...(midCap.findings as SetupMidTurnFinding[])];
  for (const f of dens.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'MID_TURN_SPARSE' ||
      f.code === 'MID_TURN_SOFT' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as SetupMidTurnFinding);
    }
  }

  const thresholds = {
    ...midCap.thresholds,
    minTurns: dens.thresholds.minTurns,
  } as Required<SetupMidTurnOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...midCap.metrics,
      midTurnCount: dens.metrics.midTurnCount,
      minTurns: dens.metrics.minTurns,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
