/**
 * V12 · Detail-Hook × Cliff-Tail Tight Dual Gate (细节特写钩 + 紧尾悬念 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《盛夏芬德拉》: detail_cu 开钩同时尾窗卡在最大悬念处.
 * Embeds evaluateDetailHookKind + evaluateCliffTailTight; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  DETAIL_HOOK_MISSING / CLIFF_TAIL_TIGHT (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateDetailHookKind,
  type DetailHookKindFinding,
  type DetailHookKindOptions,
  type DetailHookKindReport,
} from './detail-hook-kind-gate';
import {
  evaluateCliffTailTight,
  type CliffTailTightFinding,
  type CliffTailTightOptions,
} from './cliff-tail-tight-gate';

export interface DetailHookCliffTailOptions extends DetailHookKindOptions {
  hardTailToleranceSec?: number;
}

export type DetailHookCliffTailFinding = {
  code: DetailHookKindFinding['code'] | CliffTailTightFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface DetailHookCliffTailReport {
  verdict: 'PASS' | 'FAIL';
  metrics: DetailHookKindReport['metrics'] & {
    hardTailToleranceSec: number;
  };
  findings: DetailHookCliffTailFinding[];
  thresholds: Required<DetailHookCliffTailOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateDetailHookCliffTail(
  shotSpecRaw: unknown,
  opts: DetailHookCliffTailOptions = {},
): DetailHookCliffTailReport {
  const detail = evaluateDetailHookKind(shotSpecRaw, opts);
  const cliffOpts: CliffTailTightOptions = {
    ...opts,
    hardTailToleranceSec: opts.hardTailToleranceSec,
  };
  const cliff = evaluateCliffTailTight(shotSpecRaw, cliffOpts);

  const findings: DetailHookCliffTailFinding[] = [...(detail.findings as DetailHookCliffTailFinding[])];
  for (const f of cliff.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'CLIFF_TAIL_TIGHT' ||
      f.code === 'CLIFFHANGER_MISSING' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as DetailHookCliffTailFinding);
    }
  }

  const thresholds = {
    ...detail.thresholds,
    hardTailToleranceSec: cliff.thresholds.hardTailToleranceSec,
  } as Required<DetailHookCliffTailOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...detail.metrics,
      hardTailToleranceSec: cliff.thresholds.hardTailToleranceSec,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
