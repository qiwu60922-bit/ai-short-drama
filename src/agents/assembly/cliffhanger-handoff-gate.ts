/**
 * V12 · Cliffhanger Handoff Gate (季间悬念承接闸门), pre-generation, offline.
 *
 * Reverse-engineered from public text breakdowns of 2026-10 红果 hits (structure only, no footage):
 *  - 《持械入宋》(瑾叶剧场 AI 仿真人): multi-season continuous narrative; each season ends with open
 *    tension and the next season opens by continuing the arc (not a soft reset). Finales drive engagement.
 *  - 《满院亲戚全是上古大妖》S4: season opens with crisis then carries prior stakes.
 *  - 《聚宝仙盆》 leftover: 季间悬念 → 下季开篇立即承接.
 *
 * Compares two ShotSpec docs (prev episode + next episode). Each shot may carry `beatRole` ∈ BEAT_ROLES.
 *  SCHEMA (FAIL)              either doc fails ShotSpecDocSchema
 *  PREV_CLIFF_MISSING (FAIL)  prev has no cliffhanger ending within tailToleranceSec of prev total
 *  NEXT_HOOK_LATE (FAIL)      next has no hook starting within hookWindowSec
 *  INVALID_ROLE (FAIL)        beatRole outside BEAT_ROLES vocabulary (typo guard)
 *  HANDOFF_WEAK (WARN)        both cliff/hook have action text but share zero meaningful tokens
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { BEAT_ROLES, type BeatRole } from './hook-structure-gate';

export interface CliffhangerHandoffOptions {
  hookWindowSec?: number;
  tailToleranceSec?: number;
}

export type CliffhangerHandoffFinding = {
  code: 'SCHEMA' | 'PREV_CLIFF_MISSING' | 'NEXT_HOOK_LATE' | 'INVALID_ROLE' | 'HANDOFF_WEAK';
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface CliffhangerHandoffReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    prevTotalSeconds: number;
    nextTotalSeconds: number;
    prevCliffEndsAtSec: number | null;
    nextHookAtSec: number | null;
    sharedTokenCount: number;
  };
  findings: CliffhangerHandoffFinding[];
  thresholds: Required<CliffhangerHandoffOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const isRole = (v: unknown): v is BeatRole =>
  typeof v === 'string' && (BEAT_ROLES as readonly string[]).includes(v);

/** Particles ignored when comparing Chinese/English action handoff. */
const IGNORE_TOKENS = new Set(['的', '了', '呢', '吗', '是', '在', '有', '和', '与']);

/** Split action into meaningful Chinese chars + English words; drop particles. */
export function meaningfulTokens(text: string): Set<string> {
  const out = new Set<string>();
  for (const m of text.matchAll(/[A-Za-z0-9]+/g)) {
    const t = m[0].toLowerCase();
    if (t.length > 0 && !IGNORE_TOKENS.has(t)) out.add(t);
  }
  for (const m of text.matchAll(/[\u4e00-\u9fff]/g)) {
    if (!IGNORE_TOKENS.has(m[0])) out.add(m[0]);
  }
  return out;
}

type TimedShot = {
  id: string;
  dur: number;
  start: number;
  end: number;
  raw: unknown;
  role: BeatRole | undefined;
  action: string;
};

function timeline(shots: Array<{ shotId: string; durSec: number; beatRole?: unknown; action?: unknown }>): {
  shots: TimedShot[];
  total: number;
} {
  let clock = 0;
  const timed = shots.map((s) => {
    const raw = (s as { beatRole?: unknown }).beatRole;
    const start = clock;
    clock += s.durSec;
    const action = typeof s.action === 'string' ? s.action : '';
    return { id: s.shotId, dur: s.durSec, start, end: clock, raw, role: isRole(raw) ? raw : undefined, action };
  });
  return { shots: timed, total: clock };
}

const emptyMetrics = {
  prevTotalSeconds: 0,
  nextTotalSeconds: 0,
  prevCliffEndsAtSec: null as number | null,
  nextHookAtSec: null as number | null,
  sharedTokenCount: 0,
};

export function evaluateCliffhangerHandoff(
  prevRaw: unknown,
  nextRaw: unknown,
  opts: CliffhangerHandoffOptions = {},
): CliffhangerHandoffReport {
  const t: Required<CliffhangerHandoffOptions> = {
    hookWindowSec: opts.hookWindowSec ?? 3,
    tailToleranceSec: opts.tailToleranceSec ?? 3,
  };
  const gates = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

  const prevP = ShotSpecDocSchema.safeParse(prevRaw);
  const nextP = ShotSpecDocSchema.safeParse(nextRaw);
  if (!prevP.success || !nextP.success) {
    const parts: string[] = [];
    if (!prevP.success) {
      parts.push(`prev: ${prevP.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
    }
    if (!nextP.success) {
      parts.push(`next: ${nextP.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
    }
    return {
      verdict: 'FAIL',
      thresholds: t,
      gates,
      metrics: emptyMetrics,
      findings: [{ code: 'SCHEMA', severity: 'FAIL', message: parts.join(' | ') }],
    };
  }

  const prev = timeline(prevP.data.shots);
  const next = timeline(nextP.data.shots);
  const findings: CliffhangerHandoffFinding[] = [];

  const invalid = [...prev.shots, ...next.shots].filter(
    (s) => s.raw !== undefined && s.raw !== null && !s.role,
  );
  if (invalid.length) {
    findings.push({
      code: 'INVALID_ROLE',
      severity: 'FAIL',
      message: `beatRole must be one of ${BEAT_ROLES.join('|')}`,
      shotIds: invalid.map((s) => s.id),
    });
  }

  const cliff = [...prev.shots].reverse().find((s) => s.role === 'cliffhanger');
  if (!cliff || prev.total - cliff.end > t.tailToleranceSec) {
    findings.push({
      code: 'PREV_CLIFF_MISSING',
      severity: 'FAIL',
      message: cliff
        ? `prev cliffhanger ends ${r2(prev.total - cliff.end)}s before the end (> ${t.tailToleranceSec}s)`
        : 'prev episode has no cliffhanger shot',
      ...(cliff ? { shotIds: [cliff.id] } : {}),
    });
  }

  const hook = next.shots.find((s) => s.role === 'hook');
  if (!hook || hook.start >= t.hookWindowSec) {
    findings.push({
      code: 'NEXT_HOOK_LATE',
      severity: 'FAIL',
      message: hook
        ? `next hook starts at ${r2(hook.start)}s ≥ ${t.hookWindowSec}s`
        : 'next episode has no hook shot',
      ...(hook ? { shotIds: [hook.id] } : {}),
    });
  }

  let sharedTokenCount = 0;
  if (cliff && hook && cliff.action.trim() && hook.action.trim()) {
    const a = meaningfulTokens(cliff.action);
    const b = meaningfulTokens(hook.action);
    const shared = [...a].filter((tok) => b.has(tok));
    sharedTokenCount = shared.length;
    if (sharedTokenCount === 0) {
      findings.push({
        code: 'HANDOFF_WEAK',
        severity: 'WARN',
        message:
          'next hook action shares no meaningful tokens with prev cliffhanger — may not continue the arc (持械入宋-style handoff)',
        shotIds: [cliff.id, hook.id],
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      prevTotalSeconds: r2(prev.total),
      nextTotalSeconds: r2(next.total),
      prevCliffEndsAtSec: cliff ? r2(cliff.end) : null,
      nextHookAtSec: hook ? r2(hook.start) : null,
      sharedTokenCount,
    },
    findings,
    thresholds: t,
    gates,
  };
}
