/**
 * V12 · Cliff-Tail Tight × Dialogue-Before-Cliff Ban Gate (悬念尾窗 + 禁对白 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《万妖图录》/悬疑揭晓: 尾窗紧卡悬念，且 cliff 前 lookback 不得灌对白.
 * Embeds evaluateCliffTailTight + evaluateDialogueBeforeCliffBan; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  CLIFF_TAIL_TIGHT / DIALOGUE_BEFORE_CLIFF (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateCliffTailTight,
  type CliffTailTightFinding,
  type CliffTailTightOptions,
  type CliffTailTightReport,
} from './cliff-tail-tight-gate';
import {
  evaluateDialogueBeforeCliffBan,
  type DialogueBeforeCliffBanFinding,
  type DialogueBeforeCliffBanOptions,
} from './dialogue-before-cliff-ban-gate';

export interface CliffTailDialogueBanOptions extends CliffTailTightOptions {
  banDialogueBeforeCliff?: boolean;
  reactionWindowSec?: number;
  lookbackSec?: number;
  requireReaction?: boolean;
}

export type CliffTailDialogueBanFinding = {
  code: CliffTailTightFinding['code'] | DialogueBeforeCliffBanFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface CliffTailDialogueBanReport {
  verdict: 'PASS' | 'FAIL';
  metrics: CliffTailTightReport['metrics'] & {
    cliffCount: number;
    dialogueBeforeCliffShots: number;
  };
  findings: CliffTailDialogueBanFinding[];
  thresholds: Required<CliffTailDialogueBanOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateCliffTailDialogueBan(
  shotSpecRaw: unknown,
  opts: CliffTailDialogueBanOptions = {},
): CliffTailDialogueBanReport {
  const hardTailToleranceSec = opts.hardTailToleranceSec ?? opts.tailToleranceSec ?? 1.5;
  const banDialogueBeforeCliff = opts.banDialogueBeforeCliff ?? true;
  const reactionWindowSec = opts.reactionWindowSec ?? 8;
  const lookbackSec = opts.lookbackSec ?? 8;
  const requireReaction = opts.requireReaction ?? false;

  const cliff = evaluateCliffTailTight(shotSpecRaw, {
    ...opts,
    hardTailToleranceSec,
    tailToleranceSec: hardTailToleranceSec,
  });

  const banOpts: DialogueBeforeCliffBanOptions = {
    banDialogueBeforeCliff,
    reactionWindowSec,
    lookbackSec,
    requireReaction,
  };
  const ban = evaluateDialogueBeforeCliffBan(shotSpecRaw, banOpts);

  const findings: CliffTailDialogueBanFinding[] = [
    ...(cliff.findings as CliffTailDialogueBanFinding[]),
  ];
  for (const f of ban.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'DIALOGUE_BEFORE_CLIFF' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as CliffTailDialogueBanFinding);
    }
  }

  const thresholds: Required<CliffTailDialogueBanOptions> = {
    ...cliff.thresholds,
    banDialogueBeforeCliff,
    reactionWindowSec,
    lookbackSec,
    requireReaction,
  };

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...cliff.metrics,
      cliffCount: ban.metrics.cliffCount,
      dialogueBeforeCliffShots: ban.metrics.dialogueBeforeCliffShots,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
