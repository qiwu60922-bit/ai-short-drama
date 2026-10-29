/**
 * V12 · Hook-Kind Mix Gate (开场钩子种类多样性闸门), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《盛夏芬德拉》detail_cu + 《万妖图录》situation — 系列开场钩不宜单一脸部特写.
 * Wraps evaluateHookStructure(requireHookKind) + requires ≥ minDistinctKinds among hooks
 * inside hookWindowSec (and optionally all hooks).
 *
 *  SCHEMA (+ child hook findings)
 *  HOOK_KIND_MONOTONE (FAIL) — distinct hookKind count < minDistinctKinds (default 2)
 *  HOOK_KIND_FACE_HEAVY (WARN) — face hooks > maxFaceRatio of hook shots (default 0.6)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import {
  evaluateHookStructure,
  type HookFinding,
  type HookStructureOptions,
  type HookStructureReport,
} from './hook-structure-gate';

export interface HookKindMixOptions extends HookStructureOptions {
  minDistinctKinds?: number;
  maxFaceRatio?: number;
  /** Only count hooks starting inside hookWindowSec (default true). */
  earlyHooksOnly?: boolean;
}

export type HookKindMixFinding = {
  code: 'SCHEMA' | 'HOOK_KIND_MONOTONE' | 'HOOK_KIND_FACE_HEAVY' | HookFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookKindMixReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookStructureReport['metrics'] & {
    distinctKinds: number;
    faceHookCount: number;
    hookKindCount: number;
  };
  findings: HookKindMixFinding[];
  thresholds: Required<HookKindMixOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookKindMix(
  shotSpecRaw: unknown,
  opts: HookKindMixOptions = {},
): HookKindMixReport {
  const minDistinctKinds = opts.minDistinctKinds ?? 2;
  const maxFaceRatio = opts.maxFaceRatio ?? 0.6;
  const earlyHooksOnly = opts.earlyHooksOnly ?? true;

  const hookOpts: HookStructureOptions = {
    requireHookKind: opts.requireHookKind ?? true,
    hookWindowSec: opts.hookWindowSec ?? 8,
  };
  if (opts.maxFirstShotSec !== undefined) hookOpts.maxFirstShotSec = opts.maxFirstShotSec;
  if (opts.midWindow !== undefined) hookOpts.midWindow = opts.midWindow;
  if (opts.tailToleranceSec !== undefined) hookOpts.tailToleranceSec = opts.tailToleranceSec;
  if (opts.maxSetupRatio !== undefined) hookOpts.maxSetupRatio = opts.maxSetupRatio;
  if (opts.requireAllTagged !== undefined) hookOpts.requireAllTagged = opts.requireAllTagged;

  const child = evaluateHookStructure(shotSpecRaw, hookOpts);
  const thresholds: Required<HookKindMixOptions> = {
    ...child.thresholds,
    minDistinctKinds,
    maxFaceRatio,
    earlyHooksOnly,
  };
  const findings: HookKindMixFinding[] = [...(child.findings as HookKindMixFinding[])];

  let distinctKinds = 0;
  let faceHookCount = 0;
  let hookKindCount = 0;

  const p = ShotSpecDocSchema.safeParse(shotSpecRaw);
  if (p.success) {
    const kinds = new Set<string>();
    let clock = 0;
    const window = thresholds.hookWindowSec;
    for (const s of p.data.shots) {
      const start = clock;
      clock += s.durSec;
      const role = (s as { beatRole?: string }).beatRole;
      const kind = (s as { hookKind?: string }).hookKind;
      if (role !== 'hook' || !kind) continue;
      if (earlyHooksOnly && start > window) continue;
      kinds.add(kind);
      hookKindCount += 1;
      if (kind === 'face') faceHookCount += 1;
    }
    distinctKinds = kinds.size;
    if (distinctKinds < minDistinctKinds && !findings.some((f) => f.code === 'SCHEMA')) {
      findings.push({
        code: 'HOOK_KIND_MONOTONE',
        severity: 'FAIL',
        message: `开场钩种类 ${distinctKinds} < minDistinctKinds=${minDistinctKinds}（${[...kinds].join('|') || '无'}）`,
      });
    }
    if (hookKindCount > 0 && faceHookCount / hookKindCount > maxFaceRatio) {
      findings.push({
        code: 'HOOK_KIND_FACE_HEAVY',
        severity: 'WARN',
        message: `face 钩占比 ${faceHookCount}/${hookKindCount} > maxFaceRatio=${maxFaceRatio}`,
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...child.metrics,
      distinctKinds,
      faceHookCount,
      hookKindCount,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
