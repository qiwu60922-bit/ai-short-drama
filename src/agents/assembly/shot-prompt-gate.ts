/**
 * V12 · Shot Prompt Gate (提示词出门闸门 + 导演五线), pre-generation, offline, pure function.
 *
 * Gates the exact per-shot prompt that `buildShotPrompt` would send to H3, before any (paid) generation.
 * Adapted — re-implemented in TS, no code copied verbatim — from two MIT-licensed skills (scouted 2026-10-13):
 *  - 2395300049-sys/anti-prompt · scripts/check_prompt_gates.py (MIT): 1900 字安全线 / 2000 字硬上限,
 *    流程管理违禁词 (model-unexecutable process words), 台词估时 5 字/秒 + 1 秒停顿, 自然语速 3–6 字/秒.
 *  - workerpro666-ctrl/aigc-director-five-lines · SKILL.md (MIT): 动作/情绪/摄影/视觉/剪辑 five-line completeness
 *    before a final prompt is allowed (Stage A only; the Seedance translator Stage B is NOT adopted).
 *
 * Findings:
 *  SCHEMA (FAIL)              ShotSpec does not parse
 *  PROMPT_HARD_LIMIT (FAIL)   built prompt > hardChars (default 2000)
 *  PROMPT_NEAR_LIMIT (WARN)   built prompt in (safeChars, hardChars] (default 1900)
 *  PROCESS_TERM (FAIL)        a process-management phrase leaked into the prompt (model cannot execute it)
 *  DIALOGUE_TOO_FAST (FAIL)   dialogue+VO speech units / durSec > maxUnitsPerSec (default 6)
 *  DIALOGUE_TIGHT (WARN)      units / estUnitsPerSec + pauseSec > durSec (default 5/s + 1s)
 *  FIVE_LINES_MISSING (WARN|FAIL with strictFiveLines)  a director line has no field evidence:
 *      动作=action · 情绪=emotion|state · 摄影=camera · 视觉=visual|refs[]|primaryRef · 剪辑=cutMotive (first shot exempt)
 * Engineering gate only: PASS ≠ Final ≠ G3. It never writes g3 and never upgrades a human lock.
 */
import { ShotSpecDocSchema, buildShotPrompt } from './beatplan-to-multishot';

export const DEFAULT_PROCESS_TERMS = [
  '接下一大分镜', '接下一段', '承接下一段', '接分镜2', '无则删除', '未启用', '不继承上一场',
  '换场景后默认普通衔接', '不使用上一场', '如果没有则删除', '本段未启用', '全局控制：9:16', '全局控制：16:9',
] as const;

export const FIVE_LINES = ['动作', '情绪', '摄影', '视觉', '剪辑'] as const;
export type FiveLine = (typeof FIVE_LINES)[number];

export interface ShotPromptGateOptions {
  safeChars?: number;
  hardChars?: number;
  maxUnitsPerSec?: number;
  estUnitsPerSec?: number;
  pauseSec?: number;
  strictFiveLines?: boolean;
  /** Same hardBans the converter appends, so the gate measures the prompt actually sent. */
  hardBans?: string[];
  processTerms?: readonly string[];
}

export type ShotPromptFinding = {
  code: 'SCHEMA' | 'PROMPT_HARD_LIMIT' | 'PROMPT_NEAR_LIMIT' | 'PROCESS_TERM' | 'DIALOGUE_TOO_FAST' | 'DIALOGUE_TIGHT' | 'FIVE_LINES_MISSING';
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface ShotPromptRow {
  shotId: string;
  durSec: number;
  promptChars: number;
  speechUnits: number;
  unitsPerSec: number;
  estSpeechSec: number;
  processTerms: string[];
  missingLines: FiveLine[];
}

export interface ShotPromptReport {
  verdict: 'PASS' | 'FAIL';
  shots: ShotPromptRow[];
  findings: ShotPromptFinding[];
  thresholds: Required<Omit<ShotPromptGateOptions, 'hardBans' | 'processTerms'>>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const has = (v: unknown) => (typeof v === 'string' ? v.trim().length > 0 : Array.isArray(v) ? v.length > 0 : v != null && v !== false);
const joinText = (v: unknown) => (Array.isArray(v) ? v.join(' ') : typeof v === 'string' ? v : '');

/** Spoken units: each Han/kana character counts 1, each latin/number word counts 1, punctuation counts 0. */
export function speechUnits(text: string | string[] | null | undefined): number {
  const t = joinText(text);
  const cjk = t.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu)?.length ?? 0;
  const words = t.match(/[A-Za-z0-9]+(?:'[A-Za-z]+)?/g)?.length ?? 0;
  return cjk + words;
}

export function evaluateShotPrompts(shotSpecRaw: unknown, opts: ShotPromptGateOptions = {}): ShotPromptReport {
  const thresholds = {
    safeChars: opts.safeChars ?? 1900,
    hardChars: opts.hardChars ?? 2000,
    maxUnitsPerSec: opts.maxUnitsPerSec ?? 6,
    estUnitsPerSec: opts.estUnitsPerSec ?? 5,
    pauseSec: opts.pauseSec ?? 1,
    strictFiveLines: opts.strictFiveLines ?? false,
  };
  const terms = opts.processTerms ?? DEFAULT_PROCESS_TERMS;
  const gates = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };
  const p = ShotSpecDocSchema.safeParse(shotSpecRaw);
  if (!p.success) {
    return {
      verdict: 'FAIL', shots: [], thresholds, gates,
      findings: [{ code: 'SCHEMA', severity: 'FAIL', message: p.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') }],
    };
  }

  const rows: ShotPromptRow[] = p.data.shots.map((s, i) => {
    const x = s as Record<string, unknown>;
    const prompt = buildShotPrompt(s, opts.hardBans ?? []);
    const units = speechUnits(joinText(s.dialogue)) + speechUnits(s.vo ?? null);
    const missing: FiveLine[] = [];
    if (!has(x.action)) missing.push('动作');
    if (!has(x.emotion) && !has(x.state)) missing.push('情绪');
    if (!has(x.camera)) missing.push('摄影');
    if (!has(x.visual) && !has(x.refs) && !has(x.primaryRef)) missing.push('视觉');
    if (i > 0 && !has(x.cutMotive)) missing.push('剪辑');
    return {
      shotId: s.shotId,
      durSec: s.durSec,
      promptChars: [...prompt].length,
      speechUnits: units,
      unitsPerSec: r2(units / s.durSec),
      estSpeechSec: units ? r2(units / thresholds.estUnitsPerSec + thresholds.pauseSec) : 0,
      processTerms: terms.filter((t) => prompt.includes(t)),
      missingLines: missing,
    };
  });

  const findings: ShotPromptFinding[] = [];
  const add = (code: ShotPromptFinding['code'], severity: ShotPromptFinding['severity'], pick: (r: ShotPromptRow) => boolean, msg: (ids: ShotPromptRow[]) => string) => {
    const hit = rows.filter(pick);
    if (hit.length) findings.push({ code, severity, message: msg(hit), shotIds: hit.map((r) => r.shotId) });
  };
  add('PROMPT_HARD_LIMIT', 'FAIL', (r) => r.promptChars > thresholds.hardChars,
    (h) => `prompt > ${thresholds.hardChars} chars: ${h.map((r) => `${r.shotId}=${r.promptChars}`).join(', ')}; split the shot or compress`);
  add('PROMPT_NEAR_LIMIT', 'WARN', (r) => r.promptChars > thresholds.safeChars && r.promptChars <= thresholds.hardChars,
    (h) => `prompt in ${thresholds.safeChars + 1}–${thresholds.hardChars} chars: ${h.map((r) => `${r.shotId}=${r.promptChars}`).join(', ')}`);
  add('PROCESS_TERM', 'FAIL', (r) => r.processTerms.length > 0,
    (h) => `process-management phrases in prompt: ${h.map((r) => `${r.shotId}[${r.processTerms.join('|')}]`).join(', ')}`);
  add('DIALOGUE_TOO_FAST', 'FAIL', (r) => r.unitsPerSec > thresholds.maxUnitsPerSec,
    (h) => `speech > ${thresholds.maxUnitsPerSec}/s: ${h.map((r) => `${r.shotId}=${r.speechUnits}/${r.durSec}s`).join(', ')}`);
  add('DIALOGUE_TIGHT', 'WARN', (r) => r.unitsPerSec <= thresholds.maxUnitsPerSec && r.estSpeechSec > r.durSec,
    (h) => `speech needs ~${thresholds.estUnitsPerSec}/s + ${thresholds.pauseSec}s pause: ${h.map((r) => `${r.shotId} ${r.estSpeechSec}s>${r.durSec}s`).join(', ')}`);
  add('FIVE_LINES_MISSING', thresholds.strictFiveLines ? 'FAIL' : 'WARN', (r) => r.missingLines.length > 0,
    (h) => `director five lines incomplete: ${h.map((r) => `${r.shotId}[${r.missingLines.join('')}]`).join(', ')}`);

  return { verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS', shots: rows, findings, thresholds, gates };
}
