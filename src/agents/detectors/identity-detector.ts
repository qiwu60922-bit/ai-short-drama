/**
 * V13 identity detector: face embedding of shot frames vs character pack faces (cosine).
 * Local free, commercially-licensed models only: YuNet (MIT, detect+5pt align) + AuraFace-v1 glintr100 (Apache-2.0) via
 * scripts/detectors/face_embed.py + onnxruntime. InsightFace w600k_r50 / SCRFD weights are non-commercial: forbidden.
 * Threshold frozen; no per-run override. No model or no material ⇒ NOT_EVALUATED, never PASS.
 * STATUS: code ready, awaiting real material.
 */
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { assertCastWritable } from '@/agents/ledger/character-registry';
export const IDENTITY_THRESHOLDS = Object.freeze({ cosineMin: 0.45 }); // ArcFace-style same-person boundary; NOT yet calibrated for AuraFace on real refs; change only via reviewed PR
export const cosine = (a: Float32Array, b: Float32Array) => { let d = 0, x = 0, y = 0; for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; x += a[i] ** 2; y += b[i] ** 2; } return d / (Math.sqrt(x * y) || 1); };
export type Embed = (imagePath: string) => Promise<Float32Array | null>;
export const DEFAULT_FACE_MODEL = process.env.V13_FACE_MODEL ?? '/workspace/v11/models/face/glintr100.onnx';
export const FACE_MODEL_LICENSES = Object.freeze({ detector: 'YuNet 2023mar — MIT — https://github.com/opencv/opencv_zoo/blob/main/models/face_detection_yunet/LICENSE', embedder: 'AuraFace-v1 glintr100.onnx — Apache-2.0 — https://huggingface.co/fal/AuraFace-v1' });
const NON_COMMERCIAL = /w600k|det_10g|scrfd|buffalo|antelope|genderage/i;
export const facePython = () => process.env.V13_PYTHON ?? 'python3';
export function pythonFaceEmbed(modelPath: string): Embed {
  return (img) => new Promise((res, rej) => execFile(facePython(), ['scripts/detectors/face_embed.py', '--model', modelPath, img], (e, out) => {
    if (e) return rej(e); const j = JSON.parse(out); res(j.embedding ? Float32Array.from(j.embedding) : null);
  }));
}
const stamps = { V11_G3: 'NOT_EVALUATED' as const, publish: 'FORBIDDEN' as const, autoPass: 'FORBIDDEN' as const };
export async function runIdentityCheck(input: { characterId: string; packFaces: string[]; frames: { shotId: string; path: string }[] },
  deps: { embed?: Embed; modelPath?: string; modelId?: string } = {}) {
  if ('threshold' in input || 'thresholds' in input) throw new Error('identity threshold is frozen; override forbidden');
  const [characterId] = assertCastWritable([input.characterId]);
  const base = { schema: 'v13/IdentityReport/v1' as const, characterId, thresholds: IDENTITY_THRESHOLDS, readiness: 'CODE_READY_AWAITING_REAL_MATERIAL' as const, gates: stamps };
  let embed = deps.embed; const modelPath = deps.modelPath ?? DEFAULT_FACE_MODEL;
  if (NON_COMMERCIAL.test(modelPath)) throw new Error(`non-commercial face weights forbidden: ${modelPath}`);
  if (!embed) { if (!existsSync(modelPath)) return { ...base, model: null, frames: [], gate: 'NOT_EVALUATED' as const, reason: `local face model not found: ${modelPath}` }; embed = pythonFaceEmbed(modelPath); }
  const refs = (await Promise.all(input.packFaces.map(embed))).filter((x): x is Float32Array => !!x);
  if (!refs.length || !input.frames.length) return { ...base, model: deps.modelId ?? modelPath, frames: [], gate: 'NOT_EVALUATED' as const, reason: 'no pack face embeddings or no frames' };
  const frames = [];
  for (const f of input.frames) {
    const e = await embed(f.path);
    if (!e) { frames.push({ ...f, similarity: null, verdict: 'FAIL' as const, reason: 'no face detected' }); continue; }
    const sim = Math.round(Math.max(...refs.map(r => cosine(r, e))) * 1e4) / 1e4;
    frames.push({ ...f, similarity: sim, verdict: sim >= IDENTITY_THRESHOLDS.cosineMin ? 'MACHINE_OK' as const : 'FAIL' as const, reason: '' });
  }
  return { ...base, model: deps.modelId ?? modelPath, frames, licenses: deps.embed ? null : FACE_MODEL_LICENSES, gate: frames.some(f => f.verdict === 'FAIL') ? 'FAIL' as const : 'MACHINE_OK' as const };
}
