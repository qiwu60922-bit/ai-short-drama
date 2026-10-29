/**
 * V12 · Mid-Turn Density × Detail-Hook Dual Gate (中段反转密度 + 细节特写钩 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 中段须有足够反转密度，同时开钩须 detail_cu.
 * Embeds evaluateMidTurnDensity + evaluateDetailHookKind; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateMidTurnDensity,
  type MidTurnDensityFinding,
  type MidTurnDensityOptions,
  type MidTurnDensityReport,
} from './mid-turn-density-gate';
import {
  evaluateDetailHookKind,
  type DetailHookKindFinding,
  type DetailHookKindOptions,
} from './detail-hook-kind-gate';

export interface MidTurnDetailHookOptions extends MidTurnDensityOptions {
  requireDetailCu?: boolean;
}

export type MidTurnDetailHookFinding = {
  code: MidTurnDensityFinding['code'] | DetailHookKindFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface MidTurnDetailHookReport {
  verdict: 'PASS' | 'FAIL';
  metrics: MidTurnDensityReport['metrics'] & {
    detailHookCount: number;
  };
  findings: MidTurnDetailHookFinding[];
  thresholds: Required<MidTurnDetailHookOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateMidTurnDetailHook(
  shotSpecRaw: unknown,
  opts: MidTurnDetailHookOptions = {},
): MidTurnDetailHookReport {
  const mid = evaluateMidTurnDensity(shotSpecRaw, opts);
  const detailOpts: DetailHookKindOptions = {
    ...opts,
    requireDetailCu: opts.requireDetailCu,
  };
  const detail = evaluateDetailHookKind(shotSpecRaw, detailOpts);

  const findings: MidTurnDetailHookFinding[] = [...(mid.findings as MidTurnDetailHookFinding[])];
  for (const f of detail.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'DETAIL_HOOK_MISSING' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as MidTurnDetailHookFinding);
    }
  }

  const thresholds = {
    ...mid.thresholds,
    requireDetailCu: detail.thresholds.requireDetailCu,
  } as Required<MidTurnDetailHookOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mid.metrics,
      detailHookCount: detail.metrics.detailHookCount ?? 0,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
