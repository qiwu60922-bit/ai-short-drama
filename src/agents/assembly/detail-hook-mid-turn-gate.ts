/**
 * V12 · Detail-Hook × Mid-Turn Density Dual Gate (细节特写钩 + 中段反转密度 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开钩须 detail_cu，且中段须有足够反转密度.
 * Embeds evaluateDetailHookKind + evaluateMidTurnDensity; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateDetailHookKind,
  type DetailHookKindFinding,
  type DetailHookKindOptions,
  type DetailHookKindReport,
} from './detail-hook-kind-gate';
import {
  evaluateMidTurnDensity,
  type MidTurnDensityFinding,
  type MidTurnDensityOptions,
} from './mid-turn-density-gate';

export interface DetailHookMidTurnOptions extends DetailHookKindOptions {
  minTurns?: number;
}

export type DetailHookMidTurnFinding = {
  code: DetailHookKindFinding['code'] | MidTurnDensityFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface DetailHookMidTurnReport {
  verdict: 'PASS' | 'FAIL';
  metrics: DetailHookKindReport['metrics'] & {
    midTurnCount: number;
  };
  findings: DetailHookMidTurnFinding[];
  thresholds: Required<DetailHookMidTurnOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateDetailHookMidTurn(
  shotSpecRaw: unknown,
  opts: DetailHookMidTurnOptions = {},
): DetailHookMidTurnReport {
  const detail = evaluateDetailHookKind(shotSpecRaw, opts);
  const turnOpts: MidTurnDensityOptions = {
    ...opts,
    minTurns: opts.minTurns,
  };
  const turn = evaluateMidTurnDensity(shotSpecRaw, turnOpts);

  const findings: DetailHookMidTurnFinding[] = [...(detail.findings as DetailHookMidTurnFinding[])];
  for (const f of turn.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'MID_TURN_SPARSE' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as DetailHookMidTurnFinding);
    }
  }

  const thresholds = {
    ...detail.thresholds,
    minTurns: turn.thresholds.minTurns,
  } as Required<DetailHookMidTurnOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...detail.metrics,
      midTurnCount: turn.metrics.midTurnCount ?? 0,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
