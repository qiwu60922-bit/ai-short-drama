/** Wave12 · multi-shot one-click orchestrator (offline; fake provider + fake concat, one real-ffmpeg e2e). */
import { describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runMultiShotOneClick, MultiShotListSchema, requestFingerprint, MULTISHOT_EXIT } from '@/agents/assembly/multishot-oneclick';
import { createFakeH3Provider } from '@/agents/assembly/fake-h3-provider';
import type { OneClickLivePort } from '@/agents/generation/oneclick-shot';

const SHA = 'c'.repeat(64);
const ref = { characterId: 'ye-yuan', appearanceRevisionId: 'apr-ye-yuan-r1b', refContentSha256: SHA, appearanceContentSha256: SHA, firstFramePath: 'refs/ye.jpg' };
const list = (workDir: string, n = 13, over: Record<string, unknown> = {}) => ({
  schemaVersion: 1, episodeId: 'ep01', mode: 'live', defaultRef: ref, workDir,
  shots: Array.from({ length: n }, (_, i) => ({ shotId: `s${String(i).padStart(2, '0')}`, order: i, seed: String(40 + i), positivePrompt: `beat ${i}` })),
  ...over,
});
const LIVE = { ONECLICK_LIVE: '1' };
const tmp = () => mkdtempSync(join(tmpdir(), 'msoc-'));

/** Memory fake: returns pointer paths; failSet controls failures; files "exist" once produced. */
function memPort(failSet = new Set<string>()) {
  const made = new Set<string>();
  const port: OneClickLivePort & { calls: string[] } = {
    calls: [],
    probeReady: async () => true,
    enqueue: async (plan) => {
      const id = String(plan.shotSpecId);
      port.calls.push(id);
      if (failSet.has(id)) return { status: 'FAILED', message: 'boom' };
      const path = `/fake/${id}.mp4`; made.add(path);
      return { status: 'SUCCEEDED', promptId: id, artifact: { filename: `${id}.mp4`, contentSha256: SHA, path } };
    },
  };
  const concat = {
    exists: async (p: string) => made.has(p) || p.endsWith('episode.mp4'),
    probe: async () => ({ width: 1344, height: 768, fps: 24, durationSeconds: 5.2 }),
    writeListFile: vi.fn(async () => {}), runFfmpeg: vi.fn(async () => ({ code: 0, stderr: '' })), sha256File: async () => SHA,
  };
  return { port, concat, fileExists: async (p: string) => made.has(p) };
}

describe('multi-shot list schema', () => {
  it('rejects duplicate ids, order gaps, unsafe ids', () => {
    const w = '/tmp/x';
    const dup = list(w, 3); dup.shots[1].shotId = 's00';
    expect(MultiShotListSchema.safeParse(dup).success).toBe(false);
    const gap = list(w, 3); gap.shots[2].order = 5;
    expect(MultiShotListSchema.safeParse(gap).success).toBe(false);
    const bad = list(w, 3); bad.shots[0].shotId = '../evil';
    expect(MultiShotListSchema.safeParse(bad).success).toBe(false);
    expect(MultiShotListSchema.safeParse(list(w, 3)).success).toBe(true);
  });
  it('fingerprint changes with prompt, stable with shot order in array', () => {
    const a = MultiShotListSchema.parse(list('/w', 3));
    const b = MultiShotListSchema.parse({ ...list('/w', 3), shots: [...list('/w', 3).shots].reverse() });
    expect(requestFingerprint(a)).toBe(requestFingerprint(b));
    const c = MultiShotListSchema.parse(list('/w', 3)); c.shots[0].positivePrompt = 'other';
    expect(requestFingerprint(c)).not.toBe(requestFingerprint(a));
  });
});

describe('multi-shot orchestrator', () => {
  it('dry-run plans all shots, zero submit, no concat', async () => {
    const m = memPort();
    const r = await runMultiShotOneClick(list(tmp(), 13, { mode: 'dry-run' }), { live: m.port, concat: m.concat });
    expect(r.exitCode).toBe(0);
    expect(r.shots.every((s) => s.status === 'PLANNED')).toBe(true);
    expect(m.port.calls).toHaveLength(0);
    expect(r.concat).toBeUndefined();
  });
  it('live 13 shots → concat OK, PENDING_REVIEW / NOT_EVALUATED', async () => {
    const m = memPort();
    const r = await runMultiShotOneClick(list(tmp()), { env: LIVE, live: m.port, concat: m.concat, fileExists: m.fileExists });
    expect(r.exitCode).toBe(0);
    expect(m.port.calls).toHaveLength(13);
    expect(r.concat?.totalSeconds).toBe(67.6);
    expect(r.identity.status).toBe('PENDING_REVIEW');
    expect(r.gates.V11_G3).toBe('NOT_EVALUATED');
  });
  it('mid-run failure stops, checkpoints, then resume skips succeeded shots', async () => {
    const w = tmp();
    const fail = new Set(['ep01-s05']);
    const m = memPort(fail);
    const r1 = await runMultiShotOneClick(list(w), { env: LIVE, live: m.port, concat: m.concat, fileExists: m.fileExists });
    expect(r1.ok).toBe(false);
    expect(r1.exitCode).toBe(40);
    expect(r1.failedShotId).toBe('s05');
    expect(r1.resumable).toBe(true);
    expect(r1.shots.filter((s) => s.status === 'NOT_RUN')).toHaveLength(7);
    const cp = JSON.parse(readFileSync(join(w, 'checkpoint.json'), 'utf8'));
    expect(cp.shots.s05).toMatchObject({ status: 'FAILED', attempts: 1 });
    expect(Object.values(cp.shots).filter((s: any) => s.status === 'SUCCEEDED')).toHaveLength(5);

    fail.clear(); m.port.calls.length = 0;
    const r2 = await runMultiShotOneClick(list(w), { env: LIVE, live: m.port, concat: m.concat, fileExists: m.fileExists });
    expect(r2.exitCode).toBe(0);
    expect(m.port.calls).toEqual(Array.from({ length: 8 }, (_, i) => `ep01-s${String(i + 5).padStart(2, '0')}`));
    expect(r2.shots.filter((s) => s.status === 'SKIPPED_RESUMED')).toHaveLength(5);
    expect(JSON.parse(readFileSync(join(w, 'checkpoint.json'), 'utf8')).shots.s05.attempts).toBe(2);
  });
  it('resume regenerates a succeeded shot whose artifact vanished', async () => {
    const w = tmp(); const m = memPort();
    await runMultiShotOneClick(list(w), { env: LIVE, live: m.port, concat: m.concat, fileExists: m.fileExists });
    m.port.calls.length = 0;
    await runMultiShotOneClick(list(w), { env: LIVE, live: m.port, concat: m.concat, fileExists: async (p) => !p.includes('s03') });
    expect(m.port.calls).toEqual(['ep01-s03']);
  });
  it('checkpoint from a different request → 34', async () => {
    const w = tmp(); const m = memPort(new Set(['ep01-s01']));
    await runMultiShotOneClick(list(w), { env: LIVE, live: m.port, concat: m.concat, fileExists: m.fileExists });
    const changed = list(w); changed.shots[0].positivePrompt = 'changed';
    const r = await runMultiShotOneClick(changed, { env: LIVE, live: m.port, concat: m.concat, fileExists: m.fileExists });
    expect(r.exitCode).toBe(MULTISHOT_EXIT.CHECKPOINT_MISMATCH);
  });
  it('per-shot gates propagate: no live flag → 3; missing ref → 20; bad seed → 21', async () => {
    const m = memPort();
    expect((await runMultiShotOneClick(list(tmp()), { env: {}, live: m.port })).exitCode).toBe(3);
    expect((await runMultiShotOneClick(list(tmp(), 13, { defaultRef: undefined }), { env: LIVE, live: m.port })).exitCode).toBe(20);
    const bad = list(tmp()); bad.shots[2].seed = '-1';
    const r = await runMultiShotOneClick(bad, { env: LIVE, live: m.port, concat: m.concat, fileExists: m.fileExists });
    expect(r.exitCode).toBe(21);
    expect(r.failedShotId).toBe('s02');
    expect(m.port.calls).toHaveLength(2);
  });
  it('concat failure (duration out of range) is reported, resumable', async () => {
    const m = memPort();
    const r = await runMultiShotOneClick(list(tmp(), 5), { env: LIVE, live: m.port, concat: m.concat, fileExists: m.fileExists });
    expect(r.exitCode).toBe(32);
    expect(r.resumable).toBe(true);
  });
  it('bad schema → 2', async () => {
    expect((await runMultiShotOneClick({ schemaVersion: 1 })).exitCode).toBe(2);
  });

  const hasFfmpeg = (() => { try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return true; } catch { return false; } })();
  it.skipIf(!hasFfmpeg)('e2e real ffmpeg: fake provider fails shot 2, resume → 3-shot mp4', async () => {
    const w = tmp();
    const fail = new Set(['syn-s02']);
    const port = createFakeH3Provider({ outDir: join(w, 'takes'), seconds: 1, failShotSpecIds: fail });
    const l = { ...list(w, 3, { episodeId: 'syn', durationRange: { minSeconds: 2, maxSeconds: 4 } }), canvas: { width: 320, height: 240, fps: 24 } };
    const r1 = await runMultiShotOneClick(l, { env: LIVE, live: port });
    expect(r1.failedShotId).toBe('s02');
    fail.clear();
    const r2 = await runMultiShotOneClick(l, { env: LIVE, live: port });
    expect(r2.exitCode).toBe(0);
    expect(port.calls).toEqual(['syn-s00', 'syn-s01', 'syn-s02', 'syn-s02']);
    expect(existsSync(join(w, 'episode.mp4'))).toBe(true);
    expect(r2.concat?.totalSeconds).toBeCloseTo(3, 1);
  }, 60_000);
});
