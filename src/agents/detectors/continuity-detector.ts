/**
 * V13 continuity detector: tail frame of shot N vs head frame of shot N+1 (32×32 gray).
 * Metrics: MAD (0–1) + dHash Hamming (0–64). Thresholds frozen in code — change only via reviewed PR, never per run.
 * Verdicts: MACHINE_OK | FAIL. Machine never emits PASS; G3 stays NOT_EVALUATED.
 */
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
export const CONTINUITY_THRESHOLDS = Object.freeze({ mad: 0.12, dhash: 16 });
export const THRESHOLDS_SHA256 = createHash('sha256').update(JSON.stringify(CONTINUITY_THRESHOLDS)).digest('hex');
const N = 32;
export type Which = 'head' | 'tail';
export function extractGray(path: string, which: Which): Promise<Uint8Array> {
  const pre = which === 'tail' ? ['-sseof', '-0.1'] : [];
  const args = ['-v', 'error', ...pre, '-i', path, '-frames:v', '1', '-vf', `scale=${N}:${N}:flags=area,format=gray`, '-f', 'rawvideo', '-'];
  return new Promise((res, rej) => execFile('ffmpeg', args, { encoding: 'buffer', maxBuffer: 1 << 20 }, (e, out) => {
    if (e) return rej(e); if (out.length < N * N) return rej(new Error(`no frame from ${path}`)); res(new Uint8Array(out.subarray(out.length - N * N)));
  }));
}
export function dHash(g: Uint8Array): string {
  let bits = '';
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    const cell = (cx: number) => { let s = 0; for (let yy = 0; yy < 4; yy++) for (let xx = 0; xx < 3; xx++) s += g[(y * 4 + yy) * N + Math.min(N - 1, cx * 3 + xx)]; return s; };
    bits += cell(x) < cell(x + 1) ? '1' : '0';
  }
  return bits;
}
export function frameDistance(a: Uint8Array, b: Uint8Array) {
  let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
  const ha = dHash(a), hb = dHash(b); let h = 0; for (let i = 0; i < 64; i++) if (ha[i] !== hb[i]) h++;
  return { mad: Math.round((s / a.length / 255) * 1e4) / 1e4, dhash: h };
}
export interface ContShot { shotId: string; takePath: string; continuousWithPrev?: boolean }
export function continuityPairs(shots: ContShot[], mode: 'marked' | 'all' = 'marked'): [string, string][] {
  const out: [string, string][] = [];
  for (let i = 1; i < shots.length; i++) if (mode === 'all' || shots[i].continuousWithPrev) out.push([shots[i - 1].shotId, shots[i].shotId]);
  return out;
}
export interface ContinuityReport {
  schema: 'v13/ContinuityReport/v1'; episodeId: string; thresholds: typeof CONTINUITY_THRESHOLDS; thresholdsSha256: string;
  pairs: { from: string; to: string; mad: number; dhash: number; verdict: 'MACHINE_OK' | 'FAIL' }[];
  gate: 'MACHINE_OK' | 'FAIL' | 'NOT_APPLICABLE' | 'ERROR'; error?: string;
  gates: { V11_G3: 'NOT_EVALUATED'; publish: 'FORBIDDEN'; autoPass: 'FORBIDDEN' };
}
export async function runContinuityCheck(input: { episodeId: string; shots: ContShot[]; mode?: 'marked' | 'all' },
  deps: { grab?: (path: string, which: Which) => Promise<Uint8Array> } = {}): Promise<ContinuityReport> {
  if ('thresholds' in (input as object)) throw new Error('thresholds are frozen; per-run threshold override is forbidden');
  const grab = deps.grab ?? extractGray;
  const base = { schema: 'v13/ContinuityReport/v1' as const, episodeId: input.episodeId, thresholds: CONTINUITY_THRESHOLDS, thresholdsSha256: THRESHOLDS_SHA256,
    gates: { V11_G3: 'NOT_EVALUATED' as const, publish: 'FORBIDDEN' as const, autoPass: 'FORBIDDEN' as const } };
  const byId = new Map(input.shots.map(s => [s.shotId, s]));
  const pairs: ContinuityReport['pairs'] = [];
  try {
    for (const [f, t] of continuityPairs(input.shots, input.mode)) {
      const d = frameDistance(await grab(byId.get(f)!.takePath, 'tail'), await grab(byId.get(t)!.takePath, 'head'));
      pairs.push({ from: f, to: t, ...d, verdict: d.mad <= CONTINUITY_THRESHOLDS.mad && d.dhash <= CONTINUITY_THRESHOLDS.dhash ? 'MACHINE_OK' : 'FAIL' });
    }
  } catch (e) { return { ...base, pairs, gate: 'ERROR', error: (e as Error).message }; }
  return { ...base, pairs, gate: !pairs.length ? 'NOT_APPLICABLE' : pairs.some(p => p.verdict === 'FAIL') ? 'FAIL' : 'MACHINE_OK' };
}
