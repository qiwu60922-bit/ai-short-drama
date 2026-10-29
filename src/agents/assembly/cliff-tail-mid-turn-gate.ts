/**
 * V12 · Cliff-Tail Tight × Mid-Turn Density Dual Gate (紧尾悬念 + 中段密度 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 尾窗须卡在最大悬念处，且中段反转够密（与 midTurnCliffTail 对偶·尾侧优先）.
 * Embeds evaluateCliffTailTight + evaluateMidTurnDensity; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  CLIFF_TAIL_TIGHT / MID_TURN_SPARSE (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateCliffTailTight,
  type CliffTailTightFinding,
  type CliffTailTightOptions,
  type CliffTailTightReport,
} from './cliff-tail-tight-gate';
import {
  evaluateMidTurnDensity,
  type MidTurnDensityFinding,
  type MidTurnDensityOptions,
} from './mid-turn-density-gate';

export interface CliffTailMidTurnOptions extends CliffTailTightOptions {
  minTurns?: number;
}

export type CliffTailMidTurnFinding = {
  code: CliffTailTightFinding['code'] | MidTurnDensityFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface CliffTailMidTurnReport {
  verdict: 'PASS' | 'FAIL';
  metrics: CliffTailTightReport['metrics'] & {
    midTurnCount: number;
    minTurns: number;
  };
  findings: CliffTailMidTurnFinding[];
  thresholds: Required<CliffTailMidTurnOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateCliffTailMidTurn(
  shotSpecRaw: unknown,
  opts: CliffTailMidTurnOptions = {},
): CliffTailMidTurnReport {
  const tight = evaluateCliffTailTight(shotSpecRaw, opts);
  const densOpts: MidTurnDensityOptions = {
    ...opts,
    minTurns: opts.minTurns,
  };
  const dens = evaluateMidTurnDensity(shotSpecRaw, densOpts);

  const findings: CliffTailMidTurnFinding[] = [...(tight.findings as CliffTailMidTurnFinding[])];
  for (const f of dens.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'MID_TURN_SPARSE' ||
      f.code === 'MID_TURN_SOFT' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as CliffTailMidTurnFinding);
    }
  }

  const thresholds = {
    ...tight.thresholds,
    minTurns: dens.thresholds.minTurns,
  } as Required<CliffTailMidTurnOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...tight.metrics,
      midTurnCount: dens.metrics.midTurnCount,
      minTurns: dens.metrics.minTurns,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
