/**
 * V12 · Tail Cold-Close Gate (冷收尾悬念闸门), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《万妖图录传》: 结尾卡在最大悬念处断掉，不收 setup.
 *  - 《聚宝仙盆》: 季末开放悬念，尾窗内 cliffhanger 收束.
 * Wraps evaluateHookStructure + forbids setup after last cliffhanger; tight tail.
 *
 *  SCHEMA (+ child hook findings)
 *  SETUP_AFTER_CLIFF (FAIL) — setup starts after last cliffhanger begins
 *  TAIL_NOT_COLD (FAIL) — last shot is not cliffhanger
 *  TAIL_GAP_WIDE (WARN) — cliffhanger ends > coldTailSec before runtime end
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import {
  evaluateHookStructure,
  type HookFinding,
  type HookStructureOptions,
  type HookStructureReport,
} from './hook-structure-gate';

export interface TailColdCloseOptions extends HookStructureOptions {
  /** Max seconds between cliffhanger end and runtime end (default 2). */
  coldTailSec?: number;
}

export type TailColdCloseFinding = {
  code:
    | 'SCHEMA'
    | 'SETUP_AFTER_CLIFF'
    | 'TAIL_NOT_COLD'
    | 'TAIL_GAP_WIDE'
    | HookFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface TailColdCloseReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookStructureReport['metrics'] & {
    coldTailSec: number;
    lastShotRole: string | null;
    tailGapSec: number | null;
  };
  findings: TailColdCloseFinding[];
  thresholds: Required<TailColdCloseOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateTailColdClose(
  shotSpecRaw: unknown,
  opts: TailColdCloseOptions = {},
): TailColdCloseReport {
  const coldTailSec = opts.coldTailSec ?? 2;
  const hookOpts: HookStructureOptions = {
    tailToleranceSec: opts.tailToleranceSec ?? coldTailSec,
    hookWindowSec: opts.hookWindowSec,
    maxFirstShotSec: opts.maxFirstShotSec,
    maxSetupRatio: opts.maxSetupRatio,
  };
  if (opts.midWindow !== undefined) hookOpts.midWindow = opts.midWindow;
  if (opts.requireAllTagged !== undefined) hookOpts.requireAllTagged = opts.requireAllTagged;
  if (opts.requireHookKind !== undefined) hookOpts.requireHookKind = opts.requireHookKind;

  const child = evaluateHookStructure(shotSpecRaw, hookOpts);
  const thresholds: Required<TailColdCloseOptions> = {
    ...child.thresholds,
    coldTailSec,
  };

  const findings: TailColdCloseFinding[] = [...(child.findings as TailColdCloseFinding[])];
  let lastShotRole: string | null = null;
  let tailGapSec: number | null = null;

  const p = ShotSpecDocSchema.safeParse(shotSpecRaw);
  if (!p.success) {
    return {
      verdict: 'FAIL',
      metrics: {
        ...child.metrics,
        coldTailSec,
        lastShotRole: null,
        tailGapSec: null,
      },
      findings: findings.length
        ? findings
        : [
            {
              code: 'SCHEMA',
              severity: 'FAIL',
              message: p.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
            },
          ],
      thresholds,
      gates: GATES,
    };
  }

  let clock = 0;
  const timed = p.data.shots.map((s) => {
    const start = clock;
    const end = clock + s.durSec;
    clock = end;
    return {
      shotId: s.shotId,
      role: (s as { beatRole?: string }).beatRole ?? null,
      start,
      end,
    };
  });
  const total = clock;
  const last = timed[timed.length - 1];
  lastShotRole = last?.role ?? null;

  if (last && last.role !== 'cliffhanger') {
    findings.push({
      code: 'TAIL_NOT_COLD',
      severity: 'FAIL',
      message: `末镜 beatRole=${last.role ?? '∅'}，冷收尾要求末镜 cliffhanger`,
      shotIds: last.shotId ? [last.shotId] : undefined,
    });
  }

  const cliffs = timed.filter((s) => s.role === 'cliffhanger');
  const lastCliff = cliffs[cliffs.length - 1];
  if (lastCliff) {
    tailGapSec = Math.round((total - lastCliff.end) * 100) / 100;
    const setupAfter = timed.filter(
      (s) => s.role === 'setup' && s.start >= lastCliff.start,
    );
    if (setupAfter.length) {
      findings.push({
        code: 'SETUP_AFTER_CLIFF',
        severity: 'FAIL',
        message: `末 cliffhanger 之后/同期出现 setup（${setupAfter.length} 镜）`,
        shotIds: setupAfter.map((s) => s.shotId).filter(Boolean) as string[],
      });
    }
    if (tailGapSec > coldTailSec) {
      findings.push({
        code: 'TAIL_GAP_WIDE',
        severity: 'WARN',
        message: `cliffhanger 距片尾 ${tailGapSec}s > coldTailSec=${coldTailSec}`,
        shotIds: lastCliff.shotId ? [lastCliff.shotId] : undefined,
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...child.metrics,
      coldTailSec,
      lastShotRole,
      tailGapSec,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
