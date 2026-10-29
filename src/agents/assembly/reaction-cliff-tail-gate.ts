/**
 * V12 · Reaction-Before-Cliff × Cliff-Tail Tight Dual Gate (悬念前反应 + 紧尾悬念 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: cliff 前须有反应镜，且尾窗须卡在最大悬念处.
 * Embeds evaluateReactionBeforeCliff + evaluateCliffTailTight; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  CLIFF_NO_PRIOR_REACTION / CLIFF_TAIL_TIGHT (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateReactionBeforeCliff,
  type ReactionBeforeCliffFinding,
  type ReactionBeforeCliffOptions,
  type ReactionBeforeCliffReport,
} from './reaction-before-cliff-gate';
import {
  evaluateCliffTailTight,
  type CliffTailTightFinding,
  type CliffTailTightOptions,
} from './cliff-tail-tight-gate';

export interface ReactionCliffTailOptions extends ReactionBeforeCliffOptions {
  hardTailToleranceSec?: number;
}

export type ReactionCliffTailFinding = {
  code: ReactionBeforeCliffFinding['code'] | CliffTailTightFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface ReactionCliffTailReport {
  verdict: 'PASS' | 'FAIL';
  metrics: ReactionBeforeCliffReport['metrics'] & {
    hardTailToleranceSec: number;
  };
  findings: ReactionCliffTailFinding[];
  thresholds: Required<ReactionCliffTailOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateReactionCliffTail(
  shotSpecRaw: unknown,
  opts: ReactionCliffTailOptions = {},
): ReactionCliffTailReport {
  const prior = evaluateReactionBeforeCliff(shotSpecRaw, opts);
  const tightOpts: CliffTailTightOptions = {
    ...opts,
    hardTailToleranceSec: opts.hardTailToleranceSec,
  };
  const tight = evaluateCliffTailTight(shotSpecRaw, tightOpts);

  const findings: ReactionCliffTailFinding[] = [...(prior.findings as ReactionCliffTailFinding[])];
  for (const f of tight.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'CLIFF_TAIL_TIGHT' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as ReactionCliffTailFinding);
    }
  }

  const thresholds = {
    ...prior.thresholds,
    hardTailToleranceSec: tight.thresholds.hardTailToleranceSec,
  } as Required<ReactionCliffTailOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...prior.metrics,
      hardTailToleranceSec: tight.metrics.hardTailToleranceSec,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
