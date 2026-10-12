/**
 * V12 · Auto Edit Worker — TS port of cloud-h3-live/scripts/auto_edit.py.
 * Edit plan (v12/BeatPlan/v1) → per-beat ffmpeg trim (re-encode) → concat demuxer → mp4 + AUTO_EDIT_RECEIPT.md.
 * Dry-run by default; zero network; refuses protected outputs; ≠G3. Plain concat (ffmpeg-concat-worker) stays as fallback.
 */
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { buildConcatList } from './ffmpeg-concat-worker';

export const EDIT_PLAN_SCHEMA = 'v12/BeatPlan/v1';
export const AUTO_EDIT_EXIT = { OK: 0, INVALID: 2, PROTECTED: 4, FFMPEG_FAILED: 70, INTERNAL: 60 } as const;

export interface EditBeat { beatId: string; order: number; sourceShotId: string; sourcePath: string; inSec?: number; outSec?: number; ss?: number; dur?: number; }
export interface EditPlan {
  schema: string; planId: string; policy: { zeroPost: boolean; protectedOutputs?: string[] };
  targetDurationSec?: number | { min: number; max: number };
  beats: EditBeat[];
  encode?: { videoCodec?: string; preset?: string; crf?: number; pixFmt?: string; audioCodec?: string; audioBitrate?: string };
  notes?: string;
}

export function beatWindow(b: Partial<EditBeat>): { ss: number; dur: number } {
  let ss: number, dur: number;
  if (b.ss !== undefined && b.dur !== undefined) { ss = b.ss; dur = b.dur; }
  else if (b.inSec !== undefined && b.dur !== undefined) { ss = b.inSec; dur = b.dur; }
  else if (b.inSec !== undefined && b.outSec !== undefined) {
    if (b.outSec <= b.inSec) throw new Error(`${b.beatId ?? '?'}: outSec must be > inSec`);
    ss = b.inSec; dur = b.outSec - b.inSec;
  } else throw new Error(`${b.beatId ?? '?'}: need inSec+outSec, or ss+dur, or inSec+dur`);
  if (!(ss >= 0) || !(dur > 0)) throw new Error(`${b.beatId ?? '?'}: invalid window ss=${ss} dur=${dur}`);
  return { ss: Math.round(ss * 1000) / 1000, dur: Math.round(dur * 1000) / 1000 };
}

export function validateEditPlan(raw: unknown, exists: (p: string) => boolean = existsSync) {
  const errors: string[] = [];
  const p = (raw ?? {}) as Partial<EditPlan>;
  if (p.schema !== EDIT_PLAN_SCHEMA) errors.push(`schema must be ${EDIT_PLAN_SCHEMA}, got ${String(p.schema)}`);
  if (!p.planId) errors.push('missing planId');
  if (p.policy?.zeroPost !== true) errors.push('policy.zeroPost must be true');
  if (!Array.isArray(p.beats) || !p.beats.length) { errors.push('beats[] empty or missing'); return { errors, beats: [] as EditBeat[], plannedSeconds: 0 }; }
  const ids = new Set<string>(), orders = new Set<number>();
  let planned = 0;
  for (const [i, b] of p.beats.entries()) {
    if (!b?.beatId) { errors.push(`beats[${i}] missing beatId`); continue; }
    if (ids.has(b.beatId)) errors.push(`duplicate beatId=${b.beatId}`); ids.add(b.beatId);
    if (!Number.isInteger(b.order)) errors.push(`${b.beatId}: order must be int`);
    else { if (orders.has(b.order)) errors.push(`duplicate order=${b.order}`); orders.add(b.order); }
    if (!b.sourceShotId) errors.push(`${b.beatId}: missing sourceShotId`);
    if (!b.sourcePath) errors.push(`${b.beatId}: missing sourcePath`);
    else if (!exists(b.sourcePath)) errors.push(`${b.beatId}: missing source ${b.sourcePath}`);
    try { planned += beatWindow(b).dur; } catch (e) { errors.push((e as Error).message); }
  }
  const beats = [...p.beats].sort((a, b) => a.order - b.order);
  return { errors, beats, plannedSeconds: Math.round(planned * 1000) / 1000 };
}

const targetRange = (t: EditPlan['targetDurationSec']) => (t === undefined ? null : typeof t === 'number' ? { min: t, max: t } : t);

export interface AutoEditOptions {
  outPath: string; workDir: string; render?: boolean;
  runFfmpeg?: (args: string[]) => Promise<{ code: number; stderr: string }>;
  probeDuration?: (p: string) => Promise<number | null>;
}
export interface AutoEditResult {
  ok: boolean; exitCode: number; mode: 'dry-run' | 'render';
  plannedSeconds: number; durationSeconds?: number | null; output?: { path: string; contentSha256: string };
  receiptPath?: string; table: { order: number; beatId: string; shot: string; ss: number; dur: number; source: string }[];
  warnings: string[]; errors: string[];
  gates: { V11_G3: 'NOT_EVALUATED'; publish: 'FORBIDDEN' };
}

const execRun = (cmd: string, args: string[]) => new Promise<{ code: number; stdout: string; stderr: string }>((res) =>
  execFile(cmd, args, { maxBuffer: 16 << 20 }, (e, stdout, stderr) => res({ code: e ? ((e as { code?: number }).code ?? 1) : 0, stdout, stderr })));
const defaultFfmpeg = async (args: string[]) => { const r = await execRun('ffmpeg', args); return { code: r.code, stderr: r.stderr }; };
const defaultProbe = async (p: string) => { const r = await execRun('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', p]); const n = Number(r.stdout.trim()); return r.code === 0 && Number.isFinite(n) ? n : null; };

export async function runAutoEdit(raw: unknown, opts: AutoEditOptions): Promise<AutoEditResult> {
  const gates = { V11_G3: 'NOT_EVALUATED' as const, publish: 'FORBIDDEN' as const };
  const mode = opts.render ? 'render' : 'dry-run';
  const v = validateEditPlan(raw);
  const plan = raw as EditPlan;
  const warnings: string[] = [];
  const base = { mode, plannedSeconds: v.plannedSeconds, warnings, gates } as const;
  if (v.errors.length) return { ...base, ok: false, exitCode: AUTO_EDIT_EXIT.INVALID, table: [], errors: v.errors };
  const table = v.beats.map((b) => ({ order: b.order, beatId: b.beatId, shot: b.sourceShotId, ...beatWindow(b), source: b.sourcePath }));
  const tr = targetRange(plan.targetDurationSec);
  if (tr && (v.plannedSeconds < tr.min || v.plannedSeconds > tr.max)) warnings.push(`planned ${v.plannedSeconds}s outside target [${tr.min},${tr.max}]`);
  if (!opts.render) return { ...base, ok: true, exitCode: AUTO_EDIT_EXIT.OK, table, errors: [] };

  const out = resolve(opts.outPath);
  if ((plan.policy.protectedOutputs ?? []).some((p) => resolve(p) === out))
    return { ...base, ok: false, exitCode: AUTO_EDIT_EXIT.PROTECTED, table, errors: [`output ${out} is protected SoT`] };
  const run = opts.runFfmpeg ?? defaultFfmpeg;
  const e = { videoCodec: 'libx264', preset: 'fast', crf: 18, pixFmt: 'yuv420p', audioCodec: 'aac', audioBitrate: '128k', ...plan.encode };
  const clips = join(opts.workDir, 'clips');
  await mkdir(clips, { recursive: true });
  const segs: string[] = [];
  for (const row of table) {
    const seg = join(clips, `${row.beatId}_${row.shot}.mp4`);
    const r = await run(['-y', '-hide_banner', '-loglevel', 'error', '-ss', String(row.ss), '-i', row.source, '-t', String(row.dur),
      '-c:v', e.videoCodec, '-preset', e.preset, '-crf', String(e.crf), '-pix_fmt', e.pixFmt, '-c:a', e.audioCodec, '-b:a', e.audioBitrate, '-movflags', '+faststart', seg]);
    if (r.code !== 0) return { ...base, ok: false, exitCode: AUTO_EDIT_EXIT.FFMPEG_FAILED, table, errors: [`trim ${row.beatId}: ${r.stderr.trim().split('\n').pop()}`] };
    segs.push(seg);
  }
  const list = join(opts.workDir, 'concat_list.txt');
  await writeFile(list, buildConcatList(segs));
  await mkdir(join(out, '..'), { recursive: true });
  const c = await run(['-y', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', out]);
  if (c.code !== 0 || !existsSync(out)) return { ...base, ok: false, exitCode: AUTO_EDIT_EXIT.FFMPEG_FAILED, table, errors: [`concat: ${c.stderr.trim()}`] };
  const durationSeconds = await (opts.probeDuration ?? defaultProbe)(out);
  const contentSha256 = createHash('sha256').update(readFileSync(out)).digest('hex');
  const receiptPath = join(opts.workDir, 'AUTO_EDIT_RECEIPT.md');
  await writeFile(receiptPath, [
    '# AUTO_EDIT_RECEIPT', '', `> planId: \`${plan.planId}\` · mode: render · ≠G3 · ZERO POST`, '',
    '| Item | Value |', '|---|---|', `| out | \`${out}\` |`, `| duration (ffprobe) | ${durationSeconds ?? 'n/a'} |`, `| planned Σ | ${v.plannedSeconds}s |`,
    `| target | ${tr ? `[${tr.min}, ${tr.max}]` : 'n/a'} |`, `| beats | ${table.length} |`, `| sha256 | \`${contentSha256}\` |`, '',
    '| order | beat | shot | ss | dur |', '|---|---|---|---|---|', ...table.map((t) => `| ${t.order} | ${t.beatId} | ${t.shot} | ${t.ss} | ${t.dur} |`), '',
    plan.notes ?? 'auto_edit · ≠G3', '',
  ].join('\n'));
  return { ...base, ok: true, exitCode: AUTO_EDIT_EXIT.OK, table, errors: [], durationSeconds, output: { path: out, contentSha256 }, receiptPath };
}

/** Build an edit plan from generated takes: centred climax window (windowSeconds) or full take; per-shot trimHints win. */
export function editPlanFromTakes(
  takes: { shotId: string; path: string; durationSeconds: number }[],
  opts: { planId: string; windowSeconds?: number; trimHints?: Record<string, { ss: number; dur: number }>; targetDurationSec?: EditPlan['targetDurationSec']; protectedOutputs?: string[] },
): EditPlan {
  const r3 = (n: number) => Math.round(n * 1000) / 1000;
  return {
    schema: EDIT_PLAN_SCHEMA, planId: opts.planId, policy: { zeroPost: true, ...(opts.protectedOutputs ? { protectedOutputs: opts.protectedOutputs } : {}) },
    ...(opts.targetDurationSec ? { targetDurationSec: opts.targetDurationSec } : {}),
    beats: takes.map((t, i) => {
      const hint = opts.trimHints?.[t.shotId];
      let ss = 0, dur = t.durationSeconds;
      if (hint) ({ ss, dur } = hint);
      else if (opts.windowSeconds && opts.windowSeconds < t.durationSeconds) { dur = opts.windowSeconds; ss = (t.durationSeconds - dur) / 2; }
      return { beatId: `b${String(i + 1).padStart(2, '0')}`, order: i, sourceShotId: t.shotId, sourcePath: t.path, ss: r3(ss), dur: r3(dur) };
    }),
  };
}
