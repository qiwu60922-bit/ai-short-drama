/**
 * V12 · Assembly Review Gate (成片拼接审核指纹闸门), post-generation, offline, deterministic.
 *
 * Adapted from zhsjwjw3888/ai-drama-post `ai-drama-post/scripts/studio.py` (MIT):
 * https://github.com/zhsjwjw3888/ai-drama-post
 * That skill keeps a plan.json (canvas/fps/codec/clips/mix/ASS) and a reviews.json where
 * every clip review is bound to the clip's SHA-256 + in/out spec; `gate` refuses export when
 * media bytes or trim points changed after review, or when visual/audio/timing were not all
 * checked. Here the same rules are rewritten in TypeScript as pure functions (caller injects
 * ffprobe results and fingerprints). ComfyUI queue / ffmpeg render are NOT ported.
 *
 *  SCHEMA (FAIL)                   document fails AssemblyPlanSchema
 *  BAD_CANVAS (FAIL)               width/height not positive even integers
 *  BAD_FPS_CODEC (FAIL)            fps outside 1..120
 *  BAD_OUTPUT (FAIL)               output not .mp4
 *  PATH_ESCAPE (FAIL)              absolute / drive-letter / ../ path (must stay in project)
 *  OUTPUT_OVERWRITES_INPUT (FAIL)  output path equals a clip/mix/subtitle input
 *  DUP_CLIP_ID (FAIL)              clip id repeated
 *  MISSING_PROBE (FAIL)            no probe supplied for a clip/mix
 *  NO_VIDEO (FAIL)                 clip source has no video stream
 *  CLIP_EXCEEDS_SOURCE (FAIL)      start + duration > source duration + 0.02s
 *  CLIP_UNDER_ONE_FRAME (FAIL)     round(duration·fps) < 1
 *  MIX_NO_AUDIO / MIX_TOO_SHORT    mix has no audio / shorter than timeline
 *  SUBTITLE_NOT_ASS / SUBTITLE_UNREAD / SUBTITLE_DRAWING   ASS only, read, no \p1 drawing
 *  MISSING_FINGERPRINT (FAIL)      no current sha256 for a clip (never assume unchanged)
 *  REVIEW_MISSING (FAIL)           clip never reviewed
 *  REVIEW_STALE (FAIL)             sha256 or in/out spec changed after review (旧审核作废)
 *  REVIEW_INCOMPLETE (FAIL)        visual/audio/timing not all checked, or no evidence
 * Review records are human/assistant claims of checks actually performed, not automatic
 * quality judgment. Engineering gate only: PASS ≠ Final ≠ G3.
 */
import path from 'node:path';
import { z } from 'zod';

export const AssemblyClipSchema = z.object({
  id: z.string().min(1),
  path: z.string(),
  start: z.number().finite().nonnegative().default(0),
  duration: z.number().finite().positive(),
});

export const AssemblyPlanSchema = z.object({
  version: z.literal(1),
  output: z.string(),
  width: z.number().finite().positive(),
  height: z.number().finite().positive(),
  fps: z.number().finite().positive(),
  codec: z.enum(['h264', 'h265']),
  clips: z.array(AssemblyClipSchema).min(1),
  mix: z.string().min(1).optional(),
  subtitles: z.string().min(1).optional(),
});

export type AssemblyClip = z.input<typeof AssemblyClipSchema>;
export type AssemblyPlan = z.input<typeof AssemblyPlanSchema>;
type ParsedPlan = z.output<typeof AssemblyPlanSchema>;

export const REVIEW_CHECKS = ['visual', 'audio', 'timing'] as const;
export type ReviewCheck = (typeof REVIEW_CHECKS)[number];

export interface ClipSpec { id: string; path: string; start: number; duration: number }

export const AssemblyReviewRecordSchema = z.object({
  sha256: z.string(),
  clip: z.object({ id: z.string(), path: z.string(), start: z.number(), duration: z.number() }),
  checks: z.record(z.string(), z.boolean()),
  evidence: z.array(z.string()),
});
export type AssemblyReviewRecord = z.infer<typeof AssemblyReviewRecordSchema>;
export type AssemblyReviews = Record<string, AssemblyReviewRecord>;
export const AssemblyReviewsSchema = z.record(z.string(), AssemblyReviewRecordSchema);

export interface ClipProbe { hasVideo: boolean; hasAudio: boolean; durationSec: number }

export interface AssemblyEvalInput {
  /** ffprobe facts keyed by plan-relative path (clips + mix). */
  probes?: Record<string, ClipProbe>;
  /** Current SHA-256 of each clip file, keyed by plan-relative path. */
  sha256?: Record<string, string>;
  reviews?: AssemblyReviews;
  /** Raw ASS text when plan.subtitles is set. */
  subtitleText?: string;
}

export type AssemblyFindingCode =
  | 'SCHEMA' | 'BAD_CANVAS' | 'BAD_FPS_CODEC' | 'BAD_OUTPUT' | 'PATH_ESCAPE'
  | 'OUTPUT_OVERWRITES_INPUT' | 'DUP_CLIP_ID' | 'MISSING_PROBE' | 'NO_VIDEO'
  | 'CLIP_EXCEEDS_SOURCE' | 'CLIP_UNDER_ONE_FRAME' | 'MIX_NO_AUDIO' | 'MIX_TOO_SHORT'
  | 'SUBTITLE_NOT_ASS' | 'SUBTITLE_UNREAD' | 'SUBTITLE_DRAWING' | 'MISSING_FINGERPRINT'
  | 'REVIEW_MISSING' | 'REVIEW_STALE' | 'REVIEW_INCOMPLETE'
  | 'RENDER_SIZE' | 'RENDER_DURATION' | 'RENDER_FPS' | 'RENDER_CODEC' | 'RENDER_AUDIO'
  | 'RENDER_DECODE';

export interface AssemblyFinding {
  code: AssemblyFindingCode;
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;
export const SOURCE_TAIL_TOLERANCE_SEC = 0.02;
export const RENDER_DURATION_TOLERANCE_SEC = 0.15;

export interface AssemblyReport {
  verdict: 'PASS' | 'FAIL';
  metrics: { clips: number; timeline_seconds: number; reviewed_current: number };
  findings: AssemblyFinding[];
  scope: string;
  gates: typeof GATES;
}

/** Normalise a plan-relative path; null when it escapes the project root. */
export function projectRelative(p: string): string | null {
  if (!p || p.includes(':') || p.startsWith('/') || p.startsWith('\\')) return null;
  const n = path.posix.normalize(p.replace(/\\/g, '/'));
  if (n === '..' || n.startsWith('../') || n.startsWith('/')) return null;
  return n;
}

function frames(duration: number, fps: number): number {
  return Math.round(duration * fps);
}

/** Output timeline length: each clip rounded to whole output frames (studio.py check()). */
export function timelineSeconds(plan: AssemblyPlan): number {
  return plan.clips.reduce((s, c) => s + frames(c.duration, plan.fps) / plan.fps, 0);
}

function spec(c: AssemblyClip): ClipSpec {
  return { id: c.id, path: c.path, start: c.start ?? 0, duration: c.duration };
}

function sameSpec(a: ClipSpec, b: ClipSpec): boolean {
  return a.id === b.id && a.path === b.path && a.start === b.start && a.duration === b.duration;
}

const SHA_RE = /^[0-9a-f]{64}$/;

/**
 * Record a review claim for one clip (studio.py review()). Same fingerprint + spec ⇒ checks
 * and evidence accumulate; otherwise the old record is discarded first. Pure: returns a copy.
 */
export function recordAssemblyReview(
  records: AssemblyReviews,
  plan: AssemblyPlan,
  clipId: string,
  sha256: string,
  checks: ReviewCheck[],
  evidence: string,
): AssemblyReviews {
  const clip = plan.clips.find((c) => c.id === clipId);
  if (!clip) throw new Error(`unknown clip: ${clipId}`);
  if (!evidence.trim()) throw new Error('actual review evidence required');
  const sha = sha256.toLowerCase();
  if (!SHA_RE.test(sha)) throw new Error('sha256 must be 64 hex chars');
  for (const k of checks) {
    if (!(REVIEW_CHECKS as readonly string[]).includes(k)) throw new Error(`unknown check: ${k}`);
  }
  const s = spec(clip);
  const old = records[clipId];
  const base: AssemblyReviewRecord =
    old && old.sha256 === sha && sameSpec(old.clip, s)
      ? { ...old, checks: { ...old.checks }, evidence: [...old.evidence] }
      : { sha256: sha, clip: s, checks: {}, evidence: [] };
  for (const k of checks) base.checks[k] = true;
  base.evidence.push(evidence);
  return { ...records, [clipId]: base };
}

/** Validate plan + probes + fingerprints + reviews (studio.py load()/check()/gate()). */
export function evaluateAssemblyPlan(input: unknown, ev: AssemblyEvalInput): AssemblyReport {
  const scope = 'Recorded source reviews only; final timeline review still required';
  const parsed = AssemblyPlanSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { clips: 0, timeline_seconds: 0, reviewed_current: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      scope,
      gates: GATES,
    };
  }
  const p: ParsedPlan = parsed.data;
  const findings: AssemblyFinding[] = [];
  const fail = (code: AssemblyFindingCode, message: string, ids?: string[], fix?: string) =>
    findings.push({ code, severity: 'FAIL', message, ...(ids ? { ids } : {}), ...(fix ? { fix } : {}) });

  for (const [k, n] of [['width', p.width], ['height', p.height]] as const) {
    if (!Number.isInteger(n) || n % 2 !== 0) fail('BAD_CANVAS', `${k} 须为正偶数，当前 ${n}`, undefined, '改成 720×1280 等偶数尺寸');
  }
  if (p.fps < 1 || p.fps > 120) fail('BAD_FPS_CODEC', `fps 须在 1〜120，当前 ${p.fps}`);

  const out = projectRelative(p.output);
  if (out === null) fail('PATH_ESCAPE', `output 路径逃出项目：${p.output}`, ['output']);
  if (!p.output.toLowerCase().endsWith('.mp4')) fail('BAD_OUTPUT', `output 须为 .mp4：${p.output}`);

  const inputs: string[] = [];
  const seen = new Set<string>();
  for (const c of p.clips) {
    if (seen.has(c.id)) fail('DUP_CLIP_ID', `clip id 重复：${c.id}`, [c.id]);
    seen.add(c.id);
    const rel = projectRelative(c.path);
    if (rel === null) fail('PATH_ESCAPE', `clip ${c.id} 路径逃出项目：${c.path}`, [c.id], '只用相对 plan.json 的项目内路径');
    else inputs.push(rel);
  }
  for (const k of ['mix', 'subtitles'] as const) {
    const v = p[k];
    if (v === undefined) continue;
    const rel = projectRelative(v);
    if (rel === null) fail('PATH_ESCAPE', `${k} 路径逃出项目：${v}`, [k]);
    else inputs.push(rel);
  }
  if (out !== null && inputs.includes(out)) {
    fail('OUTPUT_OVERWRITES_INPUT', `output 会覆盖输入：${p.output}`, ['output'], '导出用新的版本文件名');
  }

  const total = timelineSeconds(p);
  const probes = ev.probes ?? {};
  for (const c of p.clips) {
    if (frames(c.duration, p.fps) < 1) fail('CLIP_UNDER_ONE_FRAME', `clip ${c.id} 不足一帧（${c.duration}s @${p.fps}fps）`, [c.id]);
    const pr = probes[c.path];
    if (!pr) { fail('MISSING_PROBE', `clip ${c.id} 缺 ffprobe 结果`, [c.id]); continue; }
    if (!pr.hasVideo) { fail('NO_VIDEO', `clip ${c.id} 源文件没有视频流`, [c.id]); continue; }
    if (c.start + c.duration > pr.durationSec + SOURCE_TAIL_TOLERANCE_SEC) {
      fail('CLIP_EXCEEDS_SOURCE', `clip ${c.id} 入点+时长 ${(c.start + c.duration).toFixed(3)}s 超出源 ${pr.durationSec}s`, [c.id], '缩短 duration 或前移 start');
    }
  }
  if (p.mix !== undefined) {
    const pr = probes[p.mix];
    if (!pr) fail('MISSING_PROBE', `mix 缺 ffprobe 结果`, ['mix']);
    else if (!pr.hasAudio) fail('MIX_NO_AUDIO', `mix 没有音频流`, ['mix']);
    else if (pr.durationSec + SOURCE_TAIL_TOLERANCE_SEC < total) {
      fail('MIX_TOO_SHORT', `mix ${pr.durationSec}s 短于时间轴 ${total.toFixed(3)}s`, ['mix']);
    }
  }
  if (p.subtitles !== undefined) {
    if (!p.subtitles.toLowerCase().endsWith('.ass')) fail('SUBTITLE_NOT_ASS', `字幕须为 .ass：${p.subtitles}`, ['subtitles']);
    else if (ev.subtitleText === undefined) fail('SUBTITLE_UNREAD', `未读取字幕内容：${p.subtitles}`, ['subtitles']);
    else if (ev.subtitleText.toLowerCase().includes('\\p1')) {
      fail('SUBTITLE_DRAWING', `ASS 含 \\p1 绘图指令，需人工先审`, ['subtitles']);
    }
  }

  const shas = ev.sha256 ?? {};
  const reviews = ev.reviews ?? {};
  let reviewedCurrent = 0;
  for (const c of p.clips) {
    const cur = shas[c.path]?.toLowerCase();
    if (!cur) fail('MISSING_FINGERPRINT', `clip ${c.id} 缺当前 sha256`, [c.id]);
    const r = reviews[c.id];
    if (!r) { fail('REVIEW_MISSING', `clip ${c.id} 没有审核记录`, [c.id], '实际看/听后用 --record 记录 visual audio timing'); continue; }
    if (!cur) continue;
    if (r.sha256.toLowerCase() !== cur || !sameSpec(r.clip, spec(c))) {
      fail('REVIEW_STALE', `clip ${c.id} 审核后素材或入出点已变，旧审核作废`, [c.id], '重新审核当前版本');
      continue;
    }
    const missing = REVIEW_CHECKS.filter((k) => r.checks[k] !== true);
    if (missing.length || !r.evidence.some((e) => e.trim())) {
      fail('REVIEW_INCOMPLETE', `clip ${c.id} 审核不完整：缺 ${missing.join('/') || 'evidence'}`, [c.id]);
      continue;
    }
    reviewedCurrent++;
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { clips: p.clips.length, timeline_seconds: total, reviewed_current: reviewedCurrent },
    findings,
    scope,
    gates: GATES,
  };
}

export interface RenderProbe {
  width: number;
  height: number;
  durationSec: number;
  /** ffprobe avg_frame_rate, e.g. "24/1". */
  avgFrameRate: string;
  videoCodec: string;
  audioSampleRate?: number;
  audioChannels?: number;
  /** ffmpeg -xerror full decode succeeded. */
  completeDecode: boolean;
}

export interface RenderVerifyReport {
  verdict: 'PASS' | 'FAIL';
  findings: AssemblyFinding[];
  scope: string;
  gates: typeof GATES;
}

function parseRate(r: string): number {
  const [a, b] = r.split('/').map(Number);
  return b ? a / b : a;
}

/** Technical check of an exported candidate against the plan (studio.py render() tail). */
export function verifyRenderOutput(plan: AssemblyPlan, probe: RenderProbe): RenderVerifyReport {
  const findings: AssemblyFinding[] = [];
  const fail = (code: AssemblyFindingCode, message: string) => findings.push({ code, severity: 'FAIL', message });
  if (probe.width !== plan.width || probe.height !== plan.height) {
    fail('RENDER_SIZE', `尺寸 ${probe.width}×${probe.height} ≠ 计划 ${plan.width}×${plan.height}`);
  }
  const total = timelineSeconds(plan);
  if (Math.abs(probe.durationSec - total) > RENDER_DURATION_TOLERANCE_SEC) {
    fail('RENDER_DURATION', `时长 ${probe.durationSec}s 与时间轴 ${total.toFixed(3)}s 相差超过 ${RENDER_DURATION_TOLERANCE_SEC}s`);
  }
  if (Math.abs(parseRate(probe.avgFrameRate) - plan.fps) > 0.001) {
    fail('RENDER_FPS', `帧率 ${probe.avgFrameRate} ≠ ${plan.fps}`);
  }
  const want = plan.codec === 'h264' ? 'h264' : 'hevc';
  if (probe.videoCodec !== want) fail('RENDER_CODEC', `编码 ${probe.videoCodec} ≠ ${want}`);
  if (probe.audioSampleRate !== 48000 || probe.audioChannels !== 2) {
    fail('RENDER_AUDIO', `音频须 48000Hz 双声道，当前 ${probe.audioSampleRate ?? '无'}Hz/${probe.audioChannels ?? 0}ch`);
  }
  if (!probe.completeDecode) fail('RENDER_DECODE', '完整解码未通过');
  return {
    verdict: findings.length ? 'FAIL' : 'PASS',
    findings,
    scope: 'Technical validation, not visual or listening approval',
    gates: GATES,
  };
}
