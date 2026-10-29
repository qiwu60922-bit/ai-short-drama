/**
 * V12 · Reaction-Before-Cliff × Tail-Cold-Close Dual Gate (悬念前反应 + 冷收尾 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: cliff 前须有反应镜，且尾镜冷收不收 setup.
 * Embeds evaluateReactionBeforeCliff + evaluateTailColdClose; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  CLIFF_NO_PRIOR_REACTION / TAIL_NOT_COLD / SETUP_AFTER_CLIFF (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateReactionBeforeCliff,
  type ReactionBeforeCliffFinding,
  type ReactionBeforeCliffOptions,
  type ReactionBeforeCliffReport,
} from './reaction-before-cliff-gate';
import {
  evaluateTailColdClose,
  type TailColdCloseFinding,
  type TailColdCloseOptions,
} from './tail-cold-close-gate';

export interface ReactionColdCloseOptions extends ReactionBeforeCliffOptions {
  coldTailSec?: number;
}

export type ReactionColdCloseFinding = {
  code: ReactionBeforeCliffFinding['code'] | TailColdCloseFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface ReactionColdCloseReport {
  verdict: 'PASS' | 'FAIL';
  metrics: ReactionBeforeCliffReport['metrics'] & {
    coldTailSec: number;
  };
  findings: ReactionColdCloseFinding[];
  thresholds: Required<ReactionColdCloseOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateReactionColdClose(
  shotSpecRaw: unknown,
  opts: ReactionColdCloseOptions = {},
): ReactionColdCloseReport {
  const rx = evaluateReactionBeforeCliff(shotSpecRaw, opts);
  const coldOpts: TailColdCloseOptions = {
    ...opts,
    coldTailSec: opts.coldTailSec,
  };
  const cold = evaluateTailColdClose(shotSpecRaw, coldOpts);

  const findings: ReactionColdCloseFinding[] = [...(rx.findings as ReactionColdCloseFinding[])];
  for (const f of cold.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'TAIL_NOT_COLD' ||
      f.code === 'SETUP_AFTER_CLIFF' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as ReactionColdCloseFinding);
    }
  }

  const thresholds = {
    ...rx.thresholds,
    coldTailSec: cold.thresholds.coldTailSec,
  } as Required<ReactionColdCloseOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...rx.metrics,
      coldTailSec: cold.metrics.coldTailSec ?? cold.thresholds.coldTailSec,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
