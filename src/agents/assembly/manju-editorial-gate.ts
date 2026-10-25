/**
 * V12 · Manju Editorial Gate (读音词典 · 分镜状态连续性 · 引用完整性), pre-gen, offline, deterministic.
 *
 * Method rewritten in TypeScript from w1nterdec/ai-manju-engineering
 * (MIT, Copyright (c) 2026 AI Manju Engineering contributors) — code LICENSE only:
 * https://github.com/w1nterdec/ai-manju-engineering
 * Not wholesale vendoring: no Python / TTS adapters / media hashing / cloud providers
 * copied. We encode mechanical editorial-plan checks inspired by manju/validation.py
 * (+ docs/pronunciation.md):
 *   pronunciation lexicon (digital-tone pinyin) · unique ids · referential integrity ·
 *   state_before/state_after continuity · shot-line timing/delivery · WARN refs/speech.
 *
 * Field mapping (gate-friendly camelCase ↔ upstream snake_case):
 *   schemaVersion                          ← schema_version
 *   projectId                              ← project.id
 *   characters[].id / name                 ← characters[].id / name
 *   characters[].appearance                ← characters[].appearance
 *   characters[].voiceDirection            ← characters[].voice_direction
 *   characters[].referenceImage            ← characters[].reference_image
 *   pronunciationLexicon[].term/pinyin/note← pronunciation_lexicon[]
 *   beats[].id / summary / requiredFacts   ← beats[].id / summary / required_facts
 *   beats[].lines[].id / speakerId / text  ← beats[].lines[].id / speaker_id / text
 *   beats[].lines[].speechText             ← beats[].lines[].speech_text
 *   initialState                           ← initial_state
 *   shots[].id / beatIds / durationMs      ← shots[].id / beat_ids / duration_ms
 *   shots[].characterIds                   ← shots[].character_ids
 *   shots[].stateBefore / stateAfter       ← shots[].state_before / state_after
 *   shots[].lines[].lineId / delivery      ← shots[].lines[].line_id / delivery
 *   shots[].lines[].startMs / endMs        ← shots[].lines[].start_ms / end_ms
 *
 *  SCHEMA (FAIL)                 input fails ManjuEditorialPlanSchema
 *  LEXICON_PINYIN (FAIL)         pinyin not digital-tone (shan4 xing2 zhou1; ü=v|u:)
 *  LEXICON_NAME_MISSING (FAIL)   character full name absent from lexicon terms
 *  CHAR_DUP_ID (FAIL)            duplicate character id
 *  BEAT_DUP_ID (FAIL)            duplicate beat id
 *  LINE_DUP_ID (FAIL)            duplicate line id across beats
 *  SHOT_DUP_ID (FAIL)            duplicate shot id
 *  LEXICON_DUP_TERM (FAIL)       duplicate lexicon term
 *  SPEAKER_UNKNOWN (FAIL)        line.speakerId not in characters
 *  CHAR_UNKNOWN (FAIL)           shot.characterIds cite missing character
 *  BEAT_UNKNOWN (FAIL)           shot.beatIds cite missing beat
 *  LINE_UNKNOWN (FAIL)           shot line.lineId not in beat lines (or wrong beat)
 *  STATE_KEY_MISMATCH (FAIL)     state_* keys ≠ initialState keys
 *  STATE_CONTINUITY (FAIL)       state_before ≠ previous state_after (first=initial)
 *  LINE_TIMING (FAIL)            !(0 ≤ start < end ≤ durationMs)
 *  LINE_OVERLAP (FAIL)           shot lines overlap or go backwards in order
 *  DELIVERY_INVALID (FAIL)       delivery not on_screen|off_screen|voiceover
 *  ON_SCREEN_SPEAKER (FAIL)      on_screen speaker not in shot.characterIds
 *  REF_IMAGE_MISSING (WARN)      character missing / empty referenceImage
 *  SPEECH_TEXT_DIFF (WARN)       speechText differs from text
 *  LEXICON_DIALOGUE_TERM (WARN)  multi-char CJK dialogue token not in lexicon
 *
 * Engineering gate only: PASS ≠ Final ≠ G3. No TTS / MiniMax / paid APIs.
 */
import { z } from 'zod';

/** Digital-tone pinyin: `shan4 xing2 zhou1`; light tone 5; ü as v or u:. */
export const MANJU_EDITORIAL_PINYIN_RE = /^[a-zv:]+[1-5]( [a-zv:]+[1-5])*$/;

const DELIVERIES = ['on_screen', 'off_screen', 'voiceover'] as const;

const CharacterSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  appearance: z.string().optional(),
  voiceDirection: z.string().optional(),
  referenceImage: z.string().optional(),
});

const LexemeSchema = z.object({
  term: z.string().min(1),
  pinyin: z.string().min(1),
  note: z.string().optional(),
});

const BeatLineSchema = z.object({
  id: z.string().min(1),
  speakerId: z.string().min(1),
  text: z.string().min(1),
  speechText: z.string().optional(),
});

const BeatSchema = z.object({
  id: z.string().min(1),
  summary: z.string().min(1),
  requiredFacts: z.array(z.string()).optional(),
  lines: z.array(BeatLineSchema).default([]),
});

const ShotLineSchema = z.object({
  lineId: z.string().min(1),
  delivery: z.string().min(1),
  startMs: z.number().int().nonnegative(),
  endMs: z.number().int().positive(),
});

const ShotSchema = z.object({
  id: z.string().min(1),
  beatIds: z.array(z.string().min(1)).min(1),
  durationMs: z.number().int().positive(),
  location: z.string().optional(),
  time: z.string().optional(),
  characterIds: z.array(z.string()),
  framing: z.string().optional(),
  action: z.string().optional(),
  emotion: z.string().optional(),
  stateBefore: z.record(z.string()),
  stateAfter: z.record(z.string()),
  lines: z.array(ShotLineSchema).default([]),
});

export const ManjuEditorialPlanSchema = z.object({
  schemaVersion: z.string().min(1),
  projectId: z.string().min(1),
  characters: z.array(CharacterSchema).min(1),
  pronunciationLexicon: z.array(LexemeSchema),
  beats: z.array(BeatSchema).min(1),
  initialState: z.record(z.string()).refine((o) => Object.keys(o).length > 0, {
    message: 'initialState must be a non-empty string-keyed object',
  }),
  shots: z.array(ShotSchema).min(1),
});

export type ManjuEditorialPlan = z.infer<typeof ManjuEditorialPlanSchema>;

export type ManjuEditorialFindingCode =
  | 'SCHEMA'
  | 'LEXICON_PINYIN'
  | 'LEXICON_NAME_MISSING'
  | 'CHAR_DUP_ID'
  | 'BEAT_DUP_ID'
  | 'LINE_DUP_ID'
  | 'SHOT_DUP_ID'
  | 'LEXICON_DUP_TERM'
  | 'SPEAKER_UNKNOWN'
  | 'CHAR_UNKNOWN'
  | 'BEAT_UNKNOWN'
  | 'LINE_UNKNOWN'
  | 'STATE_KEY_MISMATCH'
  | 'STATE_CONTINUITY'
  | 'LINE_TIMING'
  | 'LINE_OVERLAP'
  | 'DELIVERY_INVALID'
  | 'ON_SCREEN_SPEAKER'
  | 'REF_IMAGE_MISSING'
  | 'SPEECH_TEXT_DIFF'
  | 'LEXICON_DIALOGUE_TERM';

export interface ManjuEditorialFinding {
  code: ManjuEditorialFindingCode;
  severity: 'FAIL' | 'WARN';
  message: string;
  path?: string;
  fix?: string;
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export interface ManjuEditorialReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    projectId: string;
    characters: number;
    beats: number;
    shots: number;
    lexiconTerms: number;
    findingCounts: { FAIL: number; WARN: number };
  };
  findings: ManjuEditorialFinding[];
  gates: typeof GATES;
}

function schemaFail(message: string): ManjuEditorialReport {
  return {
    verdict: 'FAIL',
    metrics: {
      projectId: '',
      characters: 0,
      beats: 0,
      shots: 0,
      lexiconTerms: 0,
      findingCounts: { FAIL: 1, WARN: 0 },
    },
    findings: [{ code: 'SCHEMA', severity: 'FAIL', message }],
    gates: GATES,
  };
}

function dupIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) dups.add(id);
    else seen.add(id);
  }
  return [...dups];
}

function sameState(
  a: Record<string, string>,
  b: Record<string, string>,
): boolean {
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  for (const k of ak) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

function sameKeys(
  a: Record<string, string>,
  b: Record<string, string>,
): boolean {
  const ak = Object.keys(a).sort();
  const bk = Object.keys(b).sort();
  if (ak.length !== bk.length) return false;
  return ak.every((k, i) => k === bk[i]);
}

/** Extract multi-char CJK runs from dialogue for optional lexicon coverage WARN. */
function cjkTerms(text: string): string[] {
  const out: string[] = [];
  const re = /[\u4e00-\u9fff]{2,}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) out.push(m[0]);
  return out;
}

/**
 * Evaluate a Manju-style editorial plan for pronunciation / refs / state / timing.
 */
export function evaluateManjuEditorial(input: unknown): ManjuEditorialReport {
  const parsed = ManjuEditorialPlanSchema.safeParse(input);
  if (!parsed.success) {
    return schemaFail(
      parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
    );
  }

  const doc = parsed.data;
  const findings: ManjuEditorialFinding[] = [];

  for (const id of dupIds(doc.characters.map((c) => c.id))) {
    findings.push({
      code: 'CHAR_DUP_ID',
      severity: 'FAIL',
      message: `duplicate character id "${id}"`,
      path: '$.characters',
      fix: 'Give each character a unique id.',
    });
  }
  for (const id of dupIds(doc.beats.map((b) => b.id))) {
    findings.push({
      code: 'BEAT_DUP_ID',
      severity: 'FAIL',
      message: `duplicate beat id "${id}"`,
      path: '$.beats',
      fix: 'Give each beat a unique id.',
    });
  }
  const allLines = doc.beats.flatMap((b) => b.lines);
  for (const id of dupIds(allLines.map((l) => l.id))) {
    findings.push({
      code: 'LINE_DUP_ID',
      severity: 'FAIL',
      message: `duplicate line id "${id}" across beats`,
      path: '$.beats.lines',
      fix: 'Line ids must be unique across the whole plan.',
    });
  }
  for (const id of dupIds(doc.shots.map((s) => s.id))) {
    findings.push({
      code: 'SHOT_DUP_ID',
      severity: 'FAIL',
      message: `duplicate shot id "${id}"`,
      path: '$.shots',
      fix: 'Give each shot a unique id.',
    });
  }
  for (const term of dupIds(doc.pronunciationLexicon.map((x) => x.term))) {
    findings.push({
      code: 'LEXICON_DUP_TERM',
      severity: 'FAIL',
      message: `duplicate lexicon term "${term}"`,
      path: '$.pronunciationLexicon',
      fix: 'Each lexicon term must appear once.',
    });
  }

  for (let i = 0; i < doc.pronunciationLexicon.length; i++) {
    const lex = doc.pronunciationLexicon[i];
    if (!MANJU_EDITORIAL_PINYIN_RE.test(lex.pinyin)) {
      findings.push({
        code: 'LEXICON_PINYIN',
        severity: 'FAIL',
        message: `lexicon[${i}] "${lex.term}" pinyin "${lex.pinyin}" must be digital-tone (e.g. shan4 xing2 zhou1; light=5; ü=v|u:)`,
        path: `$.pronunciationLexicon[${i}].pinyin`,
        fix: 'Use lowercase syllables + tone 1–5, space-separated.',
      });
    }
  }

  const terms = new Set(doc.pronunciationLexicon.map((x) => x.term));
  for (const char of doc.characters) {
    if (!terms.has(char.name)) {
      findings.push({
        code: 'LEXICON_NAME_MISSING',
        severity: 'FAIL',
        message: `character full name "${char.name}" missing from pronunciationLexicon`,
        path: '$.pronunciationLexicon',
        fix: 'Register every character full name with digital-tone pinyin.',
      });
    }
    if (!char.referenceImage?.trim()) {
      findings.push({
        code: 'REF_IMAGE_MISSING',
        severity: 'WARN',
        message: `character "${char.id}" missing referenceImage; text sheet cannot replace a ref`,
        path: `characters.${char.id}`,
        fix: 'Attach a reference image path (may be empty string only if intentional WARN).',
      });
    }
  }

  const chars = new Map(doc.characters.map((c) => [c.id, c]));
  const beats = new Map(doc.beats.map((b) => [b.id, b]));
  const lines = new Map(allLines.map((l) => [l.id, l]));

  for (const line of allLines) {
    if (!chars.has(line.speakerId)) {
      findings.push({
        code: 'SPEAKER_UNKNOWN',
        severity: 'FAIL',
        message: `line "${line.id}" unknown speakerId "${line.speakerId}" (narrator must also be a registered character)`,
        path: `lines.${line.id}`,
        fix: 'Add the speaker to characters or fix speakerId.',
      });
    }
    if (line.speechText !== undefined && line.speechText !== line.text) {
      findings.push({
        code: 'SPEECH_TEXT_DIFF',
        severity: 'WARN',
        message: `line "${line.id}" speechText differs from text; confirm meaning / names unchanged`,
        path: `lines.${line.id}`,
        fix: 'Keep subtitle text independent; only approve deliberate speech_text swaps.',
      });
    }
    for (const tok of cjkTerms(line.text)) {
      if (!terms.has(tok) && !doc.characters.some((c) => c.name === tok)) {
        // Only warn for tokens that look like proper names (≥2 chars) not covered;
        // skip if the whole line is covered by known character names already checked.
        // Heuristic: warn when token length ≥ 2 and not a substring-only of a known term
        // that we already require. Keep noise low — warn once per distinct missing token.
        const coveredByLonger = [...terms].some(
          (t) => t.includes(tok) || tok.includes(t),
        );
        if (!coveredByLonger && tok.length >= 2) {
          // De-dupe via findings scan
          const already = findings.some(
            (f) =>
              f.code === 'LEXICON_DIALOGUE_TERM' && f.message.includes(`"${tok}"`),
          );
          if (!already) {
            findings.push({
              code: 'LEXICON_DIALOGUE_TERM',
              severity: 'WARN',
              message: `dialogue token "${tok}" (line "${line.id}") not in pronunciationLexicon`,
              path: `lines.${line.id}`,
              fix: 'Add place/term/alias readings authors care about to the lexicon.',
            });
          }
        }
      }
    }
  }

  let current = doc.initialState;
  for (const shot of doc.shots) {
    const path = `shots.${shot.id}`;

    for (const cid of shot.characterIds) {
      if (!chars.has(cid)) {
        findings.push({
          code: 'CHAR_UNKNOWN',
          severity: 'FAIL',
          message: `shot "${shot.id}" cites unknown character "${cid}"`,
          path,
          fix: 'Add character sheet or drop dangling characterId.',
        });
      }
    }

    const allowedLines = new Set<string>();
    for (const bid of shot.beatIds) {
      const beat = beats.get(bid);
      if (!beat) {
        findings.push({
          code: 'BEAT_UNKNOWN',
          severity: 'FAIL',
          message: `shot "${shot.id}" cites unknown beat "${bid}"`,
          path,
          fix: 'Link shot.beatIds to existing beats.',
        });
        continue;
      }
      for (const l of beat.lines) allowedLines.add(l.id);
    }

    for (const sk of ['stateBefore', 'stateAfter'] as const) {
      const st = shot[sk];
      if (!sameKeys(st, doc.initialState)) {
        findings.push({
          code: 'STATE_KEY_MISMATCH',
          severity: 'FAIL',
          message: `shot "${shot.id}".${sk} keys must match initialState exactly`,
          path: `${path}.${sk}`,
          fix: 'Keep the same state key set on every shot.',
        });
      }
    }

    if (!sameState(shot.stateBefore, current)) {
      findings.push({
        code: 'STATE_CONTINUITY',
        severity: 'FAIL',
        message: `shot "${shot.id}".stateBefore ≠ previous state_after (first shot must equal initialState)`,
        path: `${path}.stateBefore`,
        fix: 'Chain state_after → next state_before; open with initialState.',
      });
    }
    current = shot.stateAfter;

    let previousEnd = 0;
    for (const sl of shot.lines) {
      const lp = `${path}.lines.${sl.lineId}`;
      if (!DELIVERIES.includes(sl.delivery as (typeof DELIVERIES)[number])) {
        findings.push({
          code: 'DELIVERY_INVALID',
          severity: 'FAIL',
          message: `shot "${shot.id}" line "${sl.lineId}" delivery "${sl.delivery}" must be on_screen|off_screen|voiceover`,
          path: lp,
          fix: 'Set delivery to on_screen, off_screen, or voiceover.',
        });
      }

      if (!(0 <= sl.startMs && sl.startMs < sl.endMs && sl.endMs <= shot.durationMs)) {
        findings.push({
          code: 'LINE_TIMING',
          severity: 'FAIL',
          message: `shot "${shot.id}" line "${sl.lineId}" timing must satisfy 0 ≤ start < end ≤ durationMs`,
          path: lp,
          fix: 'Keep dialogue windows inside the shot duration.',
        });
      }

      if (sl.startMs < previousEnd) {
        findings.push({
          code: 'LINE_OVERLAP',
          severity: 'FAIL',
          message: `shot "${shot.id}" line "${sl.lineId}" overlaps or goes backwards vs prior line`,
          path: lp,
          fix: 'Single subtitle track: no overlap / reverse order.',
        });
      }
      previousEnd = Math.max(previousEnd, sl.endMs);

      if (!lines.has(sl.lineId)) {
        findings.push({
          code: 'LINE_UNKNOWN',
          severity: 'FAIL',
          message: `shot "${shot.id}" references missing line "${sl.lineId}"`,
          path: lp,
          fix: 'Point lineId at an existing beats[].lines[].id.',
        });
      } else if (!allowedLines.has(sl.lineId)) {
        findings.push({
          code: 'LINE_UNKNOWN',
          severity: 'FAIL',
          message: `shot "${shot.id}" line "${sl.lineId}" does not belong to cited beatIds`,
          path: lp,
          fix: 'Only assign lines from the beats listed on this shot.',
        });
      } else if (sl.delivery === 'on_screen') {
        const speaker = lines.get(sl.lineId)!.speakerId;
        if (!shot.characterIds.includes(speaker)) {
          findings.push({
            code: 'ON_SCREEN_SPEAKER',
            severity: 'FAIL',
            message: `shot "${shot.id}" on_screen line "${sl.lineId}" speaker "${speaker}" not in characterIds; use off_screen/voiceover for off-camera`,
            path: lp,
            fix: 'Add speaker to characterIds or change delivery.',
          });
        }
      }
    }
  }

  const failN = findings.filter((f) => f.severity === 'FAIL').length;
  const warnN = findings.filter((f) => f.severity === 'WARN').length;

  return {
    verdict: failN > 0 ? 'FAIL' : 'PASS',
    metrics: {
      projectId: doc.projectId,
      characters: doc.characters.length,
      beats: doc.beats.length,
      shots: doc.shots.length,
      lexiconTerms: doc.pronunciationLexicon.length,
      findingCounts: { FAIL: failN, WARN: warnN },
    },
    findings,
    gates: GATES,
  };
}
