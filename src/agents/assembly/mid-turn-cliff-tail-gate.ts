/**
 * V12 · Mid-Turn Density × Cliff-Tail Tight Dual Gate (中段密度 + 紧尾悬念 双闸),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 中段反转够密，且尾窗须卡在最大悬念处.
 * Embeds evaluateMidTurnDensity + evaluateCliffTailTight; merges FAIL findings.
 *
 *  SCHEMA (+ child findings)
 *  MID_TURN_SPARSE / CLIFF_TAIL_TIGHT (from children)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import {
  evaluateMidTurnDensity,
  type MidTurnDensityFinding,
  type MidTurnDensityOptions,
  type MidTurnDensityReport,
} from './mid-turn-density-gate';
import {
  evaluateCliffTailTight,
  type CliffTailTightFinding,
  type CliffTailTightOptions,
} from './cliff-tail-tight-gate';

export interface MidTurnCliffTailOptions extends MidTurnDensityOptions {
  hardTailToleranceSec?: number;
}

export type MidTurnCliffTailFinding = {
  code: MidTurnDensityFinding['code'] | CliffTailTightFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface MidTurnCliffTailReport {
  verdict: 'PASS' | 'FAIL';
  metrics: MidTurnDensityReport['metrics'] & {
    hardTailToleranceSec: number;
  };
  findings: MidTurnCliffTailFinding[];
  thresholds: Required<MidTurnCliffTailOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

export function evaluateMidTurnCliffTail(
  shotSpecRaw: unknown,
  opts: MidTurnCliffTailOptions = {},
): MidTurnCliffTailReport {
  const dens = evaluateMidTurnDensity(shotSpecRaw, opts);
  const tightOpts: CliffTailTightOptions = {
    ...opts,
    hardTailToleranceSec: opts.hardTailToleranceSec,
  };
  const tight = evaluateCliffTailTight(shotSpecRaw, tightOpts);

  const findings: MidTurnCliffTailFinding[] = [...(dens.findings as MidTurnCliffTailFinding[])];
  for (const f of tight.findings) {
    if (findings.some((x) => x.code === f.code && x.message === f.message)) continue;
    if (
      f.code === 'SCHEMA' ||
      f.code === 'CLIFF_TAIL_TIGHT' ||
      !findings.some((x) => x.code === f.code)
    ) {
      findings.push(f as MidTurnCliffTailFinding);
    }
  }

  const thresholds = {
    ...dens.thresholds,
    hardTailToleranceSec: tight.thresholds.hardTailToleranceSec,
  } as Required<MidTurnCliffTailOptions>;

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...dens.metrics,
      hardTailToleranceSec: tight.metrics.hardTailToleranceSec,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
