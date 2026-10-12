/** V13 · continuity detector: tail frame of shot N vs head frame of shot N+1. */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
import { frameDistance, dHash, CONTINUITY_THRESHOLDS, runContinuityCheck, continuityPairs, extractGray } from '@/agents/detectors/continuity-detector';
const flat = (v: number, n = 32 * 32) => new Uint8Array(n).fill(v);
const grad = (flip = false) => { const a = new Uint8Array(32 * 32); for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) a[y * 32 + x] = (flip ? 31 - x : x) * 8; return a; };
describe('metrics', () => {
  it('identical frames distance 0; very different frames large', () => {
    expect(frameDistance(grad(), grad())).toEqual({ mad: 0, dhash: 0 });
    const d = frameDistance(grad(), grad(true)); expect(d.mad).toBeGreaterThan(0.3); expect(d.dhash).toBeGreaterThan(40);
  });
  it('dHash is 64 bits', () => expect(dHash(grad())).toHaveLength(64));
  it('thresholds are frozen and cannot be overridden', () => {
    expect(Object.isFrozen(CONTINUITY_THRESHOLDS)).toBe(true);
    expect(() => runContinuityCheck({ episodeId: 'e', shots: [], thresholds: { mad: 1 } } as any)).rejects.toThrow(/threshold/);
  });
});
describe('pairs', () => {
  it('only checks shots marked continuous with previous (default) or all when mode=all', () => {
    const shots = [{ shotId: 'S08', takePath: 'a' }, { shotId: 'S09a', takePath: 'b' }, { shotId: 'S09b', takePath: 'c', continuousWithPrev: true }];
    expect(continuityPairs(shots).map(p => p.join('→'))).toEqual(['S09a→S09b']);
    expect(continuityPairs(shots, 'all')).toHaveLength(2);
  });
});
describe('gate with injected frames', () => {
  const shots = [{ shotId: 'A', takePath: 'a' }, { shotId: 'B', takePath: 'b', continuousWithPrev: true }, { shotId: 'C', takePath: 'c', continuousWithPrev: true }];
  it('jump → FAIL (no machine PASS; G3 untouched)', async () => {
    const frames: Record<string, Uint8Array> = { 'a:tail': grad(), 'b:head': grad(), 'b:tail': grad(), 'c:head': grad(true) };
    const r = await runContinuityCheck({ episodeId: 'e', shots }, { grab: async (p, w) => frames[`${p}:${w}`] });
    expect(r.pairs.map(p => p.verdict)).toEqual(['MACHINE_OK', 'FAIL']);
    expect(r.gate).toBe('FAIL'); expect(r.gates).toEqual({ V11_G3: 'NOT_EVALUATED', publish: 'FORBIDDEN', autoPass: 'FORBIDDEN' });
    expect(r.pairs[1].mad).toBeGreaterThan(CONTINUITY_THRESHOLDS.mad);
    expect(r.thresholdsSha256).toMatch(/^[0-9a-f]{64}$/);
  });
  it('all ok → gate MACHINE_OK (never "PASS"); no pairs → NOT_APPLICABLE', async () => {
    const r = await runContinuityCheck({ episodeId: 'e', shots }, { grab: async () => grad() });
    expect(r.gate).toBe('MACHINE_OK'); expect(JSON.stringify(r)).not.toMatch(/"PASS"/);
    expect((await runContinuityCheck({ episodeId: 'e', shots: [shots[0]] }, { grab: async () => grad() })).gate).toBe('NOT_APPLICABLE');
  });
  it('grab failure → ERROR, not ok', async () => {
    const r = await runContinuityCheck({ episodeId: 'e', shots }, { grab: async () => { throw new Error('no file'); } });
    expect(r.gate).toBe('ERROR');
  });
});
describe('real ffmpeg', () => {
  it('same-source split is continuous; different source is FAIL', async () => {
    const w = mkdtempSync(join(tmpdir(), 'cont-'));
    const gen = (out: string, src: string, ss: number) => execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', src, '-ss', String(ss), '-t', '1', '-pix_fmt', 'yuv420p', join(w, out)]);
    gen('a.mp4', 'testsrc2=size=128x96:rate=24:duration=3', 0); gen('b.mp4', 'testsrc2=size=128x96:rate=24:duration=3', 1); gen('c.mp4', 'mandelbrot=size=128x96:rate=24', 0);
    expect((await extractGray(join(w, 'a.mp4'), 'tail')).length).toBe(1024);
    const r = await runContinuityCheck({ episodeId: 'e', shots: [{ shotId: 'A', takePath: join(w, 'a.mp4') }, { shotId: 'B', takePath: join(w, 'b.mp4'), continuousWithPrev: true }, { shotId: 'C', takePath: join(w, 'c.mp4'), continuousWithPrev: true }] });
    expect(r.pairs.map(p => p.verdict)).toEqual(['MACHINE_OK', 'FAIL']);
  }, 60000);
});
