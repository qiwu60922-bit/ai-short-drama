/**
 * V12 · Story Rhythm Gate (wave13 WAVE13_V12_BEAT_DENSITY_ACCEPTANCE 口径), pre-generation, offline.
 * Effective events = cuts + extra action beats (action text split on · → / ， ; etc.).
 * Density normalised to a 90s window; failure mode = one action stretched over the runtime.
 * Engineering gate only: PASS ≠ Final ≠ G3 (human eye still judges rhythm).
 */
import { ShotSpecDocSchema } from './beatplan-to-multishot';

export interface RhythmOptions {
  /** Effective events required per 90s (wave13: 10–20). Default 10. */
  minEventsPer90s?: number;
  /** Max single shot length (s). Default 8. */
  maxShotSeconds?: number;
  /** Max seconds per action beat inside a shot. Default 8. */
  maxSecondsPerEvent?: number;
  /** Require ShotSpec `cutMotive` on every shot after the first. Default false (WARN). */
  requireCutMotive?: boolean;
}

export type RhythmFinding = { code: 'SCHEMA' | 'DENSITY_LOW' | 'SHOT_TOO_LONG' | 'EVENT_STRETCH' | 'REPEATED_ACTION' | 'CUT_MOTIVE_MISSING'; severity: 'FAIL' | 'WARN'; message: string; shotIds?: string[] };
export interface RhythmReport {
  verdict: 'PASS' | 'FAIL';
  metrics: { totalSeconds: number; cutEvents: number; effectiveEvents: number; eventsPer90s: number; maxShotSeconds: number; maxSecondsPerEvent: number };
  findings: RhythmFinding[];
  thresholds: Required<RhythmOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const SPLIT = /[·→\/／，,;；、]|->/;
export function countActionBeats(action: string | undefined | null): number {
  if (!action) return 1;
  return Math.max(1, action.split(SPLIT).map((s) => s.trim()).filter(Boolean).length);
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export function evaluateStoryRhythm(shotSpecRaw: unknown, opts: RhythmOptions = {}): RhythmReport {
  const t: Required<RhythmOptions> = { minEventsPer90s: 10, maxShotSeconds: 8, maxSecondsPerEvent: 8, requireCutMotive: false, ...opts };
  const gates = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };
  const empty = { totalSeconds: 0, cutEvents: 0, effectiveEvents: 0, eventsPer90s: 0, maxShotSeconds: 0, maxSecondsPerEvent: 0 };
  const p = ShotSpecDocSchema.safeParse(shotSpecRaw);
  if (!p.success) return { verdict: 'FAIL', metrics: empty, thresholds: t, gates, findings: [{ code: 'SCHEMA', severity: 'FAIL', message: p.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') }] };
  const shots = p.data.shots as (typeof p.data.shots[number] & { cutMotive?: string })[];
  const findings: RhythmFinding[] = [];
  const total = shots.reduce((a, s) => a + s.durSec, 0);
  const beats = shots.map((s) => countActionBeats(s.action));
  const effective = beats.reduce((a, b) => a + b, 0);
  const per90 = r2((effective * 90) / total);
  const perEvent = shots.map((s, i) => s.durSec / beats[i]);

  if (per90 < t.minEventsPer90s) findings.push({ code: 'DENSITY_LOW', severity: 'FAIL', message: `${per90} effective events per 90s < ${t.minEventsPer90s}` });
  const long = shots.filter((s) => s.durSec > t.maxShotSeconds);
  if (long.length) findings.push({ code: 'SHOT_TOO_LONG', severity: 'FAIL', message: `shots over ${t.maxShotSeconds}s`, shotIds: long.map((s) => s.shotId) });
  const stretch = shots.filter((_, i) => perEvent[i] > t.maxSecondsPerEvent);
  if (stretch.length) findings.push({ code: 'EVENT_STRETCH', severity: 'FAIL', message: `single action beat held > ${t.maxSecondsPerEvent}s`, shotIds: stretch.map((s) => s.shotId) });
  for (let i = 1; i < shots.length; i++) {
    const a = shots[i - 1].action?.trim(), b = shots[i].action?.trim();
    if (a && a === b) findings.push({ code: 'REPEATED_ACTION', severity: 'WARN', message: 'consecutive shots share identical action', shotIds: [shots[i - 1].shotId, shots[i].shotId] });
  }
  const noMotive = shots.slice(1).filter((s) => !s.cutMotive);
  if (noMotive.length) findings.push({ code: 'CUT_MOTIVE_MISSING', severity: t.requireCutMotive ? 'FAIL' : 'WARN', message: `${noMotive.length} cuts without cutMotive`, shotIds: noMotive.map((s) => s.shotId) });

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { totalSeconds: r2(total), cutEvents: shots.length, effectiveEvents: effective, eventsPer90s: per90, maxShotSeconds: Math.max(...shots.map((s) => s.durSec)), maxSecondsPerEvent: r2(Math.max(...perEvent)) },
    findings, thresholds: t, gates,
  };
}
