/**
 * V12 · Hook-Window Hard × Mid-Turn Density Dual Gate (硬钩窗 + 中段反转密度 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开头更快抛冲突，且中段须有足够反转/增量密度.
 * Embeds evaluateHookWindowHard + evaluateMidTurnDensity; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  HOOK_WINDOW_HARD / MID_TURN_SPARSE (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateHookWindowHard,
  type HookWindowHardFinding,
  type HookWindowHardOptions,
  type HookWindowHardReport,
} from './hook-window-hard-gate';
import {
  evaluateMidTurnDensity,
  type MidTurnDensityFinding,
} from './mid-turn-density-gate';

export interface HookWindowMidTurnOptions extends HookWindowHardOptions {
  minTurns?: number;
}

export type HookWindowMidTurnFinding = {
  code: HookWindowHardFinding['code'] | MidTurnDensityFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookWindowMidTurnReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookWindowHardReport['metrics'] & {
    midTurnCount: number;
    minTurns: number;
  };
  findings: HookWindowMidTurnFinding[];
  thresholds: Required<HookWindowMidTurnOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookWindowMidTurn(
  shotSpecRaw: unknown,
  opts: HookWindowMidTurnOptions = {},
): HookWindowMidTurnReport {
  const hard = evaluateHookWindowHard(shotSpecRaw, opts);
  const dens = evaluateMidTurnDensity(shotSpecRaw, { ...opts, minTurns: opts.minTurns });

  const findings: HookWindowMidTurnFinding[] = [...(hard.findings as HookWindowMidTurnFinding[])];
  for (const f of dens.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'MID_TURN_SPARSE' ||
      f.code === 'MID_TURN_SOFT' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookWindowMidTurnFinding);
    }
  }

  const thresholds = {
    ...hard.thresholds,
    minTurns: dens.thresholds.minTurns,
  } as Required<HookWindowMidTurnOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...hard.metrics,
      midTurnCount: dens.metrics.midTurnCount,
      minTurns: dens.metrics.minTurns,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
