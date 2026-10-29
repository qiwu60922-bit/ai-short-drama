/**
 * V12 · Setup-After-Hook Ban Gate (钩后禁铺垫闸), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《不候，过期离婚》/密爽向: 第一钩落地后不得再回 setup 温吞铺垫.
 * Embeds evaluateHookStructure; FAIL when any beatRole=setup starts at/after firstHookAtSec.
 *
 *  SCHEMA (+ child hook findings)
 *  SETUP_AFTER_HOOK (FAIL)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import {
  evaluateHookStructure,
  type HookFinding,
  type HookStructureOptions,
  type HookStructureReport,
} from './hook-structure-gate';

export type SetupAfterHookBanOptions = HookStructureOptions;

export type SetupAfterHookBanFinding = {
  code: 'SCHEMA' | 'SETUP_AFTER_HOOK' | HookFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface SetupAfterHookBanReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookStructureReport['metrics'] & {
    setupAfterHookShots: number;
  };
  findings: SetupAfterHookBanFinding[];
  thresholds: Required<SetupAfterHookBanOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };
const r2 = (n: number) => Math.round(n * 100) / 100;

export function evaluateSetupAfterHookBan(
  shotSpecRaw: unknown,
  opts: SetupAfterHookBanOptions = {},
): SetupAfterHookBanReport {
  const child = evaluateHookStructure(shotSpecRaw, opts);
  const thresholds: Required<SetupAfterHookBanOptions> = { ...child.thresholds };
  const findings: SetupAfterHookBanFinding[] = [...(child.findings as SetupAfterHookBanFinding[])];

  let setupAfterHookShots = 0;
  const firstHookAtSec = child.metrics.firstHookAtSec;
  const p = ShotSpecDocSchema.safeParse(shotSpecRaw);
  if (p.success && firstHookAtSec !== null) {
    let clock = 0;
    const bad: string[] = [];
    for (const s of p.data.shots) {
      const start = clock;
      clock += s.durSec;
      if ((s as { beatRole?: string }).beatRole === 'setup' && start >= firstHookAtSec) {
        bad.push(s.shotId);
      }
    }
    if (bad.length > 0) {
      setupAfterHookShots = bad.length;
      findings.push({
        code: 'SETUP_AFTER_HOOK',
        severity: 'FAIL',
        shotIds: bad,
        message: `${bad.length} 镜 setup 起点 ≥ firstHook@${r2(firstHookAtSec)}s`,
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { ...child.metrics, setupAfterHookShots },
    findings,
    thresholds,
    gates: GATES,
  };
}
