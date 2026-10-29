/**
 * V12 · Cliff-Tail Tight × Hook-Window Hard Dual Gate (紧尾悬念 + 硬钩窗 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场钩窗要紧，且结尾悬念尾窗也要紧（严于默认 3s）.
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

export interface CliffTailHookHardOptions extends CliffTailTightOptions {
  hardHookWindowSec?: number;
  hookWindowSec?: number;
}

export type CliffTailHookHardFinding = {
  code: CliffTailTightFinding['code'] | HookWindowHardFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface CliffTailHookHardReport {
  verdict: 'PASS' | 'FAIL';
  metrics: CliffTailTightReport['metrics'] & { hardHookWindowSec: number };
  findings: CliffTailHookHardFinding[];
  thresholds: Required<CliffTailHookHardOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateCliffTailHookHard(
  shotSpecRaw: unknown,
  opts: CliffTailHookHardOptions = {},
): CliffTailHookHardReport {
  const hardHookWindowSec = opts.hardHookWindowSec ?? opts.hookWindowSec ?? 2;
  const tight = evaluateCliffTailTight(shotSpecRaw, opts);
  const hardOpts: HookWindowHardOptions = {
    ...opts,
    hardHookWindowSec,
    hookWindowSec: hardHookWindowSec,
  };
  const hard = evaluateHookWindowHard(shotSpecRaw, hardOpts);

  const findings: CliffTailHookHardFinding[] = [...(tight.findings as CliffTailHookHardFinding[])];
  for (const f of hard.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (f.code === 'SCHEMA' || f.code === 'HOOK_WINDOW_HARD' || !findings.some((x) => x.code === f.code)) {
      findings.push(f as CliffTailHookHardFinding);
    }
  }

  const thresholds = {
    ...tight.thresholds,
    hardHookWindowSec,
    hookWindowSec: hardHookWindowSec,
  } as Required<CliffTailHookHardOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { ...tight.metrics, hardHookWindowSec: hard.metrics.hardHookWindowSec },
    findings,
    thresholds,
    gates: GATES,
  };
}
