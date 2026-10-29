/**
 * V12 · Tail Cold-Close × Detail-Hook Dual Gate (冷收尾 + 细节特写钩 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《盛夏芬德拉》: 尾镜冷收同时开钩须 detail_cu.
 * Embeds evaluateTailColdClose + evaluateDetailHookKind; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  TAIL_NOT_COLD / SETUP_AFTER_CLIFF / DETAIL_HOOK_MISSING (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateTailColdClose,
  type TailColdCloseFinding,
  type TailColdCloseOptions,
  type TailColdCloseReport,
} from './tail-cold-close-gate';
import {
  evaluateDetailHookKind,
  type DetailHookKindFinding,
  type DetailHookKindOptions,
} from './detail-hook-kind-gate';

export interface ColdCloseDetailHookOptions extends TailColdCloseOptions {
  requireDetailCu?: boolean;
}

export type ColdCloseDetailHookFinding = {
  code: TailColdCloseFinding['code'] | DetailHookKindFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface ColdCloseDetailHookReport {
  verdict: 'PASS' | 'FAIL';
  metrics: TailColdCloseReport['metrics'] & {
    detailHookCount: number;
  };
  findings: ColdCloseDetailHookFinding[];
  thresholds: Required<ColdCloseDetailHookOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateColdCloseDetailHook(
  shotSpecRaw: unknown,
  opts: ColdCloseDetailHookOptions = {},
): ColdCloseDetailHookReport {
  const cold = evaluateTailColdClose(shotSpecRaw, opts);
  const detailOpts: DetailHookKindOptions = {
    ...opts,
    requireDetailCu: opts.requireDetailCu,
  };
  const detail = evaluateDetailHookKind(shotSpecRaw, detailOpts);

  const findings: ColdCloseDetailHookFinding[] = [...(cold.findings as ColdCloseDetailHookFinding[])];
  for (const f of detail.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'DETAIL_HOOK_MISSING' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as ColdCloseDetailHookFinding);
    }
  }

  const thresholds = {
    ...cold.thresholds,
    requireDetailCu: detail.thresholds.requireDetailCu,
  } as Required<ColdCloseDetailHookOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...cold.metrics,
      detailHookCount: detail.metrics.detailHookCount ?? 0,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
