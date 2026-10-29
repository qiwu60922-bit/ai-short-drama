/**
 * V12 · Cold-Open Cascade Gate (冷开场 × 开场叠钩 复合闸), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《老公请和我恋爱吧》: 冷开危机后立刻叠第二/第三钩，而非长铺垫.
 * Runs evaluateColdOpenHook + evaluateOpeningCascade; both must PASS.
 *
 *  SCHEMA (+ child findings)
 *  COLD_OPEN_* / CASCADE_* from children
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateColdOpenHook,
  type ColdOpenHookFinding,
  type ColdOpenHookOptions,
  type ColdOpenHookReport,
} from './cold-open-hook-gate';
import {
  evaluateOpeningCascade,
  type OpeningCascadeFinding,
  type OpeningCascadeOptions,
  type OpeningCascadeReport,
} from './opening-cascade-gate';

export interface ColdOpenCascadeOptions extends ColdOpenHookOptions, OpeningCascadeOptions {}

export type ColdOpenCascadeFinding = ColdOpenHookFinding | OpeningCascadeFinding;

export interface ColdOpenCascadeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: ColdOpenHookReport['metrics'] &
    OpeningCascadeReport['metrics'] & {
      coldOpenVerdict: 'PASS' | 'FAIL';
      cascadeVerdict: 'PASS' | 'FAIL';
    };
  findings: ColdOpenCascadeFinding[];
  thresholds: Required<ColdOpenCascadeOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateColdOpenCascade(
  shotSpecRaw: unknown,
  opts: ColdOpenCascadeOptions = {},
): ColdOpenCascadeReport {
  const cold = evaluateColdOpenHook(shotSpecRaw, opts);
  const cascade = evaluateOpeningCascade(shotSpecRaw, {
    cascadeWindowSec: opts.cascadeWindowSec ?? opts.coldOpenWindowSec ?? 8,
    minCascadeBeats: opts.minCascadeBeats ?? 2,
  });

  const findings: ColdOpenCascadeFinding[] = [
    ...(cold.findings as ColdOpenCascadeFinding[]),
    ...(cascade.findings as ColdOpenCascadeFinding[]),
  ];

  const thresholds: Required<ColdOpenCascadeOptions> = {
    ...cold.thresholds,
    cascadeWindowSec: cascade.thresholds.cascadeWindowSec,
    minCascadeBeats: cascade.thresholds.minCascadeBeats,
  };

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...cold.metrics,
      ...cascade.metrics,
      coldOpenVerdict: cold.verdict,
      cascadeVerdict: cascade.verdict,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
