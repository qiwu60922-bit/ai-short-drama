/**
 * V12 · Detail-Hook × Hook-Window Hard Dual Gate (细节特写钩 + 硬钩窗 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开钩须 detail_cu，且开场钩窗要紧.
 * Embeds evaluateDetailHookKind + evaluateHookWindowHard; merges FAIL findings.
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
  evaluateHookWindowHard,
  type HookWindowHardFinding,
  type HookWindowHardOptions,
} from './hook-window-hard-gate';

export interface DetailHookHookWindowOptions extends DetailHookKindOptions {
  hardHookWindowSec?: number;
  hookWindowSec?: number;
}

export type DetailHookHookWindowFinding = {
  code: DetailHookKindFinding['code'] | HookWindowHardFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface DetailHookHookWindowReport {
  verdict: 'PASS' | 'FAIL';
  metrics: DetailHookKindReport['metrics'] & {
    hardHookAtSec: number | null;
  };
  findings: DetailHookHookWindowFinding[];
  thresholds: Required<DetailHookHookWindowOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateDetailHookHookWindow(
  shotSpecRaw: unknown,
  opts: DetailHookHookWindowOptions = {},
): DetailHookHookWindowReport {
  const detail = evaluateDetailHookKind(shotSpecRaw, opts);
  const hardHookWindowSec = opts.hardHookWindowSec ?? opts.hookWindowSec ?? 2;
  const hard = evaluateHookWindowHard(shotSpecRaw, {
    ...opts,
    hardHookWindowSec,
    hookWindowSec: hardHookWindowSec,
  } as HookWindowHardOptions);

  const findings: DetailHookHookWindowFinding[] = [...(detail.findings as DetailHookHookWindowFinding[])];
  for (const f of hard.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'HOOK_WINDOW_HARD' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as DetailHookHookWindowFinding);
    }
  }

  const thresholds = {
    ...detail.thresholds,
    hardHookWindowSec: hard.thresholds.hardHookWindowSec,
    hookWindowSec: hardHookWindowSec,
  } as Required<DetailHookHookWindowOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...detail.metrics,
      hardHookAtSec: (hard.metrics as { firstHookAtSec?: number | null }).firstHookAtSec ?? null,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
