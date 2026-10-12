/** Wave12 · ffmpeg concat Worker (offline; real ffmpeg only on synthetic lavfi clips). */
import { describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  runMultiShotConcat, buildConcatList, buildFfmpegArgs, planShotCount, CONCAT_EXIT, type ProbeInfo,
} from '@/agents/assembly/ffmpeg-concat-worker';

const shots = (n: number) => Array.from({ length: n }, (_, i) => ({ shotId: `s${i}`, order: i, takePath: `/t/s${i}.mp4` }));
const req = (over: Record<string, unknown> = {}) => ({ schemaVersion: 1, episodeId: 'ep01', shots: shots(13), outPath: '/t/out.mp4', ...over });
const okProbe = (dur = 5.2): ((p: string) => Promise<ProbeInfo>) => async () => ({ width: 1344, height: 768, fps: 24, durationSeconds: dur });
const fakeDeps = (over = {}) => ({
  probe: okProbe(), exists: async () => true, sha256File: async () => 'f'.repeat(64),
  writeListFile: vi.fn(async () => {}), runFfmpeg: vi.fn(async () => ({ code: 0, stderr: '' })), ...over,
});

describe('ffmpeg concat worker', () => {
  it('planShotCount per ADR: 60s≈12, 90s≈18', () => {
    expect(planShotCount(60)).toBe(12);
    expect(planShotCount(90)).toBe(18);
  });
  it('builds concat list with escaped quotes and copy args', () => {
    expect(buildConcatList(["/a/it's.mp4"])).toBe("file '/a/it'\\''s.mp4'\n");
    expect(buildFfmpegArgs('/l.txt', '/o.mp4')).toEqual(expect.arrayContaining(['-f', 'concat', '-safe', '0', '-c', 'copy']));
  });
  it('13×5.2s = 67.6s → OK, ordered list, PENDING_REVIEW/NOT_EVALUATED', async () => {
    const deps = fakeDeps();
    const r = await runMultiShotConcat(req({ shots: shots(13).reverse() }), deps);
    expect(r.exitCode).toBe(0);
    expect(r.totalSeconds).toBe(67.6);
    expect(r.output?.contentSha256).toHaveLength(64);
    expect(r.identity.status).toBe('PENDING_REVIEW');
    expect(r.gates.V11_G3).toBe('NOT_EVALUATED');
    const list = (deps.writeListFile.mock.calls[0] as unknown as [string, string])[1];
    expect(list.split('\n')[0]).toContain('s0.mp4');
    expect(list.split('\n')[12]).toContain('s12.mp4');
  });
  it('too short / too long → 32, ffmpeg not called', async () => {
    for (const n of [5, 20]) {
      const deps = fakeDeps();
      const r = await runMultiShotConcat(req({ shots: shots(n) }), deps);
      expect(r.exitCode).toBe(CONCAT_EXIT.DURATION_OUT_OF_RANGE);
      expect(deps.runFfmpeg).not.toHaveBeenCalled();
    }
  });
  it('canvas/fps mismatch → 31', async () => {
    const probe = async (p: string) => ({ width: p.includes('s3') ? 768 : 1344, height: p.includes('s3') ? 1344 : 768, fps: 24, durationSeconds: 5.2 });
    expect((await runMultiShotConcat(req(), fakeDeps({ probe }))).exitCode).toBe(31);
    const probeFps = async () => ({ width: 1344, height: 768, fps: 25, durationSeconds: 5.2 });
    expect((await runMultiShotConcat(req(), fakeDeps({ probe: probeFps }))).exitCode).toBe(31);
  });
  it('duplicate id / gap in order / out collides → 30', async () => {
    const dup = shots(13); dup[1] = { ...dup[1], shotId: 's0' };
    expect((await runMultiShotConcat(req({ shots: dup }), fakeDeps())).exitCode).toBe(30);
    const gap = shots(13); gap[12] = { ...gap[12], order: 20 };
    expect((await runMultiShotConcat(req({ shots: gap }), fakeDeps())).exitCode).toBe(30);
    expect((await runMultiShotConcat(req({ outPath: '/t/s0.mp4' }), fakeDeps())).exitCode).toBe(30);
  });
  it('missing take → 33; probe error → 71; ffmpeg nonzero → 70; bad schema → 2', async () => {
    expect((await runMultiShotConcat(req(), fakeDeps({ exists: async (p: string) => !p.includes('s4') }))).exitCode).toBe(33);
    expect((await runMultiShotConcat(req(), fakeDeps({ probe: async () => { throw new Error('bad'); } }))).exitCode).toBe(71);
    const r = await runMultiShotConcat(req(), fakeDeps({ runFfmpeg: async () => ({ code: 1, stderr: 'boom' }) }));
    expect(r.exitCode).toBe(70);
    expect(r.ok).toBe(false);
    expect((await runMultiShotConcat({ schemaVersion: 1 }, fakeDeps())).exitCode).toBe(2);
  });

  const hasFfmpeg = (() => { try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return true; } catch { return false; } })();
  it.skipIf(!hasFfmpeg)('real ffmpeg: 3 synthetic 1s clips → 3s mp4', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'concat-'));
    const takes = [0, 1, 2].map((i) => {
      const p = join(dir, `s${i}.mp4`);
      execFileSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', `testsrc=size=1344x768:rate=24:duration=1`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', p]);
      return { shotId: `s${i}`, order: i, takePath: p };
    });
    const out = join(dir, 'out.mp4');
    const r = await runMultiShotConcat({ schemaVersion: 1, episodeId: 'syn', shots: takes, outPath: out, durationRange: { minSeconds: 2, maxSeconds: 4 } });
    expect(r.exitCode).toBe(0);
    expect(existsSync(out)).toBe(true);
    expect(r.totalSeconds).toBeCloseTo(3, 1);
  });
});
