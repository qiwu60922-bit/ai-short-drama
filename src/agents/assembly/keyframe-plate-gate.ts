/**
 * V12 · Keyframe Plate Gate (H3 关键帧板连续性闸门), pre-gen / post-storyboard, offline, deterministic.
 *
 * Method rewritten in TypeScript from stealbmin/h3-keyframe-plate-sequence README method
 * (MIT, Copyright (c) 2026 stealbmin) — code LICENSE only:
 * https://github.com/stealbmin/h3-keyframe-plate-sequence
 * Not a wholesale vendoring: examples/media/results are CC BY-NC (LICENSE-CONTENT) and are NOT copied.
 * We only encode the mechanical screenplay rules:
 *   render plates P0..Pn in one locked room → each clip uses FL2VA from P(k-1) to P(k)
 *   → no clip starts from a generated last-frame (no chain mode) → neighbours share the join plate.
 *
 *  SCHEMA (FAIL)                 input fails shape
 *  PLATE_MIN (FAIL)              plates.length < minPlates (default 2)
 *  CLIP_MIN (FAIL)               clips.length < minClips (default 1)
 *  DUP_PLATE (FAIL)              plate id duplicated
 *  ROOM_LOCK_MISMATCH (FAIL)     plate.roomLockId ≠ scene.roomLockId
 *  PLATE_UNKNOWN (FAIL)          clip first/last plate id not in plates
 *  CHAIN_MODE (FAIL)             clip.mode === 'chain' (forbidden; use fl2va)
 *  SAME_PLATE (FAIL)             firstPlateId === lastPlateId
 *  PLATE_ORDER (FAIL)            first.index >= last.index
 *  JOIN_BREAK (FAIL)             clip[i].lastPlateId ≠ clip[i+1].firstPlateId
 *  PROMPT_MISSING (FAIL)         clip.prompt empty/whitespace
 *  CONT_SHOT_LINE (WARN)         characterCount≥2 and continuousShotLine ≠ true
 *
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';

export const KEYFRAME_PLATE_DEFAULTS = {
  minPlates: 2,
  minClips: 1,
} as const;

export interface KeyframePlateOptions {
  minPlates?: number;
  minClips?: number;
}

const PlateSchema = z.object({
  id: z.string().min(1),
  index: z.number().int().nonnegative(),
  roomLockId: z.string().min(1),
  castNote: z.string().optional(),
});

const ClipSchema = z.object({
  id: z.string().min(1),
  firstPlateId: z.string().min(1),
  lastPlateId: z.string().min(1),
  mode: z.enum(['fl2va', 'chain']),
  prompt: z.string(),
  continuousShotLine: z.boolean().optional(),
});

export const KeyframePlateDocSchema = z.object({
  sceneId: z.string().min(1),
  roomLockId: z.string().min(1),
  characterCount: z.number().int().positive(),
  plates: z.array(PlateSchema),
  clips: z.array(ClipSchema),
});

export type KeyframePlateDoc = z.infer<typeof KeyframePlateDocSchema>;

export type KeyframePlateFindingCode =
  | 'SCHEMA'
  | 'PLATE_MIN'
  | 'CLIP_MIN'
  | 'DUP_PLATE'
  | 'ROOM_LOCK_MISMATCH'
  | 'PLATE_UNKNOWN'
  | 'CHAIN_MODE'
  | 'SAME_PLATE'
  | 'PLATE_ORDER'
  | 'JOIN_BREAK'
  | 'PROMPT_MISSING'
  | 'CONT_SHOT_LINE';

export interface KeyframePlateFinding {
  code: KeyframePlateFindingCode;
  severity: 'FAIL' | 'WARN';
  message: string;
  clipId?: string;
  plateId?: string;
  fix?: string;
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export interface KeyframePlateReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    plates: number;
    clips: number;
    joins: number;
    characterCount: number;
  };
  findings: KeyframePlateFinding[];
  thresholds: Required<KeyframePlateOptions>;
  gates: typeof GATES;
}

function schemaFail(message: string, t: Required<KeyframePlateOptions>): KeyframePlateReport {
  return {
    verdict: 'FAIL',
    metrics: { plates: 0, clips: 0, joins: 0, characterCount: 0 },
    findings: [{ code: 'SCHEMA', severity: 'FAIL', message }],
    thresholds: t,
    gates: GATES,
  };
}

/**
 * Evaluate a keyframe-plate sequence plan (H3 FL2VA, locked room, shared joins).
 */
export function evaluateKeyframePlate(
  input: unknown,
  options: KeyframePlateOptions = {},
): KeyframePlateReport {
  const t: Required<KeyframePlateOptions> = {
    minPlates: options.minPlates ?? KEYFRAME_PLATE_DEFAULTS.minPlates,
    minClips: options.minClips ?? KEYFRAME_PLATE_DEFAULTS.minClips,
  };

  const parsed = KeyframePlateDocSchema.safeParse(input);
  if (!parsed.success) {
    return schemaFail(parsed.error.issues[0]?.message ?? 'invalid keyframe-plate document', t);
  }
  const doc = parsed.data;
  const findings: KeyframePlateFinding[] = [];

  if (doc.plates.length < t.minPlates) {
    findings.push({
      code: 'PLATE_MIN',
      severity: 'FAIL',
      message: `plates=${doc.plates.length} < minPlates=${t.minPlates}`,
      fix: 'Render at least two keyframe plates (P0, P1, …) in one locked room before clipping',
    });
  }

  if (doc.clips.length < t.minClips) {
    findings.push({
      code: 'CLIP_MIN',
      severity: 'FAIL',
      message: `clips=${doc.clips.length} < minClips=${t.minClips}`,
    });
  }

  const seen = new Set<string>();
  const plateById = new Map<string, (typeof doc.plates)[number]>();
  for (const p of doc.plates) {
    if (seen.has(p.id)) {
      findings.push({
        code: 'DUP_PLATE',
        severity: 'FAIL',
        plateId: p.id,
        message: `duplicate plate id "${p.id}"`,
      });
    }
    seen.add(p.id);
    plateById.set(p.id, p);
    if (p.roomLockId !== doc.roomLockId) {
      findings.push({
        code: 'ROOM_LOCK_MISMATCH',
        severity: 'FAIL',
        plateId: p.id,
        message: `plate ${p.id} roomLockId="${p.roomLockId}" ≠ scene roomLockId="${doc.roomLockId}"`,
        fix: 'Lock every plate to the same empty-room plate (seg_lock / compose)',
      });
    }
  }

  for (const clip of doc.clips) {
    if (clip.mode === 'chain') {
      findings.push({
        code: 'CHAIN_MODE',
        severity: 'FAIL',
        clipId: clip.id,
        message: `clip ${clip.id} mode=chain — forbidden; use fl2va (first-and-last-frame from plates)`,
        fix: 'Do not start a clip from a generated last-frame; pin both ends to plates',
      });
    }

    if (!clip.prompt.trim()) {
      findings.push({
        code: 'PROMPT_MISSING',
        severity: 'FAIL',
        clipId: clip.id,
        message: `clip ${clip.id} prompt is empty`,
      });
    }

    const first = plateById.get(clip.firstPlateId);
    const last = plateById.get(clip.lastPlateId);
    if (!first) {
      findings.push({
        code: 'PLATE_UNKNOWN',
        severity: 'FAIL',
        clipId: clip.id,
        message: `clip ${clip.id} firstPlateId="${clip.firstPlateId}" not in plates`,
      });
    }
    if (!last) {
      findings.push({
        code: 'PLATE_UNKNOWN',
        severity: 'FAIL',
        clipId: clip.id,
        message: `clip ${clip.id} lastPlateId="${clip.lastPlateId}" not in plates`,
      });
    }

    if (clip.firstPlateId === clip.lastPlateId) {
      findings.push({
        code: 'SAME_PLATE',
        severity: 'FAIL',
        clipId: clip.id,
        message: `clip ${clip.id} firstPlateId === lastPlateId ("${clip.firstPlateId}")`,
        fix: 'Each clip must travel between two distinct plates',
      });
    } else if (first && last && first.index >= last.index) {
      findings.push({
        code: 'PLATE_ORDER',
        severity: 'FAIL',
        clipId: clip.id,
        message: `clip ${clip.id} plate order ${first.id}(i=${first.index}) → ${last.id}(i=${last.index}) is not ascending`,
        fix: 'Clips must advance P(k-1) → P(k)',
      });
    }

    if (doc.characterCount >= 2 && clip.continuousShotLine !== true) {
      findings.push({
        code: 'CONT_SHOT_LINE',
        severity: 'WARN',
        clipId: clip.id,
        message: `clip ${clip.id}: characterCount=${doc.characterCount} but continuousShotLine≠true — H3 may insert coverage cut-ins`,
        fix: 'Add "one continuous, unbroken shot from one fixed camera" to the prompt and set continuousShotLine=true',
      });
    }
  }

  for (let i = 0; i < doc.clips.length - 1; i++) {
    const a = doc.clips[i];
    const b = doc.clips[i + 1];
    if (a.lastPlateId !== b.firstPlateId) {
      findings.push({
        code: 'JOIN_BREAK',
        severity: 'FAIL',
        clipId: b.id,
        message: `join break: clip ${a.id}.lastPlateId="${a.lastPlateId}" ≠ clip ${b.id}.firstPlateId="${b.firstPlateId}"`,
        fix: 'Neighbouring clips must share the join plate so the end of one is the start of the next',
      });
    }
  }

  const hasFail = findings.some((f) => f.severity === 'FAIL');
  return {
    verdict: hasFail ? 'FAIL' : 'PASS',
    metrics: {
      plates: doc.plates.length,
      clips: doc.clips.length,
      joins: Math.max(0, doc.clips.length - 1),
      characterCount: doc.characterCount,
    },
    findings,
    thresholds: t,
    gates: GATES,
  };
}
