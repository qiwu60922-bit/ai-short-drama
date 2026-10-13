/**
 * Wave14 · REF_INDEX.json → RefBinding map for the ShotSpec converter.
 * NEVER auto-locks: only entries already `HUMAN_LOCK` become locked bindings.
 * `LOCK_CANDIDATE` is excluded unless the caller opts in for a dry-run rehearsal AND the index itself
 * carries a human-set dry-run policy (dryRun=ALLOW_PORTRAIT); then it is emitted as approvedTemporary,
 * status stays LOCK_CANDIDATE, and no appearanceContentSha256 is claimed.
 */
import type { CharacterRefBinding } from './beatplan-to-multishot';

export interface RefIndexFile { path: string; role?: string; sha256?: string; }
export interface RefIndexEntry {
  status?: string; displayName?: string; files?: RefIndexFile[];
  kind?: string; shots?: string[];
  humanLockPrimary?: string; humanLockSheet?: string; primary?: string; dryRun?: string; dryRunPolicy?: string;
}

export type BindingDecision =
  | { characterId: string; outcome: 'LOCKED'; binding: CharacterRefBinding; source: string }
  | { characterId: string; outcome: 'TEMPORARY_DRY_RUN'; binding: CharacterRefBinding; source: string }
  | { characterId: string; outcome: 'EXCLUDED'; reason: string };

export interface RefIndexOptions {
  /** Opt-in for rehearsal: allow LOCK_CANDIDATE with index dryRun=ALLOW_PORTRAIT as approvedTemporary. */
  allowCandidatesForDryRun?: boolean;
  /** Optional on-disk sha verification (path → sha256 or null if missing). */
  verifySha?: (path: string) => string | null;
}

const isEntry = (v: unknown): v is RefIndexEntry => !!v && typeof v === 'object' && !Array.isArray(v) && 'status' in (v as object);
const norm = (p: string) => p.replace(/\\/g, '/');

function pickPrimary(e: RefIndexEntry): RefIndexFile | undefined {
  const files = (e.files ?? []).filter((f) => f.path && f.sha256 && /^[a-f0-9]{64}$/i.test(f.sha256));
  for (const want of [e.humanLockPrimary, e.humanLockSheet, e.primary].filter(Boolean) as string[]) {
    const w = norm(want);
    const hit = files.find((f) => norm(f.path) === w || norm(f.path).endsWith('/' + w.replace(/^\/+/, '')));
    if (hit) return hit;
  }
  return files[0];
}

export function bindingsFromRefIndex(index: Record<string, unknown>, opts: RefIndexOptions = {}) {
  const decisions: BindingDecision[] = [];
  const bindings: Record<string, CharacterRefBinding> = {};
  for (const [id, v] of Object.entries(index)) {
    if (!isEntry(v) || v.kind === 'scene') continue;
    const status = String(v.status);
    if (status !== 'HUMAN_LOCK' && status !== 'LOCK_CANDIDATE') { decisions.push({ characterId: id, outcome: 'EXCLUDED', reason: `status ${status}` }); continue; }
    const f = pickPrimary(v);
    if (!f) { decisions.push({ characterId: id, outcome: 'EXCLUDED', reason: 'no file with sha256' }); continue; }
    if (opts.verifySha) {
      const actual = opts.verifySha(f.path);
      if (actual === null) { decisions.push({ characterId: id, outcome: 'EXCLUDED', reason: `file missing: ${f.path}` }); continue; }
      if (actual.toLowerCase() !== f.sha256!.toLowerCase()) { decisions.push({ characterId: id, outcome: 'EXCLUDED', reason: `sha mismatch on disk: ${f.path}` }); continue; }
    }
    const sha = f.sha256!.toLowerCase();
    if (status === 'HUMAN_LOCK') {
      const binding: CharacterRefBinding = { characterId: id, appearanceRevisionId: `apr-${id}-${sha.slice(0, 8)}`, refContentSha256: sha,
        appearanceContentSha256: sha, operatorKind: 'dna_locked_export', firstFramePath: f.path };
      bindings[id] = binding;
      decisions.push({ characterId: id, outcome: 'LOCKED', binding, source: f.path });
      continue;
    }
    if (!opts.allowCandidatesForDryRun) { decisions.push({ characterId: id, outcome: 'EXCLUDED', reason: 'LOCK_CANDIDATE (not HUMAN_LOCK); never auto-locked' }); continue; }
    if (v.dryRun !== 'ALLOW_PORTRAIT') { decisions.push({ characterId: id, outcome: 'EXCLUDED', reason: 'LOCK_CANDIDATE without index dryRun=ALLOW_PORTRAIT' }); continue; }
    const binding: CharacterRefBinding = { characterId: id, appearanceRevisionId: `apr-${id}-candidate-${sha.slice(0, 8)}`, refContentSha256: sha,
      operatorKind: 'hero_portrait', firstFramePath: f.path,
      approvedTemporary: { actor: 'REF_INDEX.dryRunPolicy', reason: `LOCK_CANDIDATE dry-run only (${v.dryRunPolicy ?? 'ALLOW_PORTRAIT'}); not HUMAN_LOCK` } };
    bindings[id] = binding;
    decisions.push({ characterId: id, outcome: 'TEMPORARY_DRY_RUN', binding, source: f.path });
  }
  return { bindings, decisions };
}

export type SceneDecision =
  | { sceneId: string; outcome: 'LOCKED'; shots: string[]; binding: CharacterRefBinding }
  | { sceneId: string; outcome: 'EXCLUDED'; reason: string };

/**
 * Scene refs (kind="scene", shots=[...]). Only HUMAN_LOCK scene entries bind; SPEC_PENDING / LOCK_CANDIDATE
 * never do (caller keeps its placeholder). Never auto-locks.
 */
export function sceneRefsFromRefIndex(index: Record<string, unknown>, opts: Pick<RefIndexOptions, 'verifySha'> = {}) {
  const byShot: Record<string, CharacterRefBinding> = {};
  const decisions: SceneDecision[] = [];
  for (const [id, v] of Object.entries(index)) {
    if (!isEntry(v) || v.kind !== 'scene') continue;
    if (v.status !== 'HUMAN_LOCK') { decisions.push({ sceneId: id, outcome: 'EXCLUDED', reason: `status ${v.status}; placeholder stays until human lock` }); continue; }
    const f = pickPrimary(v);
    if (!f) { decisions.push({ sceneId: id, outcome: 'EXCLUDED', reason: 'no file with sha256' }); continue; }
    if (opts.verifySha) {
      const actual = opts.verifySha(f.path);
      if (actual === null || actual.toLowerCase() !== f.sha256!.toLowerCase()) { decisions.push({ sceneId: id, outcome: 'EXCLUDED', reason: `file missing or sha mismatch: ${f.path}` }); continue; }
    }
    const sha = f.sha256!.toLowerCase();
    const binding: CharacterRefBinding = { characterId: id, appearanceRevisionId: `apr-${id}-${sha.slice(0, 8)}`, refContentSha256: sha, appearanceContentSha256: sha, operatorKind: 'dna_locked_export', firstFramePath: f.path };
    for (const shot of v.shots ?? []) byShot[shot] = binding;
    decisions.push({ sceneId: id, outcome: 'LOCKED', shots: v.shots ?? [], binding });
  }
  return { byShot, decisions };
}
