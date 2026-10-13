/** V13 · identity / costume / scene detectors + LLM QC guard. Code ready, awaiting real material. */
import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
import { cosine, IDENTITY_THRESHOLDS, runIdentityCheck } from '@/agents/detectors/identity-detector';
import { colorHistogram, histIntersection, APPEARANCE_THRESHOLDS, runAppearanceCheck } from '@/agents/detectors/appearance-detector';
import { parseLlmQcAdvice } from '@/agents/detectors/llm-qc-guard';
const v = (...x: number[]) => Float32Array.from(x);
describe('identity detector', () => {
  it('cosine', () => { expect(cosine(v(1, 0), v(1, 0))).toBeCloseTo(1); expect(cosine(v(1, 0), v(0, 1))).toBeCloseTo(0); });
  it('frozen threshold; override forbidden', async () => {
    expect(Object.isFrozen(IDENTITY_THRESHOLDS)).toBe(true);
    await expect(runIdentityCheck({ characterId: 'qi-ye', packFaces: ['p'], frames: [], threshold: 0.1 } as any)).rejects.toThrow(/frozen/);
  });
  it('no local model → NOT_EVALUATED (never PASS), status code-ready-awaiting', async () => {
    const r = await runIdentityCheck({ characterId: 'qi-ye', packFaces: ['p.png'], frames: [{ shotId: 'S02', path: 'f.png' }] }, { modelPath: '/nope.onnx' });
    expect(r.gate).toBe('NOT_EVALUATED'); expect(r.readiness).toBe('CODE_READY_AWAITING_REAL_MATERIAL');
  });
  it('numbers: low similarity → FAIL; high → MACHINE_OK; no face → FAIL', async () => {
    const emb: Record<string, Float32Array | null> = { 'p.png': v(1, 0, 0), 'a.png': v(0.95, 0.1, 0), 'b.png': v(0.1, 1, 0), 'c.png': null };
    const r = await runIdentityCheck({ characterId: 'qi-ye', packFaces: ['p.png'], frames: [{ shotId: 'S1', path: 'a.png' }, { shotId: 'S2', path: 'b.png' }, { shotId: 'S3', path: 'c.png' }] },
      { embed: async (p) => emb[p], modelId: 'test' });
    expect(r.frames.map(f => f.verdict)).toEqual(['MACHINE_OK', 'FAIL', 'FAIL']);
    expect(r.frames[0].similarity).toBeGreaterThan(0.9); expect(r.frames[2].reason).toMatch(/no face/);
    expect(r.gate).toBe('FAIL'); expect(r.gates.V11_G3).toBe('NOT_EVALUATED');
  });
  it('archived character rejected', async () => {
    await expect(runIdentityCheck({ characterId: 'ye-yuan', packFaces: [], frames: [] }, { embed: async () => v(1) })).rejects.toThrow(/ARCHIVED/);
  });
});
describe('costume / scene detector', () => {
  const px = (r: number, g: number, b: number) => { const a = new Uint8Array(64 * 64 * 3); for (let i = 0; i < a.length; i += 3) { a[i] = r; a[i + 1] = g; a[i + 2] = b; } return a; };
  it('histogram intersection 1 for same, ~0 for different colours', () => {
    expect(histIntersection(colorHistogram(px(200, 0, 0)), colorHistogram(px(200, 0, 0)))).toBeCloseTo(1);
    expect(histIntersection(colorHistogram(px(200, 0, 0)), colorHistogram(px(0, 0, 200)))).toBeLessThan(0.1);
  });
  it('costume drift → FAIL; same → MACHINE_OK; frozen', async () => {
    expect(Object.isFrozen(APPEARANCE_THRESHOLDS)).toBe(true);
    const img: Record<string, Uint8Array> = { ref: px(200, 0, 0), same: px(198, 2, 0), off: px(0, 0, 200) };
    const r = await runAppearanceCheck({ kind: 'costume', refId: 'qi-ye-costume-a', refImages: ['ref'], frames: [{ shotId: 'S1', path: 'same' }, { shotId: 'S2', path: 'off' }] }, { load: async (p) => img[p] });
    expect(r.frames.map(f => f.verdict)).toEqual(['MACHINE_OK', 'FAIL']); expect(r.gate).toBe('FAIL'); expect(r.method).toBe('rgb-hist-8x8x8');
  });
  it('real PNG via ffmpeg decode', async () => {
    const d = mkdtempSync(join(tmpdir(), 'app-'));
    const { execFileSync } = await import('node:child_process');
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=red:s=64x64', '-frames:v', '1', join(d, 'r.png')]);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=blue:s=64x64', '-frames:v', '1', join(d, 'b.png')]);
    const r = await runAppearanceCheck({ kind: 'scene', refId: 'scene-ep01-s01', refImages: [join(d, 'r.png')], frames: [{ shotId: 'S1', path: join(d, 'r.png') }, { shotId: 'S2', path: join(d, 'b.png') }] });
    expect(r.frames.map(f => f.verdict)).toEqual(['MACHINE_OK', 'FAIL']);
  });
});
describe('LLM QC guard', () => {
  it('accepts advisory notes only, stamps ADVISORY', () => {
    const r = parseLlmQcAdvice({ shotId: 'S02', notes: ['发色略偏'], suggestedAction: 'HUMAN_LOOK' });
    expect(r.role).toBe('ADVISORY_ONLY'); expect(r.gates.V11_G3).toBe('NOT_EVALUATED');
  });
  it('rejects any attempt to set g3 / pass / verdict, at any depth', () => {
    for (const bad of [{ shotId: 'S', notes: [], g3: true }, { shotId: 'S', notes: [], verdict: 'PASS' }, { shotId: 'S', notes: [], extra: { V11_G3: 'PASS' } }, { shotId: 'S', notes: [], identity: { status: 'HUMAN_PASS' } }])
      expect(() => parseLlmQcAdvice(bad)).toThrow(/LLM/);
  });
});
