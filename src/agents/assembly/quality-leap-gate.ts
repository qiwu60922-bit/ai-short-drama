/**
 * V12 · Quality Leap Gate（表演/情绪/自然口型/镜头叙事逐镜门禁）,
 * pre-gen, offline, deterministic.
 *
 * Method rewritten in TypeScript from yangjing6213-dev/ai-drama-quality-leap
 * SKILL.md selection rules & output format (MIT):
 * https://github.com/yangjing6213-dev/ai-drama-quality-leap
 * Not wholesale vendoring: no built-in prompt library / emotion phrase bank /
 * camera/lens brand packs / generation API calls. We encode mechanical checks:
 *   dramaPurpose + characterIntent · six-class emotion + intensity 1–5 ·
 *   visible performance (face/gaze/posture) · single primary camera move ·
 *   lipsyncNote when dialogue · mouthResting when silent · fullPrompt present ·
 *   no cartoon FX in live_action · warn flat intensity-5 / all push-in.
 *
 *  SCHEMA (FAIL)                     input shape / shots empty
 *  SHOT_ID (FAIL)                    id missing or duplicate
 *  DRAMA_PURPOSE (FAIL)              empty
 *  CHARACTER_INTENT (FAIL)           empty
 *  EMOTION (FAIL)                    missing / not in six-class (synonyms ok)
 *  INTENSITY (FAIL)                  not integer 1–5
 *  PERFORMANCE_VISIBLE (FAIL)        face/gaze/posture all empty
 *  INFERRED_AS_FACT (WARN)           inferredEmotions appear in scriptBeat unmarked
 *  CAMERA_SHOT_SIZE (FAIL)           missing
 *  PRIMARY_MOVE (FAIL)               missing
 *  MULTI_MOVE (FAIL)                 extraMoves conflict with primary
 *  DIALOGUE_LIPSYNC (FAIL)           dialogue.line without lipsyncNote
 *  MOUTH_RESTING (FAIL)              no dialogue and mouthResting missing
 *  PROMPT_EMPTY (FAIL)               fullPrompt empty
 *  PROMPT_MISSING_PERFORMANCE (WARN) fullPrompt too short / no acting|camera cues
 *  CARTOON_FX (FAIL)                 live_action + cartoon symbols
 *  INTENSITY_FLAT (WARN)             ≥3 shots all intensity===5
 *  ALL_PUSH_IN (WARN)                ≥3 shots all primaryMove push-in
 *
 * Engineering gate only: PASS ≠ Final ≠ G3. $0. No MiniMax / paid APIs / network.
 */
import { z } from 'zod';

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

/** Canonical six emotion classes from upstream Module A. */
export const QUALITY_LEAP_EMOTIONS = [
  'fear',
  'joy',
  'doubt',
  'anger',
  'sadness',
  'relief',
] as const;
export type QualityLeapEmotion = (typeof QUALITY_LEAP_EMOTIONS)[number];

const EMOTION_SYNONYMS: Record<string, QualityLeapEmotion> = {
  fear: 'fear',
  恐惧: 'fear',
  害怕: 'fear',
  惊恐: 'fear',
  scared: 'fear',
  afraid: 'fear',
  terrified: 'fear',
  joy: 'joy',
  喜悦: 'joy',
  高兴: 'joy',
  开心: 'joy',
  快乐: 'joy',
  happy: 'joy',
  happiness: 'joy',
  delight: 'joy',
  doubt: 'doubt',
  怀疑: 'doubt',
  疑惑: 'doubt',
  迟疑: 'doubt',
  suspicious: 'doubt',
  suspicion: 'doubt',
  uncertain: 'doubt',
  anger: 'anger',
  angry: 'anger',
  愤怒: 'anger',
  怒: 'anger',
  生气: 'anger',
  mad: 'anger',
  rage: 'anger',
  sadness: 'sadness',
  sad: 'sadness',
  悲伤: 'sadness',
  难过: 'sadness',
  伤心: 'sadness',
  grief: 'sadness',
  sorrow: 'sadness',
  relief: 'relief',
  释然: 'relief',
  放松: 'relief',
  relieved: 'relief',
  ease: 'relief',
};

const CARTOON_FX_RE =
  /爱心冒泡|蒸汽团|速度线|夸张拖影|漫画符号|心形泡泡|怒气冒烟|井字青筋|汗滴符号|speed\s*lines?|heart\s*bubbles?|steam\s*puff|motion\s*trails?/i;

const PERFORMANCE_CUE_RE =
  /眉|眼|视|嘴|唇|呼吸|肩|颈|手|姿|表情|gaze|face|breath|posture|hand|emotion|推进|拉远|摇|跟拍|固定|景别|焦点|shot|camera|push|dolly|pan|tilt|zoom/i;

const PUSH_IN_RE = /推进|push[\s_-]?in|dolly[\s_-]?in|缓推|急推|缓慢推进/i;

const PerformanceSchema = z
  .object({
    emotion: z.string().optional(),
    intensity: z.number().optional(),
    surfaceVsTrue: z.string().optional(),
    inferredEmotions: z.array(z.string()).optional(),
    face: z.string().optional(),
    gaze: z.string().optional(),
    breath: z.string().optional(),
    posture: z.string().optional(),
    hands: z.string().optional(),
    rhythm: z.string().optional(),
  })
  .passthrough();

const CameraSchema = z
  .object({
    shotSize: z.string().optional(),
    primaryMove: z.string().optional(),
    moveDetail: z.string().optional(),
    focusTarget: z.string().optional(),
    depthHint: z.string().optional(),
    extraMoves: z.array(z.string()).optional(),
  })
  .passthrough();

const DialogueSchema = z
  .object({
    speaker: z.string().optional(),
    line: z.string().optional(),
    lipsyncNote: z.string().optional(),
    audioProvided: z.boolean().optional(),
  })
  .passthrough()
  .nullable()
  .optional();

const ShotSchema = z
  .object({
    id: z.string(),
    scriptBeat: z.string().optional(),
    durationSec: z.number().optional(),
    dramaPurpose: z.string().optional(),
    characterIntent: z.string().optional(),
    performance: PerformanceSchema.optional(),
    camera: CameraSchema.optional(),
    dialogue: DialogueSchema,
    mouthResting: z.string().optional(),
    fullPrompt: z.string().optional(),
    continuityNotes: z.array(z.string()).optional(),
  })
  .passthrough();

export const QualityLeapDocSchema = z
  .object({
    style: z.enum(['live_action', 'anime', 'comic']).optional(),
    shots: z.array(ShotSchema).optional(),
  })
  .passthrough();

export type QualityLeapDoc = z.infer<typeof QualityLeapDocSchema>;

export type QualityLeapFindingCode =
  | 'SCHEMA'
  | 'SHOT_ID'
  | 'DRAMA_PURPOSE'
  | 'CHARACTER_INTENT'
  | 'EMOTION'
  | 'INTENSITY'
  | 'PERFORMANCE_VISIBLE'
  | 'INFERRED_AS_FACT'
  | 'CAMERA_SHOT_SIZE'
  | 'PRIMARY_MOVE'
  | 'MULTI_MOVE'
  | 'DIALOGUE_LIPSYNC'
  | 'MOUTH_RESTING'
  | 'PROMPT_EMPTY'
  | 'PROMPT_MISSING_PERFORMANCE'
  | 'CARTOON_FX'
  | 'INTENSITY_FLAT'
  | 'ALL_PUSH_IN';

export interface QualityLeapFinding {
  code: QualityLeapFindingCode;
  severity: 'FAIL' | 'WARN';
  message: string;
  shotId?: string;
  fix?: string;
}

export interface QualityLeapReport {
  verdict: 'PASS' | 'FAIL';
  findings: QualityLeapFinding[];
  metrics: {
    shotCount: number;
    style: 'live_action' | 'anime' | 'comic';
    emotionCounts: Record<string, number>;
    avgIntensity: number | null;
    dialogueShots: number;
    silentShots: number;
    findingCounts: { FAIL: number; WARN: number };
  };
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
  summary?: string;
  fixes?: string[];
}

function emptyMetrics(
  overrides: Partial<QualityLeapReport['metrics']> = {},
): QualityLeapReport['metrics'] {
  return {
    shotCount: 0,
    style: 'live_action',
    emotionCounts: {},
    avgIntensity: null,
    dialogueShots: 0,
    silentShots: 0,
    findingCounts: { FAIL: 0, WARN: 0 },
    ...overrides,
  };
}

function trim(s: unknown): string {
  return typeof s === 'string' ? s.trim() : '';
}

function hasText(s: unknown): boolean {
  return trim(s).length > 0;
}

export function normalizeEmotion(raw: string): QualityLeapEmotion | null {
  const key = raw.trim().toLowerCase();
  if (!key) return null;
  if ((QUALITY_LEAP_EMOTIONS as readonly string[]).includes(key)) {
    return key as QualityLeapEmotion;
  }
  // try original + lowercased synonym table (Chinese keys stay as-is)
  if (EMOTION_SYNONYMS[raw.trim()]) return EMOTION_SYNONYMS[raw.trim()];
  if (EMOTION_SYNONYMS[key]) return EMOTION_SYNONYMS[key];
  return null;
}

function isPushIn(move: string): boolean {
  return PUSH_IN_RE.test(move);
}

function moveFamily(move: string): string {
  const m = move.trim().toLowerCase();
  if (PUSH_IN_RE.test(m) || /推/.test(m)) return 'push';
  if (/拉远|pull[\s_-]?out|dolly[\s_-]?out|缓拉|急拉/.test(m)) return 'pull';
  if (/横摇|摇摄|pan/.test(m)) return 'pan';
  if (/俯仰|上摇|下摇|tilt/.test(m)) return 'tilt';
  if (/甩镜|whip/.test(m)) return 'whip';
  if (/跟拍|tracking|follow/.test(m)) return 'track';
  if (/手持|handheld/.test(m)) return 'handheld';
  if (/环绕|orbit|arc/.test(m)) return 'orbit';
  if (/变焦|zoom/.test(m)) return 'zoom';
  if (/滑动变焦|dolly\s*zoom|vertigo/.test(m)) return 'dollyzoom';
  if (/固定|static|locked|lock-off/.test(m)) return 'static';
  if (/慢动作|slow[\s_-]?mo/.test(m)) return 'slowmo';
  if (/子弹时间|bullet\s*time/.test(m)) return 'bullettime';
  return `other:${m}`;
}

function hasDialogueLine(shot: {
  dialogue?: { line?: string } | null;
}): boolean {
  return hasText(shot.dialogue?.line);
}

function cartoonHaystack(shot: {
  performance?: Record<string, unknown>;
  fullPrompt?: string;
}): string {
  const p = shot.performance ?? {};
  return [
    shot.fullPrompt,
    p.face,
    p.gaze,
    p.breath,
    p.posture,
    p.hands,
    p.rhythm,
    p.surfaceVsTrue,
  ]
    .map((x) => (typeof x === 'string' ? x : ''))
    .join('\n');
}

/**
 * Evaluate a quality-leap shot pack (performance / emotion / lipsync / camera).
 * Offline · deterministic · PASS ≠ Final ≠ G3.
 */
export function evaluateQualityLeap(input: unknown): QualityLeapReport {
  const findings: QualityLeapFinding[] = [];

  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    findings.push({
      code: 'SCHEMA',
      severity: 'FAIL',
      message: 'input must be a non-null object',
    });
    return {
      verdict: 'FAIL',
      findings,
      metrics: emptyMetrics({ findingCounts: { FAIL: 1, WARN: 0 } }),
      gates: GATES,
      summary: 'FAIL (SCHEMA)',
    };
  }

  const parsed = QualityLeapDocSchema.safeParse(input);
  if (!parsed.success) {
    findings.push({
      code: 'SCHEMA',
      severity: 'FAIL',
      message: `schema: ${parsed.error.issues[0]?.message ?? 'invalid'}`,
    });
    return {
      verdict: 'FAIL',
      findings,
      metrics: emptyMetrics({ findingCounts: { FAIL: 1, WARN: 0 } }),
      gates: GATES,
      summary: 'FAIL (SCHEMA)',
    };
  }

  const doc = parsed.data;
  const style = doc.style ?? 'live_action';
  const shots = doc.shots ?? [];

  if (shots.length === 0) {
    findings.push({
      code: 'SCHEMA',
      severity: 'FAIL',
      message: 'shots must be a non-empty array',
    });
    return {
      verdict: 'FAIL',
      findings,
      metrics: emptyMetrics({ style, findingCounts: { FAIL: 1, WARN: 0 } }),
      gates: GATES,
      summary: 'FAIL (SCHEMA)',
    };
  }

  const seenIds = new Map<string, number>();
  const emotionCounts: Record<string, number> = {};
  const intensities: number[] = [];
  let dialogueShots = 0;
  let silentShots = 0;
  let pushInCount = 0;

  for (const shot of shots) {
    const sid = shot.id;
    if (!hasText(sid)) {
      findings.push({
        code: 'SHOT_ID',
        severity: 'FAIL',
        message: 'shot.id is required',
        shotId: sid || undefined,
        fix: '给每镜唯一非空 id',
      });
    } else {
      const prev = seenIds.get(sid);
      if (prev !== undefined) {
        findings.push({
          code: 'SHOT_ID',
          severity: 'FAIL',
          message: `duplicate shot.id "${sid}" (also at index ${prev})`,
          shotId: sid,
          fix: '保证镜头 id 唯一',
        });
      } else {
        seenIds.set(sid, shots.indexOf(shot));
      }
    }

    if (!hasText(shot.dramaPurpose)) {
      findings.push({
        code: 'DRAMA_PURPOSE',
        severity: 'FAIL',
        message: 'dramaPurpose is empty',
        shotId: sid,
        fix: '写清本镜戏剧作用',
      });
    }
    if (!hasText(shot.characterIntent)) {
      findings.push({
        code: 'CHARACTER_INTENT',
        severity: 'FAIL',
        message: 'characterIntent is empty',
        shotId: sid,
        fix: '写清人物意图',
      });
    }

    const perf = shot.performance;
    const emotionRaw = trim(perf?.emotion);
    const emotionNorm = emotionRaw ? normalizeEmotion(emotionRaw) : null;
    if (!emotionRaw || !emotionNorm) {
      findings.push({
        code: 'EMOTION',
        severity: 'FAIL',
        message: emotionRaw
          ? `emotion "${emotionRaw}" not in six-class set (fear/joy/doubt/anger/sadness/relief)`
          : 'performance.emotion is required',
        shotId: sid,
        fix: '映射到六类基础情绪（可用中英同义）',
      });
    } else {
      emotionCounts[emotionNorm] = (emotionCounts[emotionNorm] ?? 0) + 1;
    }

    const intensity = perf?.intensity;
    if (
      typeof intensity !== 'number' ||
      !Number.isInteger(intensity) ||
      intensity < 1 ||
      intensity > 5
    ) {
      findings.push({
        code: 'INTENSITY',
        severity: 'FAIL',
        message: `intensity must be integer 1–5, got ${String(intensity)}`,
        shotId: sid,
        fix: '强度取 1–5 整数，避免每镜默认 5',
      });
    } else {
      intensities.push(intensity);
    }

    const face = trim(perf?.face);
    const gaze = trim(perf?.gaze);
    const posture = trim(perf?.posture);
    if (!face && !gaze && !posture) {
      findings.push({
        code: 'PERFORMANCE_VISIBLE',
        severity: 'FAIL',
        message:
          'performance has no visible acting cues (face/gaze/posture all empty)',
        shotId: sid,
        fix: '补上面部/视线/肩颈等可见动作，不要只写情绪名词',
      });
    }

    const inferred = perf?.inferredEmotions ?? [];
    if (inferred.length > 0 && hasText(shot.scriptBeat)) {
      const beat = shot.scriptBeat!;
      const marked = /推断|inferred|导演判断|director'?s?\s*infer/i.test(beat);
      if (!marked) {
        for (const item of inferred) {
          const token = trim(item);
          if (token && beat.includes(token)) {
            findings.push({
              code: 'INFERRED_AS_FACT',
              severity: 'WARN',
              message: `inferred emotion "${token}" appears in scriptBeat without 推断/inferred marker`,
              shotId: sid,
              fix: '剧本事实与导演推断分开；推断须标注',
            });
            break;
          }
        }
      }
    }

    const cam = shot.camera;
    if (!hasText(cam?.shotSize)) {
      findings.push({
        code: 'CAMERA_SHOT_SIZE',
        severity: 'FAIL',
        message: 'camera.shotSize is required',
        shotId: sid,
        fix: '写清景别',
      });
    }
    if (!hasText(cam?.primaryMove)) {
      findings.push({
        code: 'PRIMARY_MOVE',
        severity: 'FAIL',
        message: 'camera.primaryMove is required',
        shotId: sid,
        fix: '每镜只选一种主要运镜',
      });
    } else {
      const primary = trim(cam!.primaryMove);
      if (isPushIn(primary)) pushInCount += 1;
      const extras = (cam?.extraMoves ?? []).map(trim).filter(Boolean);
      const primaryFam = moveFamily(primary);
      const conflicting = extras.filter((e) => moveFamily(e) !== primaryFam);
      if (conflicting.length > 0) {
        findings.push({
          code: 'MULTI_MOVE',
          severity: 'FAIL',
          message: `extraMoves conflict with primaryMove "${primary}": ${conflicting.join(', ')}`,
          shotId: sid,
          fix: '一个镜头优先一种主要运镜；删掉冲突的 extraMoves',
        });
      }
    }

    if (hasDialogueLine(shot)) {
      dialogueShots += 1;
      if (!hasText(shot.dialogue?.lipsyncNote)) {
        findings.push({
          code: 'DIALOGUE_LIPSYNC',
          severity: 'FAIL',
          message: 'dialogue.line present but lipsyncNote missing',
          shotId: sid,
          fix: '标明自然口型起止/停顿（有音频优先跟音频）',
        });
      }
    } else {
      silentShots += 1;
      if (!hasText(shot.mouthResting)) {
        findings.push({
          code: 'MOUTH_RESTING',
          severity: 'FAIL',
          message: 'no dialogue but mouthResting missing',
          shotId: sid,
          fix: '无对白时说明嘴部自然停留（可轻启或闭唇）',
        });
      }
    }

    const prompt = trim(shot.fullPrompt);
    if (!prompt) {
      findings.push({
        code: 'PROMPT_EMPTY',
        severity: 'FAIL',
        message: 'fullPrompt is empty',
        shotId: sid,
        fix: '输出可直接复制的完整视频提示词',
      });
    } else if (prompt.length < 20 || !PERFORMANCE_CUE_RE.test(prompt)) {
      findings.push({
        code: 'PROMPT_MISSING_PERFORMANCE',
        severity: 'WARN',
        message:
          'fullPrompt looks too short or lacks performance/camera cues',
        shotId: sid,
        fix: '按「谁在做什么 → 表演变化 → 摄影机观察」补全',
      });
    }

    if (style === 'live_action') {
      const hay = cartoonHaystack(shot);
      if (CARTOON_FX_RE.test(hay)) {
        findings.push({
          code: 'CARTOON_FX',
          severity: 'FAIL',
          message:
            'live_action style forbids cartoon FX (爱心冒泡/蒸汽团/速度线/夸张拖影…)',
          shotId: sid,
          fix: '默认真人写实：把漫画符号改成自然脸部/身体动作，或改 style=anime|comic',
        });
      }
    }
  }

  if (shots.length >= 3 && intensities.length === shots.length) {
    if (intensities.every((n) => n === 5)) {
      findings.push({
        code: 'INTENSITY_FLAT',
        severity: 'WARN',
        message: `all ${shots.length} shots use intensity=5; vary intensity with drama beats`,
        fix: '强度随戏剧节拍变化，保留收敛与反差',
      });
    }
  }

  if (shots.length >= 3 && pushInCount === shots.length) {
    findings.push({
      code: 'ALL_PUSH_IN',
      severity: 'WARN',
      message: `all ${shots.length} shots use push-in; leave static/environment moves`,
      fix: '按剧情选择运镜，不要每镜都推进',
    });
  }

  const failN = findings.filter((f) => f.severity === 'FAIL').length;
  const warnN = findings.filter((f) => f.severity === 'WARN').length;
  const avgIntensity =
    intensities.length > 0
      ? intensities.reduce((a, b) => a + b, 0) / intensities.length
      : null;

  const fixes = [
    ...new Set(
      findings.map((f) => f.fix).filter((x): x is string => Boolean(x)),
    ),
  ];

  return {
    verdict: failN > 0 ? 'FAIL' : 'PASS',
    findings,
    metrics: {
      shotCount: shots.length,
      style,
      emotionCounts,
      avgIntensity,
      dialogueShots,
      silentShots,
      findingCounts: { FAIL: failN, WARN: warnN },
    },
    gates: GATES,
    summary:
      failN > 0
        ? `FAIL (${findings
            .filter((f) => f.severity === 'FAIL')
            .map((f) => f.code)
            .join(',')})`
        : warnN > 0
          ? `PASS with ${warnN} WARN`
          : 'PASS',
    fixes: fixes.length ? fixes : undefined,
  };
}
