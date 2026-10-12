/**
 * V13 lipsync detector: SyncNet-style LSE-C (confidence, higher better) / LSE-D (distance, lower better),
 * as used by LatentSync evaluation. Local scorer only (scripts/detectors/latentsync_score.py, user-provided weights).
 * Thresholds frozen. Any FAIL/ERROR ⇒ G3 BLOCKED. MACHINE_OK never lifts G3 (human-only).
 * STATUS: code ready, awaiting real material.
 */
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
export const LIPSYNC_THRESHOLDS = Object.freeze({ lseCMin: 6.0, lseDMax: 8.5 });
export type Score = (videoPath: string, audioPath: string) => Promise<{ lseC: number; lseD: number }>;
export const DEFAULT_SCORER = process.env.V13_LIPSYNC_SCORER ?? 'scripts/detectors/latentsync_score.py';
const pyScorer = (cmd: string): Score => (v, a) => new Promise((res, rej) =>
  execFile('python3', [cmd, '--video', v, '--audio', a], (e, out) => (e ? rej(e) : res(JSON.parse(out)))));
export interface LipShot { shotId: string; takePath: string; audioPath?: string; hasDialogue: boolean }
export async function runLipsyncCheck(input: { episodeId: string; shots: LipShot[] }, deps: { score?: Score; scorerCmd?: string } = {}) {
  if ('thresholds' in input || 'threshold' in input) throw new Error('lipsync thresholds are frozen; override forbidden');
  const base = { schema: 'v13/LipsyncReport/v1' as const, episodeId: input.episodeId, thresholds: LIPSYNC_THRESHOLDS, method: 'SyncNet LSE-C/LSE-D (LatentSync eval)',
    readiness: 'CODE_READY_AWAITING_REAL_MATERIAL' as const, gates: { V11_G3: 'NOT_EVALUATED' as const, publish: 'FORBIDDEN' as const, autoPass: 'FORBIDDEN' as const } };
  const dlg = input.shots.filter(s => s.hasDialogue);
  let score = deps.score;
  if (!score) { const cmd = deps.scorerCmd ?? DEFAULT_SCORER;
    if (!existsSync(cmd)) return { ...base, shots: [], gate: 'NOT_EVALUATED' as const, g3: 'NOT_EVALUATED' as const, reason: `local lipsync scorer not found: ${cmd}` };
    score = pyScorer(cmd); }
  if (!dlg.length) return { ...base, shots: [], gate: 'NOT_APPLICABLE' as const, g3: 'NOT_EVALUATED' as const };
  const shots: { shotId: string; lseC: number | null; lseD: number | null; verdict: 'MACHINE_OK' | 'FAIL'; reason: string }[] = [];
  try {
    for (const s of dlg) {
      if (!s.audioPath) { shots.push({ shotId: s.shotId, lseC: null, lseD: null, verdict: 'FAIL', reason: 'dialogue shot has no audio; cannot verify' }); continue; }
      const { lseC, lseD } = await score(s.takePath, s.audioPath);
      const ok = lseC >= LIPSYNC_THRESHOLDS.lseCMin && lseD <= LIPSYNC_THRESHOLDS.lseDMax;
      shots.push({ shotId: s.shotId, lseC, lseD, verdict: ok ? 'MACHINE_OK' : 'FAIL', reason: ok ? '' : 'below LSE thresholds' });
    }
  } catch (e) { return { ...base, shots, gate: 'ERROR' as const, g3: 'BLOCKED' as const, reason: (e as Error).message }; }
  const fail = shots.some(s => s.verdict === 'FAIL');
  return { ...base, shots, gate: fail ? 'FAIL' as const : 'MACHINE_OK' as const, g3: fail ? 'BLOCKED' as const : 'NOT_EVALUATED' as const };
}
