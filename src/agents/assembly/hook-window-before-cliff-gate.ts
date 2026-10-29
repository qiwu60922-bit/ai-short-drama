/**
 * V12 · Hook-Window Hard × Dialogue-Before-Cliff Ban Gate (硬钩窗 + 悬念前禁对白 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽/悬疑向: 开场钩窗要紧，且 cliff 前 lookback 内不得灌对白抢戏.
 * Embeds evaluateHookWindowHard + evaluateDialogueBeforeCliffBan; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  HOOK_WINDOW_HARD / DIALOGUE_BEFORE_CLIFF (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateHookWindowHard,
  type HookWindowHardFinding,
  type HookWindowHardOptions,
  type HookWindowHardReport,
} from './hook-window-hard-gate';
import {
  evaluateDialogueBeforeCliffBan,
  type DialogueBeforeCliffBanFinding,
  type DialogueBeforeCliffBanOptions,
} from './dialogue-before-cliff-ban-gate';

export interface HookWindowBeforeCliffOptions extends HookWindowHardOptions {
  banDialogueBeforeCliff?: boolean;
  lookbackSec?: number;
  requireReaction?: boolean;
  reactionWindowSec?: number;
}

export type HookWindowBeforeCliffFinding = {
  code: HookWindowHardFinding['code'] | DialogueBeforeCliffBanFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface HookWindowBeforeCliffReport {
  verdict: 'PASS' | 'FAIL';
  metrics: HookWindowHardReport['metrics'] & {
    cliffCount: number;
    dialogueBeforeCliffShots: number;
  };
  findings: HookWindowBeforeCliffFinding[];
  thresholds: Required<HookWindowBeforeCliffOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateHookWindowBeforeCliff(
  shotSpecRaw: unknown,
  opts: HookWindowBeforeCliffOptions = {},
): HookWindowBeforeCliffReport {
  const hardHookWindowSec = opts.hardHookWindowSec ?? opts.hookWindowSec ?? 2;
  const hard = evaluateHookWindowHard(shotSpecRaw, {
    ...opts,
    hardHookWindowSec,
    hookWindowSec: hardHookWindowSec,
  });
  const banOpts: DialogueBeforeCliffBanOptions = {
    banDialogueBeforeCliff: opts.banDialogueBeforeCliff,
    lookbackSec: opts.lookbackSec,
    requireReaction: opts.requireReaction,
    reactionWindowSec: opts.reactionWindowSec,
  };
  const ban = evaluateDialogueBeforeCliffBan(shotSpecRaw, banOpts);

  const findings: HookWindowBeforeCliffFinding[] = [...(hard.findings as HookWindowBeforeCliffFinding[])];
  for (const f of ban.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'DIALOGUE_BEFORE_CLIFF' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as HookWindowBeforeCliffFinding);
    }
  }

  const thresholds = {
    ...hard.thresholds,
    banDialogueBeforeCliff: ban.thresholds.banDialogueBeforeCliff,
    lookbackSec: ban.thresholds.lookbackSec,
    requireReaction: ban.thresholds.requireReaction,
    reactionWindowSec: ban.thresholds.reactionWindowSec,
  } as Required<HookWindowBeforeCliffOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...hard.metrics,
      cliffCount: ban.metrics.cliffCount,
      dialogueBeforeCliffShots: ban.metrics.dialogueBeforeCliffShots,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
