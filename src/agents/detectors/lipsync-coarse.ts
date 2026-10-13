/**
 * V13 coarse lip-sync gate (license-clean fallback; no SyncNet/LatentSync weights).
 * MediaPipe Face Landmarker (Apache-2.0) mouth opening vs audio RMS per frame (scripts/detectors/lipsync_coarse.py).
 * Can only FAIL or NOT_EVALUATED — it never returns MACHINE_OK/PASS. Thresholds frozen; uncalibrated on real dialogue.
 */
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
export const COARSE_LIPSYNC = Object.freeze({ speechRms: 0.02, minSpeechFrac: 0.2, minFaceFrac: 0.6, staticMouthStd: 0.01, corrMin: 0.1, maxLag: 3 });
export type Series = { fps: number; mouth: (number | null)[]; energy: number[] };
export type Measure = (video: string, audio: string) => Promise<Series>;
export const DEFAULT_LANDMARKER = process.env.V13_FACE_LANDMARKER ?? '/workspace/v11/models/mediapipe/face_landmarker.task';
export const pythonMeasure = (model = DEFAULT_LANDMARKER): Measure => (v, a) => new Promise((res, rej) =>
  execFile(process.env.V13_PYTHON ?? 'python3', ['scripts/detectors/lipsync_coarse.py', '--model', model, '--video', v, '--audio', a], { maxBuffer: 1 << 24 },
    (e, out) => (e ? rej(e) : res(JSON.parse(out.trim().split('\n').pop()!)))));
const mean = (x: number[]) => x.reduce((s, v) => s + v, 0) / (x.length || 1);
const std = (x: number[]) => { const m = mean(x); return Math.sqrt(mean(x.map(v => (v - m) ** 2))); };
export function pearson(a: number[], b: number[]) { const ma = mean(a), mb = mean(b); let n = 0, x = 0, y = 0;
  for (let i = 0; i < a.length; i++) { n += (a[i] - ma) * (b[i] - mb); x += (a[i] - ma) ** 2; y += (b[i] - mb) ** 2; } return x && y ? n / Math.sqrt(x * y) : 0; }
/** best Pearson over audio lags 0..maxLag frames (mouth may lead/lag audio slightly), on frames with a face. */
export function bestLagCorr(mouth: (number | null)[], energy: number[], maxLag = COARSE_LIPSYNC.maxLag) {
  let best = -1;
  for (let lag = -maxLag; lag <= maxLag; lag++) { const a: number[] = [], b: number[] = [];
    mouth.forEach((m, i) => { const j = i + lag; if (m !== null && j >= 0 && j < energy.length) { a.push(m); b.push(energy[j]); } });
    if (a.length > 5) best = Math.max(best, pearson(a, b)); }
  return Math.round(best * 1e4) / 1e4;
}
export function judgeCoarse(s: Series) {
  const C = COARSE_LIPSYNC; const n = s.mouth.length; const faceFrac = n ? s.mouth.filter(m => m !== null).length / n : 0;
  const speech = s.energy.map(e => e >= C.speechRms); const speechFrac = n ? speech.filter(Boolean).length / n : 0;
  const base = { faceFrac: Math.round(faceFrac * 1e3) / 1e3, speechFrac: Math.round(speechFrac * 1e3) / 1e3 };
  if (faceFrac < C.minFaceFrac) return { ...base, mouthStd: null, corr: null, verdict: 'NOT_EVALUATED' as const, reason: 'face not tracked in enough frames' };
  if (speechFrac < C.minSpeechFrac) return { ...base, mouthStd: null, corr: null, verdict: 'NOT_EVALUATED' as const, reason: 'too little speech energy' };
  const mouthStd = Math.round(std(s.mouth.filter((m, i): m is number => m !== null && speech[i])) * 1e5) / 1e5; const corr = bestLagCorr(s.mouth, s.energy);
  if (mouthStd < C.staticMouthStd) return { ...base, mouthStd, corr, verdict: 'FAIL' as const, reason: 'mouth static while audio has speech' };
  if (corr < C.corrMin) return { ...base, mouthStd, corr, verdict: 'FAIL' as const, reason: `mouth/audio correlation ${corr} < ${C.corrMin}` };
  return { ...base, mouthStd, corr, verdict: 'NOT_EVALUATED' as const, reason: 'coarse check found no defect; human lip-sync review required' };
}
export async function runCoarseLipsync(input: { episodeId: string; shots: { shotId: string; takePath: string; audioPath?: string; hasDialogue: boolean }[] }, deps: { measure?: Measure; model?: string } = {}) {
  if ('threshold' in input || 'thresholds' in input) throw new Error('coarse lipsync thresholds are frozen; override forbidden');
  const base = { schema: 'v13/CoarseLipsync/v1' as const, episodeId: input.episodeId, thresholds: COARSE_LIPSYNC, method: 'mediapipe-mouth-vs-rms (coarse, FAIL-only)',
    licenses: 'MediaPipe Face Landmarker — Apache-2.0 — https://github.com/google-ai-edge/mediapipe/blob/master/LICENSE', gates: { V11_G3: 'NOT_EVALUATED' as const, publish: 'FORBIDDEN' as const, autoPass: 'FORBIDDEN' as const } };
  const dlg = input.shots.filter(s => s.hasDialogue);
  if (!dlg.length) return { ...base, shots: [], gate: 'NOT_APPLICABLE' as const, g3: 'NOT_EVALUATED' as const };
  let measure = deps.measure;
  if (!measure) { const m = deps.model ?? DEFAULT_LANDMARKER; if (!existsSync(m)) return { ...base, shots: [], gate: 'NOT_EVALUATED' as const, g3: 'NOT_EVALUATED' as const, reason: `face landmarker not found: ${m}` }; measure = pythonMeasure(m); }
  const shots = [];
  for (const s of dlg) {
    if (!s.audioPath) { shots.push({ shotId: s.shotId, verdict: 'FAIL' as const, reason: 'dialogue shot has no audio; cannot verify' }); continue; }
    try { shots.push({ shotId: s.shotId, ...judgeCoarse(await measure(s.takePath, s.audioPath)) }); }
    catch (e) { shots.push({ shotId: s.shotId, verdict: 'FAIL' as const, reason: `measure error: ${(e as Error).message.slice(0, 200)}` }); }
  }
  const fail = shots.some(s => s.verdict === 'FAIL');
  return { ...base, shots, gate: fail ? 'FAIL' as const : 'NOT_EVALUATED' as const, g3: fail ? 'BLOCKED' as const : 'NOT_EVALUATED' as const };
}
