/** V12 item 3 · concat re-encode to fix DTS + monotonic-DTS verifier. */
import { describe, it, expect, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
import { buildFfmpegArgs, runMultiShotConcat, checkDtsMonotonic, analyzeDts, CONCAT_EXIT } from '@/agents/assembly/ffmpeg-concat-worker';
const req = (over = {}) => ({ schemaVersion: 1, episodeId: 'e', durationRange: { minSeconds: 1, maxSeconds: 90 }, canvas: { width: 64, height: 48, fps: 24 },
  shots: [{ shotId: 'a', order: 0, takePath: '/t/a.mp4' }, { shotId: 'b', order: 1, takePath: '/t/b.mp4' }], outPath: '/t/out.mp4', ...over });
const fake = (dts: any) => ({ exists: async () => true, probe: async () => ({ width: 64, height: 48, fps: 24, durationSeconds: 2 }),
  writeListFile: vi.fn(async () => {}), runFfmpeg: vi.fn(async () => ({ code: 0, stderr: '' })), sha256File: async () => 'f'.repeat(64), checkDts: vi.fn(dts) });
describe('concat encode modes', () => {
  it('copy args unchanged (back-compat); reencode args use libx264/aac + reset timestamps', () => {
    expect(buildFfmpegArgs('l', 'o')).toContain('copy');
    const r = buildFfmpegArgs('l', 'o', { encode: 'reencode', fps: 24 });
    expect(r).not.toContain('copy');
    for (const x of ['libx264', 'aac', '+genpts', 'cfr', 'yuv420p']) expect(r.join(' ')).toContain(x);
  });
  it('reencode verifies DTS by default; non-monotonic → exit DTS_NON_MONOTONIC', async () => {
    const d = fake(async () => ({ ok: false, packets: 10, violations: [{ index: 4, dts: 1, prevDts: 3 }] }));
    const r = await runMultiShotConcat(req({ encode: 'reencode' }), d);
    expect(r.exitCode).toBe(CONCAT_EXIT.DTS_NON_MONOTONIC); expect(d.checkDts).toHaveBeenCalled();
    const ok = await runMultiShotConcat(req({ encode: 'reencode' }), fake(async () => ({ ok: true, packets: 10, violations: [] })));
    expect(ok.exitCode).toBe(0); expect(ok.dts?.ok).toBe(true); expect(ok.encode).toBe('reencode');
  });
  it('copy mode does not check DTS unless asked', async () => {
    const d = fake(async () => ({ ok: true, packets: 1, violations: [] }));
    await runMultiShotConcat(req(), d); expect(d.checkDts).not.toHaveBeenCalled();
    await runMultiShotConcat(req({ verifyDts: true }), d); expect(d.checkDts).toHaveBeenCalled();
  });
  it('analyzeDts finds non-increasing values', () => {
    expect(analyzeDts([0, 1, 2]).ok).toBe(true);
    expect(analyzeDts([0, 2, 2, 1]).violations.map(v => v.index)).toEqual([2, 3]);
  });
});
import { runMultiShotOneClick } from '@/agents/assembly/multishot-oneclick';
describe('multishot passthrough', () => {
  it('concatEncode=reencode reaches concat worker', async () => {
    const SHA = 'c'.repeat(64); const made = new Set<string>();
    const live = { probeReady: async () => true, enqueue: async (p: any) => { const path = `/fake/${p.shotSpecId}.mp4`; made.add(path); return { status: 'SUCCEEDED', promptId: 'x', artifact: { filename: 'x.mp4', contentSha256: SHA, path } }; } } as any;
    const c = { ...fake(async () => ({ ok: true, packets: 3, violations: [] })), exists: async (p: string) => made.has(p) || p.endsWith('episode.mp4') };
    const r = await runMultiShotOneClick({ schemaVersion: 1, episodeId: 'e', mode: 'live', workDir: mkdtempSync(join(tmpdir(), 'mp-')), concatEncode: 'reencode',
      canvas: { width: 64, height: 48, fps: 24 }, durationRange: { minSeconds: 1, maxSeconds: 90 },
      defaultRef: { characterId: 'qi-ye', appearanceRevisionId: 'a', refContentSha256: SHA, appearanceContentSha256: SHA, firstFramePath: 'x.jpg' },
      shots: [{ shotId: 's0', order: 0, seed: '1', positivePrompt: 'p' }] }, { env: { ONECLICK_LIVE: '1' }, live, concat: c, fileExists: async (p: string) => made.has(p) });
    expect(r.exitCode).toBe(0); expect(c.runFfmpeg.mock.calls[0][0]).toContain('libx264'); expect(c.checkDts).toHaveBeenCalled();
  });
});
describe('real ffmpeg', () => {
  it('mixed-timebase clips: reencode output has monotonic DTS and right duration', async () => {
    const w = mkdtempSync(join(tmpdir(), 'dts-'));
    const mk = (n: string, tb: string) => execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc=size=64x48:rate=24:duration=1', '-f', 'lavfi', '-i', 'sine=d=1',
      '-shortest', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-video_track_timescale', tb, join(w, n)]);
    mk('a.mp4', '12288'); mk('b.mp4', '90000');
    const out = join(w, 'out.mp4');
    const r = await runMultiShotConcat(req({ shots: [{ shotId: 'a', order: 0, takePath: join(w, 'a.mp4') }, { shotId: 'b', order: 1, takePath: join(w, 'b.mp4') }], outPath: out, encode: 'reencode' }));
    expect(r.exitCode).toBe(0); expect(r.dts?.ok).toBe(true);
    expect((await checkDtsMonotonic(out)).ok).toBe(true);
    expect(r.totalSeconds).toBeGreaterThan(1.9);
  }, 60000);
});
