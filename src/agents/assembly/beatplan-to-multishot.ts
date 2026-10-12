/**
 * Wave14 · ShotSpec (+ optional BeatPlan) → MultiShotList converter.
 * Pure function: no IO. Refuses (lists problems) instead of guessing refs; never invents RefDNA.
 */
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { MultiShotListSchema, type MultiShotList } from './multishot-oneclick';

const sha = z.string().regex(/^[a-f0-9]{64}$/i);
export const CharacterRefBindingSchema = z.object({
  characterId: z.string().min(1),
  appearanceRevisionId: z.string().min(1),
  refContentSha256: sha,
  appearanceContentSha256: sha.optional(),
  operatorKind: z.enum(['hero_portrait', 'dna_locked_export']).optional(),
  approvedTemporary: z.object({ actor: z.string().min(1), reason: z.string().min(1) }).optional(),
  firstFramePath: z.string().min(1),
});
export type CharacterRefBinding = z.infer<typeof CharacterRefBindingSchema>;

export const ShotSpecDocSchema = z.object({
  schema: z.string().optional(),
  episode: z.string().min(1),
  shots: z.array(z.object({
    shotId: z.string().min(1),
    beatId: z.string().min(1).optional(),
    durSec: z.number().positive(),
    camera: z.string().optional(),
    action: z.string().optional(),
    cast: z.array(z.string()).default([]),
    state: z.string().nullable().optional(),
    dialogue: z.union([z.string(), z.array(z.string())]).nullable().optional(),
    vo: z.string().nullable().optional(),
  }).passthrough()).min(1),
}).passthrough();
export type ShotSpecDoc = z.infer<typeof ShotSpecDocSchema>;

export const BeatPlanDocSchema = z.object({
  planId: z.string().optional(),
  targetDurationSec: z.object({ min: z.number().positive(), max: z.number().positive() }).optional(),
  beats: z.array(z.object({ beatId: z.string().min(1), dur: z.number().positive().optional(), shots: z.array(z.string()), cast: z.array(z.string()).default([]) }).passthrough()),
}).passthrough();

export interface ConvertOptions {
  workDir: string;
  mode?: 'dry-run' | 'live';
  /** Bound refs per characterId (from HumanLock / REF_INDEX). Missing ⇒ problem, never guessed. */
  bindings: Record<string, CharacterRefBinding>;
  /** Ref for shots with empty cast (establishing/scenery). Without it those shots are problems. */
  sceneRef?: CharacterRefBinding;
  /** Deterministic seeds: baseSeed + order. Default 1000. */
  baseSeed?: number;
  canvas?: { width: number; height: number; fps: number };
  /** Explicit range override; else BeatPlan.targetDurationSec; else 60–90. */
  durationRange?: { minSeconds: number; maxSeconds: number };
  /** Inline prompt bans appended to every prompt. */
  hardBans?: string[];
}

export type ConvertProblem = { shotId?: string; beatId?: string; code: 'NO_REF_BINDING' | 'BEAT_SHOT_MISMATCH' | 'BEAT_DURATION_MISMATCH' | 'UNKNOWN_BEAT' | 'DURATION_OUT_OF_RANGE' | 'SCHEMA'; message: string };
export type ConvertResult = { ok: true; list: MultiShotList; leadByShot: Record<string, string | null>; problems: [] } | { ok: false; problems: ConvertProblem[] };

const safeId = (id: string) => id.replace(/[^A-Za-z0-9._-]/g, '_');

export function buildShotPrompt(s: ShotSpecDoc['shots'][number], hardBans: string[] = []): string {
  const parts = [
    s.camera && `Camera: ${s.camera}`,
    s.action && `Action: ${s.action}`,
    s.cast.length ? `Cast: ${s.cast.join(', ')}` : 'Cast: none (scenery)',
    s.state && `State: ${s.state}`,
    s.dialogue && `Dialogue: ${Array.isArray(s.dialogue) ? s.dialogue.join(' / ') : s.dialogue}`,
    s.vo && `VO: ${s.vo}`,
    hardBans.length ? `Hard bans: ${hardBans.join('; ')}` : '',
  ];
  return parts.filter(Boolean).join('\n');
}

export function convertShotSpecToMultiShot(shotSpecRaw: unknown, beatPlanRaw: unknown | undefined, opts: ConvertOptions): ConvertResult {
  const problems: ConvertProblem[] = [];
  const sp = ShotSpecDocSchema.safeParse(shotSpecRaw);
  if (!sp.success) return { ok: false, problems: [{ code: 'SCHEMA', message: `ShotSpec: ${sp.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}` }] };
  let beat: z.infer<typeof BeatPlanDocSchema> | undefined;
  if (beatPlanRaw !== undefined) {
    const bp = BeatPlanDocSchema.safeParse(beatPlanRaw);
    if (!bp.success) return { ok: false, problems: [{ code: 'SCHEMA', message: `BeatPlan: ${bp.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}` }] };
    beat = bp.data;
  }
  const spec = sp.data;

  if (beat) {
    const beatIds = new Set(beat.beats.map((b) => b.beatId));
    for (const s of spec.shots) if (s.beatId && !beatIds.has(s.beatId)) problems.push({ shotId: s.shotId, code: 'UNKNOWN_BEAT', message: `beat ${s.beatId} not in BeatPlan` });
    for (const b of beat.beats) {
      const fromSpec = spec.shots.filter((s) => s.beatId === b.beatId).map((s) => s.shotId);
      if (fromSpec.join(',') !== b.shots.join(','))
        problems.push({ beatId: b.beatId, code: 'BEAT_SHOT_MISMATCH', message: `BeatPlan shots [${b.shots}] ≠ ShotSpec [${fromSpec}]` });
      if (b.dur !== undefined) {
        const sum = spec.shots.filter((s) => s.beatId === b.beatId).reduce((a, s) => a + s.durSec, 0);
        if (Math.abs(sum - b.dur) > 1e-6) problems.push({ beatId: b.beatId, code: 'BEAT_DURATION_MISMATCH', message: `beat dur ${b.dur}s ≠ shots sum ${sum}s` });
      }
    }
  }

  const range = opts.durationRange
    ?? (beat?.targetDurationSec ? { minSeconds: beat.targetDurationSec.min, maxSeconds: beat.targetDurationSec.max } : { minSeconds: 60, maxSeconds: 90 });
  const planned = spec.shots.reduce((a, s) => a + s.durSec, 0);
  if (planned < range.minSeconds || planned > range.maxSeconds)
    problems.push({ code: 'DURATION_OUT_OF_RANGE', message: `planned ${planned}s outside [${range.minSeconds},${range.maxSeconds}]` });

  const leadByShot: Record<string, string | null> = {};
  const shots = spec.shots.map((s, i) => {
    let ref: CharacterRefBinding | undefined;
    if (s.cast.length === 0) {
      ref = opts.sceneRef;
      leadByShot[s.shotId] = null;
      if (!ref) problems.push({ shotId: s.shotId, code: 'NO_REF_BINDING', message: 'scenery shot needs sceneRef' });
    } else {
      const lead = s.cast.find((c) => opts.bindings[c]);
      leadByShot[s.shotId] = lead ?? null;
      ref = lead ? opts.bindings[lead] : undefined;
      const unbound = s.cast.filter((c) => !opts.bindings[c]);
      if (unbound.length) problems.push({ shotId: s.shotId, code: 'NO_REF_BINDING', message: `no RefBinding for ${unbound.join(',')}` });
    }
    return { shotId: safeId(s.shotId), order: i, seed: String((opts.baseSeed ?? 1000) + i), positivePrompt: buildShotPrompt(s, opts.hardBans), ...(ref ? { ref } : {}) };
  });

  if (problems.length) return { ok: false, problems };
  const candidate = {
    schemaVersion: 1, episodeId: safeId(spec.episode.toLowerCase()), mode: opts.mode ?? 'dry-run',
    ...(opts.canvas ? { canvas: opts.canvas } : {}), durationRange: range, shots, workDir: opts.workDir,
  };
  const parsed = MultiShotListSchema.safeParse(candidate);
  if (!parsed.success) return { ok: false, problems: [{ code: 'SCHEMA', message: parsed.error.issues.map((i) => i.message).join('; ') }] };
  return { ok: true, list: parsed.data, leadByShot, problems: [] };
}

/** Stable id of a converted list (for audit trails). */
export const listDigest = (l: MultiShotList) => createHash('sha256').update(JSON.stringify(l.shots)).digest('hex');
