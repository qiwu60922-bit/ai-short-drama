/**
 * V12 · Cliff-Tail Tight × Tail-Cold-Close Dual Gate (悬念尾窗紧卡 + 冷收尾 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 尾窗须卡在最大悬念处，且尾镜冷收不收 setup.
 * Embeds evaluateCliffTailTight + evaluateTailColdClose; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  CLIFF_TAIL_TIGHT / TAIL_NOT_COLD / SETUP_AFTER_CLIFF (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateCliffTailTight,
  type CliffTailTightFinding,
  type CliffTailTightOptions,
  type CliffTailTightReport,
} from './cliff-tail-tight-gate';
import {
  evaluateTailColdClose,
  type TailColdCloseFinding,
  type TailColdCloseOptions,
} from './tail-cold-close-gate';

export interface CliffTailColdCloseOptions extends CliffTailTightOptions {
  coldTailSec?: number;
}

export type CliffTailColdCloseFinding = {
  code: CliffTailTightFinding['code'] | TailColdCloseFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface CliffTailColdCloseReport {
  verdict: 'PASS' | 'FAIL';
  metrics: CliffTailTightReport['metrics'] & {
    coldTailSec: number;
  };
  findings: CliffTailColdCloseFinding[];
  thresholds: Required<CliffTailColdCloseOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateCliffTailColdClose(
  shotSpecRaw: unknown,
  opts: CliffTailColdCloseOptions = {},
): CliffTailColdCloseReport {
  const tight = evaluateCliffTailTight(shotSpecRaw, opts);
  const coldOpts: TailColdCloseOptions = {
    ...opts,
    coldTailSec: opts.coldTailSec,
  };
  const cold = evaluateTailColdClose(shotSpecRaw, coldOpts);

  const findings: CliffTailColdCloseFinding[] = [...(tight.findings as CliffTailColdCloseFinding[])];
  for (const f of cold.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'TAIL_NOT_COLD' ||
      f.code === 'SETUP_AFTER_CLIFF' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as CliffTailColdCloseFinding);
    }
  }

  const thresholds = {
    ...tight.thresholds,
    coldTailSec: cold.thresholds.coldTailSec,
  } as Required<CliffTailColdCloseOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...tight.metrics,
      coldTailSec: cold.metrics.coldTailSec ?? cold.thresholds.coldTailSec,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
