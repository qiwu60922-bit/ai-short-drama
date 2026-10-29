/**
 * V12 · Mid-Hook Early × Cliff-Tail Tight Dual Gate (中段早钩 + 紧尾悬念 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 中段尽快再抛钩，且尾窗须卡在最大悬念处.
 * Embeds evaluateMidHookEarly + evaluateCliffTailTight; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  MID_HOOK_MISSING / MID_HOOK_LATE / CLIFF_TAIL_TIGHT (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateMidHookEarly,
  type MidHookEarlyFinding,
  type MidHookEarlyOptions,
  type MidHookEarlyReport,
} from './mid-hook-early-gate';
import {
  evaluateCliffTailTight,
  type CliffTailTightFinding,
  type CliffTailTightOptions,
} from './cliff-tail-tight-gate';

export interface MidHookCliffTailOptions extends MidHookEarlyOptions {
  hardTailToleranceSec?: number;
}

export type MidHookCliffTailFinding = {
  code: MidHookEarlyFinding['code'] | CliffTailTightFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface MidHookCliffTailReport {
  verdict: 'PASS' | 'FAIL';
  metrics: MidHookEarlyReport['metrics'] & {
    hardTailToleranceSec: number;
  };
  findings: MidHookCliffTailFinding[];
  thresholds: Required<MidHookCliffTailOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateMidHookCliffTail(
  shotSpecRaw: unknown,
  opts: MidHookCliffTailOptions = {},
): MidHookCliffTailReport {
  const mid = evaluateMidHookEarly(shotSpecRaw, opts);
  const tightOpts: CliffTailTightOptions = {
    ...opts,
    hardTailToleranceSec: opts.hardTailToleranceSec,
  };
  const tight = evaluateCliffTailTight(shotSpecRaw, tightOpts);

  const findings: MidHookCliffTailFinding[] = [...(mid.findings as MidHookCliffTailFinding[])];
  for (const f of tight.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'CLIFF_TAIL_TIGHT' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as MidHookCliffTailFinding);
    }
  }

  const thresholds = {
    ...mid.thresholds,
    hardTailToleranceSec: tight.thresholds.hardTailToleranceSec,
  } as Required<MidHookCliffTailOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...mid.metrics,
      hardTailToleranceSec: tight.metrics.hardTailToleranceSec,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
