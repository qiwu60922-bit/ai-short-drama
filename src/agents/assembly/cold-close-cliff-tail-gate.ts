/**
 * V12 · Tail-Cold-Close × Cliff-Tail-Tight Gate (冷收尾 + 悬念尾窗紧卡 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《万妖图录》/悬疑揭晓: 尾镜冷收且尾窗紧卡悬念，不收 setup.
 * Embeds evaluateTailColdClose + evaluateCliffTailTight; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  TAIL_NOT_COLD / SETUP_AFTER_CLIFF / CLIFF_TAIL_TIGHT (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateTailColdClose,
  type TailColdCloseFinding,
  type TailColdCloseOptions,
  type TailColdCloseReport,
} from './tail-cold-close-gate';
import {
  evaluateCliffTailTight,
  type CliffTailTightFinding,
  type CliffTailTightOptions,
} from './cliff-tail-tight-gate';

export interface ColdCloseCliffTailOptions extends TailColdCloseOptions {
  hardTailToleranceSec?: number;
}

export type ColdCloseCliffTailFinding = {
  code: TailColdCloseFinding['code'] | CliffTailTightFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface ColdCloseCliffTailReport {
  verdict: 'PASS' | 'FAIL';
  metrics: TailColdCloseReport['metrics'] & {
    hardTailToleranceSec: number;
  };
  findings: ColdCloseCliffTailFinding[];
  thresholds: Required<ColdCloseCliffTailOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateColdCloseCliffTail(
  shotSpecRaw: unknown,
  opts: ColdCloseCliffTailOptions = {},
): ColdCloseCliffTailReport {
  const coldTailSec = opts.coldTailSec ?? 2;
  const hardTailToleranceSec = opts.hardTailToleranceSec ?? opts.tailToleranceSec ?? 1.5;
  const cold = evaluateTailColdClose(shotSpecRaw, { ...opts, coldTailSec });
  const tightOpts: CliffTailTightOptions = {
    ...opts,
    hardTailToleranceSec,
    tailToleranceSec: hardTailToleranceSec,
  };
  const tight = evaluateCliffTailTight(shotSpecRaw, tightOpts);

  const findings: ColdCloseCliffTailFinding[] = [
    ...(cold.findings as ColdCloseCliffTailFinding[]),
  ];
  for (const f of tight.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'CLIFF_TAIL_TIGHT' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as ColdCloseCliffTailFinding);
    }
  }

  const thresholds: Required<ColdCloseCliffTailOptions> = {
    ...cold.thresholds,
    hardTailToleranceSec,
  };

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...cold.metrics,
      hardTailToleranceSec: tight.metrics.hardTailToleranceSec ?? hardTailToleranceSec,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
