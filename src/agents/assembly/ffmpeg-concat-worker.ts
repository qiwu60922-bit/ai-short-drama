/**
 * Wave12 · multi-shot ffmpeg concat Worker (ADR WAVE12_ADR_DURATION_60_90S D1/D3).
 * shots[] → validate (order / canvas / fps / total duration) → concat demuxer (-c copy) → out mp4 + sha.
 * Process-local only: no network, no provider calls. Non-zero ⇒ failure code, never fake green. ≠G3.
 */
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { z } from 'zod';

export const CONCAT_EXIT = {
  OK: 0, USAGE: 2, SHOTS_INVALID: 30, CANVAS_MISMATCH: 31, DURATION_OUT_OF_RANGE: 32, TAKE_MISSING: 33,
  FFMPEG_FAILED: 70, PROBE_FAILED: 71, INTERNAL: 60,
} as const;

/** Average H3 single-shot length observed (ADR). */
export const H3_SHOT_SECONDS = 5.2;
export const planShotCount = (targetSeconds: number, perShot = H3_SHOT_SECONDS) => Math.ceil(targetSeconds / perShot);

export const MultiShotConcatRequestSchema = z.object({
  schemaVersion: z.literal(1),
  episodeId: z.string().min(1),
  canvas: z.object({ width: z.number().int().positive(), height: z.number().int().positive(), fps: z.number().positive() })
    .default({ width: 1344, height: 768, fps: 24 }),
  durationRange: z.object({ minSeconds: z.number().positive(), maxSeconds: z.number().positive() })
    .default({ minSeconds: 60, maxSeconds: 90 }),
  shots: z.array(z.object({
    shotId: z.string().min(1),
    order: z.number().int().nonnegative(),
    takePath: z.string().min(1),
    takeId: z.string().min(1).optional(),
  })).min(1),
  outPath: z.string().min(1),
});
export type MultiShotConcatRequest = z.infer<typeof MultiShotConcatRequestSchema>;

export interface ProbeInfo { width: number; height: number; fps: number; durationSeconds: number; }
export interface ConcatDeps {
  probe?: (path: string) => Promise<ProbeInfo>;
  runFfmpeg?: (args: string[]) => Promise<{ code: number; stderr: string }>;
  exists?: (path: string) => Promise<boolean>;
  sha256File?: (path: string) => Promise<string>;
  writeListFile?: (path: string, content: string) => Promise<void>;
}

export interface ConcatResult {
  ok: boolean;
  exitCode: number;
  episodeId?: string;
  shotCount?: number;
  totalSeconds?: number;
  output?: { path: string; contentSha256: string };
  ffmpegArgs?: string[];
  identity: { status: 'PENDING_REVIEW'; note: string };
  gates: { V11_G3: 'NOT_EVALUATED'; publish: 'FORBIDDEN' };
  error?: { code: string; message: string };
}

/** concat demuxer list; single quotes escaped per ffmpeg rules. */
export function buildConcatList(paths: string[]): string {
  return paths.map((p) => `file '${resolve(p).replace(/'/g, "'\\''")}'`).join('\n') + '\n';
}

export function buildFfmpegArgs(listPath: string, outPath: string): string[] {
  return ['-hide_banner', '-nostdin', '-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', '-movflags', '+faststart', outPath];
}

const run = (cmd: string, args: string[]) => new Promise<{ code: number; stdout: string; stderr: string }>((res) => {
  execFile(cmd, args, { maxBuffer: 16 * 1024 * 1024 }, (err, stdout, stderr) => {
    res({ code: err ? (typeof (err as { code?: unknown }).code === 'number' ? (err as { code: number }).code : 1) : 0, stdout, stderr });
  });
});

export async function ffprobeInfo(path: string): Promise<ProbeInfo> {
  const r = await run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate:format=duration', '-of', 'json', path]);
  if (r.code !== 0) throw new Error(`ffprobe failed: ${r.stderr.trim()}`);
  const j = JSON.parse(r.stdout) as { streams?: { width: number; height: number; r_frame_rate: string }[]; format?: { duration?: string } };
  const s = j.streams?.[0];
  if (!s) throw new Error('no video stream');
  const [n, d] = s.r_frame_rate.split('/').map(Number);
  return { width: s.width, height: s.height, fps: d ? n / d : n, durationSeconds: Number(j.format?.duration ?? 0) };
}

const defaults: Required<ConcatDeps> = {
  probe: ffprobeInfo,
  runFfmpeg: async (args) => { const r = await run('ffmpeg', args); return { code: r.code, stderr: r.stderr }; },
  exists: async (p) => readFile(p).then(() => true, () => false),
  sha256File: async (p) => createHash('sha256').update(await readFile(p)).digest('hex'),
  writeListFile: async (p, c) => { await mkdir(dirname(p), { recursive: true }); await writeFile(p, c); },
};

export async function runMultiShotConcat(raw: unknown, deps: ConcatDeps = {}): Promise<ConcatResult> {
  const d = { ...defaults, ...deps };
  const base = {
    identity: { status: 'PENDING_REVIEW' as const, note: 'concat TECH only; per-shot identity gate separate' },
    gates: { V11_G3: 'NOT_EVALUATED' as const, publish: 'FORBIDDEN' as const },
  };
  const fail = (exitCode: number, code: string, message: string, extra: Partial<ConcatResult> = {}): ConcatResult =>
    ({ ...base, ...extra, ok: false, exitCode, error: { code, message } });
  try {
    const p = MultiShotConcatRequestSchema.safeParse(raw);
    if (!p.success) return fail(CONCAT_EXIT.USAGE, 'USAGE', p.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
    const req = p.data;
    const ctx = { episodeId: req.episodeId, shotCount: req.shots.length };
    if (req.durationRange.minSeconds > req.durationRange.maxSeconds) return fail(CONCAT_EXIT.USAGE, 'USAGE', 'durationRange min > max', ctx);

    const ids = new Set(req.shots.map((s) => s.shotId));
    if (ids.size !== req.shots.length) return fail(CONCAT_EXIT.SHOTS_INVALID, 'SHOTS_INVALID', 'duplicate shotId', ctx);
    const shots = [...req.shots].sort((a, b) => a.order - b.order);
    if (shots.some((s, i) => s.order !== i)) return fail(CONCAT_EXIT.SHOTS_INVALID, 'SHOTS_INVALID', 'order must be contiguous 0..N-1', ctx);
    if (shots.some((s) => resolve(s.takePath) === resolve(req.outPath))) return fail(CONCAT_EXIT.SHOTS_INVALID, 'SHOTS_INVALID', 'outPath collides with a take', ctx);

    for (const s of shots) if (!(await d.exists(s.takePath))) return fail(CONCAT_EXIT.TAKE_MISSING, 'TAKE_MISSING', `take missing for ${s.shotId}: ${s.takePath}`, ctx);

    let total = 0;
    for (const s of shots) {
      let info: ProbeInfo;
      try { info = await d.probe(s.takePath); } catch (e) { return fail(CONCAT_EXIT.PROBE_FAILED, 'PROBE_FAILED', `${s.shotId}: ${(e as Error).message}`, ctx); }
      if (info.width !== req.canvas.width || info.height !== req.canvas.height || Math.abs(info.fps - req.canvas.fps) > 0.01)
        return fail(CONCAT_EXIT.CANVAS_MISMATCH, 'CANVAS_MISMATCH',
          `${s.shotId}: ${info.width}x${info.height}@${info.fps} ≠ ${req.canvas.width}x${req.canvas.height}@${req.canvas.fps}`, ctx);
      total += info.durationSeconds;
    }
    const totalSeconds = Math.round(total * 1000) / 1000;
    if (totalSeconds < req.durationRange.minSeconds || totalSeconds > req.durationRange.maxSeconds)
      return fail(CONCAT_EXIT.DURATION_OUT_OF_RANGE, 'DURATION_OUT_OF_RANGE',
        `total ${totalSeconds}s outside [${req.durationRange.minSeconds},${req.durationRange.maxSeconds}] (need ~${planShotCount(req.durationRange.minSeconds)}–${planShotCount(req.durationRange.maxSeconds)} shots)`, { ...ctx, totalSeconds });

    const listPath = `${req.outPath}.concat.txt`;
    await d.writeListFile(listPath, buildConcatList(shots.map((s) => s.takePath)));
    const args = buildFfmpegArgs(listPath, req.outPath);
    const r = await d.runFfmpeg(args);
    if (r.code !== 0) return fail(CONCAT_EXIT.FFMPEG_FAILED, 'FFMPEG_FAILED', r.stderr.trim().split('\n').slice(-3).join(' | '), { ...ctx, totalSeconds, ffmpegArgs: args });
    if (!(await d.exists(req.outPath))) return fail(CONCAT_EXIT.FFMPEG_FAILED, 'FFMPEG_FAILED', 'ffmpeg exit 0 but no output', { ...ctx, totalSeconds, ffmpegArgs: args });
    return { ...base, ...ctx, ok: true, exitCode: CONCAT_EXIT.OK, totalSeconds, ffmpegArgs: args, output: { path: req.outPath, contentSha256: await d.sha256File(req.outPath) } };
  } catch (e) {
    return fail(CONCAT_EXIT.INTERNAL, 'INTERNAL', (e as Error).message);
  }
}
