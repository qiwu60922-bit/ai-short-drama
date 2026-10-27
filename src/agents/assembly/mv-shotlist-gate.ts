/**
 * V12 · MV Shotlist Gate (分镜表时间连续·景别分布·段落时长), pre-gen, offline, deterministic.
 *
 * Method rewritten in TypeScript from blackiseki/anime-mv-art-direction
 * (MIT, Copyright (c) 2026 blackiseki) — scripts/shotlist_check.py mechanical rules only:
 * https://github.com/blackiseki/anime-mv-art-direction
 * Not wholesale vendoring: no SKILL.md prompts / mv_lint video analysis / AE scripts /
 * Pillow·ffmpeg delivery paths. We encode JSON/object shotlist checks inspired by the
 * CSV checker (time continuity, required fields, 景别 distribution, section duration).
 *
 * Distinct from cut-timeline-gate (frame-level C### forge): this gate targets
 * section/lyric/shot-size/move/trans/asset style shotlists (CSV semantics → JSON).
 *
 * Field mapping (camelCase ↔ upstream CSV columns):
 *   no / start / end / dur / section / lyric / shot(景别) / angle / subject /
 *   move / trans / beat / asset / fx?
 * Times: number seconds or "m:ss" / "h:mm:ss" strings.
 *
 *  SCHEMA (FAIL)            overall parse fail or shots empty
 *  TIME_PARSE (FAIL)        start/end unparseable
 *  DUR_NONPOSITIVE (FAIL)   end<=start or dur<=0
 *  TIME_GAP (FAIL|>0.1s)    adjacent gap; WARN if <=0.1s and >1 frame
 *  TIME_OVERLAP (FAIL)      adjacent overlap
 *  REQUIRED_EMPTY (WARN)    required field empty (lyric may be empty; missing no → WARN)
 *  SECTION_DUR_OFF (WARN)   duration outside SECTION_DUR × 0.55/1.9
 *  SHOT_MS_HEAVY (WARN)     MS+MCU >55%
 *  SHOT_NO_CU (WARN)        no CU/ECU
 *  SHOT_NO_WIDE (WARN)      no ELS/FS
 *  FX_STACK (WARN)          fx items >2
 *  BEAT_ALIGN_LOW (WARN)    bpm given and on-beat ratio <70%
 *
 * Engineering gate only: PASS ≠ Final ≠ G3. No video/ffmpeg / MiniMax / paid APIs.
 */
import { z } from 'zod';

const SHOT_TYPES = ['ELS', 'FS', 'MLS', 'MS', 'MCU', 'CU', 'ECU'] as const;

/** Section recommended per-shot duration (seconds). From upstream references/04-shot.md §6.3. */
const SECTION_DUR: Record<string, [number, number]> = {
  intro: [2.0, 8.0],
  a: [1.5, 4.0],
  'aメロ': [1.5, 4.0],
  'a-melo': [1.5, 4.0],
  verse: [1.5, 4.0],
  b: [0.8, 3.0],
  'bメロ': [0.8, 3.0],
  'b-melo': [0.8, 3.0],
  pre: [0.8, 3.0],
  'サビ': [0.4, 2.0],
  chorus: [0.4, 2.0],
  副歌: [0.4, 2.0],
  '間奏': [1.5, 8.0],
  间奏: [1.5, 8.0],
  inter: [1.5, 8.0],
  'cメロ': [2.0, 8.0],
  'c-melo': [2.0, 8.0],
  bridge: [2.0, 8.0],
  outro: [2.0, 8.0],
};

const REQUIRED_FIELDS = [
  'no',
  'start',
  'end',
  'dur',
  'section',
  'lyric',
  'shot',
  'angle',
  'subject',
  'move',
  'trans',
  'beat',
  'asset',
] as const;

const TimeValueSchema = z.union([z.number(), z.string()]);

const ShotSchema = z
  .object({
    no: z.union([z.string(), z.number()]).optional(),
    start: TimeValueSchema,
    end: TimeValueSchema,
    dur: z.union([z.number(), z.string()]).optional(),
    section: z.union([z.string(), z.number()]).optional(),
    lyric: z.union([z.string(), z.number()]).optional(),
    shot: z.union([z.string(), z.number()]).optional(),
    angle: z.union([z.string(), z.number()]).optional(),
    subject: z.union([z.string(), z.number()]).optional(),
    move: z.union([z.string(), z.number()]).optional(),
    trans: z.union([z.string(), z.number()]).optional(),
    beat: z.union([z.string(), z.number()]).optional(),
    asset: z.union([z.string(), z.number()]).optional(),
    fx: z.union([z.string(), z.number()]).optional(),
  })
  .passthrough();

export const MvShotlistDocSchema = z
  .object({
    fps: z.number().positive().optional(),
    bpm: z.number().positive().optional(),
    shots: z.array(ShotSchema).min(1),
  })
  .passthrough();

export type MvShotlistFindingCode =
  | 'SCHEMA'
  | 'TIME_PARSE'
  | 'DUR_NONPOSITIVE'
  | 'TIME_GAP'
  | 'TIME_OVERLAP'
  | 'REQUIRED_EMPTY'
  | 'SECTION_DUR_OFF'
  | 'SHOT_MS_HEAVY'
  | 'SHOT_NO_CU'
  | 'SHOT_NO_WIDE'
  | 'FX_STACK'
  | 'BEAT_ALIGN_LOW';

export interface MvShotlistFinding {
  code: MvShotlistFindingCode;
  severity: 'FAIL' | 'WARN';
  message: string;
  path?: string;
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export interface MvShotlistReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    shotCount: number;
    totalDur: number;
    avgDur: number;
    shotTypeDist: Record<string, number>;
    beatAlignRatio?: number;
    findingCounts: { FAIL: number; WARN: number };
  };
  findings: MvShotlistFinding[];
  gates: typeof GATES;
  summary?: string;
}

interface ParsedShot {
  i: number;
  no: string;
  start: number;
  end: number;
  dur: number;
  section: string;
  lyric: string;
  shot: string;
  angle: string;
  subject: string;
  move: string;
  trans: string;
  beat: string;
  asset: string;
  fx: string;
  raw: Record<string, unknown>;
}

function schemaFail(message: string): MvShotlistReport {
  return {
    verdict: 'FAIL',
    metrics: {
      shotCount: 0,
      totalDur: 0,
      avgDur: 0,
      shotTypeDist: {},
      findingCounts: { FAIL: 1, WARN: 0 },
    },
    findings: [{ code: 'SCHEMA', severity: 'FAIL', message }],
    gates: GATES,
    summary: 'FAIL (SCHEMA)',
  };
}

/** Parse "m:ss" / "h:mm:ss" or bare number seconds. */
export function parseTime(value: unknown): number {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('non-finite number');
    return value;
  }
  const s = String(value ?? '').trim();
  if (!s) throw new Error('empty time');
  if (s.includes(':')) {
    const parts = s.split(':');
    if (parts.length === 2) {
      const m = Number(parts[0]);
      const sec = Number(parts[1]);
      if (!Number.isFinite(m) || !Number.isFinite(sec)) throw new Error(`bad m:ss "${s}"`);
      return m * 60 + sec;
    }
    if (parts.length === 3) {
      const h = Number(parts[0]);
      const m = Number(parts[1]);
      const sec = Number(parts[2]);
      if (!Number.isFinite(h) || !Number.isFinite(m) || !Number.isFinite(sec)) {
        throw new Error(`bad h:mm:ss "${s}"`);
      }
      return h * 3600 + m * 60 + sec;
    }
    throw new Error(`bad time "${s}"`);
  }
  const n = Number(s);
  if (!Number.isFinite(n)) throw new Error(`bad time "${s}"`);
  return n;
}

function fieldStr(v: unknown): string {
  if (v === undefined || v === null) return '';
  return String(v).trim();
}

function isEmptyField(v: string): boolean {
  return v === '' || v === 'nan' || v === 'None';
}

function secKey(name: string): string | null {
  const n = name.trim().toLowerCase();
  for (const k of Object.keys(SECTION_DUR)) {
    if (n.startsWith(k.toLowerCase()) || n.startsWith(k)) return k;
  }
  // also try original-case startswith for CJK keys
  for (const k of Object.keys(SECTION_DUR)) {
    if (name.trim().toLowerCase().startsWith(k.toLowerCase())) return k;
  }
  return null;
}

function countFxItems(fx: string): number {
  if (isEmptyField(fx) || fx === '-') return 0;
  return fx.split(/[+,/、，]/).map((x) => x.trim()).filter(Boolean).length;
}

function normalizeInput(input: unknown): unknown {
  if (Array.isArray(input)) {
    return { fps: 24, shots: input };
  }
  return input;
}

/**
 * Evaluate an MV / anime shotlist for time continuity, 景别 distribution, and section duration.
 */
export function evaluateMvShotlist(input: unknown): MvShotlistReport {
  const normalized = normalizeInput(input);
  const parsed = MvShotlistDocSchema.safeParse(normalized);
  if (!parsed.success) {
    return schemaFail(
      parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') ||
        'invalid shotlist',
    );
  }

  const doc = parsed.data;
  const fps = doc.fps ?? 24;
  const bpm = doc.bpm;
  const frame = 1 / fps;
  const findings: MvShotlistFinding[] = [];
  const shots: ParsedShot[] = [];

  for (let i = 0; i < doc.shots.length; i++) {
    const raw = doc.shots[i] as Record<string, unknown>;
    const label = fieldStr(raw.no) || String(i + 1);
    let start: number;
    let end: number;
    try {
      start = parseTime(raw.start);
      end = parseTime(raw.end);
    } catch (e) {
      findings.push({
        code: 'TIME_PARSE',
        severity: 'FAIL',
        message: `#${label} start/end unparseable: ${e instanceof Error ? e.message : String(e)}`,
        path: `$.shots[${i}]`,
      });
      continue;
    }
    const dur = end - start;
    const shot: ParsedShot = {
      i,
      no: fieldStr(raw.no),
      start,
      end,
      dur,
      section: fieldStr(raw.section),
      lyric: fieldStr(raw.lyric),
      shot: fieldStr(raw.shot),
      angle: fieldStr(raw.angle),
      subject: fieldStr(raw.subject),
      move: fieldStr(raw.move),
      trans: fieldStr(raw.trans),
      beat: fieldStr(raw.beat),
      asset: fieldStr(raw.asset),
      fx: fieldStr(raw.fx),
      raw,
    };
    shots.push(shot);

    if (dur <= 0) {
      findings.push({
        code: 'DUR_NONPOSITIVE',
        severity: 'FAIL',
        message: `#${label} duration <= 0 (${start} → ${end})`,
        path: `$.shots[${i}]`,
      });
    }

    for (const c of REQUIRED_FIELDS) {
      const v = fieldStr(raw[c]);
      // lyric may be empty; other required empties → WARN (upstream)
      if (c === 'lyric') continue;
      if (isEmptyField(v)) {
        findings.push({
          code: 'REQUIRED_EMPTY',
          severity: 'WARN',
          message: `#${label || i + 1} field ${c} empty`,
          path: `$.shots[${i}].${c}`,
        });
      }
    }
  }

  // Sort by start for continuity checks (same as upstream)
  const ordered = [...shots].sort((a, b) => a.start - b.start);

  for (let i = 1; i < ordered.length; i++) {
    const prev = ordered[i - 1];
    const cur = ordered[i];
    const delta = cur.start - prev.end;
    if (Math.abs(delta) <= frame * 0.6) continue;
    if (delta > 0) {
      if (delta > 0.1) {
        findings.push({
          code: 'TIME_GAP',
          severity: 'FAIL',
          message: `time gap ${delta.toFixed(3)}s: #${prev.no || prev.i + 1}(${prev.end.toFixed(2)}) → #${cur.no || cur.i + 1}(${cur.start.toFixed(2)})`,
          path: `$.shots[${cur.i}]`,
        });
      } else if (delta > frame) {
        findings.push({
          code: 'TIME_GAP',
          severity: 'WARN',
          message: `small time gap ${delta.toFixed(3)}s: #${prev.no || prev.i + 1} → #${cur.no || cur.i + 1}`,
          path: `$.shots[${cur.i}]`,
        });
      }
    } else {
      findings.push({
        code: 'TIME_OVERLAP',
        severity: 'FAIL',
        message: `time overlap ${(-delta).toFixed(3)}s: #${prev.no || prev.i + 1} & #${cur.no || cur.i + 1}`,
        path: `$.shots[${cur.i}]`,
      });
    }
  }

  // Section duration
  for (const s of shots) {
    const k = secKey(s.section);
    if (!k) continue;
    const [lo, hi] = SECTION_DUR[k];
    if (s.dur < lo * 0.55 || s.dur > hi * 1.9) {
      findings.push({
        code: 'SECTION_DUR_OFF',
        severity: 'WARN',
        message: `#${s.no || s.i + 1} dur ${s.dur.toFixed(2)}s off section "${s.section}" ref ${lo}–${hi}s`,
        path: `$.shots[${s.i}].dur`,
      });
    }
  }

  // 景别 distribution
  const dist: Record<string, number> = {};
  for (const s of shots) {
    const t = s.shot.toUpperCase();
    dist[t || '?'] = (dist[t || '?'] ?? 0) + 1;
  }
  const tot = shots.length || 1;
  const msHeavy = (dist['MS'] ?? 0) + (dist['MCU'] ?? 0);
  if (msHeavy / tot > 0.55) {
    findings.push({
      code: 'SHOT_MS_HEAVY',
      severity: 'WARN',
      message: `MS+MCU = ${((msHeavy / tot) * 100).toFixed(0)}% (>55%; flat framing)`,
      path: '$.shots',
    });
  }
  if ((dist['ECU'] ?? 0) + (dist['CU'] ?? 0) === 0) {
    findings.push({
      code: 'SHOT_NO_CU',
      severity: 'WARN',
      message: 'no CU/ECU — missing emotional close-ups',
      path: '$.shots',
    });
  }
  if ((dist['ELS'] ?? 0) + (dist['FS'] ?? 0) === 0) {
    findings.push({
      code: 'SHOT_NO_WIDE',
      severity: 'WARN',
      message: 'no ELS/FS — missing wide/space breaths',
      path: '$.shots',
    });
  }

  // FX stack
  for (const s of shots) {
    const n = countFxItems(s.fx);
    if (n > 2) {
      findings.push({
        code: 'FX_STACK',
        severity: 'WARN',
        message: `#${s.no || s.i + 1} has ${n} fx items (max 2)`,
        path: `$.shots[${s.i}].fx`,
      });
    }
  }

  // Beat align
  let beatAlignRatio: number | undefined;
  if (bpm && ordered.length > 0) {
    const beat = 60 / bpm;
    let ok = 0;
    const base = ordered[0].start;
    for (const s of ordered) {
      const rel = (s.start - base) / beat;
      const distMs = Math.abs(rel - Math.round(rel)) * beat;
      if (distMs <= frame * 1.5) ok += 1;
    }
    beatAlignRatio = ok / ordered.length;
    if (beatAlignRatio < 0.7) {
      findings.push({
        code: 'BEAT_ALIGN_LOW',
        severity: 'WARN',
        message: `beat-align ${(beatAlignRatio * 100).toFixed(0)}% (${ok}/${ordered.length}) <70% @ ${bpm} BPM`,
        path: '$.shots',
      });
    }
  }

  const failN = findings.filter((f) => f.severity === 'FAIL').length;
  const warnN = findings.filter((f) => f.severity === 'WARN').length;
  const totalDur =
    ordered.length > 0 ? ordered[ordered.length - 1].end - ordered[0].start : 0;
  const avgDur =
    shots.length > 0 ? shots.reduce((a, s) => a + s.dur, 0) / shots.length : 0;

  // Keep only known shot types + '?' in dist metrics for clarity
  const shotTypeDist: Record<string, number> = {};
  for (const [k, v] of Object.entries(dist)) {
    if ((SHOT_TYPES as readonly string[]).includes(k) || k === '?') {
      shotTypeDist[k] = v;
    } else {
      shotTypeDist[k] = v;
    }
  }

  return {
    verdict: failN > 0 ? 'FAIL' : 'PASS',
    metrics: {
      shotCount: shots.length,
      totalDur,
      avgDur,
      shotTypeDist,
      ...(beatAlignRatio !== undefined ? { beatAlignRatio } : {}),
      findingCounts: { FAIL: failN, WARN: warnN },
    },
    findings,
    gates: GATES,
    summary:
      failN > 0
        ? `FAIL (${failN} fail, ${warnN} warn)`
        : warnN > 0
          ? `PASS with ${warnN} warn`
          : 'PASS',
  };
}
