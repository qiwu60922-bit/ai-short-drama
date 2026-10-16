/**
 * V12 · Cut Timeline Gate (帧级分镜时间轴闸门), pre-generation, offline, deterministic.
 *
 * Adapted from RNA4219/video-storyboard-forge `scripts/storyboard.py` load()/validate (MIT):
 * https://github.com/RNA4219/video-storyboard-forge
 * That CLI validates a YAML storyboard (fps / even canvas / C### cut IDs / cue ranges /
 * character refs / sum(duration_frames) == target_frames) and auto-computes start/end
 * frame+seconds. Here the same rules run on one JSON document, rewritten in TypeScript
 * for the V11 pipeline. Animatic/ffmpeg export is NOT ported (optional later).
 *
 *  SCHEMA (FAIL)              document fails CutTimelineSchema
 *  BAD_FPS (FAIL)             fps not integer 1..120
 *  BAD_CANVAS (FAIL)          width/height not even integers in 2..4096
 *  BAD_CUT_ID (FAIL)          cut id not C### (C001+) or duplicate
 *  BAD_DURATION (FAIL)        duration_frames < 1
 *  EMPTY_SCENE_ACTION (FAIL)  scene or action blank
 *  BAD_CAMERA (FAIL)          camera framing/angle/movement missing/blank
 *  UNKNOWN_CAST (FAIL)        cut.characters references id not in meta.characters
 *  CUE_OOR (FAIL)             cue start/end outside [0, duration_frames) / a>=b
 *  TOTAL_MISMATCH (FAIL)      sum(duration_frames) != meta.target_frames
 *  BEAT_TOO_LONG (WARN)       cut seconds > maxBeatSec (default 4; forge rhythm hint 2–4s)
 *  BEAT_TOO_SHORT (WARN)      cut seconds < minBeatSec (default 0.5)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';

const PosInt = z.number().int().positive();
const NonNegInt = z.number().int().nonnegative();

export const CutCueSchema = z.object({
  start_frame: NonNegInt,
  end_frame: PosInt,
  description: z.string(),
});

export const CutCameraSchema = z.object({
  framing: z.string().min(1),
  angle: z.string().min(1),
  movement: z.string().min(1),
});

export const CutSchema = z.object({
  id: z.string().min(1),
  duration_frames: PosInt,
  scene: z.string(),
  action: z.string(),
  camera: CutCameraSchema,
  characters: z.array(z.string()).default([]),
  dialogue: z.string().default(''),
  sound: z.string().default(''),
  on_screen_text: z.string().default(''),
  notes: z.string().default(''),
  cues: z.array(CutCueSchema).default([]),
});

export const CutTimelineMetaSchema = z.object({
  title: z.string().min(1),
  style: z.string().min(1),
  fps: PosInt,
  width: PosInt,
  height: PosInt,
  target_frames: PosInt,
  characters: z.record(z.string(), z.string()).default({}),
});

export const CutTimelineSchema = z.object({
  version: z.literal(1),
  meta: CutTimelineMetaSchema,
  cuts: z.array(CutSchema).min(1),
});

export type CutTimeline = z.infer<typeof CutTimelineSchema>;

export interface CutTimelineOptions {
  /** Warn when a cut exceeds this many seconds (forge: 2–4s information change). Default 4. */
  maxBeatSec?: number;
  /** Warn when a cut is shorter than this many seconds. Default 0.5. */
  minBeatSec?: number;
}

export const CUT_TIMELINE_DEFAULTS: Required<CutTimelineOptions> = {
  maxBeatSec: 4,
  minBeatSec: 0.5,
};

export type CutTimelineFinding = {
  code:
    | 'SCHEMA'
    | 'BAD_FPS'
    | 'BAD_CANVAS'
    | 'BAD_CUT_ID'
    | 'BAD_DURATION'
    | 'EMPTY_SCENE_ACTION'
    | 'BAD_CAMERA'
    | 'UNKNOWN_CAST'
    | 'CUE_OOR'
    | 'TOTAL_MISMATCH'
    | 'BEAT_TOO_LONG'
    | 'BEAT_TOO_SHORT';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface CutTimelineRow {
  id: string;
  start_frame: number;
  end_frame: number;
  duration_frames: number;
  start_seconds: number;
  end_seconds: number;
}

export interface CutTimelineReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    cuts: number;
    total_frames: number;
    target_frames: number;
    total_seconds: number;
    fps: number;
  };
  timeline: CutTimelineRow[];
  findings: CutTimelineFinding[];
  thresholds: Required<CutTimelineOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;
const CUT_ID_RE = /^C\d{3,}$/;

function evenInRange(n: number): boolean {
  return Number.isInteger(n) && n >= 2 && n <= 4096 && n % 2 === 0;
}

/**
 * Validate a frame-accurate cut timeline and compute start/end frame+seconds per cut.
 * Mirrors forge `load()` validation; does not write HTML/CSV/animatic.
 */
export function evaluateCutTimeline(
  input: unknown,
  opts: CutTimelineOptions = {},
): CutTimelineReport {
  const thresholds = { ...CUT_TIMELINE_DEFAULTS, ...opts };
  const emptyMetrics = {
    cuts: 0,
    total_frames: 0,
    target_frames: 0,
    total_seconds: 0,
    fps: 0,
  };

  const parsed = CutTimelineSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: emptyMetrics,
      timeline: [],
      findings: [
        {
          code: 'SCHEMA',
          severity: 'FAIL',
          message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        },
      ],
      thresholds,
      gates: GATES,
    };
  }

  const { meta, cuts } = parsed.data;
  const findings: CutTimelineFinding[] = [];
  const push = (f: CutTimelineFinding) => findings.push(f);

  if (!Number.isInteger(meta.fps) || meta.fps < 1 || meta.fps > 120) {
    push({
      code: 'BAD_FPS',
      severity: 'FAIL',
      message: `fps 须为整数 1〜120，当前 ${meta.fps}`,
      fix: '把 meta.fps 改成 24/25/30 等常见帧率',
    });
  }
  if (!evenInRange(meta.width) || !evenInRange(meta.height)) {
    push({
      code: 'BAD_CANVAS',
      severity: 'FAIL',
      message: `画布须为偶数 2〜4096，当前 ${meta.width}×${meta.height}`,
      fix: 'width/height 改成偶数（如 1280×720）以便 ffmpeg 编码',
    });
  }

  const charIds = new Set(Object.keys(meta.characters));
  const seenIds = new Set<string>();
  const timeline: CutTimelineRow[] = [];
  let total = 0;

  for (const cut of cuts) {
    const cid = cut.id;
    if (!CUT_ID_RE.test(cid)) {
      push({
        code: 'BAD_CUT_ID',
        severity: 'FAIL',
        ids: [cid],
        message: `镜头 ID 须为 C001 形式，当前 ${cid}`,
        fix: '改成 C001、C002…（至少三位数字）',
      });
    }
    if (seenIds.has(cid)) {
      push({
        code: 'BAD_CUT_ID',
        severity: 'FAIL',
        ids: [cid],
        message: `镜头 ID 重复：${cid}`,
        fix: '每个 cut.id 必须唯一',
      });
    }
    seenIds.add(cid);

    if (!Number.isInteger(cut.duration_frames) || cut.duration_frames < 1) {
      push({
        code: 'BAD_DURATION',
        severity: 'FAIL',
        ids: [cid],
        message: `${cid}: duration_frames 须为正整数`,
      });
    }

    if (!cut.scene.trim() || !cut.action.trim()) {
      push({
        code: 'EMPTY_SCENE_ACTION',
        severity: 'FAIL',
        ids: [cid],
        message: `${cid}: scene/action 不能为空`,
        fix: '写清场景与动作，便于分镜与预演',
      });
    }

    for (const key of ['framing', 'angle', 'movement'] as const) {
      if (!cut.camera[key]?.trim()) {
        push({
          code: 'BAD_CAMERA',
          severity: 'FAIL',
          ids: [cid],
          message: `${cid}: camera.${key} 不能为空`,
        });
      }
    }

    const unknown = cut.characters.filter((c) => !charIds.has(c));
    if (unknown.length) {
      push({
        code: 'UNKNOWN_CAST',
        severity: 'FAIL',
        ids: [cid, ...unknown],
        message: `${cid}: 未在 meta.characters 定义：${unknown.join(', ')}`,
        fix: '先在 meta.characters 登记角色 ID→描述',
      });
    }

    for (const cue of cut.cues) {
      const a = cue.start_frame;
      const b = cue.end_frame;
      if (!(Number.isInteger(a) && Number.isInteger(b) && a >= 0 && a < b && b <= cut.duration_frames)) {
        push({
          code: 'CUE_OOR',
          severity: 'FAIL',
          ids: [cid],
          message: `${cid}: cue ${a}–${b}f 超出本镜尺 0…${cut.duration_frames}`,
          fix: 'cue 须满足 0 ≤ start < end ≤ duration_frames',
        });
      }
    }

    const start = total;
    const end = total + cut.duration_frames;
    timeline.push({
      id: cid,
      start_frame: start,
      end_frame: end,
      duration_frames: cut.duration_frames,
      start_seconds: start / meta.fps,
      end_seconds: end / meta.fps,
    });
    total += cut.duration_frames;

    const sec = cut.duration_frames / meta.fps;
    if (sec > thresholds.maxBeatSec) {
      push({
        code: 'BEAT_TOO_LONG',
        severity: 'WARN',
        ids: [cid],
        message: `${cid}: ${sec.toFixed(3)}s > maxBeatSec ${thresholds.maxBeatSec}（建议 2–4s 一信息变化）`,
        fix: '拆镜或缩短 duration_frames，保持剪辑节奏',
      });
    } else if (sec < thresholds.minBeatSec) {
      push({
        code: 'BEAT_TOO_SHORT',
        severity: 'WARN',
        ids: [cid],
        message: `${cid}: ${sec.toFixed(3)}s < minBeatSec ${thresholds.minBeatSec}`,
        fix: '过短镜头观众看不清，适当加长或合并',
      });
    }
  }

  if (total !== meta.target_frames) {
    push({
      code: 'TOTAL_MISMATCH',
      severity: 'FAIL',
      message: `尺不一致：合计 ${total}f / 指定 target_frames ${meta.target_frames}f`,
      fix: '改 cuts 的 duration_frames 或 meta.target_frames，使两者相等',
    });
  }

  const hasFail = findings.some((f) => f.severity === 'FAIL');
  return {
    verdict: hasFail ? 'FAIL' : 'PASS',
    metrics: {
      cuts: cuts.length,
      total_frames: total,
      target_frames: meta.target_frames,
      total_seconds: total / meta.fps,
      fps: meta.fps,
    },
    timeline,
    findings,
    thresholds,
    gates: GATES,
  };
}
