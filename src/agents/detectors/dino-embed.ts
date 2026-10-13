/**
 * V13 DINOv2-small (Apache-2.0, facebook/dinov2-small; ONNX from onnx-community/dinov2-small) whole-image / whole-character
 * embeddings via scripts/detectors/dino_embed.py. Offline CPU. Calibrations frozen; change only via reviewed PR.
 */
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cosine } from './identity-detector';
export const DEFAULT_DINO_MODEL = process.env.V13_DINO_MODEL ?? '/workspace/v11/models/dinov2/dinov2-small.onnx';
export const DINO_LICENSE = 'DINOv2-small — Apache-2.0 — https://huggingface.co/facebook/dinov2-small , https://github.com/facebookresearch/dinov2/blob/main/LICENSE';
export type BatchEmbed = (paths: string[]) => Promise<Record<string, Float32Array | null>>;
export const pythonDino = (model = DEFAULT_DINO_MODEL, cropPerson = false): BatchEmbed => (paths) => new Promise((res, rej) =>
  execFile(process.env.V13_PYTHON ?? 'python3', ['scripts/detectors/dino_embed.py', '--model', model, ...(cropPerson ? ['--crop-person'] : []), ...paths], { maxBuffer: 1 << 26 }, (e, out) => {
    if (e) return rej(e); const j = JSON.parse(out.trim().split('\n').pop()!).embeddings as Record<string, number[] | null>;
    res(Object.fromEntries(Object.entries(j).map(([k, v]) => [k, v ? Float32Array.from(v) : null]))); }));
/** Whole-character (person crop) calibration on locked refs, 2026-10-13 (V13_DINO_CALIBRATION.md).
 * zhui-yu-shitu: own refs LOO max 0.72–0.73; vs qi-ye ≤0.37; vs fei-yue-li ≤0.60 → cosineMin 0.66, margin 0.10. */
export const CHARACTER_EMBED_CALIBRATION: Readonly<Record<string, Readonly<{ cosineMin: number; margin: number }>>> = Object.freeze({
  'zhui-yu-shitu': Object.freeze({ cosineMin: 0.66, margin: 0.10 }) });
/** Scene: same-scene variants ≥0.7733, different scenes ≤0.5849 → 0.68. */
export const DINO_SCENE_THRESHOLD = 0.68;
const r4 = (x: number) => Math.round(x * 1e4) / 1e4;
const gatesStamp = { V11_G3: 'NOT_EVALUATED' as const, publish: 'FORBIDDEN' as const, autoPass: 'FORBIDDEN' as const };
export async function runCharacterEmbedCheck(input: { characterId: string; packs: Record<string, string[]>; frames: { shotId: string; path: string }[] }, deps: { embed?: BatchEmbed; model?: string } = {}) {
  if ('threshold' in input || 'thresholds' in input) throw new Error('character-embed threshold is frozen; override forbidden');
  const cal = CHARACTER_EMBED_CALIBRATION[input.characterId] ?? null;
  const base = { schema: 'v13/CharacterEmbedReport/v1' as const, characterId: input.characterId, method: 'dinov2-small person-crop CLS', calibration: cal, license: DINO_LICENSE, gates: gatesStamp };
  if (!cal) return { ...base, frames: [], gate: 'NOT_EVALUATED' as const, reason: 'no calibration for this character' };
  const own = input.packs[input.characterId] ?? [];
  if (!own.length || !input.frames.length) return { ...base, frames: [], gate: 'NOT_EVALUATED' as const, reason: 'no refs or no frames' };
  let embed = deps.embed; if (!embed) { const m = deps.model ?? DEFAULT_DINO_MODEL; if (!existsSync(m)) return { ...base, frames: [], gate: 'NOT_EVALUATED' as const, reason: `dino model not found: ${m}` }; embed = pythonDino(m, true); }
  const all = [...new Set([...Object.values(input.packs).flat(), ...input.frames.map(f => f.path)])]; const E = await embed(all);
  const frames = input.frames.map(f => {
    const e = E[f.path]; if (!e) return { ...f, similarity: null, nearestOther: null, verdict: 'FAIL' as const, reason: 'unreadable frame' };
    const score = (refs: string[]) => { const v = refs.filter(r => r !== f.path).map(r => E[r]).filter((x): x is Float32Array => !!x).map(r => cosine(r, e)); return v.length ? r4(Math.max(...v)) : null; };
    const sim = score(own); let nearestOther: { id: string; similarity: number } | null = null;
    for (const [id, refs] of Object.entries(input.packs)) if (id !== input.characterId) { const v = score(refs); if (v !== null && (!nearestOther || v > nearestOther.similarity)) nearestOther = { id, similarity: v }; }
    if (sim === null) return { ...f, similarity: null, nearestOther, verdict: 'NOT_EVALUATED' as const, reason: 'no other own refs' };
    if (sim < cal.cosineMin) return { ...f, similarity: sim, nearestOther, verdict: 'FAIL' as const, reason: `similarity ${sim} < ${cal.cosineMin}` };
    if (nearestOther && sim - nearestOther.similarity < cal.margin) return { ...f, similarity: sim, nearestOther, verdict: 'FAIL' as const, reason: `margin over ${nearestOther.id} < ${cal.margin}` };
    return { ...f, similarity: sim, nearestOther, verdict: 'MACHINE_OK' as const, reason: '' };
  });
  const gate = frames.some(f => f.verdict === 'FAIL') ? 'FAIL' as const : frames.some(f => f.verdict === 'NOT_EVALUATED') ? 'NOT_EVALUATED' as const : 'MACHINE_OK' as const;
  return { ...base, frames, gate };
}
export async function runDinoSceneCheck(input: { refId: string; refImages: string[]; frames: { shotId: string; path: string }[] }, deps: { embed?: BatchEmbed; model?: string } = {}) {
  if ('threshold' in input || 'thresholds' in input) throw new Error('scene threshold is frozen; override forbidden');
  const base = { schema: 'v13/AppearanceReport/v1' as const, kind: 'scene' as const, refId: input.refId, method: 'dinov2-small CLS', threshold: DINO_SCENE_THRESHOLD, license: DINO_LICENSE, gates: gatesStamp };
  if (!input.refImages.length || !input.frames.length) return { ...base, frames: [], gate: 'NOT_EVALUATED' as const };
  let embed = deps.embed; if (!embed) { const m = deps.model ?? DEFAULT_DINO_MODEL; if (!existsSync(m)) return { ...base, frames: [], gate: 'NOT_EVALUATED' as const, reason: `dino model not found: ${m}` }; embed = pythonDino(m); }
  const E = await embed([...new Set([...input.refImages, ...input.frames.map(f => f.path)])]); const refs = input.refImages.map(r => E[r]).filter((x): x is Float32Array => !!x);
  const frames = input.frames.map(f => { const e = E[f.path]; if (!e || !refs.length) return { ...f, score: null, verdict: 'FAIL' as const };
    const s = r4(Math.max(...refs.map(r => cosine(r, e)))); return { ...f, score: s, verdict: s >= DINO_SCENE_THRESHOLD ? 'MACHINE_OK' as const : 'FAIL' as const }; });
  return { ...base, frames, gate: frames.some(f => f.verdict === 'FAIL') ? 'FAIL' as const : 'MACHINE_OK' as const };
}
