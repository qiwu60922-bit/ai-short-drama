/**
 * Wave12 · multi-shot one-click orchestrator (gap items 2+3).
 * shots[] → per shot runOneClickShot (gates + injected live port) → checkpoint → ffmpeg concat Worker.
 * Resume: re-run with same request + workDir skips shots already SUCCEEDED in checkpoint.json.
 * Offline by design: the only "live" path is an injected OneClickLivePort (tests/CLI use a fake provider). ≠G3.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import { runOneClickShot, type OneClickLivePort, type OneClickShotResult } from '@/agents/generation/oneclick-shot';
import { runMultiShotConcat, type ConcatDeps, type ConcatResult } from './ffmpeg-concat-worker';
import { createShotQcRecord, type QcDeps } from './shot-qc-record';

export const MULTISHOT_EXIT = { OK: 0, USAGE: 2, CHECKPOINT_MISMATCH: 34, QC_FAILED: 35, INTERNAL: 60 } as const;

const sha = z.string().regex(/^[a-f0-9]{64}$/i);
const RefSchema = z.object({
  characterId: z.string().min(1),
  appearanceRevisionId: z.string().min(1),
  refContentSha256: sha,
  appearanceContentSha256: sha.optional(),
  operatorKind: z.enum(['hero_portrait', 'dna_locked_export']).optional(),
  approvedTemporary: z.object({ actor: z.string().min(1), reason: z.string().min(1) }).optional(),
  firstFramePath: z.string().min(1),
});

/** Formal multi-shot list (gap item 2). */
export const MultiShotListSchema = z.object({
  schemaVersion: z.literal(1),
  episodeId: z.string().min(1),
  mode: z.enum(['dry-run', 'live']),
  canvas: z.object({ width: z.number().int().positive(), height: z.number().int().positive(), fps: z.number().positive() })
    .default({ width: 1344, height: 768, fps: 24 }),
  durationRange: z.object({ minSeconds: z.number().positive(), maxSeconds: z.number().positive() })
    .default({ minSeconds: 60, maxSeconds: 90 }),
  defaultRef: RefSchema.optional(),
  shots: z.array(z.object({
    shotId: z.string().min(1).regex(/^[A-Za-z0-9._-]+$/, 'shotId must be filename-safe'),
    order: z.number().int().nonnegative(),
    seed: z.string().min(1),
    positivePrompt: z.string().min(1),
    ref: RefSchema.optional(),
  })).min(1),
  workDir: z.string().min(1),
  outFile: z.string().default('episode.mp4'),
}).superRefine((v, ctx) => {
  const ids = new Set(v.shots.map((s) => s.shotId));
  if (ids.size !== v.shots.length) ctx.addIssue({ code: 'custom', path: ['shots'], message: 'duplicate shotId' });
  const orders = [...v.shots.map((s) => s.order)].sort((a, b) => a - b);
  if (orders.some((o, i) => o !== i)) ctx.addIssue({ code: 'custom', path: ['shots'], message: 'order must be contiguous 0..N-1' });
});
export type MultiShotList = z.infer<typeof MultiShotListSchema>;

export interface ShotCheckpoint { status: 'SUCCEEDED' | 'FAILED' | 'PLANNED'; exitCode: number; artifactPath?: string; contentSha256?: string; qcRecordPath?: string; error?: string; attempts: number; }
export interface Checkpoint { schemaVersion: 1; episodeId: string; requestSha256: string; shots: Record<string, ShotCheckpoint>; }

export interface MultiShotDeps {
  env?: Record<string, string | undefined>;
  live?: OneClickLivePort;
  concat?: ConcatDeps;
  fileExists?: (p: string) => Promise<boolean>;
  /** When set, save first/mid/last stills + qc-record.json per succeeded shot under <workDir>/qc (PENDING_REVIEW). */
  qc?: { enabled: boolean; deps?: QcDeps };
}

export interface MultiShotResult {
  ok: boolean;
  exitCode: number;
  episodeId?: string;
  mode?: 'dry-run' | 'live';
  checkpointPath?: string;
  shots: { shotId: string; status: ShotCheckpoint['status'] | 'SKIPPED_RESUMED' | 'NOT_RUN'; exitCode?: number }[];
  failedShotId?: string;
  resumable?: boolean;
  concat?: ConcatResult;
  output?: { path: string; contentSha256: string };
  identity: { status: 'PENDING_REVIEW'; note: string };
  gates: { V11_G3: 'NOT_EVALUATED'; publish: 'FORBIDDEN' };
  error?: { code: string; message: string };
}

/** Stable hash of the generation-relevant request (resume must not mix different plans). */
export function requestFingerprint(req: MultiShotList): string {
  const material = { episodeId: req.episodeId, canvas: req.canvas, defaultRef: req.defaultRef ?? null,
    shots: [...req.shots].sort((a, b) => a.order - b.order) };
  return createHash('sha256').update(JSON.stringify(material)).digest('hex');
}

async function loadCheckpoint(path: string): Promise<Checkpoint | null> {
  try { return JSON.parse(await readFile(path, 'utf8')) as Checkpoint; } catch { return null; }
}
async function saveCheckpoint(path: string, cp: Checkpoint): Promise<void> {
  const tmp = `${path}.tmp`;
  await writeFile(tmp, JSON.stringify(cp, null, 2));
  await rename(tmp, path);
}

export async function runMultiShotOneClick(raw: unknown, deps: MultiShotDeps = {}): Promise<MultiShotResult> {
  const base = {
    identity: { status: 'PENDING_REVIEW' as const, note: 'TECH only; per-shot Continuity three-frame gate separate' },
    gates: { V11_G3: 'NOT_EVALUATED' as const, publish: 'FORBIDDEN' as const },
  };
  const exists = deps.fileExists ?? (async (p: string) => readFile(p).then(() => true, () => false));
  try {
    const parsed = MultiShotListSchema.safeParse(raw);
    if (!parsed.success)
      return { ...base, ok: false, exitCode: MULTISHOT_EXIT.USAGE, shots: [], error: { code: 'USAGE', message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') } };
    const req = parsed.data;
    const shots = [...req.shots].sort((a, b) => a.order - b.order);
    await mkdir(req.workDir, { recursive: true });
    const checkpointPath = join(req.workDir, 'checkpoint.json');
    const fp = requestFingerprint(req);
    const ctx = { episodeId: req.episodeId, mode: req.mode, checkpointPath };

    let cp = req.mode === 'live' ? await loadCheckpoint(checkpointPath) : null;
    if (cp && cp.requestSha256 !== fp)
      return { ...base, ...ctx, ok: false, exitCode: MULTISHOT_EXIT.CHECKPOINT_MISMATCH, shots: [],
        error: { code: 'CHECKPOINT_MISMATCH', message: 'workDir checkpoint belongs to a different request; use a new workDir' } };
    cp ??= { schemaVersion: 1, episodeId: req.episodeId, requestSha256: fp, shots: {} };

    const report: MultiShotResult['shots'] = [];
    const takes: { shotId: string; order: number; takePath: string }[] = [];

    for (const s of shots) {
      const prev = cp.shots[s.shotId];
      if (req.mode === 'live' && prev?.status === 'SUCCEEDED' && prev.artifactPath && (await exists(prev.artifactPath))) {
        report.push({ shotId: s.shotId, status: 'SKIPPED_RESUMED', exitCode: 0 });
        takes.push({ shotId: s.shotId, order: s.order, takePath: prev.artifactPath });
        continue;
      }
      const ref = s.ref ?? req.defaultRef;
      const r: OneClickShotResult = await runOneClickShot({
        schemaVersion: 1,
        mode: req.mode,
        shot: { shotSpecId: `${req.episodeId}-${s.shotId}` },
        ...(ref ? { ref } : {}),
        render: { width: req.canvas.width, height: req.canvas.height, seed: s.seed, positivePrompt: s.positivePrompt },
      }, { env: deps.env, live: deps.live, runId: `ocr-${req.episodeId}-${s.shotId}` });

      if (req.mode === 'dry-run') {
        report.push({ shotId: s.shotId, status: r.ok ? 'PLANNED' : 'FAILED', exitCode: r.exitCode });
        if (!r.ok) {
          for (const rest of shots.slice(shots.indexOf(s) + 1)) report.push({ shotId: rest.shotId, status: 'NOT_RUN' });
          return { ...base, ...ctx, ok: false, exitCode: r.exitCode, shots: report, failedShotId: s.shotId, resumable: false, error: r.error };
        }
        continue;
      }

      const attempts = (prev?.attempts ?? 0) + 1;
      if (!r.ok || !r.artifact?.path) {
        cp.shots[s.shotId] = { status: 'FAILED', exitCode: r.exitCode, error: r.error?.message ?? 'no artifact path', attempts };
        await saveCheckpoint(checkpointPath, cp);
        report.push({ shotId: s.shotId, status: 'FAILED', exitCode: r.exitCode });
        for (const rest of shots.slice(shots.indexOf(s) + 1)) report.push({ shotId: rest.shotId, status: 'NOT_RUN' });
        return { ...base, ...ctx, ok: false, exitCode: r.ok ? MULTISHOT_EXIT.INTERNAL : r.exitCode, shots: report, failedShotId: s.shotId,
          resumable: true, error: r.error ?? { code: 'NO_ARTIFACT', message: 'provider returned no artifact path' } };
      }
      let qcRecordPath: string | undefined;
      if (deps.qc?.enabled) {
        try {
          await createShotQcRecord({ shotId: s.shotId, takePath: r.artifact.path, takeSha256: r.artifact.contentSha256, qcDir: join(req.workDir, 'qc') }, deps.qc.deps);
          qcRecordPath = join(req.workDir, 'qc', s.shotId, 'qc-record.json');
        } catch (e) {
          cp.shots[s.shotId] = { status: 'FAILED', exitCode: MULTISHOT_EXIT.QC_FAILED, error: `QC stills: ${(e as Error).message}`, attempts };
          await saveCheckpoint(checkpointPath, cp);
          report.push({ shotId: s.shotId, status: 'FAILED', exitCode: MULTISHOT_EXIT.QC_FAILED });
          for (const rest of shots.slice(shots.indexOf(s) + 1)) report.push({ shotId: rest.shotId, status: 'NOT_RUN' });
          return { ...base, ...ctx, ok: false, exitCode: MULTISHOT_EXIT.QC_FAILED, shots: report, failedShotId: s.shotId, resumable: true,
            error: { code: 'QC_FAILED', message: (e as Error).message } };
        }
      }
      cp.shots[s.shotId] = { status: 'SUCCEEDED', exitCode: 0, artifactPath: r.artifact.path, contentSha256: r.artifact.contentSha256, attempts, ...(qcRecordPath ? { qcRecordPath } : {}) };
      await saveCheckpoint(checkpointPath, cp);
      report.push({ shotId: s.shotId, status: 'SUCCEEDED', exitCode: 0 });
      takes.push({ shotId: s.shotId, order: s.order, takePath: r.artifact.path });
    }

    if (req.mode === 'dry-run') return { ...base, ...ctx, ok: true, exitCode: MULTISHOT_EXIT.OK, shots: report };

    const concat = await runMultiShotConcat({
      schemaVersion: 1, episodeId: req.episodeId, canvas: req.canvas, durationRange: req.durationRange,
      shots: takes, outPath: join(req.workDir, req.outFile),
    }, deps.concat);
    if (!concat.ok)
      return { ...base, ...ctx, ok: false, exitCode: concat.exitCode, shots: report, concat, resumable: true, error: concat.error };
    return { ...base, ...ctx, ok: true, exitCode: MULTISHOT_EXIT.OK, shots: report, concat, output: concat.output };
  } catch (e) {
    return { ...base, ok: false, exitCode: MULTISHOT_EXIT.INTERNAL, shots: [], error: { code: 'INTERNAL', message: (e as Error).message } };
  }
}
