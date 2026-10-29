/**
 * V12 · Cliff-Tail Tight × Cold-Open Dual Gate (紧尾悬念 + 冷开 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 尾窗卡最大悬念，同时开场即危机.
 * Embeds evaluateCliffTailTight + evaluateColdOpenHook; merges FAIL findings.
 * Invert of coldOpenCliffTail (cold primary → cliffTail primary).
 *
 *  SCHEMA (+ child findings)
 *  CLIFF_TAIL_TIGHT / COLD_OPEN_LATE / SETUP_BEFORE_HOOK (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateCliffTailTight,
  type CliffTailTightFinding,
  type CliffTailTightOptions,
  type CliffTailTightReport,
} from './cliff-tail-tight-gate';
import {
  evaluateColdOpenHook,
  type ColdOpenHookFinding,
  type ColdOpenHookOptions,
} from './cold-open-hook-gate';

export interface CliffTailColdOpenOptions extends CliffTailTightOptions {
  coldOpenWindowSec?: number;
}

export type CliffTailColdOpenFinding = {
  code: CliffTailTightFinding['code'] | ColdOpenHookFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface CliffTailColdOpenReport {
  verdict: 'PASS' | 'FAIL';
  metrics: CliffTailTightReport['metrics'] & {
    coldOpenAtSec: number | null;
  };
  findings: CliffTailColdOpenFinding[];
  thresholds: Required<CliffTailColdOpenOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateCliffTailColdOpen(
  shotSpecRaw: unknown,
  opts: CliffTailColdOpenOptions = {},
): CliffTailColdOpenReport {
  const tight = evaluateCliffTailTight(shotSpecRaw, opts);
  const coldOpts: ColdOpenHookOptions = {
    ...opts,
    coldOpenWindowSec: opts.coldOpenWindowSec,
  };
  const cold = evaluateColdOpenHook(shotSpecRaw, coldOpts);

  const findings: CliffTailColdOpenFinding[] = [...(tight.findings as CliffTailColdOpenFinding[])];
  for (const f of cold.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'COLD_OPEN_LATE' ||
      f.code === 'SETUP_BEFORE_HOOK' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as CliffTailColdOpenFinding);
    }
  }

  const thresholds = {
    ...tight.thresholds,
    coldOpenWindowSec: cold.thresholds.coldOpenWindowSec,
  } as Required<CliffTailColdOpenOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...tight.metrics,
      coldOpenAtSec: cold.metrics.firstHookAtSec ?? null,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
