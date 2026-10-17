/**
 * V12 · Hook Structure Gate (钩子·增量·悬念), pre-generation, offline.
 *
 * Reverse-engineered from public text breakdowns of 2026-10 红果 hits (structure only, no footage):
 *  - 《万妖图录传》: 开头3秒抛冲突 → 中段一个反转或信息增量 → 结尾卡在最大悬念处断掉;
 *    "给每一集标注钩子、增量、悬念，归不进这三类的镜头全删".
 *  - 《聚宝仙盆之杂灵根才是真BOSS》: 废柴设定反转 + 季末开放悬念、下季开篇承接.
 *  - 《不候，过期离婚》: 第一场就是危机（离婚当天车祸失忆），不做铺垫.
 *
 * Each ShotSpec shot may carry `beatRole` ∈ BEAT_ROLES (incl. `reaction` for 天幕式反应镜). The gate checks:
 *  HOOK_LATE (FAIL)          no `hook` shot starting inside the first hookWindowSec (default 3s)
 *  TURN_MISSING (FAIL)       no `reversal`/`increment` shot starting in the middle window (default 25–75%)
 *  CLIFFHANGER_MISSING (FAIL) last `cliffhanger` shot does not end within tailToleranceSec of the end (default 3s,
 *                            so a short black title card may follow it)
 *  INVALID_ROLE (FAIL)       beatRole outside the vocabulary (typo guard)
 *  UNTAGGED_SHOT (WARN|FAIL) shot without beatRole (FAIL when requireAllTagged)
 *  FIRST_SHOT_LONG (WARN)    first shot longer than maxFirstShotSec (default 3s)
 *  SETUP_HEAVY (WARN)        `setup` seconds above maxSetupRatio of runtime (default 0.5)
 * Engineering gate only: PASS ≠ Final ≠ G3 (a human still judges whether the hook actually lands).
 */
import { ShotSpecDocSchema } from './beatplan-to-multishot';

export const BEAT_ROLES = ['hook', 'increment', 'reversal', 'cliffhanger', 'setup', 'reaction'] as const;
export type BeatRole = (typeof BEAT_ROLES)[number];

export interface HookStructureOptions {
  hookWindowSec?: number;
  maxFirstShotSec?: number;
  midWindow?: [number, number];
  tailToleranceSec?: number;
  maxSetupRatio?: number;
  requireAllTagged?: boolean;
}

export type HookFinding = {
  code: 'SCHEMA' | 'HOOK_LATE' | 'TURN_MISSING' | 'CLIFFHANGER_MISSING' | 'INVALID_ROLE' | 'UNTAGGED_SHOT' | 'FIRST_SHOT_LONG' | 'SETUP_HEAVY';
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookStructureReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    totalSeconds: number;
    firstHookAtSec: number | null;
    turnAtSec: number | null;
    cliffhangerEndsAtSec: number | null;
    taggedShots: number;
    untaggedShots: number;
    setupSeconds: number;
  };
  findings: HookFinding[];
  thresholds: Required<HookStructureOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const isRole = (v: unknown): v is BeatRole => typeof v === 'string' && (BEAT_ROLES as readonly string[]).includes(v);

export function evaluateHookStructure(shotSpecRaw: unknown, opts: HookStructureOptions = {}): HookStructureReport {
  const t: Required<HookStructureOptions> = {
    hookWindowSec: 3, maxFirstShotSec: 3, midWindow: [0.25, 0.75], tailToleranceSec: 3, maxSetupRatio: 0.5, requireAllTagged: false, ...opts,
  };
  const gates = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };
  const p = ShotSpecDocSchema.safeParse(shotSpecRaw);
  if (!p.success) {
    return {
      verdict: 'FAIL', thresholds: t, gates,
      metrics: { totalSeconds: 0, firstHookAtSec: null, turnAtSec: null, cliffhangerEndsAtSec: null, taggedShots: 0, untaggedShots: 0, setupSeconds: 0 },
      findings: [{ code: 'SCHEMA', severity: 'FAIL', message: p.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') }],
    };
  }

  let clock = 0;
  const shots = p.data.shots.map((s) => {
    const raw = (s as { beatRole?: unknown }).beatRole;
    const start = clock;
    clock += s.durSec;
    return { id: s.shotId, dur: s.durSec, start, end: clock, raw, role: isRole(raw) ? raw : undefined };
  });
  const total = clock;
  const findings: HookFinding[] = [];

  const invalid = shots.filter((s) => s.raw !== undefined && s.raw !== null && !s.role);
  if (invalid.length) findings.push({ code: 'INVALID_ROLE', severity: 'FAIL', message: `beatRole must be one of ${BEAT_ROLES.join('|')}`, shotIds: invalid.map((s) => s.id) });

  const hook = shots.find((s) => s.role === 'hook');
  if (!hook || hook.start >= t.hookWindowSec) {
    findings.push({ code: 'HOOK_LATE', severity: 'FAIL', message: hook ? `first hook starts at ${r2(hook.start)}s ≥ ${t.hookWindowSec}s` : 'no hook shot', ...(hook ? { shotIds: [hook.id] } : {}) });
  }

  const [lo, hi] = [total * t.midWindow[0], total * t.midWindow[1]];
  const turn = shots.find((s) => (s.role === 'reversal' || s.role === 'increment') && s.start >= lo && s.start <= hi);
  if (!turn) findings.push({ code: 'TURN_MISSING', severity: 'FAIL', message: `no reversal/increment starting between ${r2(lo)}s and ${r2(hi)}s` });

  const cliff = [...shots].reverse().find((s) => s.role === 'cliffhanger');
  if (!cliff || total - cliff.end > t.tailToleranceSec) {
    findings.push({ code: 'CLIFFHANGER_MISSING', severity: 'FAIL', message: cliff ? `last cliffhanger ends ${r2(total - cliff.end)}s before the end (> ${t.tailToleranceSec}s)` : 'no cliffhanger shot', ...(cliff ? { shotIds: [cliff.id] } : {}) });
  }

  const untagged = shots.filter((s) => s.raw === undefined || s.raw === null);
  if (untagged.length) findings.push({ code: 'UNTAGGED_SHOT', severity: t.requireAllTagged ? 'FAIL' : 'WARN', message: `${untagged.length} shots without beatRole (钩子/增量/悬念都不是的镜头考虑删掉)`, shotIds: untagged.map((s) => s.id) });

  if (shots[0].dur > t.maxFirstShotSec) findings.push({ code: 'FIRST_SHOT_LONG', severity: 'WARN', message: `first shot ${shots[0].dur}s > ${t.maxFirstShotSec}s`, shotIds: [shots[0].id] });

  const setup = shots.filter((s) => s.role === 'setup').reduce((a, s) => a + s.dur, 0);
  if (setup > total * t.maxSetupRatio) findings.push({ code: 'SETUP_HEAVY', severity: 'WARN', message: `setup ${r2(setup)}s > ${t.maxSetupRatio * 100}% of ${r2(total)}s` });

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      totalSeconds: r2(total),
      firstHookAtSec: hook ? r2(hook.start) : null,
      turnAtSec: turn ? r2(turn.start) : null,
      cliffhangerEndsAtSec: cliff ? r2(cliff.end) : null,
      taggedShots: shots.length - untagged.length,
      untaggedShots: untagged.length,
      setupSeconds: r2(setup),
    },
    findings, thresholds: t, gates,
  };
}
