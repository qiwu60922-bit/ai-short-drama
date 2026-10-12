/**
 * V13 costume / scene detector: RGB 8×8×8 histogram intersection vs locked ref images (no model, free).
 * Optional CLIP ONNX embedder can be added behind the same gate later. Threshold frozen. FAIL = FAIL.
 * STATUS: code ready, awaiting real material.
 */
import { execFile } from 'node:child_process';
export const APPEARANCE_THRESHOLDS = Object.freeze({ costume: 0.55, scene: 0.45 });
export function colorHistogram(rgb: Uint8Array): Float32Array {
  const h = new Float32Array(512); const n = rgb.length / 3;
  for (let i = 0; i < rgb.length; i += 3) h[((rgb[i] >> 5) << 6) | ((rgb[i + 1] >> 5) << 3) | (rgb[i + 2] >> 5)] += 1 / n;
  return h;
}
export const histIntersection = (a: Float32Array, b: Float32Array) => { let s = 0; for (let i = 0; i < a.length; i++) s += Math.min(a[i], b[i]); return s; };
export const loadRgb64 = (p: string) => new Promise<Uint8Array>((res, rej) => execFile('ffmpeg', ['-v', 'error', '-i', p, '-frames:v', '1', '-vf', 'scale=64:64,format=rgb24', '-f', 'rawvideo', '-'],
  { encoding: 'buffer', maxBuffer: 1 << 20 }, (e, out) => (e ? rej(e) : res(new Uint8Array(out)))));
export async function runAppearanceCheck(input: { kind: 'costume' | 'scene'; refId: string; refImages: string[]; frames: { shotId: string; path: string }[] },
  deps: { load?: (p: string) => Promise<Uint8Array> } = {}) {
  if ('threshold' in input || 'thresholds' in input) throw new Error('appearance threshold is frozen; override forbidden');
  const load = deps.load ?? loadRgb64; const th = APPEARANCE_THRESHOLDS[input.kind];
  const base = { schema: 'v13/AppearanceReport/v1' as const, kind: input.kind, refId: input.refId, method: 'rgb-hist-8x8x8', threshold: th,
    readiness: 'CODE_READY_AWAITING_REAL_MATERIAL' as const, gates: { V11_G3: 'NOT_EVALUATED' as const, publish: 'FORBIDDEN' as const, autoPass: 'FORBIDDEN' as const } };
  if (!input.refImages.length || !input.frames.length) return { ...base, frames: [], gate: 'NOT_EVALUATED' as const };
  const refs = await Promise.all(input.refImages.map(async p => colorHistogram(await load(p))));
  const frames = [];
  for (const f of input.frames) {
    const h = colorHistogram(await load(f.path)); const s = Math.round(Math.max(...refs.map(r => histIntersection(r, h))) * 1e4) / 1e4;
    frames.push({ ...f, score: s, verdict: s >= th ? 'MACHINE_OK' as const : 'FAIL' as const });
  }
  return { ...base, frames, gate: frames.some(f => f.verdict === 'FAIL') ? 'FAIL' as const : 'MACHINE_OK' as const };
}
