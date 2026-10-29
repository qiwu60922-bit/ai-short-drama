/**
 * V12 · Cliff-Tail Tight × Hook-Window Hard Dual Gate (紧尾悬念 + 硬钩窗 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 尾窗须卡在最大悬念处，且开头更快抛冲突.
 * Embeds evaluateCliffTailTight + evaluateHookWindowHard; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  CLIFF_TAIL_TIGHT / HOOK_WINDOW_HARD (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateCliffTailTight,
  type CliffTailTightFinding,
  type CliffTailTightOptions,
  type CliffTailTightReport,
} from './cliff-tail-tight-gate';
import {
  evaluateHookWindowHard,
  type HookWindowHardFinding,
  type HookWindowHardOptions,
} from './hook-window-hard-gate';

export interface CliffTailHookWindowOptions extends CliffTailTightOptions {
  hardHookWindowSec?: number;
}

export type CliffTailHookWindowFinding = {
  code: CliffTailTightFinding['code'] | HookWindowHardFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface CliffTailHookWindowReport {
  verdict: 'PASS' | 'FAIL';
  metrics: CliffTailTightReport['metrics'] & {
    hardHookWindowSec: number;
  };
  findings: CliffTailHookWindowFinding[];
  thresholds: Required<CliffTailHookWindowOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateCliffTailHookWindow(
  shotSpecRaw: unknown,
  opts: CliffTailHookWindowOptions = {},
): CliffTailHookWindowReport {
  const tight = evaluateCliffTailTight(shotSpecRaw, opts);
  const hardOpts: HookWindowHardOptions = {
    ...opts,
    hardHookWindowSec: opts.hardHookWindowSec,
  };
  const hard = evaluateHookWindowHard(shotSpecRaw, hardOpts);

  const findings: CliffTailHookWindowFinding[] = [...(tight.findings as CliffTailHookWindowFinding[])];
  for (const f of hard.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'HOOK_WINDOW_HARD' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as CliffTailHookWindowFinding);
    }
  }

  const thresholds = {
    ...tight.thresholds,
    hardHookWindowSec: hard.thresholds.hardHookWindowSec,
  } as Required<CliffTailHookWindowOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...tight.metrics,
      hardHookWindowSec: hard.metrics.hardHookWindowSec ?? hard.thresholds.hardHookWindowSec,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
