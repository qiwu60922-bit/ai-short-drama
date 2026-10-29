/**
 * V12 · Cliff-Tail Tight Gate (悬念尾窗紧闸), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《万妖图录传》: 结尾卡在最大悬念处；尾窗默认 1.5s（严于 hook-structure 的 3s）.
 * Wraps evaluateHookStructure; escalates CLIFFHANGER_MISSING → CLIFF_TAIL_TIGHT FAIL.
 *
 *  SCHEMA (+ child hook findings)
 *  CLIFF_TAIL_TIGHT (FAIL)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateHookStructure,
  type HookFinding,
  type HookStructureOptions,
  type HookStructureReport,
} from './hook-structure-gate';

export interface CliffTailTightOptions extends HookStructureOptions {
  /** Hard tail tolerance in seconds (default 1.5). */
  hardTailToleranceSec?: number;
}

export type CliffTailTightFinding = {
  code: 'SCHEMA' | 'CLIFF_TAIL_TIGHT' | HookFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface CliffTailTightReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookStructureReport['metrics'] & {
    hardTailToleranceSec: number;
  };
  findings: CliffTailTightFinding[];
  thresholds: Required<CliffTailTightOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateCliffTailTight(
  shotSpecRaw: unknown,
  opts: CliffTailTightOptions = {},
): CliffTailTightReport {
  const hardTailToleranceSec = opts.hardTailToleranceSec ?? opts.tailToleranceSec ?? 1.5;
  const hookOpts: HookStructureOptions = { ...opts, tailToleranceSec: hardTailToleranceSec };
  const child = evaluateHookStructure(shotSpecRaw, hookOpts);
  const thresholds: Required<CliffTailTightOptions> = {
    ...child.thresholds,
    hardTailToleranceSec,
  };

  const findings: CliffTailTightFinding[] = [];
  for (const f of child.findings) {
    if (f.code === 'CLIFFHANGER_MISSING') {
      findings.push({
        code: 'CLIFF_TAIL_TIGHT',
        severity: 'FAIL',
        message: f.message.replace('CLIFFHANGER_MISSING', 'CLIFF_TAIL_TIGHT'),
        shotIds: f.shotIds,
      });
    } else {
      findings.push(f as CliffTailTightFinding);
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { ...child.metrics, hardTailToleranceSec },
    findings,
    thresholds,
    gates: GATES,
  };
}
