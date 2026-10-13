/**
 * V12 · Dialogue Exposition Gate (台词带过剧情闸门), pre-generation, offline.
 *
 * Reverse-engineered from public text criticism of 2026-10 红果 hit 《不候，过期离婚》:
 * mid-episode plot jumps ("几句台词带过时空穿梭救女主") must not pass as story increments.
 * A shot tagged hook / increment / reversal that carries spoken content but lacks a concrete
 * visual action is FAIL. Untagged dialogue-heavy mid shots are WARN only.
 *
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { speechUnits } from './shot-prompt-gate';

export const PLOT_ROLES = ['hook', 'increment', 'reversal'] as const;
export type PlotRole = (typeof PLOT_ROLES)[number];

export interface DialogueExpositionOptions {
  /** Minimum trimmed action characters to count as a visible event (default 8). */
  minActionChars?: number;
  /** Mid-window fraction for unlabeled exposition WARN (default 0.2–0.8). */
  midWindow?: [number, number];
  /** Spoken units above this in an untagged mid shot trigger WARN (default 12). */
  unlabeledSpeechMin?: number;
}

export type DialogueExpositionFinding = {
  code: 'SCHEMA' | 'DIALOGUE_ONLY_PLOT' | 'EXPOSITION_UNLABELED';
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface DialogueExpositionReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    totalSeconds: number;
    plotShots: number;
    dialogueOnlyPlotShots: number;
    unlabeledExpositionShots: number;
  };
  findings: DialogueExpositionFinding[];
  thresholds: Required<DialogueExpositionOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const joinText = (v: unknown) => (Array.isArray(v) ? v.join(' ') : typeof v === 'string' ? v : '');
const isPlot = (v: unknown): v is PlotRole =>
  typeof v === 'string' && (PLOT_ROLES as readonly string[]).includes(v);

export function evaluateDialogueExposition(
  shotSpecRaw: unknown,
  opts: DialogueExpositionOptions = {},
): DialogueExpositionReport {
  const t: Required<DialogueExpositionOptions> = {
    minActionChars: opts.minActionChars ?? 8,
    midWindow: opts.midWindow ?? [0.2, 0.8],
    unlabeledSpeechMin: opts.unlabeledSpeechMin ?? 12,
  };
  const gates = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };
  const p = ShotSpecDocSchema.safeParse(shotSpecRaw);
  if (!p.success) {
    return {
      verdict: 'FAIL',
      thresholds: t,
      gates,
      metrics: { totalSeconds: 0, plotShots: 0, dialogueOnlyPlotShots: 0, unlabeledExpositionShots: 0 },
      findings: [
        {
          code: 'SCHEMA',
          severity: 'FAIL',
          message: p.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        },
      ],
    };
  }

  let clock = 0;
  const shots = p.data.shots.map((s) => {
    const start = clock;
    clock += s.durSec;
    const action = typeof s.action === 'string' ? s.action.trim() : '';
    const spoken = speechUnits(s.dialogue) + speechUnits(s.vo ?? null);
    const roleRaw = (s as { beatRole?: unknown }).beatRole;
    return {
      id: s.shotId,
      dur: s.durSec,
      start,
      end: clock,
      action,
      spoken,
      role: isPlot(roleRaw) ? roleRaw : undefined,
      hasRole: roleRaw !== undefined && roleRaw !== null,
    };
  });
  const total = clock;
  const findings: DialogueExpositionFinding[] = [];

  const dialogueOnly: string[] = [];
  for (const s of shots) {
    if (!s.role || s.spoken <= 0) continue;
    if (s.action.length < t.minActionChars) dialogueOnly.push(s.id);
  }
  if (dialogueOnly.length) {
    findings.push({
      code: 'DIALOGUE_ONLY_PLOT',
      severity: 'FAIL',
      message: `plot beat (hook/increment/reversal) carried by dialogue/VO without a concrete visual action (≥${t.minActionChars} chars); 中段增量须是可感知事件，不能用台词糊`,
      shotIds: dialogueOnly,
    });
  }

  const [lo, hi] = [total * t.midWindow[0], total * t.midWindow[1]];
  const unlabeled = shots.filter(
    (s) =>
      !s.hasRole &&
      s.spoken >= t.unlabeledSpeechMin &&
      s.action.length < t.minActionChars &&
      s.start < hi &&
      s.end > lo,
  );
  if (unlabeled.length) {
    findings.push({
      code: 'EXPOSITION_UNLABELED',
      severity: 'WARN',
      message: `${unlabeled.length} mid-episode dialogue-heavy shots lack beatRole and visual action (可能是台词带过剧情)`,
      shotIds: unlabeled.map((s) => s.id),
    });
  }

  const plotShots = shots.filter((s) => s.role).length;
  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      totalSeconds: r2(total),
      plotShots,
      dialogueOnlyPlotShots: dialogueOnly.length,
      unlabeledExpositionShots: unlabeled.length,
    },
    findings,
    thresholds: t,
    gates,
  };
}
