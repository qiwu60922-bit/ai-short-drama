/**
 * V12 · Detail Hook-Kind Gate (局部特写钩子闸门), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《盛夏芬德拉》推迟正脸、双手交叠 CU 当钩（detail_cu）.
 *  - 《回到70年代霸道婆婆带我飞》「掌公主」掌掴 CU.
 * Wraps evaluateHookStructure(requireHookKind) + requires ≥1 detail_cu in hook window.
 *
 *  SCHEMA (+ child hook findings)
 *  DETAIL_HOOK_MISSING (FAIL) — no hookKind=detail_cu inside hookWindowSec
 *  DETAIL_HOOK_LATE (WARN) — first detail_cu hook starts after hookWindowSec
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import {
  evaluateHookStructure,
  type HookFinding,
  type HookStructureOptions,
  type HookStructureReport,
} from './hook-structure-gate';

export interface DetailHookKindOptions extends HookStructureOptions {
  /** Require at least one detail_cu hook (default true). */
  requireDetailCu?: boolean;
}

export type DetailHookKindFinding = {
  code: 'SCHEMA' | 'DETAIL_HOOK_MISSING' | 'DETAIL_HOOK_LATE' | HookFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface DetailHookKindReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookStructureReport['metrics'] & {
    detailHookCount: number;
    firstDetailHookAtSec: number | null;
  };
  findings: DetailHookKindFinding[];
  thresholds: Required<DetailHookKindOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateDetailHookKind(
  shotSpecRaw: unknown,
  opts: DetailHookKindOptions = {},
): DetailHookKindReport {
  const requireDetailCu = opts.requireDetailCu ?? true;
  const hookOpts: HookStructureOptions = {
    requireHookKind: opts.requireHookKind ?? true,
    hookWindowSec: opts.hookWindowSec ?? 3,
    maxFirstShotSec: opts.maxFirstShotSec,
    maxSetupRatio: opts.maxSetupRatio,
  };
  if (opts.midWindow !== undefined) hookOpts.midWindow = opts.midWindow;
  if (opts.tailToleranceSec !== undefined) hookOpts.tailToleranceSec = opts.tailToleranceSec;
  if (opts.requireAllTagged !== undefined) hookOpts.requireAllTagged = opts.requireAllTagged;

  const child = evaluateHookStructure(shotSpecRaw, hookOpts);
  const thresholds: Required<DetailHookKindOptions> = {
    ...child.thresholds,
    requireDetailCu,
  };

  const findings: DetailHookKindFinding[] = [...(child.findings as DetailHookKindFinding[])];
  let firstDetailHookAtSec: number | null = null;
  let detailHookCount = child.metrics.detailHookCount ?? 0;

  const p = ShotSpecDocSchema.safeParse(shotSpecRaw);
  if (p.success) {
    let clock = 0;
    for (const s of p.data.shots) {
      const start = clock;
      clock += s.durSec;
      const role = (s as { beatRole?: string }).beatRole;
      const kind = (s as { hookKind?: string }).hookKind;
      if (role === 'hook' && kind === 'detail_cu') {
        detailHookCount = Math.max(detailHookCount, 1);
        if (firstDetailHookAtSec === null) firstDetailHookAtSec = start;
      }
    }
    // recount precisely
    detailHookCount = 0;
    clock = 0;
    firstDetailHookAtSec = null;
    for (const s of p.data.shots) {
      const start = clock;
      clock += s.durSec;
      const role = (s as { beatRole?: string }).beatRole;
      const kind = (s as { hookKind?: string }).hookKind;
      if (role === 'hook' && kind === 'detail_cu') {
        detailHookCount += 1;
        if (firstDetailHookAtSec === null) firstDetailHookAtSec = start;
      }
    }
  }

  if (requireDetailCu && detailHookCount === 0 && !findings.some((f) => f.code === 'SCHEMA')) {
    findings.push({
      code: 'DETAIL_HOOK_MISSING',
      severity: 'FAIL',
      message: '开场窗内缺少 hookKind=detail_cu（局部/身体特写钩）',
    });
  }

  const window = thresholds.hookWindowSec;
  if (
    requireDetailCu &&
    firstDetailHookAtSec !== null &&
    firstDetailHookAtSec > window
  ) {
    findings.push({
      code: 'DETAIL_HOOK_LATE',
      severity: 'WARN',
      message: `首个 detail_cu hook 起于 ${firstDetailHookAtSec}s > hookWindowSec=${window}`,
    });
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...child.metrics,
      detailHookCount,
      firstDetailHookAtSec,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
