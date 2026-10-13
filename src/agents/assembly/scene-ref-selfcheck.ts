/**
 * Scene reference pre-lock self-check (SCENE_REF_SPEC_S01_S14): exists · PNG · 1344×768 · registered sha256.
 * Person detection is NOT run (NOT_CHECKED) — human must confirm. Read-only; never changes REF_INDEX status.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

export type CheckState = 'PASS' | 'FAIL' | 'NOT_CHECKED' | 'NOT_REGISTERED';
export interface SceneCheckResult {
  path: string;
  sha256?: string;
  size?: { width: number; height: number };
  checks: { exists: CheckState; format: CheckState; size: CheckState; sha256: CheckState; noPerson: 'NOT_CHECKED' };
  reasons: string[];
  verdict: 'READY_FOR_HUMAN_LOCK' | 'BLOCKED';
  autoLock: 'FORBIDDEN';
}

const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
export function readPngSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 24 || !buf.subarray(0, 8).equals(PNG_SIG) || buf.toString('ascii', 12, 16) !== 'IHDR') return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

export function checkSceneRefFile(path: string, opts: { expectedSha256?: string; width?: number; height?: number } = {}): SceneCheckResult {
  const W = opts.width ?? 1344, H = opts.height ?? 768;
  const reasons: string[] = [];
  const checks: SceneCheckResult['checks'] = { exists: 'FAIL', format: 'NOT_CHECKED', size: 'NOT_CHECKED', sha256: 'NOT_CHECKED', noPerson: 'NOT_CHECKED' };
  const done = (extra: Partial<SceneCheckResult> = {}): SceneCheckResult => {
    reasons.push('noPerson NOT_CHECKED: human must confirm no characters in frame');
    const blocked = Object.entries(checks).some(([k, v]) => k !== 'noPerson' && v !== 'PASS');
    return { path, checks, reasons, verdict: blocked ? 'BLOCKED' : 'READY_FOR_HUMAN_LOCK', autoLock: 'FORBIDDEN', ...extra };
  };
  if (!existsSync(path)) { reasons.push('file missing'); return done(); }
  checks.exists = 'PASS';
  const buf = readFileSync(path);
  const sha256 = createHash('sha256').update(buf).digest('hex');
  const size = readPngSize(buf);
  if (!size) { checks.format = 'FAIL'; reasons.push('not a PNG'); }
  else {
    checks.format = 'PASS';
    checks.size = size.width === W && size.height === H ? 'PASS' : 'FAIL';
    if (checks.size === 'FAIL') reasons.push(`size ${size.width}x${size.height} ≠ ${W}x${H}`);
  }
  if (!opts.expectedSha256) { checks.sha256 = 'NOT_REGISTERED'; reasons.push('sha256 not registered in REF_INDEX'); }
  else if (opts.expectedSha256.toLowerCase() === sha256) checks.sha256 = 'PASS';
  else { checks.sha256 = 'FAIL'; reasons.push('sha256 mismatch vs REF_INDEX'); }
  return done({ sha256, ...(size ? { size } : {}) });
}

export interface SceneEntryCheck { sceneId: string; status: string; shots: string[]; files: SceneCheckResult[]; verdict: SceneCheckResult['verdict']; reasons: string[]; autoLock: 'FORBIDDEN'; }

export function selfCheckSceneEntries(index: Record<string, unknown>): SceneEntryCheck[] {
  const out: SceneEntryCheck[] = [];
  for (const [id, raw] of Object.entries(index)) {
    const v = raw as { kind?: string; status?: string; shots?: string[]; files?: { path: string; sha256?: string }[] };
    if (!v || typeof v !== 'object' || v.kind !== 'scene') continue;
    const files = (v.files ?? []).map((f) => checkSceneRefFile(f.path, { expectedSha256: f.sha256 }));
    const reasons = files.length ? files.flatMap((f) => f.reasons.map((r) => `${f.path}: ${r}`)) : ['no files registered'];
    const verdict = files.length && files.every((f) => f.verdict === 'READY_FOR_HUMAN_LOCK') ? 'READY_FOR_HUMAN_LOCK' : 'BLOCKED';
    out.push({ sceneId: id, status: String(v.status), shots: v.shots ?? [], files, verdict, reasons, autoLock: 'FORBIDDEN' });
  }
  return out;
}
