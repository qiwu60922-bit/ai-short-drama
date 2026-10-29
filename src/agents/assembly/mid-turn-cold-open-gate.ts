/**
 * V12 · Mid-Turn Density × Cold-Open Dual Gate (中段反转密度 + 冷开 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 中段须有足够反转密度，同时冷开即危机.
 * Embeds evaluateMidTurnDensity + evaluateColdOpenHook; merges FAIL findings.
 * Invert of coldOpenMidTurn (cold primary → midTurn primary).
 *
 *  SCHEMA (+ child findings)
 *  MID_TURN_SPARSE / COLD_OPEN_LATE / SETUP_BEFORE_HOOK (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateMidTurnDensity,
  type MidTurnDensityFinding,
  type MidTurnDensityReport,
} from './mid-turn-density-gate';
import {
  evaluateColdOpenHook,
  type ColdOpenHookFinding,
  type ColdOpenHookOptions,
} from './cold-open-hook-gate';

export interface MidTurnColdOpenOptions extends ColdOpenHookOptions {
  minTurns?: number;
}

export type MidTurnColdOpenFinding = {
  code: MidTurnDensityFinding['code'] | ColdOpenHookFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface MidTurnColdOpenReport {
  verdict: 'PASS' | 'FAIL';
  metrics: MidTurnDensityReport['metrics'] & {
    coldOpenAtSec: number | null;
  };
  findings: MidTurnColdOpenFinding[];
  thresholds: Required<MidTurnColdOpenOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateMidTurnColdOpen(
  shotSpecRaw: unknown,
  opts: MidTurnColdOpenOptions = {},
): MidTurnColdOpenReport {
  const mid = evaluateMidTurnDensity(shotSpecRaw, { minTurns: opts.minTurns });
  const coldOpts: ColdOpenHookOptions = {
    ...opts,
    coldOpenWindowSec: opts.coldOpenWindowSec,
  };
  const cold = evaluateColdOpenHook(shotSpecRaw, coldOpts);

  const findings: MidTurnColdOpenFinding[] = [...(mid.findings as MidTurnColdOpenFinding[])];
  for (const f of cold.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'COLD_OPEN_LATE' ||
      f.code === 'SETUP_BEFORE_HOOK' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as MidTurnColdOpenFinding);
    }
  }

  const thresholds = {
    ...cold.thresholds,
    minTurns: mid.thresholds.minTurns,
    coldOpenWindowSec: cold.thresholds.coldOpenWindowSec,
  } as Required<MidTurnColdOpenOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mid.metrics,
      coldOpenAtSec: cold.metrics.firstHookAtSec ?? null,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
