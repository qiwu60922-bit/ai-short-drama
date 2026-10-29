/**
 * V12 · Cliff-Tail Tight × Detail-Hook Dual Gate (紧尾悬念 + 细节特写钩 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《盛夏芬德拉》: 尾窗卡最大悬念，同时开钩须 detail_cu.
 * Embeds evaluateCliffTailTight + evaluateDetailHookKind; merges FAIL findings.
 * Invert of detailHookCliffTail (detail primary → cliffTail primary).
 *
 *  SCHEMA (+ child findings)
 *  CLIFF_TAIL_TIGHT / DETAIL_HOOK_MISSING (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateCliffTailTight,
  type CliffTailTightFinding,
  type CliffTailTightOptions,
  type CliffTailTightReport,
} from './cliff-tail-tight-gate';
import {
  evaluateDetailHookKind,
  type DetailHookKindFinding,
  type DetailHookKindOptions,
} from './detail-hook-kind-gate';

export interface CliffTailDetailHookOptions extends CliffTailTightOptions {
  requireDetailCu?: boolean;
}

export type CliffTailDetailHookFinding = {
  code: CliffTailTightFinding['code'] | DetailHookKindFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface CliffTailDetailHookReport {
  verdict: 'PASS' | 'FAIL';
  metrics: CliffTailTightReport['metrics'] & {
    detailHookCount: number;
  };
  findings: CliffTailDetailHookFinding[];
  thresholds: Required<CliffTailDetailHookOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateCliffTailDetailHook(
  shotSpecRaw: unknown,
  opts: CliffTailDetailHookOptions = {},
): CliffTailDetailHookReport {
  const tight = evaluateCliffTailTight(shotSpecRaw, opts);
  const detailOpts: DetailHookKindOptions = {
    ...opts,
    requireDetailCu: opts.requireDetailCu,
  };
  const detail = evaluateDetailHookKind(shotSpecRaw, detailOpts);

  const findings: CliffTailDetailHookFinding[] = [...(tight.findings as CliffTailDetailHookFinding[])];
  for (const f of detail.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'DETAIL_HOOK_MISSING' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as CliffTailDetailHookFinding);
    }
  }

  const thresholds = {
    ...tight.thresholds,
    requireDetailCu: detail.thresholds.requireDetailCu,
  } as Required<CliffTailDetailHookOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...tight.metrics,
      detailHookCount: detail.metrics.detailHookCount ?? 0,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
