/**
 * V12 · Hook-Window Hard × Detail-Hook Dual Gate (硬钩窗 + 细节特写钩 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩窗要紧，同时开钩须 detail_cu.
 * Embeds evaluateHookWindowHard + evaluateDetailHookKind; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateHookWindowHard,
  type HookWindowHardFinding,
  type HookWindowHardOptions,
  type HookWindowHardReport,
} from './hook-window-hard-gate';
import {
  evaluateDetailHookKind,
  type DetailHookKindFinding,
  type DetailHookKindOptions,
} from './detail-hook-kind-gate';

export interface HookWindowDetailHookOptions extends HookWindowHardOptions {
  requireDetailCu?: boolean;
}

export type HookWindowDetailHookFinding = {
  code: HookWindowHardFinding['code'] | DetailHookKindFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookWindowDetailHookReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookWindowHardReport['metrics'] & {
    detailHookCount: number;
  };
  findings: HookWindowDetailHookFinding[];
  thresholds: Required<HookWindowDetailHookOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookWindowDetailHook(
  shotSpecRaw: unknown,
  opts: HookWindowDetailHookOptions = {},
): HookWindowDetailHookReport {
  const hardHookWindowSec = opts.hardHookWindowSec ?? opts.hookWindowSec ?? 2;
  const hard = evaluateHookWindowHard(shotSpecRaw, { ...opts, hardHookWindowSec, hookWindowSec: hardHookWindowSec });
  const detailOpts: DetailHookKindOptions = {
    ...opts,
    requireDetailCu: opts.requireDetailCu,
  };
  const detail = evaluateDetailHookKind(shotSpecRaw, detailOpts);

  const findings: HookWindowDetailHookFinding[] = [...(hard.findings as HookWindowDetailHookFinding[])];
  for (const f of detail.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'DETAIL_HOOK_MISSING' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookWindowDetailHookFinding);
    }
  }

  const thresholds = {
    ...hard.thresholds,
    requireDetailCu: detail.thresholds.requireDetailCu,
  } as Required<HookWindowDetailHookOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...hard.metrics,
      detailHookCount: detail.metrics.detailHookCount ?? 0,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
