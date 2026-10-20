/**
 * V12 · Clip Storyboard Gate (Clip 分镜纸面机械闸门), post-assembly / pre-gen, offline, deterministic.
 *
 * Rules rewritten in TypeScript from wwaa34682-lab/novel-to-short-drama-skill
 * 步骤4 Clip 分镜 + error-ledger G01 / G02 / G08 / G11 (and step-4 mechanical bits)
 * (MIT, Copyright (c) 2026 wwaa34682-lab):
 * https://github.com/wwaa34682-lab/novel-to-short-drama-skill
 * Not a wholesale vendoring of the skill markdown — same mechanical checks only.
 *
 *  SCHEMA (error)            empty / malformed JSON
 *  CLIP_SHOT_MIN (error)     clip shots < 6
 *  CLIP_DURATION (warning)   suggestedDurationSec off 15s by >±3s, or missing
 *  HANDOFF_MISSING (error)   non-first missing handoffFromPrev / non-last missing handoffToNext / empty
 *  NAIL_OFF_CAMERA (error)   nailPoints entry not covered by any shot.nailPoint (empty list → skip)
 *  SHELL_ASSET (error)       assetRefs cite status≠可用 (G08)
 *  DIALOGUE_RATE (warning)   printable dialogue chars > suggestedDurationSec*4 (缺 duration → 15)
 *  COMBAT_CAUSALITY (error)  isCombat && (no beats or no 「→」 causal chain)
 *  STEP_SKIP (error)         pipeline.previousStepFormalPass === false (G11); undefined → skip
 *  REF_OVERFLOW (error)      checkMode=pre-gen && maxRefImagesPerGen > 2 (G01)
 *  RELEASE_MISSING (error)   checkMode=pre-gen && releasePhrasePresent === false (G02)
 *
 * pass = no error-severity findings (warnings alone keep pass=true).
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */

export type AssetStatus = '可用' | '空壳' | '作废';
export type ClipCheckMode = 'paper' | 'pre-gen';

export interface ClipShot {
  no: number;
  visual: string;
  size?: string;
  angle?: string;
  move?: string;
  line?: string;
  /** 本镜覆盖的钉点（应匹配所属 Clip 的 nailPoints 条目） */
  nailPoint?: string;
}

export interface ClipItem {
  id: string;
  title?: string;
  suggestedDurationSec?: number;
  /** 【承接上一 Clip】 */
  handoffFromPrev?: string;
  /** 【交给下一 Clip】 */
  handoffToNext?: string;
  nailPoints: string[];
  shots: ClipShot[];
  assetRefs?: string[];
  isCombat?: boolean;
  /** 谁→对谁→结果 */
  combatBeats?: string[];
}

export interface ClipAsset {
  id: string;
  status: AssetStatus;
}

export interface ClipPipelineFlags {
  /** 上一步是否书面正式通过（G11） */
  previousStepFormalPass?: boolean;
  /** 用户放行口令（G02，仅 pre-gen） */
  releasePhrasePresent?: boolean;
  /** 实际挂的参考图数（G01，仅 pre-gen） */
  maxRefImagesPerGen?: number;
}

export interface ClipStoryboardInput {
  clips: ClipItem[];
  assets?: ClipAsset[];
  pipeline?: ClipPipelineFlags;
  checkMode?: ClipCheckMode;
}

export type ClipStoryboardFindingCode =
  | 'SCHEMA'
  | 'CLIP_SHOT_MIN'
  | 'CLIP_DURATION'
  | 'HANDOFF_MISSING'
  | 'NAIL_OFF_CAMERA'
  | 'SHELL_ASSET'
  | 'DIALOGUE_RATE'
  | 'COMBAT_CAUSALITY'
  | 'STEP_SKIP'
  | 'REF_OVERFLOW'
  | 'RELEASE_MISSING';

export interface ClipStoryboardFinding {
  code: ClipStoryboardFindingCode;
  severity: 'error' | 'warning';
  message: string;
  clipId?: string;
}

export interface ClipStoryboardMetrics {
  clipCount: number;
  shotCount: number;
  errorCount: number;
  warningCount: number;
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export interface ClipStoryboardReport {
  pass: boolean;
  verdict: 'PASS' | 'FAIL';
  findings: ClipStoryboardFinding[];
  metrics: ClipStoryboardMetrics;
  gates: typeof GATES;
}

const TARGET_DURATION_SEC = 15;
const DURATION_TOLERANCE_SEC = 3;
const MIN_SHOTS_PER_CLIP = 6;
const DIALOGUE_CHARS_PER_SEC = 4;
const MAX_REF_IMAGES = 2;

function schemaFail(message: string): ClipStoryboardReport {
  return {
    pass: false,
    verdict: 'FAIL',
    findings: [{ code: 'SCHEMA', severity: 'error', message }],
    metrics: { clipCount: 0, shotCount: 0, errorCount: 1, warningCount: 0 },
    gates: GATES,
  };
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

/** 可打印非空白字符（含汉字），用于语速统计 */
export function countPrintableChars(text: string): number {
  let n = 0;
  for (const ch of text) {
    // skip whitespace / control
    if (/\s/u.test(ch)) continue;
    if (ch.charCodeAt(0) < 32) continue;
    n += 1;
  }
  return n;
}

function parseShot(raw: unknown, clipIdx: number, shotIdx: number): ClipShot | string {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return `clips[${clipIdx}].shots[${shotIdx}] must be an object`;
  }
  const s = raw as Record<string, unknown>;
  if (typeof s.no !== 'number' || !Number.isFinite(s.no)) {
    return `clips[${clipIdx}].shots[${shotIdx}].no must be a number`;
  }
  if (typeof s.visual !== 'string' || !s.visual.trim()) {
    return `clips[${clipIdx}].shots[${shotIdx}].visual must be a non-empty string`;
  }
  const shot: ClipShot = {
    no: s.no,
    visual: s.visual.trim(),
  };
  if (typeof s.size === 'string') shot.size = s.size;
  if (typeof s.angle === 'string') shot.angle = s.angle;
  if (typeof s.move === 'string') shot.move = s.move;
  if (typeof s.line === 'string') shot.line = s.line;
  if (typeof s.nailPoint === 'string') shot.nailPoint = s.nailPoint;
  return shot;
}

function parseClip(raw: unknown, idx: number): ClipItem | string {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return `clips[${idx}] must be an object`;
  }
  const c = raw as Record<string, unknown>;
  if (!isNonEmptyString(c.id)) {
    return `clips[${idx}].id must be a non-empty string`;
  }
  if (!Array.isArray(c.nailPoints)) {
    return `clips[${idx}].nailPoints must be an array`;
  }
  for (let i = 0; i < c.nailPoints.length; i++) {
    if (typeof c.nailPoints[i] !== 'string') {
      return `clips[${idx}].nailPoints[${i}] must be a string`;
    }
  }
  if (!Array.isArray(c.shots)) {
    return `clips[${idx}].shots must be an array`;
  }
  const shots: ClipShot[] = [];
  for (let i = 0; i < c.shots.length; i++) {
    const parsed = parseShot(c.shots[i], idx, i);
    if (typeof parsed === 'string') return parsed;
    shots.push(parsed);
  }
  const clip: ClipItem = {
    id: c.id.trim(),
    nailPoints: (c.nailPoints as string[]).map((x) => x),
    shots,
  };
  if (typeof c.title === 'string') clip.title = c.title;
  if (typeof c.suggestedDurationSec === 'number' && Number.isFinite(c.suggestedDurationSec)) {
    clip.suggestedDurationSec = c.suggestedDurationSec;
  }
  if (typeof c.handoffFromPrev === 'string') clip.handoffFromPrev = c.handoffFromPrev;
  if (typeof c.handoffToNext === 'string') clip.handoffToNext = c.handoffToNext;
  if (Array.isArray(c.assetRefs)) {
    clip.assetRefs = c.assetRefs.filter((x): x is string => typeof x === 'string');
  }
  if (typeof c.isCombat === 'boolean') clip.isCombat = c.isCombat;
  if (Array.isArray(c.combatBeats)) {
    clip.combatBeats = c.combatBeats.filter((x): x is string => typeof x === 'string');
  }
  return clip;
}

function parseInput(input: unknown): ClipStoryboardInput | ClipStoryboardReport {
  if (input === null || input === undefined || typeof input !== 'object' || Array.isArray(input)) {
    return schemaFail('input must be a JSON object');
  }
  const obj = input as Record<string, unknown>;
  if (!Array.isArray(obj.clips) || obj.clips.length === 0) {
    return schemaFail('clips must be a non-empty array');
  }
  const clips: ClipItem[] = [];
  for (let i = 0; i < obj.clips.length; i++) {
    const parsed = parseClip(obj.clips[i], i);
    if (typeof parsed === 'string') return schemaFail(parsed);
    clips.push(parsed);
  }

  let assets: ClipAsset[] | undefined;
  if (obj.assets !== undefined) {
    if (!Array.isArray(obj.assets)) {
      return schemaFail('assets must be an array when present');
    }
    assets = [];
    for (let i = 0; i < obj.assets.length; i++) {
      const a = obj.assets[i];
      if (a === null || typeof a !== 'object' || Array.isArray(a)) {
        return schemaFail(`assets[${i}] must be an object`);
      }
      const rec = a as Record<string, unknown>;
      if (!isNonEmptyString(rec.id)) {
        return schemaFail(`assets[${i}].id must be a non-empty string`);
      }
      if (rec.status !== '可用' && rec.status !== '空壳' && rec.status !== '作废') {
        return schemaFail(`assets[${i}].status must be 可用|空壳|作废`);
      }
      assets.push({ id: rec.id.trim(), status: rec.status });
    }
  }

  let pipeline: ClipPipelineFlags | undefined;
  if (obj.pipeline !== undefined) {
    if (obj.pipeline === null || typeof obj.pipeline !== 'object' || Array.isArray(obj.pipeline)) {
      return schemaFail('pipeline must be an object when present');
    }
    const p = obj.pipeline as Record<string, unknown>;
    pipeline = {};
    if (typeof p.previousStepFormalPass === 'boolean') {
      pipeline.previousStepFormalPass = p.previousStepFormalPass;
    }
    if (typeof p.releasePhrasePresent === 'boolean') {
      pipeline.releasePhrasePresent = p.releasePhrasePresent;
    }
    if (typeof p.maxRefImagesPerGen === 'number' && Number.isFinite(p.maxRefImagesPerGen)) {
      pipeline.maxRefImagesPerGen = p.maxRefImagesPerGen;
    }
  }

  let checkMode: ClipCheckMode | undefined;
  if (obj.checkMode !== undefined) {
    if (obj.checkMode !== 'paper' && obj.checkMode !== 'pre-gen') {
      return schemaFail('checkMode must be paper|pre-gen');
    }
    checkMode = obj.checkMode;
  }

  return { clips, assets, pipeline, checkMode };
}

function finish(findings: ClipStoryboardFinding[], clipCount: number, shotCount: number): ClipStoryboardReport {
  const errorCount = findings.filter((f) => f.severity === 'error').length;
  const warningCount = findings.filter((f) => f.severity === 'warning').length;
  const pass = errorCount === 0;
  return {
    pass,
    verdict: pass ? 'PASS' : 'FAIL',
    findings,
    metrics: { clipCount, shotCount, errorCount, warningCount },
    gates: GATES,
  };
}

/**
 * Evaluate structured Clip 分镜纸面 / 生成前 flags (skill 步骤4 + G01/G02/G08/G11).
 */
export function evaluateClipStoryboard(input: unknown): ClipStoryboardReport {
  const parsed = parseInput(input);
  if ('findings' in parsed && !('clips' in parsed)) {
    return parsed as ClipStoryboardReport;
  }
  // Type narrowing: parseInput returns either report (schema) or input
  if (!('clips' in parsed)) {
    return parsed as ClipStoryboardReport;
  }
  const doc = parsed as ClipStoryboardInput;
  const findings: ClipStoryboardFinding[] = [];
  const checkMode: ClipCheckMode = doc.checkMode ?? 'paper';
  const assetMap = new Map<string, AssetStatus>();
  for (const a of doc.assets ?? []) {
    assetMap.set(a.id, a.status);
  }

  // G11 STEP_SKIP
  if (doc.pipeline?.previousStepFormalPass === false) {
    findings.push({
      code: 'STEP_SKIP',
      severity: 'error',
      message: 'pipeline.previousStepFormalPass is false — 上一步未书面正式通过，禁止开本步 (G11)',
    });
  }

  // G01 / G02 only in pre-gen
  if (checkMode === 'pre-gen') {
    const maxRef = doc.pipeline?.maxRefImagesPerGen;
    if (typeof maxRef === 'number' && maxRef > MAX_REF_IMAGES) {
      findings.push({
        code: 'REF_OVERFLOW',
        severity: 'error',
        message: `maxRefImagesPerGen=${maxRef} > ${MAX_REF_IMAGES} — 每条最多挂 ${MAX_REF_IMAGES} 张参考 (G01)`,
      });
    }
    if (doc.pipeline?.releasePhrasePresent === false) {
      findings.push({
        code: 'RELEASE_MISSING',
        severity: 'error',
        message: 'releasePhrasePresent is false — 用户未说出放行口令，禁止生成 (G02)',
      });
    }
  }

  const clips = doc.clips;
  let shotCount = 0;

  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];
    const isFirst = i === 0;
    const isLast = i === clips.length - 1;
    shotCount += clip.shots.length;

    // CLIP_SHOT_MIN
    if (clip.shots.length < MIN_SHOTS_PER_CLIP) {
      findings.push({
        code: 'CLIP_SHOT_MIN',
        severity: 'error',
        clipId: clip.id,
        message: `Clip ${clip.id} has ${clip.shots.length} shots (< ${MIN_SHOTS_PER_CLIP})`,
      });
    }

    // CLIP_DURATION
    if (typeof clip.suggestedDurationSec !== 'number') {
      findings.push({
        code: 'CLIP_DURATION',
        severity: 'warning',
        clipId: clip.id,
        message: `Clip ${clip.id} missing suggestedDurationSec (expected ~${TARGET_DURATION_SEC}s ±${DURATION_TOLERANCE_SEC})`,
      });
    } else if (
      Math.abs(clip.suggestedDurationSec - TARGET_DURATION_SEC) > DURATION_TOLERANCE_SEC
    ) {
      findings.push({
        code: 'CLIP_DURATION',
        severity: 'warning',
        clipId: clip.id,
        message: `Clip ${clip.id} suggestedDurationSec=${clip.suggestedDurationSec} drifts from ${TARGET_DURATION_SEC}s by >±${DURATION_TOLERANCE_SEC}s`,
      });
    }

    // HANDOFF_MISSING
    if (!isFirst && !isNonEmptyString(clip.handoffFromPrev)) {
      findings.push({
        code: 'HANDOFF_MISSING',
        severity: 'error',
        clipId: clip.id,
        message: `Clip ${clip.id} missing or empty handoffFromPrev【承接上一 Clip】`,
      });
    }
    if (!isLast && !isNonEmptyString(clip.handoffToNext)) {
      findings.push({
        code: 'HANDOFF_MISSING',
        severity: 'error',
        clipId: clip.id,
        message: `Clip ${clip.id} missing or empty handoffToNext【交给下一 Clip】`,
      });
    }

    // NAIL_OFF_CAMERA
    if (clip.nailPoints.length > 0) {
      const covered = new Set<string>();
      for (const sh of clip.shots) {
        if (isNonEmptyString(sh.nailPoint)) {
          covered.add(sh.nailPoint.trim());
        }
      }
      const missing = clip.nailPoints.filter((np) => !covered.has(np.trim()));
      if (missing.length > 0) {
        findings.push({
          code: 'NAIL_OFF_CAMERA',
          severity: 'error',
          clipId: clip.id,
          message: `Clip ${clip.id} nailPoints not on camera: ${missing.join(', ')}`,
        });
      }
    }

    // SHELL_ASSET (G08)
    if (clip.assetRefs && clip.assetRefs.length > 0) {
      for (const ref of clip.assetRefs) {
        const st = assetMap.get(ref);
        if (st === undefined) {
          findings.push({
            code: 'SHELL_ASSET',
            severity: 'error',
            clipId: clip.id,
            message: `Clip ${clip.id} assetRefs "${ref}" not in assets registry (treat as 空壳) (G08)`,
          });
        } else if (st !== '可用') {
          findings.push({
            code: 'SHELL_ASSET',
            severity: 'error',
            clipId: clip.id,
            message: `Clip ${clip.id} assetRefs "${ref}" status=${st} (only 可用 allowed) (G08)`,
          });
        }
      }
    }

    // DIALOGUE_RATE
    const dur =
      typeof clip.suggestedDurationSec === 'number' && Number.isFinite(clip.suggestedDurationSec)
        ? clip.suggestedDurationSec
        : TARGET_DURATION_SEC;
    let dialogueChars = 0;
    for (const sh of clip.shots) {
      if (typeof sh.line === 'string') {
        dialogueChars += countPrintableChars(sh.line);
      }
    }
    const limit = dur * DIALOGUE_CHARS_PER_SEC;
    if (dialogueChars > limit) {
      findings.push({
        code: 'DIALOGUE_RATE',
        severity: 'warning',
        clipId: clip.id,
        message: `Clip ${clip.id} dialogue printable chars=${dialogueChars} > ${limit} (≤${DIALOGUE_CHARS_PER_SEC}字/秒 × ${dur}s)`,
      });
    }

    // COMBAT_CAUSALITY
    if (clip.isCombat === true) {
      const beats = clip.combatBeats ?? [];
      const hasCausal = beats.some((b) => typeof b === 'string' && b.includes('→'));
      if (beats.length === 0 || !hasCausal) {
        findings.push({
          code: 'COMBAT_CAUSALITY',
          severity: 'error',
          clipId: clip.id,
          message: `Clip ${clip.id} isCombat but combatBeats empty or lack 「→」因果链`,
        });
      }
    }
  }

  return finish(findings, clips.length, shotCount);
}
