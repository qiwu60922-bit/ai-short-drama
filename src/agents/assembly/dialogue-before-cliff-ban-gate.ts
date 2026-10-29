/**
 * V12 · Dialogue-Before-Cliff Ban Gate (悬念前禁对白闸), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《天幕直播》/悬疑揭晓: cliffhanger 落地前 lookback 窗内不得灌对白抢戏，留给反应/画面.
 * Wraps evaluateReactionBeats for schema; FAIL when a cliffhanger has speech ending
 * within lookbackSec before its start (default 8).
 *
 *  SCHEMA (+ child reaction findings)
 *  DIALOGUE_BEFORE_CLIFF (FAIL)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { BEAT_ROLES, type BeatRole } from './hook-structure-gate';
import { speechUnits } from './shot-prompt-gate';
import {
  evaluateReactionBeats,
  type ReactionBeatFinding,
  type ReactionBeatOptions,
  type ReactionBeatReport,
} from './reaction-beat-gate';

export interface DialogueBeforeCliffBanOptions extends ReactionBeatOptions {
  /** Ban dialogue before cliffhanger (default true). */
  banDialogueBeforeCliff?: boolean;
}

export type DialogueBeforeCliffBanFinding = {
  code: 'SCHEMA' | 'DIALOGUE_BEFORE_CLIFF' | ReactionBeatFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface DialogueBeforeCliffBanReport {
  verdict: 'PASS' | 'FAIL';
  metrics: ReactionBeatReport['metrics'] & {
    cliffCount: number;
    dialogueBeforeCliffShots: number;
  };
  findings: DialogueBeforeCliffBanFinding[];
  thresholds: Required<DialogueBeforeCliffBanOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };
const isRole = (v: unknown): v is BeatRole =>
  typeof v === 'string' && (BEAT_ROLES as readonly string[]).includes(v);
const r2 = (n: number) => Math.round(n * 100) / 100;

export function evaluateDialogueBeforeCliffBan(
  shotSpecRaw: unknown,
  opts: DialogueBeforeCliffBanOptions = {},
): DialogueBeforeCliffBanReport {
  const reactionWindowSec = opts.reactionWindowSec ?? 8;
  const lookbackSec = opts.lookbackSec ?? 8;
  const requireReaction = opts.requireReaction ?? false;
  const banDialogueBeforeCliff = opts.banDialogueBeforeCliff ?? true;

  const child = evaluateReactionBeats(shotSpecRaw, {
    reactionWindowSec,
    lookbackSec,
    requireReaction,
  });
  const thresholds: Required<DialogueBeforeCliffBanOptions> = {
    ...child.thresholds,
    banDialogueBeforeCliff,
  };

  const findings: DialogueBeforeCliffBanFinding[] = [
    ...(child.findings as DialogueBeforeCliffBanFinding[]),
  ];

  let cliffCount = 0;
  let dialogueBeforeCliffShots = 0;
  const p = ShotSpecDocSchema.safeParse(shotSpecRaw);
  if (p.success && banDialogueBeforeCliff) {
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
      if (s.role !== 'cliffhanger') continue;
      cliffCount += 1;
      for (const d of shots) {
        if (d.spoken <= 0) continue;
        if (d.end <= s.start && s.start - d.end <= lookbackSec) {
          bad.push(d.id);
        }
      }
    }
    if (bad.length > 0 && !findings.some((f) => f.code === 'SCHEMA')) {
      const uniq = [...new Set(bad)];
      dialogueBeforeCliffShots = uniq.length;
      findings.push({
        code: 'DIALOGUE_BEFORE_CLIFF',
        severity: 'FAIL',
        shotIds: uniq,
        message: `${uniq.length} 镜台词落在 cliffhanger 前 ${r2(lookbackSec)}s 窗内`,
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...child.metrics,
      cliffCount,
      dialogueBeforeCliffShots,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
