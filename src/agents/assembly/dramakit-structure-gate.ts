/**
 * V12 · Dramakit Structure Gate (分镜结构/时长/钩子密度机械闸门), post-assembly, offline, deterministic.
 *
 * Rules rewritten in TypeScript from gaoren7716-lab/dramakit
 * `engine/lib/scan.py` analyze() + defaults from `config/dramakit.toml` v0.1.0
 * (MIT, Copyright (c) 2026 gaoren7716-lab):
 * https://github.com/gaoren7716-lab/dramakit
 * Not a wholesale vendoring of the Python package — same mechanical checks + AI/live profiles.
 *
 *  HOOK_WINDOW_LONG (error)       shot 1 sec > hook_window_s
 *  HOOK_WINDOW_NARRATION (error)  shot 1 line contains 旁白
 *  EMPTY_LONG_TAKE (error)        long take (≥long_take_sec) with no content line
 *  SERIES_ENDING_NO_HOOK (error)  series last shot lacks ending-hook signals
 *  DURATION_DRIFT (warning)       single: |total - target| > target * tolerance
 *  SHOT_COUNT (warning)           single: n outside shots_min..shots_max
 *  ENDING_SHORT (warning)         single: last shot sec < long_take_sec
 *  FIXED_RATIO_LOW (warning)      fixed move ratio < fixed_ratio_min
 *  CLOSE_MEDIUM_RATIO_LOW (warning) (近景+中景)/n < close_medium_ratio_min
 *  CORE_RATIO_LOW (warning)       core sec band ratio < core_ratio_min
 *  DIALOGUE_RATIO (warning)       dialogue shot ratio outside [min, max]
 *  REACTION_LONG (warning)        特写/大特写 no dialogue and sec > reaction_max_sec
 *  HOOK_GAP (warning)             sliding windows of hook_per_seconds with no hook
 *  SCHEMA (error)                 malformed / empty shotlist
 *
 * pass = no error-severity findings (warnings alone keep pass=true).
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */

export type DramakitFormat = 'single' | 'series';
export type DramakitMode = 'ai' | 'live';

export interface DramakitShot {
  no: number;
  sec: number;
  size: string;
  move?: string;
  visual?: string;
  line?: string;
}

export interface DramakitShotlist {
  format?: DramakitFormat;
  mode?: DramakitMode;
  shots: DramakitShot[];
}

export type DramakitFindingCode =
  | 'SCHEMA'
  | 'HOOK_WINDOW_LONG'
  | 'HOOK_WINDOW_NARRATION'
  | 'EMPTY_LONG_TAKE'
  | 'SERIES_ENDING_NO_HOOK'
  | 'DURATION_DRIFT'
  | 'SHOT_COUNT'
  | 'ENDING_SHORT'
  | 'FIXED_RATIO_LOW'
  | 'CLOSE_MEDIUM_RATIO_LOW'
  | 'CORE_RATIO_LOW'
  | 'DIALOGUE_RATIO'
  | 'REACTION_LONG'
  | 'HOOK_GAP';

export interface DramakitFinding {
  code: DramakitFindingCode;
  severity: 'error' | 'warning';
  message: string;
  shotNos?: number[];
}

export interface DramakitMetrics {
  n: number;
  totalSec: number;
  fixedRatio: number;
  closeMediumRatio: number;
  coreRatio: number;
  dialogueRatio: number;
  hookMissCount: number;
  profile: DramakitMode;
  format: DramakitFormat;
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export interface DramakitReport {
  pass: boolean;
  verdict: 'PASS' | 'FAIL';
  metrics: DramakitMetrics;
  findings: DramakitFinding[];
  gates: typeof GATES;
}

/** Defaults from gaoren7716-lab/dramakit config/dramakit.toml v0.1.0 (AI baseline + live overrides). */
export const DRAMAKIT_DEFAULTS = {
  version: '0.1.0',
  ai: {
    single: {
      target_duration_s: 140,
      duration_tolerance: 0.15,
      shots_min: 28,
      shots_max: 45,
      hook_window_s: 3,
    },
    shot: {
      core_sec_min: 3,
      core_sec_max: 4,
      core_ratio_min: 0.55,
      long_take_sec: 5,
      reaction_max_sec: 3,
    },
    quality: {
      fixed_ratio_min: 0.65,
      close_medium_ratio_min: 0.6,
      dialogue_ratio_min: 0.4,
      dialogue_ratio_max: 0.65,
      hook_per_seconds: 20,
    },
  },
  live: {
    single: {
      target_duration_s: 140,
      duration_tolerance: 0.15,
      shots_min: 6,
      shots_max: 12,
      hook_window_s: 6,
    },
    shot: {
      core_sec_min: 5,
      core_sec_max: 10,
      core_ratio_min: 0.4,
      long_take_sec: 5,
      reaction_max_sec: 6,
    },
    quality: {
      fixed_ratio_min: 0.65,
      close_medium_ratio_min: 0.6,
      dialogue_ratio_min: 0.4,
      dialogue_ratio_max: 0.65,
      hook_per_seconds: 20,
    },
  },
} as const;

/** 台词里的钩子信号：疑问 / 否定 / 冲突（scan.py HOOK_LINE） */
export const HOOK_LINE = [
  '？',
  '?',
  '凭什么',
  '为什么',
  '难道',
  '竟然',
  '居然',
  '没想到',
  '其实',
  '真相',
  '秘密',
  '骗',
  '撒谎',
  '闭嘴',
  '滚',
  '你敢',
  '分手',
  '离婚',
  '后悔',
] as const;

/** 画面里的事件信号（scan.py HOOK_VISUAL） */
export const HOOK_VISUAL = [
  '震动',
  '来电',
  '消息',
  '响起',
  '铃声',
  '突然',
  '瞬间',
  '推门',
  '起身',
  '站起',
  '跪',
  '耳光',
  '摔',
  '撕',
  '转身走',
  '拉住',
  '抱住',
  '吻',
  '拥抱',
  '亮起',
] as const;

/** 情绪推进型运镜（scan.py HOOK_MOVES） */
export const HOOK_MOVES = ['缓推', '推', '仰拍', '俯拍', '摇'] as const;

export const CLOSE_SIZES = ['特写', '大特写'] as const;

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function moveOf(s: DramakitShot): string {
  const m = (s.move ?? '').trim();
  return m || '固定';
}

/** scan.py has_line：'无' 与 '—/ -' 字幕都不算对白 */
export function hasLine(s: DramakitShot): boolean {
  const t = (s.line ?? '').trim();
  if (!t || t === '无') return false;
  if (t.startsWith('—') || t.startsWith('-')) return false;
  return true;
}

/** scan.py has_content：空 / '无' 不算；字幕/旁白仍算内容 */
export function hasContent(s: DramakitShot): boolean {
  const t = (s.line ?? '').trim();
  return Boolean(t) && t !== '无';
}

/** Density-hook heuristic（含长镜）；ending hook 另见 hasEndingHook */
export function isHook(s: DramakitShot, longTakeSec: number): boolean {
  const move = moveOf(s);
  if (HOOK_MOVES.some((m) => move.includes(m))) return true;
  if ((CLOSE_SIZES as readonly string[]).includes(s.size)) return true;
  const line = s.line ?? '';
  if (HOOK_LINE.some((w) => line.includes(w))) return true;
  const visual = s.visual ?? '';
  if (HOOK_VISUAL.some((w) => visual.includes(w))) return true;
  if (s.sec >= longTakeSec) return true;
  return false;
}

/** 连载结尾：只用 HOOK_LINE / HOOK_VISUAL（不含长镜/特写） */
export function hasEndingHook(s: DramakitShot): boolean {
  const line = s.line ?? '';
  if (HOOK_LINE.some((w) => line.includes(w))) return true;
  const visual = s.visual ?? '';
  if (HOOK_VISUAL.some((w) => visual.includes(w))) return true;
  return false;
}

interface HookWindow {
  t0: number;
  t1: number;
  hook: boolean;
}

function hookWindows(
  shots: DramakitShot[],
  windowS: number,
  longTakeSec: number,
): HookWindow[] {
  const wins: HookWindow[] = [];
  let cur: DramakitShot[] = [];
  let t0 = 0;
  let acc = 0;
  for (const s of shots) {
    cur.push(s);
    acc += s.sec;
    if (acc >= windowS) {
      wins.push({
        t0: Math.round(t0 * 10) / 10,
        t1: Math.round((t0 + acc) * 10) / 10,
        hook: cur.some((x) => isHook(x, longTakeSec)),
      });
      t0 += acc;
      acc = 0;
      cur = [];
    }
  }
  if (cur.length) {
    wins.push({
      t0: Math.round(t0 * 10) / 10,
      t1: Math.round((t0 + acc) * 10) / 10,
      hook: cur.some((x) => isHook(x, longTakeSec)),
    });
  }
  return wins;
}

function schemaFail(message: string): DramakitReport {
  return {
    pass: false,
    verdict: 'FAIL',
    metrics: {
      n: 0,
      totalSec: 0,
      fixedRatio: 0,
      closeMediumRatio: 0,
      coreRatio: 0,
      dialogueRatio: 0,
      hookMissCount: 0,
      profile: 'ai',
      format: 'single',
    },
    findings: [{ code: 'SCHEMA', severity: 'error', message }],
    gates: GATES,
  };
}

function parseShotlist(input: unknown): DramakitShotlist | DramakitReport {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return schemaFail('shotlist must be a JSON object');
  }
  const obj = input as Record<string, unknown>;
  if (!Array.isArray(obj.shots) || obj.shots.length === 0) {
    return schemaFail('shots must be a non-empty array');
  }
  const shots: DramakitShot[] = [];
  for (let i = 0; i < obj.shots.length; i++) {
    const raw = obj.shots[i];
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
      return schemaFail(`shot[${i}] must be an object`);
    }
    const s = raw as Record<string, unknown>;
    if (typeof s.no !== 'number' || !Number.isFinite(s.no)) {
      return schemaFail(`shot[${i}].no must be a number`);
    }
    if (typeof s.sec !== 'number' || !Number.isFinite(s.sec) || s.sec < 0) {
      return schemaFail(`shot[${i}].sec must be a non-negative number`);
    }
    if (typeof s.size !== 'string' || !s.size.trim()) {
      return schemaFail(`shot[${i}].size must be a non-empty string`);
    }
    shots.push({
      no: s.no,
      sec: s.sec,
      size: s.size.trim(),
      move: typeof s.move === 'string' ? s.move : undefined,
      visual: typeof s.visual === 'string' ? s.visual : undefined,
      line: typeof s.line === 'string' ? s.line : undefined,
    });
  }
  const format: DramakitFormat = obj.format === 'series' ? 'series' : 'single';
  const mode: DramakitMode = obj.mode === 'live' ? 'live' : 'ai';
  return { format, mode, shots };
}

/**
 * Evaluate one structured shotlist (dramakit analyze() mechanical semantics).
 */
export function evaluateDramakitShotlist(input: unknown): DramakitReport {
  const parsed = parseShotlist(input);
  if ('findings' in parsed) {
    return parsed as DramakitReport;
  }
  const { format, mode, shots } = parsed;
  const profile = DRAMAKIT_DEFAULTS[mode];
  const dsingle = profile.single;
  const dshot = profile.shot;
  const dq = profile.quality;

  const n = shots.length;
  const totalSec = shots.reduce((sum, s) => sum + s.sec, 0);
  const findings: DramakitFinding[] = [];

  let fixedN = 0;
  let cmN = 0;
  let dlgN = 0;
  let coreN = 0;
  for (const s of shots) {
    if (moveOf(s) === '固定') fixedN += 1;
    if (s.size === '近景' || s.size === '中景') cmN += 1;
    if (hasLine(s)) dlgN += 1;
    if (s.sec >= dshot.core_sec_min && s.sec <= dshot.core_sec_max) coreN += 1;
  }
  const fixedRatio = fixedN / n;
  const closeMediumRatio = cmN / n;
  const dialogueRatio = dlgN / n;
  const coreRatio = coreN / n;

  // 黄金开场：镜 1 不得超长，且不得用旁白交代
  const first = shots[0];
  if (first.sec > dsingle.hook_window_s) {
    findings.push({
      code: 'HOOK_WINDOW_LONG',
      severity: 'error',
      message: `shot 1 = ${first.sec}s exceeds hook_window_s ${dsingle.hook_window_s}s (${mode})`,
      shotNos: [first.no],
    });
  }
  if ((first.line ?? '').includes('旁白')) {
    findings.push({
      code: 'HOOK_WINDOW_NARRATION',
      severity: 'error',
      message: `shot 1 line uses 旁白: ${(first.line ?? '').slice(0, 24)}`,
      shotNos: [first.no],
    });
  }

  // 长镜必须承载内容
  const badLong = shots.filter(
    (s) => s.sec >= dshot.long_take_sec && !hasContent(s),
  );
  if (badLong.length) {
    findings.push({
      code: 'EMPTY_LONG_TAKE',
      severity: 'error',
      message: `empty long take(s) ≥${dshot.long_take_sec}s without content line`,
      shotNos: badLong.map((s) => s.no),
    });
  }

  // 时长 / 镜数（仅 single）
  if (format === 'single') {
    const target = dsingle.target_duration_s;
    const tol = dsingle.duration_tolerance;
    if (Math.abs(totalSec - target) > target * tol) {
      findings.push({
        code: 'DURATION_DRIFT',
        severity: 'warning',
        message: `total ${totalSec}s outside ${target}±${tol * 100}%`,
      });
    }
    if (!(dsingle.shots_min <= n && n <= dsingle.shots_max)) {
      findings.push({
        code: 'SHOT_COUNT',
        severity: 'warning',
        message: `shot count ${n} outside ${dsingle.shots_min}-${dsingle.shots_max} (${mode})`,
      });
    }
  }

  // 结尾：single 余味长镜；series 必须留悬念
  const last = shots[shots.length - 1];
  if (format === 'single') {
    if (last.sec < dshot.long_take_sec) {
      findings.push({
        code: 'ENDING_SHORT',
        severity: 'warning',
        message: `last shot ${last.sec}s < long_take_sec ${dshot.long_take_sec}s`,
        shotNos: [last.no],
      });
    }
  } else if (!hasEndingHook(last)) {
    findings.push({
      code: 'SERIES_ENDING_NO_HOOK',
      severity: 'error',
      message: `series last shot ${last.no} lacks ending-hook (HOOK_LINE/HOOK_VISUAL)`,
      shotNos: [last.no],
    });
  }

  // 镜头语言比例
  if (fixedRatio < dq.fixed_ratio_min) {
    findings.push({
      code: 'FIXED_RATIO_LOW',
      severity: 'warning',
      message: `fixed ratio ${(fixedRatio * 100).toFixed(0)}% < ${dq.fixed_ratio_min * 100}%`,
    });
  }
  if (closeMediumRatio < dq.close_medium_ratio_min) {
    findings.push({
      code: 'CLOSE_MEDIUM_RATIO_LOW',
      severity: 'warning',
      message: `close+medium ratio ${(closeMediumRatio * 100).toFixed(0)}% < ${dq.close_medium_ratio_min * 100}%`,
    });
  }
  if (coreRatio < dshot.core_ratio_min) {
    const span = `${dshot.core_sec_min}-${dshot.core_sec_max}s`;
    findings.push({
      code: 'CORE_RATIO_LOW',
      severity: 'warning',
      message: `core (${span}) ratio ${(coreRatio * 100).toFixed(0)}% < ${dshot.core_ratio_min * 100}%`,
    });
  }
  if (
    !(dq.dialogue_ratio_min <= dialogueRatio && dialogueRatio <= dq.dialogue_ratio_max)
  ) {
    findings.push({
      code: 'DIALOGUE_RATIO',
      severity: 'warning',
      message: `dialogue ratio ${(dialogueRatio * 100).toFixed(0)}% outside ${dq.dialogue_ratio_min * 100}-${dq.dialogue_ratio_max * 100}%`,
    });
  }

  const overReaction = shots.filter(
    (s) =>
      (CLOSE_SIZES as readonly string[]).includes(s.size) &&
      !hasLine(s) &&
      s.sec > dshot.reaction_max_sec,
  );
  if (overReaction.length) {
    findings.push({
      code: 'REACTION_LONG',
      severity: 'warning',
      message: `close reaction without dialogue > ${dshot.reaction_max_sec}s (${mode})`,
      shotNos: overReaction.map((s) => s.no),
    });
  }

  // 钩子密度
  const wins = hookWindows(shots, dq.hook_per_seconds, dshot.long_take_sec);
  const miss = wins.filter((w) => !w.hook);
  if (miss.length) {
    const spans = miss.map((w) => `${w.t0}-${w.t1}s`).join('、');
    findings.push({
      code: 'HOOK_GAP',
      severity: 'warning',
      message: `hook gaps in ${spans} (need ≥1 hook per ${dq.hook_per_seconds}s)`,
    });
  }

  const hasError = findings.some((f) => f.severity === 'error');
  return {
    pass: !hasError,
    verdict: hasError ? 'FAIL' : 'PASS',
    metrics: {
      n,
      totalSec,
      fixedRatio: round3(fixedRatio),
      closeMediumRatio: round3(closeMediumRatio),
      coreRatio: round3(coreRatio),
      dialogueRatio: round3(dialogueRatio),
      hookMissCount: miss.length,
      profile: mode,
      format,
    },
    findings,
    gates: GATES,
  };
}
