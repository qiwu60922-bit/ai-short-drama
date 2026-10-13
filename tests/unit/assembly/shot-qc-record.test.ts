/** Per-shot QC stills (first/mid/last) for human identity review; never auto-pass. */
import { describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createShotQcRecord, qcSampleTimes, recordHumanVerdict } from '@/agents/assembly/shot-qc-record';
import { runMultiShotOneClick } from '@/agents/assembly/multishot-oneclick';
import { createFakeH3Provider } from '@/agents/assembly/fake-h3-provider';

const tmp = () => mkdtempSync(join(tmpdir(), 'qc-'));
const fakeDeps = () => ({
  probe: async () => ({ width: 1344, height: 768, fps: 24, durationSeconds: 5.2 }),
  extractFrame: vi.fn(async () => {}), sha256File: async () => 'e'.repeat(64), now: () => '2026-10-12T07:00:00Z',
});

describe('shot QC record', () => {
  it('sample times: 0 / mid / last frame', () => {
    expect(qcSampleTimes({ width: 1, height: 1, fps: 24, durationSeconds: 5.2 })).toEqual({ first: 0, mid: 2.6, last: 5.158 });
    expect(qcSampleTimes({ width: 1, height: 1, fps: 24, durationSeconds: 0.01 }).last).toBe(0);
  });
  it('creates PENDING_REVIEW record with 3 stills, autoPass FORBIDDEN, writes json', async () => {
    const d = tmp(); const deps = fakeDeps();
    const rec = await createShotQcRecord({ shotId: 'S07', takePath: '/t/S07.mp4', qcDir: d }, deps);
    expect(rec.stills.map((s) => s.role)).toEqual(['first', 'mid', 'last']);
    expect(rec.identity).toMatchObject({ status: 'PENDING_REVIEW', reviewer: null });
    expect(rec.gates).toEqual({ V11_G3: 'NOT_EVALUATED', publish: 'FORBIDDEN', autoPass: 'FORBIDDEN' });
    expect(deps.extractFrame).toHaveBeenCalledTimes(3);
    expect(JSON.parse(readFileSync(join(d, 'S07', 'qc-record.json'), 'utf8')).identity.status).toBe('PENDING_REVIEW');
  });
  it('verdict needs named human; bot names rejected; G3 stays NOT_EVALUATED', async () => {
    const rec = await createShotQcRecord({ shotId: 'S01', takePath: '/t.mp4', qcDir: tmp() }, fakeDeps());
    for (const reviewer of ['', ' ', 'auto', 'BOT', 'agent', 'ci']) expect(() => recordHumanVerdict(rec, { reviewer, verdict: 'HUMAN_PASS', at: 'x' })).toThrow();
    const v = recordHumanVerdict(rec, { reviewer: '吴琦', verdict: 'HUMAN_FAIL', note: '发色偏', at: '2026-10-12T07:05:00Z' });
    expect(v.identity).toMatchObject({ status: 'HUMAN_FAIL', reviewer: '吴琦' });
    expect(v.gates.V11_G3).toBe('NOT_EVALUATED');
    expect(rec.identity.status).toBe('PENDING_REVIEW');
  });
  it('orchestrator: QC extraction failure fails the shot as resumable (35)', async () => {
    const w = tmp();
    const SHA = 'c'.repeat(64);
    const ref = { characterId: 'q', appearanceRevisionId: 'r', refContentSha256: SHA, appearanceContentSha256: SHA, firstFramePath: 'q.png' };
    const port = { probeReady: async () => true, enqueue: async (p: Record<string, unknown>) => ({ status: 'SUCCEEDED' as const, promptId: 'x', artifact: { filename: 'a.mp4', contentSha256: SHA, path: `/fake/${String(p.shotSpecId)}.mp4` } }) };
    const r = await runMultiShotOneClick({ schemaVersion: 1, episodeId: 'e', mode: 'live', defaultRef: ref, workDir: w, shots: [{ shotId: 's0', order: 0, seed: '1', positivePrompt: 'p' }] },
      { env: { ONECLICK_LIVE: '1' }, live: port, qc: { enabled: true, deps: { probe: async () => { throw new Error('probe boom'); } } } });
    expect(r.exitCode).toBe(35);
    expect(r.resumable).toBe(true);
  });

  const hasFfmpeg = (() => { try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return true; } catch { return false; } })();
  it.skipIf(!hasFfmpeg)('e2e: orchestrator with QC writes real stills per shot', async () => {
    const w = tmp();
    const SHA = 'c'.repeat(64);
    const ref = { characterId: 'q', appearanceRevisionId: 'r', refContentSha256: SHA, appearanceContentSha256: SHA, firstFramePath: 'q.png' };
    const r = await runMultiShotOneClick({
      schemaVersion: 1, episodeId: 'qc', mode: 'live', defaultRef: ref, workDir: w,
      canvas: { width: 320, height: 240, fps: 24 }, durationRange: { minSeconds: 1, maxSeconds: 3 },
      shots: [0, 1].map((i) => ({ shotId: `s${i}`, order: i, seed: String(i + 1), positivePrompt: 'p' })),
    }, { env: { ONECLICK_LIVE: '1' }, live: createFakeH3Provider({ outDir: join(w, 'takes'), seconds: 1 }), qc: { enabled: true } });
    expect(r.exitCode).toBe(0);
    for (const s of ['s0', 's1']) for (const f of ['first', 'mid', 'last']) expect(existsSync(join(w, 'qc', s, `${f}.png`))).toBe(true);
    const cp = JSON.parse(readFileSync(join(w, 'checkpoint.json'), 'utf8'));
    expect(cp.shots.s1.qcRecordPath).toBe(join(w, 'qc', 's1', 'qc-record.json'));
  }, 60_000);
});
