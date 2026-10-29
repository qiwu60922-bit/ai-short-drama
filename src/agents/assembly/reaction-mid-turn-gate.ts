/**
 * V12 · Reaction-Before-Cliff × Mid-Turn Density Dual Gate (悬念前反应 + 中段反转密度 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: cliff 前须有反应镜，且中段须有足够反转密度.
 * Embeds evaluateReactionBeforeCliff + evaluateMidTurnDensity; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateReactionBeforeCliff,
  type ReactionBeforeCliffFinding,
  type ReactionBeforeCliffOptions,
  type ReactionBeforeCliffReport,
} from './reaction-before-cliff-gate';
import {
  evaluateMidTurnDensity,
  type MidTurnDensityFinding,
  type MidTurnDensityOptions,
} from './mid-turn-density-gate';

export interface ReactionMidTurnOptions extends ReactionBeforeCliffOptions {
  minTurns?: number;
}

export type ReactionMidTurnFinding = {
  code: ReactionBeforeCliffFinding['code'] | MidTurnDensityFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface ReactionMidTurnReport {
  verdict: 'PASS' | 'FAIL';
  metrics: ReactionBeforeCliffReport['metrics'] & {
    midTurnCount: number;
  };
  findings: ReactionMidTurnFinding[];
  thresholds: Required<ReactionMidTurnOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateReactionMidTurn(
  shotSpecRaw: unknown,
  opts: ReactionMidTurnOptions = {},
): ReactionMidTurnReport {
  const rx = evaluateReactionBeforeCliff(shotSpecRaw, opts);
  const midOpts: MidTurnDensityOptions = {
    ...opts,
    minTurns: opts.minTurns,
  };
  const mid = evaluateMidTurnDensity(shotSpecRaw, midOpts);

  const findings: ReactionMidTurnFinding[] = [...(rx.findings as ReactionMidTurnFinding[])];
  for (const f of mid.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'MID_TURN_SPARSE' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as ReactionMidTurnFinding);
    }
  }

  const thresholds = {
    ...rx.thresholds,
    minTurns: mid.thresholds.minTurns,
  } as Required<ReactionMidTurnOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...rx.metrics,
      midTurnCount: mid.metrics.midTurnCount ?? 0,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
