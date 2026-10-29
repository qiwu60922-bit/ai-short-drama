/**
 * V12 · Cold-Open Hook × Cliff-Tail Tight Dual Gate (冷开场钩 + 紧尾悬念 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场即危机，且尾窗须卡在最大悬念处.
 * Embeds evaluateColdOpenHook + evaluateCliffTailTight; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  COLD_OPEN_LATE / SETUP_BEFORE_HOOK / CLIFF_TAIL_TIGHT (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateColdOpenHook,
  type ColdOpenHookFinding,
  type ColdOpenHookOptions,
  type ColdOpenHookReport,
} from './cold-open-hook-gate';
import {
  evaluateCliffTailTight,
  type CliffTailTightFinding,
  type CliffTailTightOptions,
} from './cliff-tail-tight-gate';

export interface ColdOpenCliffTailOptions extends ColdOpenHookOptions {
  hardTailToleranceSec?: number;
}

export type ColdOpenCliffTailFinding = {
  code: ColdOpenHookFinding['code'] | CliffTailTightFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface ColdOpenCliffTailReport {
  verdict: 'PASS' | 'FAIL';
  metrics: ColdOpenHookReport['metrics'] & {
    hardTailToleranceSec: number;
  };
  findings: ColdOpenCliffTailFinding[];
  thresholds: Required<ColdOpenCliffTailOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateColdOpenCliffTail(
  shotSpecRaw: unknown,
  opts: ColdOpenCliffTailOptions = {},
): ColdOpenCliffTailReport {
  const cold = evaluateColdOpenHook(shotSpecRaw, opts);
  const tightOpts: CliffTailTightOptions = {
    ...opts,
    hardTailToleranceSec: opts.hardTailToleranceSec,
  };
  const tight = evaluateCliffTailTight(shotSpecRaw, tightOpts);

  const findings: ColdOpenCliffTailFinding[] = [...(cold.findings as ColdOpenCliffTailFinding[])];
  for (const f of tight.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'CLIFF_TAIL_TIGHT' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as ColdOpenCliffTailFinding);
    }
  }

  const thresholds = {
    ...cold.thresholds,
    hardTailToleranceSec: tight.thresholds.hardTailToleranceSec,
  } as Required<ColdOpenCliffTailOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...cold.metrics,
      hardTailToleranceSec: tight.metrics.hardTailToleranceSec,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
