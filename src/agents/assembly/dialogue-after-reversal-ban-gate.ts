/**
 * V12 · Dialogue-After-Reversal Ban Gate (反转后禁对白闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《天幕直播》/悬疑揭晓: 反转落地后 lookforward 窗内留给反应/画面，不得立刻灌对白抢戏.
 * Wraps evaluateReactionAfterReversal; FAIL when speech starts within lookforwardSec
 * after a reversal ends (default 6).
 *
 *  SCHEMA (+ child findings)
 *  DIALOGUE_AFTER_REVERSAL (FAIL)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { BEAT_ROLES, type BeatRole } from './hook-structure-gate';
import { speechUnits } from './shot-prompt-gate';
import {
  evaluateReactionAfterReversal,
  type ReactionAfterReversalFinding,
  type ReactionAfterReversalOptions,
  type ReactionAfterReversalReport,
} from './reaction-after-reversal-gate';

export interface DialogueAfterReversalBanOptions extends ReactionAfterReversalOptions {
  /** Ban dialogue after reversal (default true). */
  banDialogueAfterReversal?: boolean;
  /** Seconds after reversal end that must stay dialogue-free (default 6). */
  lookforwardSec?: number;
}

export type DialogueAfterReversalBanFinding = {
  code: 'SCHEMA' | 'DIALOGUE_AFTER_REVERSAL' | ReactionAfterReversalFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface DialogueAfterReversalBanReport {
  verdict: 'PASS' | 'FAIL';
  metrics: ReactionAfterReversalReport['metrics'] & {
    dialogueAfterReversalShots: number;
    lookforwardSec: number;
  };
  findings: DialogueAfterReversalBanFinding[];
  thresholds: Required<DialogueAfterReversalBanOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };
const isRole = (v: unknown): v is BeatRole =>
  typeof v === 'string' && (BEAT_ROLES as readonly string[]).includes(v);
const r2 = (n: number) => Math.round(n * 100) / 100;

export function evaluateDialogueAfterReversalBan(
  shotSpecRaw: unknown,
  opts: DialogueAfterReversalBanOptions = {},
): DialogueAfterReversalBanReport {
  const reactionWindowSec = opts.reactionWindowSec ?? 8;
  const lookbackSec = opts.lookbackSec ?? 12;
  const requireReaction = opts.requireReaction ?? false;
  const reversalOnly = opts.reversalOnly ?? true;
  const banDialogueAfterReversal = opts.banDialogueAfterReversal ?? true;
  const lookforwardSec = opts.lookforwardSec ?? 6;

  const child = evaluateReactionAfterReversal(shotSpecRaw, {
    reactionWindowSec,
    lookbackSec,
    requireReaction,
    reversalOnly,
  });
  const thresholds: Required<DialogueAfterReversalBanOptions> = {
    ...child.thresholds,
    banDialogueAfterReversal,
    lookforwardSec,
  };

  const findings: DialogueAfterReversalBanFinding[] = [
    ...(child.findings as DialogueAfterReversalBanFinding[]),
  ];

  let dialogueAfterReversalShots = 0;
  const p = ShotSpecDocSchema.safeParse(shotSpecRaw);
  if (p.success && banDialogueAfterReversal) {
    let clock = 0;
    const shots = p.data.shots.map((s) => {
      const start = clock;
      clock += s.durSec;
      const raw = (s as { beatRole?: unknown }).beatRole;
      const spoken =
        speechUnits((s as { dialogue?: string | string[] | null }).dialogue) +
        speechUnits((s as { vo?: string | string[] | null }).vo ?? null);
      return {
        id: s.shotId,
        start,
        end: clock,
        role: isRole(raw) ? raw : undefined,
        spoken,
      };
    });

    const bad: string[] = [];
    for (const s of shots) {
      if (s.role !== 'reversal') continue;
      for (const d of shots) {
        if (d.spoken <= 0) continue;
        if (d.start >= s.end && d.start - s.end <= lookforwardSec) {
          bad.push(d.id);
        }
      }
    }
    if (bad.length > 0 && !findings.some((f) => f.code === 'SCHEMA')) {
      const uniq = [...new Set(bad)];
      dialogueAfterReversalShots = uniq.length;
      findings.push({
        code: 'DIALOGUE_AFTER_REVERSAL',
        severity: 'FAIL',
        shotIds: uniq,
        message: `${uniq.length} 镜台词落在 reversal 后 ${r2(lookforwardSec)}s 窗内`,
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...child.metrics,
      dialogueAfterReversalShots,
      lookforwardSec,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
