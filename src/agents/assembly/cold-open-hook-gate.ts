/**
 * V12 · Cold-Open Hook Gate (冷开场钩子闸门), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《不候，过期离婚》: 第一场就是危机，不做铺垫.
 *  - 《当家主母的自我修养》: 开场即掌掴立威，冷开无 setup 前置.
 *  - Wraps evaluateHookStructure with tighter cold-open rules.
 *
 *  SCHEMA (+ child hook findings)
 *  SETUP_BEFORE_HOOK (FAIL) — any setup shot starts before first hook
 *  COLD_OPEN_LATE (FAIL) — first hook starts after coldOpenWindowSec (default 2)
 *  FIRST_NOT_HOOK (WARN) — first shot is not beatRole=hook
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import {
  evaluateHookStructure,
  type HookFinding,
  type HookStructureOptions,
  type HookStructureReport,
} from './hook-structure-gate';

export interface ColdOpenHookOptions extends HookStructureOptions {
  /** Max seconds before first hook for cold open (default 2). */
  coldOpenWindowSec?: number;
}

export type ColdOpenHookFinding = {
  code:
    | 'SCHEMA'
    | 'SETUP_BEFORE_HOOK'
    | 'COLD_OPEN_LATE'
    | 'FIRST_NOT_HOOK'
    | HookFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface ColdOpenHookReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookStructureReport['metrics'] & {
    coldOpenWindowSec: number;
    firstShotRole: string | null;
  };
  findings: ColdOpenHookFinding[];
  thresholds: Required<ColdOpenHookOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateColdOpenHook(
  shotSpecRaw: unknown,
  opts: ColdOpenHookOptions = {},
): ColdOpenHookReport {
  const coldOpenWindowSec = opts.coldOpenWindowSec ?? 2;
  const hookOpts: HookStructureOptions = {
    hookWindowSec: opts.hookWindowSec ?? coldOpenWindowSec,
    maxFirstShotSec: opts.maxFirstShotSec ?? coldOpenWindowSec,
    maxSetupRatio: opts.maxSetupRatio ?? 0.35,
  };
  if (opts.midWindow !== undefined) hookOpts.midWindow = opts.midWindow;
  if (opts.tailToleranceSec !== undefined) hookOpts.tailToleranceSec = opts.tailToleranceSec;
  if (opts.requireAllTagged !== undefined) hookOpts.requireAllTagged = opts.requireAllTagged;
  if (opts.requireHookKind !== undefined) hookOpts.requireHookKind = opts.requireHookKind;

  const child = evaluateHookStructure(shotSpecRaw, hookOpts);
  const thresholds: Required<ColdOpenHookOptions> = {
    ...child.thresholds,
    coldOpenWindowSec,
  };

  if (child.findings.some((f) => f.code === 'SCHEMA')) {
    return {
      verdict: 'FAIL',
      metrics: { ...child.metrics, coldOpenWindowSec, firstShotRole: null },
      findings: child.findings as ColdOpenHookFinding[],
      thresholds,
      gates: GATES,
    };
  }

  const findings: ColdOpenHookFinding[] = [...(child.findings as ColdOpenHookFinding[])];
  const p = ShotSpecDocSchema.safeParse(shotSpecRaw);
  if (!p.success) {
    return {
      verdict: 'FAIL',
      metrics: { ...child.metrics, coldOpenWindowSec, firstShotRole: null },
      findings: [
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
    clock += s.durSec;
    return { ...s, startSec: start };
  });
  const first = timed[0];
  const firstShotRole =
    first && typeof first.beatRole === 'string' ? first.beatRole : null;

  if (firstShotRole && firstShotRole !== 'hook') {
    findings.push({
      code: 'FIRST_NOT_HOOK',
      severity: 'WARN',
      message: `首镜 beatRole=${firstShotRole}，冷开建议首镜即 hook`,
      shotIds: first?.shotId ? [first.shotId] : undefined,
    });
  }

  const firstHook = timed.find((s) => s.beatRole === 'hook');
  if (firstHook && firstHook.startSec > coldOpenWindowSec) {
    findings.push({
      code: 'COLD_OPEN_LATE',
      severity: 'FAIL',
      message: `首个 hook 起于 ${firstHook.startSec}s > coldOpenWindowSec=${coldOpenWindowSec}`,
      shotIds: firstHook.shotId ? [firstHook.shotId] : undefined,
    });
  }

  if (firstHook) {
    const setupBefore = timed.filter(
      (s) => s.beatRole === 'setup' && s.startSec < firstHook.startSec,
    );
    if (setupBefore.length) {
      findings.push({
        code: 'SETUP_BEFORE_HOOK',
        severity: 'FAIL',
        message: `冷开禁止 hook 前出现 setup（${setupBefore.length} 镜）`,
        shotIds: setupBefore.map((s) => s.shotId).filter(Boolean) as string[],
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { ...child.metrics, coldOpenWindowSec, firstShotRole },
    findings,
    thresholds,
    gates: GATES,
  };
}
