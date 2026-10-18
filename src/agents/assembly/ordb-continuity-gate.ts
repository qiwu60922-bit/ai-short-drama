/**
 * V12 · ORDB Continuity Gate (多集连续性离线闸门), post-assembly, offline, deterministic.
 *
 * Rules rewritten in TypeScript from soulverse92500-ui/open-reality-drama-benchmark
 * `src/ordb/evaluator.py` evaluate_run() (MIT, Copyright (c) 2026 ORDB contributors):
 * https://github.com/soulverse92500-ui/open-reality-drama-benchmark
 * Not a wholesale vendoring of the Python package — same finding codes + scoring semantics.
 *
 *  SCHEMA (error)              run fails shape (characters/episodes non-empty, unique ids, int index)
 *  TIMELINE_ORDER (error)      episode.index must strictly increase
 *  CHARACTER_DRIFT (error)     character_states vs character.facts baselines (shared keys only)
 *  UNKNOWN_CHARACTER (error)   character_states id not in run.characters
 *  BROKEN_TRANSITION (warning) previous end_state vs next start_state shared keys disagree
 *  REPEATED_DIALOGUE (warning) normalized dialogue text appears more than once
 *
 * Scoring (ORDB 0.1.0): character_consistency 40% · scene_transition 25% · timeline_order 20% ·
 * dialogue_uniqueness 15%. pass = no error-severity findings (warnings alone keep pass=true).
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */

export interface OrdbCharacter {
  id: string;
  facts?: Record<string, unknown>;
}

export interface OrdbDialogueLine {
  speaker?: string;
  text?: string;
}

export interface OrdbEpisode {
  index: number;
  character_states?: Record<string, Record<string, unknown>>;
  start_state?: Record<string, unknown>;
  end_state?: Record<string, unknown>;
  dialogue?: OrdbDialogueLine[];
}

export interface OrdbRun {
  run_name?: string;
  characters: OrdbCharacter[];
  episodes: OrdbEpisode[];
}

export type OrdbFindingCode =
  | 'SCHEMA'
  | 'TIMELINE_ORDER'
  | 'CHARACTER_DRIFT'
  | 'UNKNOWN_CHARACTER'
  | 'BROKEN_TRANSITION'
  | 'REPEATED_DIALOGUE';

export interface OrdbFinding {
  code: OrdbFindingCode;
  severity: 'error' | 'warning';
  episode: number | null;
  message: string;
}

export interface OrdbScores {
  character_consistency: number;
  scene_transition: number;
  timeline_order: number;
  dialogue_uniqueness: number;
  overall: number;
}

export interface OrdbCounts {
  character_fact_checks: number;
  transition_checks: number;
  timeline_errors: number;
  duplicate_dialogue_instances: number;
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export interface OrdbReport {
  pass: boolean;
  verdict: 'PASS' | 'FAIL';
  benchmark_version: '0.1.0';
  run_name: string;
  episode_count: number;
  scores: OrdbScores;
  counts: OrdbCounts;
  findings: OrdbFinding[];
  gates: typeof GATES;
}

/** Match Python: re.sub(r"[^\w]+", "", text.casefold(), flags=re.UNICODE). */
export function normalizeDialogue(text: string): string {
  return text.toLocaleLowerCase('en-US').replace(/[^\p{L}\p{N}_]+/gu, '');
}

/** Approximate Python !r for values used in ORDB finding messages. */
function formatPyRepr(value: unknown): string {
  if (typeof value === 'string') return `'${value}'`;
  if (value === null || value === undefined) return 'None';
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  return String(value);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function schemaFail(message: string): OrdbReport {
  return {
    pass: false,
    verdict: 'FAIL',
    benchmark_version: '0.1.0',
    run_name: 'unnamed',
    episode_count: 0,
    scores: {
      character_consistency: 0,
      scene_transition: 0,
      timeline_order: 0,
      dialogue_uniqueness: 0,
      overall: 0,
    },
    counts: {
      character_fact_checks: 0,
      transition_checks: 0,
      timeline_errors: 0,
      duplicate_dialogue_instances: 0,
    },
    findings: [{ code: 'SCHEMA', severity: 'error', episode: null, message }],
    gates: GATES,
  };
}

function parseRun(run: unknown): OrdbRun | OrdbReport {
  if (run === null || typeof run !== 'object' || Array.isArray(run)) {
    return schemaFail('run must be a JSON object');
  }
  const obj = run as Record<string, unknown>;
  if (!Array.isArray(obj.characters) || obj.characters.length === 0) {
    return schemaFail('characters must be a non-empty list');
  }
  if (!Array.isArray(obj.episodes) || obj.episodes.length === 0) {
    return schemaFail('episodes must be a non-empty list');
  }
  const characters = obj.characters as OrdbCharacter[];
  const ids = characters.map((item) => item?.id);
  if (ids.some((value) => !value) || ids.length !== new Set(ids).size) {
    return schemaFail('each character needs a unique non-empty id');
  }
  const episodes = obj.episodes as OrdbEpisode[];
  for (let ordinal = 0; ordinal < episodes.length; ordinal++) {
    const index = episodes[ordinal]?.index;
    if (typeof index !== 'number' || !Number.isInteger(index)) {
      return schemaFail(`episode ${ordinal + 1} needs an integer index`);
    }
    const states = episodes[ordinal].character_states;
    if (states === undefined) continue;
    if (typeof states !== 'object' || states === null || Array.isArray(states)) {
      return schemaFail('character_states must be an object');
    }
    for (const [characterId, observed] of Object.entries(states)) {
      if (
        observed !== undefined &&
        (typeof observed !== 'object' || observed === null || Array.isArray(observed))
      ) {
        return schemaFail(`character state for ${characterId} must be an object`);
      }
    }
  }
  return {
    run_name: typeof obj.run_name === 'string' ? obj.run_name : undefined,
    characters,
    episodes,
  };
}

/**
 * Evaluate one structured multi-episode generation run (ORDB evaluate_run semantics).
 */
export function evaluateOrdbRun(input: unknown): OrdbReport {
  const parsed = parseRun(input);
  if ('findings' in parsed) {
    return parsed as OrdbReport;
  }
  const run = parsed;

  const findings: OrdbFinding[] = [];
  const baselines: Record<string, Record<string, unknown>> = {};
  for (const item of run.characters) {
    baselines[item.id] = item.facts ?? {};
  }

  let factChecks = 0;
  let factMatches = 0;
  let transitionChecks = 0;
  let transitionMatches = 0;
  let timelineErrors = 0;
  const dialogueRows: Array<{ index: number; text: string }> = [];
  let previousIndex: number | null = null;
  let previousEnd: Record<string, unknown> | null = null;

  for (const episode of run.episodes) {
    const index = episode.index;
    if (previousIndex !== null && index <= previousIndex) {
      timelineErrors += 1;
      findings.push({
        code: 'TIMELINE_ORDER',
        severity: 'error',
        episode: index,
        message: `episode index ${index} does not follow ${previousIndex}`,
      });
    }
    previousIndex = index;

    const states = episode.character_states ?? {};
    for (const [characterId, observed] of Object.entries(states)) {
      if (!(characterId in baselines)) {
        findings.push({
          code: 'UNKNOWN_CHARACTER',
          severity: 'error',
          episode: index,
          message: `unknown character id: ${characterId}`,
        });
        continue;
      }
      for (const [key, value] of Object.entries(observed)) {
        if (!(key in baselines[characterId])) continue;
        factChecks += 1;
        const expected = baselines[characterId][key];
        if (value === expected) {
          factMatches += 1;
        } else {
          findings.push({
            code: 'CHARACTER_DRIFT',
            severity: 'error',
            episode: index,
            message: `${characterId}.${key}: expected ${formatPyRepr(expected)}, observed ${formatPyRepr(value)}`,
          });
        }
      }
    }

    const startState = episode.start_state;
    if (
      previousEnd !== null &&
      startState !== undefined &&
      typeof startState === 'object' &&
      startState !== null &&
      !Array.isArray(startState)
    ) {
      const shared = Object.keys(previousEnd)
        .filter((k) => Object.prototype.hasOwnProperty.call(startState, k))
        .sort();
      for (const key of shared) {
        transitionChecks += 1;
        if (previousEnd[key] === startState[key]) {
          transitionMatches += 1;
        } else {
          findings.push({
            code: 'BROKEN_TRANSITION',
            severity: 'warning',
            episode: index,
            message: `${key}: previous end ${formatPyRepr(previousEnd[key])}, current start ${formatPyRepr(startState[key])}`,
          });
        }
      }
    }
    const end = episode.end_state;
    previousEnd =
      end !== undefined && typeof end === 'object' && end !== null && !Array.isArray(end)
        ? end
        : null;

    for (const line of episode.dialogue ?? []) {
      if (line && typeof line === 'object' && typeof line.text === 'string') {
        const normalized = normalizeDialogue(line.text);
        if (normalized) dialogueRows.push({ index, text: normalized });
      }
    }
  }

  const countsMap = new Map<string, number>();
  for (const row of dialogueRows) {
    countsMap.set(row.text, (countsMap.get(row.text) ?? 0) + 1);
  }
  let duplicateInstances = 0;
  for (const count of countsMap.values()) {
    if (count > 1) duplicateInstances += count - 1;
  }
  for (const [text, count] of countsMap.entries()) {
    if (count > 1) {
      const affected = dialogueRows.find((row) => row.text === text)!.index;
      findings.push({
        code: 'REPEATED_DIALOGUE',
        severity: 'warning',
        episode: affected,
        message: `normalized dialogue repeated ${count} times: ${text.slice(0, 40)}`,
      });
    }
  }

  const characterScore = factChecks === 0 ? 100 : (100 * factMatches) / factChecks;
  const transitionScore =
    transitionChecks === 0 ? 100 : (100 * transitionMatches) / transitionChecks;
  const timelineScore = Math.max(0, 100 - timelineErrors * 25);
  const repetitionScore =
    dialogueRows.length === 0
      ? 100
      : Math.max(0, 100 * (1 - duplicateInstances / dialogueRows.length));
  const overall =
    characterScore * 0.4 + transitionScore * 0.25 + timelineScore * 0.2 + repetitionScore * 0.15;

  const hasError = findings.some((f) => f.severity === 'error');
  return {
    pass: !hasError,
    verdict: hasError ? 'FAIL' : 'PASS',
    benchmark_version: '0.1.0',
    run_name: run.run_name ?? 'unnamed',
    episode_count: run.episodes.length,
    scores: {
      character_consistency: round2(characterScore),
      scene_transition: round2(transitionScore),
      timeline_order: round2(timelineScore),
      dialogue_uniqueness: round2(repetitionScore),
      overall: round2(overall),
    },
    counts: {
      character_fact_checks: factChecks,
      transition_checks: transitionChecks,
      timeline_errors: timelineErrors,
      duplicate_dialogue_instances: duplicateInstances,
    },
    findings,
    gates: GATES,
  };
}
