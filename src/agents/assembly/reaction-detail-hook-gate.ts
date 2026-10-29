/**
 * V12 · Reaction-Before-Cliff × Detail-Hook Dual Gate (悬念前反应 + 细节特写钩 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《盛夏芬德拉》/密爽向: cliff 前须有反应镜，同时开钩须 detail_cu.
 * Embeds evaluateReactionBeforeCliff + evaluateDetailHookKind; merges FAIL findings.
 * Invert of detailHookReaction (detail primary → reaction primary).
 *
 *  SCHEMA (+ child findings)
 *  CLIFF_NO_PRIOR_REACTION / DETAIL_HOOK_MISSING (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateReactionBeforeCliff,
  type ReactionBeforeCliffFinding,
  type ReactionBeforeCliffOptions,
  type ReactionBeforeCliffReport,
} from './reaction-before-cliff-gate';
import {
  evaluateDetailHookKind,
  type DetailHookKindFinding,
  type DetailHookKindOptions,
} from './detail-hook-kind-gate';

export interface ReactionDetailHookOptions extends ReactionBeforeCliffOptions {
  requireDetailCu?: boolean;
}

export type ReactionDetailHookFinding = {
  code: ReactionBeforeCliffFinding['code'] | DetailHookKindFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface ReactionDetailHookReport {
  verdict: 'PASS' | 'FAIL';
  metrics: ReactionBeforeCliffReport['metrics'] & {
    detailHookCount: number;
  };
  findings: ReactionDetailHookFinding[];
  thresholds: Required<ReactionDetailHookOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateReactionDetailHook(
  shotSpecRaw: unknown,
  opts: ReactionDetailHookOptions = {},
): ReactionDetailHookReport {
  const reaction = evaluateReactionBeforeCliff(shotSpecRaw, opts);
  const detailOpts: DetailHookKindOptions = {
    ...opts,
    requireDetailCu: opts.requireDetailCu,
  };
  const detail = evaluateDetailHookKind(shotSpecRaw, detailOpts);

  const findings: ReactionDetailHookFinding[] = [...(reaction.findings as ReactionDetailHookFinding[])];
  for (const f of detail.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'DETAIL_HOOK_MISSING' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as ReactionDetailHookFinding);
    }
  }

  const thresholds = {
    ...reaction.thresholds,
    requireDetailCu: detail.thresholds.requireDetailCu,
  } as Required<ReactionDetailHookOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...reaction.metrics,
      detailHookCount: detail.metrics.detailHookCount ?? 0,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
