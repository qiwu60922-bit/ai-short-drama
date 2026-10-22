/**
 * V12 · Shot Contract Gate (AI 视频分镜契约闸门), pre-gen / post-storyboard, offline, deterministic.
 *
 * Method rewritten in TypeScript from tongxigogo-crypto/shot-contract validate.mjs
 * (MIT, Copyright (c) 2026 tongxigogo-crypto) — code LICENSE only:
 * https://github.com/tongxigogo-crypto/shot-contract
 * Not wholesale vendoring: examples/media not copied. We encode the mechanical rules:
 *   dramatic motive (no impression words) · 1–2 ruleRefs/shot · duration band ·
 *   negatives required · dialogue needs spatial.axis · 3+ cast needs topDownMap ·
 *   ruleset resolution · neighbour WARNs (axis flip / time gap / untimed content / unmotivated move).
 *
 * Field mapping (gate-friendly JSON ↔ upstream):
 *   schemaVersion, projectId, shots[]          ← board root
 *   shot.id / durationSec / purpose / ruleRefs / negative / content / characters
 *   shot.dialogue (string | array)             ← triggers AXIS_REQUIRED
 *   shot.spatial.axis / move / motivation      ← axis + motivated camera
 *   shot.topDownMap                            ← crowded-scene map
 *   shot.startSec                              ← timeline continuity WARN
 *   options.ruleset.rules[].id                 ← RULE_UNKNOWN when provided
 *
 *  SCHEMA (FAIL)              input fails shape / empty shots
 *  RULE_REFS_EMPTY (FAIL)     ruleRefs length < 1
 *  RULE_REFS_MAX (FAIL)       ruleRefs length > maxRulesPerShot (default 2)
 *  VAGUE_PURPOSE (FAIL)       purpose contains impression words (VAGUE_TERMS)
 *  DURATION (FAIL)            durationSec outside [minDurationSec, maxDurationSec]
 *  NEGATIVE_MISSING (FAIL)    negative empty
 *  AXIS_REQUIRED (FAIL)       dialogue present but spatial.axis < 2 characters
 *  TOP_DOWN_MAP (FAIL)        characters ≥ 3 and no topDownMap object
 *  RULE_UNKNOWN (FAIL)        ruleRef not in ruleset (when ruleset provided)
 *  AXIS_FLIP (WARN)           neighbouring shots reverse axis order
 *  TIME_GAP (WARN)            startSec does not continue from prior end
 *  CONTENT_UNTIMED (WARN)     content lacks "MM:SS-MM:SS " beat segments
 *  MOVE_UNMOTIVATED (WARN)    spatial.move set without motivation
 *
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';

export const SHOT_CONTRACT_DEFAULTS = {
  minDurationSec: 3,
  maxDurationSec: 15,
  maxRulesPerShot: 2,
} as const;

/** Impression words — aligned with upstream VAGUE_TERMS (tongxigogo-crypto/shot-contract). */
export const VAGUE_TERMS = [
  '电影感',
  '高级感',
  '大气',
  '有质感',
  '氛围感',
  '大片感',
  '震撼',
  '唯美',
  'cinematic',
  'movie feel',
  'premium feel',
  'high-end feel',
  'epic',
  'vibey',
  'aesthetic',
] as const;

export interface ShotContractOptions {
  minDurationSec?: number;
  maxDurationSec?: number;
  maxRulesPerShot?: number;
  /** When present, every ruleRefs entry must resolve to a rule id. */
  ruleset?: { rules?: Array<{ id?: string }> } | null;
}

const SpatialSchema = z
  .object({
    axis: z.array(z.string()).optional(),
    move: z.string().optional(),
    motivation: z.string().optional(),
  })
  .passthrough()
  .optional();

const ShotSchema = z.object({
  id: z.string().min(1),
  startSec: z.number().finite().optional(),
  durationSec: z.number().finite(),
  purpose: z.string().min(1),
  ruleRefs: z.array(z.string()),
  characters: z.array(z.string()).optional(),
  dialogue: z.union([z.string(), z.array(z.unknown())]).optional(),
  content: z.string().min(1),
  spatial: SpatialSchema,
  negative: z.array(z.string()),
  topDownMap: z.record(z.unknown()).optional(),
});

export const ShotContractDocSchema = z.object({
  schemaVersion: z.string().min(1),
  projectId: z.string().min(1),
  shots: z.array(ShotSchema).min(1),
});

export type ShotContractDoc = z.infer<typeof ShotContractDocSchema>;

export type ShotContractFindingCode =
  | 'SCHEMA'
  | 'RULE_REFS_EMPTY'
  | 'RULE_REFS_MAX'
  | 'VAGUE_PURPOSE'
  | 'DURATION'
  | 'NEGATIVE_MISSING'
  | 'AXIS_REQUIRED'
  | 'TOP_DOWN_MAP'
  | 'RULE_UNKNOWN'
  | 'AXIS_FLIP'
  | 'TIME_GAP'
  | 'CONTENT_UNTIMED'
  | 'MOVE_UNMOTIVATED';

export interface ShotContractFinding {
  code: ShotContractFindingCode;
  severity: 'FAIL' | 'WARN';
  message: string;
  shotId?: string;
  fix?: string;
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export interface ShotContractReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    projectId: string;
    shots: number;
    totalDurationSec: number;
    ruleRefs: number;
    findingCounts: { FAIL: number; WARN: number };
  };
  findings: ShotContractFinding[];
  thresholds: {
    minDurationSec: number;
    maxDurationSec: number;
    maxRulesPerShot: number;
  };
  gates: typeof GATES;
}

const TIMECODE = /^\s*\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}\s/;

function findVagueTerms(text: string): string[] {
  const lower = text.toLowerCase();
  return VAGUE_TERMS.filter((term) => lower.includes(term.toLowerCase()));
}

function hasDialogue(dialogue: unknown): boolean {
  if (typeof dialogue === 'string') return dialogue.trim().length > 0;
  return Array.isArray(dialogue);
}

function axisReversed(a: string[], b: string[]): boolean {
  if (a.length < 2 || b.length < 2) return false;
  return String(a[0]) === String(b[1]) && String(a[1]) === String(b[0]);
}

function collectRuleIds(ruleset: ShotContractOptions['ruleset']): Set<string> | null {
  if (!ruleset || !Array.isArray(ruleset.rules)) return null;
  const ids = ruleset.rules
    .map((r) => r?.id)
    .filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
  return new Set(ids);
}

function schemaFail(
  message: string,
  t: ShotContractReport['thresholds'],
): ShotContractReport {
  return {
    verdict: 'FAIL',
    metrics: {
      projectId: '',
      shots: 0,
      totalDurationSec: 0,
      ruleRefs: 0,
      findingCounts: { FAIL: 1, WARN: 0 },
    },
    findings: [{ code: 'SCHEMA', severity: 'FAIL', message }],
    thresholds: t,
    gates: GATES,
  };
}

/**
 * Evaluate an AI-video storyboard against the shot contract
 * (motive · ruleRefs · duration · negatives · spatial · beat timing).
 */
export function evaluateShotContract(
  input: unknown,
  options: ShotContractOptions = {},
): ShotContractReport {
  const t = {
    minDurationSec: options.minDurationSec ?? SHOT_CONTRACT_DEFAULTS.minDurationSec,
    maxDurationSec: options.maxDurationSec ?? SHOT_CONTRACT_DEFAULTS.maxDurationSec,
    maxRulesPerShot: options.maxRulesPerShot ?? SHOT_CONTRACT_DEFAULTS.maxRulesPerShot,
  };

  const parsed = ShotContractDocSchema.safeParse(input);
  if (!parsed.success) {
    return schemaFail(parsed.error.issues[0]?.message ?? 'invalid shot-contract document', t);
  }
  const doc = parsed.data;
  const findings: ShotContractFinding[] = [];
  const knownRules = collectRuleIds(options.ruleset);
  let totalDuration = 0;
  let ruleCount = 0;

  for (let index = 0; index < doc.shots.length; index++) {
    const shot = doc.shots[index];
    const label = `shots[${index}]`;

    totalDuration += shot.durationSec;
    if (shot.durationSec < t.minDurationSec || shot.durationSec > t.maxDurationSec) {
      findings.push({
        code: 'DURATION',
        severity: 'FAIL',
        shotId: shot.id,
        message: `${label}.durationSec ${shot.durationSec} outside [${t.minDurationSec}, ${t.maxDurationSec}]s`,
        fix: 'Keep each AI shot long enough to read and short enough for the model to hold coherence',
      });
    }

    const vague = findVagueTerms(shot.purpose);
    if (vague.length > 0) {
      findings.push({
        code: 'VAGUE_PURPOSE',
        severity: 'FAIL',
        shotId: shot.id,
        message: `${label}.purpose relies on impression words (${vague.join(', ')}); state the dramatic motive instead`,
        fix: 'Replace adjectives like 电影感/cinematic with what the shot must accomplish dramatically',
      });
    }

    if (shot.ruleRefs.length === 0) {
      findings.push({
        code: 'RULE_REFS_EMPTY',
        severity: 'FAIL',
        shotId: shot.id,
        message: `${label}.ruleRefs must contain at least one rule id`,
      });
    } else {
      ruleCount += shot.ruleRefs.length;
      if (shot.ruleRefs.length > t.maxRulesPerShot) {
        findings.push({
          code: 'RULE_REFS_MAX',
          severity: 'FAIL',
          shotId: shot.id,
          message: `${label}.ruleRefs has ${shot.ruleRefs.length} rules; selection principle allows at most ${t.maxRulesPerShot}`,
          fix: 'Carry one or two rules per shot, not a stack',
        });
      }
      if (knownRules) {
        for (const ref of shot.ruleRefs) {
          if (!ref.trim()) continue;
          if (!knownRules.has(ref)) {
            findings.push({
              code: 'RULE_UNKNOWN',
              severity: 'FAIL',
              shotId: shot.id,
              message: `${label}.ruleRefs references unknown rule ${ref} (not present in the ruleset)`,
            });
          }
        }
      }
    }

    if (shot.negative.length === 0) {
      findings.push({
        code: 'NEGATIVE_MISSING',
        severity: 'FAIL',
        shotId: shot.id,
        message: `${label}.negative must contain at least one constraint`,
        fix: 'List what the model must not invent (text, morphs, extra figures, …)',
      });
    }

    if (!TIMECODE.test(shot.content)) {
      findings.push({
        code: 'CONTENT_UNTIMED',
        severity: 'WARN',
        shotId: shot.id,
        message: `${label}.content has no timecode segments (expected "00:00-00:02 ..."); a model cannot pace an untimed description`,
      });
    }

    const characters = shot.characters ?? [];
    if (hasDialogue(shot.dialogue)) {
      const axis = shot.spatial?.axis;
      if (!Array.isArray(axis) || axis.length < 2) {
        findings.push({
          code: 'AXIS_REQUIRED',
          severity: 'FAIL',
          shotId: shot.id,
          message: `${label}.spatial.axis must list two characters when the shot has dialogue (prevents axis jumps)`,
          fix: 'Declare spatial.axis as [speakerA, speakerB] for every dialogue shot',
        });
      }
    }

    if (characters.length >= 3 && (shot.topDownMap === undefined || shot.topDownMap === null)) {
      findings.push({
        code: 'TOP_DOWN_MAP',
        severity: 'FAIL',
        shotId: shot.id,
        message: `${label} has ${characters.length} characters and no topDownMap; map positions and camera route before writing the prompt`,
      });
    }

    const spatial = shot.spatial;
    if (spatial && Array.isArray(spatial.axis) && spatial.axis.length >= 2 && index > 0) {
      const previous = doc.shots[index - 1];
      const previousAxis = previous.spatial?.axis;
      if (Array.isArray(previousAxis) && previousAxis.length >= 2 && axisReversed(previousAxis, spatial.axis)) {
        findings.push({
          code: 'AXIS_FLIP',
          severity: 'WARN',
          shotId: shot.id,
          message: `${label}.spatial.axis reverses ${previous.id} (${previousAxis.join('/')} → ${spatial.axis.join('/')}); confirm this is an intentional 180° break`,
        });
      }
    }

    if (spatial && typeof spatial.move === 'string' && spatial.move.trim().length > 0) {
      if (typeof spatial.motivation !== 'string' || spatial.motivation.trim().length === 0) {
        findings.push({
          code: 'MOVE_UNMOTIVATED',
          severity: 'WARN',
          shotId: shot.id,
          message: `${label}.spatial.move is declared without a motivation (what in frame triggers it?)`,
        });
      }
    }
  }

  // Timeline continuity
  let cursor = 0;
  for (let index = 0; index < doc.shots.length; index++) {
    const shot = doc.shots[index];
    const start = typeof shot.startSec === 'number' ? shot.startSec : cursor;
    if (typeof shot.startSec === 'number' && Math.abs(shot.startSec - cursor) > 0.01) {
      findings.push({
        code: 'TIME_GAP',
        severity: 'WARN',
        shotId: shot.id,
        message: `shots[${index}].startSec ${shot.startSec} does not continue from ${cursor}; check for a gap or overlap`,
      });
    }
    cursor = start + shot.durationSec;
  }

  const failN = findings.filter((f) => f.severity === 'FAIL').length;
  const warnN = findings.filter((f) => f.severity === 'WARN').length;
  return {
    verdict: failN > 0 ? 'FAIL' : 'PASS',
    metrics: {
      projectId: doc.projectId,
      shots: doc.shots.length,
      totalDurationSec: Number(totalDuration.toFixed(2)),
      ruleRefs: ruleCount,
      findingCounts: { FAIL: failN, WARN: warnN },
    },
    findings,
    thresholds: t,
    gates: GATES,
  };
}
