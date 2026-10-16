/**
 * V12 · Conflict Payoff Gap Gate (冲突→兑现间隔闸门), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text breakdowns of 2026-10-16 红果 hits (structure only, no footage):
 *  - 《帐中香》: 配角挑衅当场反噬，主角绝不受隔夜气（冲突兑现 ≤1 集）。
 *  - 《东北后妈，整顿全家》: 自闭厌食/恋爱脑/杀猪盘等家庭矛盾，用铁锅炖肉/掏粪勺/杀猪刀对症快速兑现。
 *  - 《公路求生榜一说她要走到公路尽头》: 重生绝境后首杀、榜一兑现来得极早（短间隔）。
 *
 * Distinct from foreshadow-ledger-gate: 伏笔要发酵（minFermentEps），冲突要快兑现（maxGapEpisodes）。
 *
 *  SCHEMA (FAIL)                 ledger fails ConflictPayoffLedgerSchema
 *  DUP_ID (FAIL)                 conflict id duplicated
 *  PAYOFF_BEFORE_OPEN (FAIL)     payoffEp/atSec earlier than open
 *  FUTURE_EP (FAIL)              openEp / payoffEp beyond latestEp
 *  CONFLICT_GAP_EPISODES (FAIL)  payoffEp - openEp > maxGapEpisodes (default 1)
 *  CONFLICT_GAP_SEC (FAIL)       same ep and both atSec set, gap > maxSameEpGapSec (default 60)
 *  CONFLICT_OPEN (FAIL)          no payoff and latestEp - openEp > maxGapEpisodes (overdue)
 *  OPEN_PENDING (WARN)           no payoff but still inside the maxGap window
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';

const Ep = z.number().int().positive();
const Sec = z.number().nonnegative().optional();

export const ConflictEntrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  openEp: Ep,
  openAtSec: Sec,
  payoffEp: Ep.optional(),
  payoffAtSec: Sec,
  note: z.string().optional(),
});

export const ConflictPayoffLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  conflicts: z.array(ConflictEntrySchema),
});

export type ConflictPayoffLedger = z.infer<typeof ConflictPayoffLedgerSchema>;

export interface ConflictPayoffOptions {
  maxGapEpisodes?: number;
  maxSameEpGapSec?: number;
}

export const CONFLICT_PAYOFF_DEFAULTS: Required<ConflictPayoffOptions> = {
  maxGapEpisodes: 1,
  maxSameEpGapSec: 60,
};

export type ConflictPayoffFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'PAYOFF_BEFORE_OPEN'
    | 'FUTURE_EP'
    | 'CONFLICT_GAP_EPISODES'
    | 'CONFLICT_GAP_SEC'
    | 'CONFLICT_OPEN'
    | 'OPEN_PENDING';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface ConflictPayoffReport {
  verdict: 'PASS' | 'FAIL';
  metrics: { total: number; paid: number; open: number; overdue: number; latestEp: number };
  findings: ConflictPayoffFinding[];
  thresholds: Required<ConflictPayoffOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateConflictPayoffGap(
  input: unknown,
  opts: ConflictPayoffOptions = {},
): ConflictPayoffReport {
  const thresholds = { ...CONFLICT_PAYOFF_DEFAULTS, ...opts };
  const parsed = ConflictPayoffLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { total: 0, paid: 0, open: 0, overdue: 0, latestEp: 0 },
      findings: [
        {
          code: 'SCHEMA',
          severity: 'FAIL',
          message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        },
      ],
      thresholds,
      gates: GATES,
    };
  }

  const { latestEp, conflicts } = parsed.data;
  const findings: ConflictPayoffFinding[] = [];
  const push = (x: ConflictPayoffFinding) => findings.push(x);

  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const c of conflicts) {
    if (seen.has(c.id)) dups.add(c.id);
    else seen.add(c.id);
  }
  for (const id of dups) {
    push({
      code: 'DUP_ID',
      severity: 'FAIL',
      ids: [id],
      message: `冲突ID重复：${id}`,
      fix: '冲突ID是兑现指针的主键，改成唯一ID',
    });
  }

  let paid = 0;
  let open = 0;
  let overdue = 0;

  for (const c of conflicts) {
    if (c.openEp > latestEp || (c.payoffEp !== undefined && c.payoffEp > latestEp)) {
      push({
        code: 'FUTURE_EP',
        severity: 'FAIL',
        ids: [c.id],
        message: `${c.id} 开冲突/兑现集超出 latestEp=E${latestEp}`,
        fix: '改 openEp/payoffEp，或上调 latestEp',
      });
    }

    if (c.payoffEp === undefined) {
      open += 1;
      const gap = latestEp - c.openEp;
      if (gap > thresholds.maxGapEpisodes) {
        overdue += 1;
        push({
          code: 'CONFLICT_OPEN',
          severity: 'FAIL',
          ids: [c.id],
          message: `${c.id} 开于 E${c.openEp}，已过 ${gap} 集仍无兑现（上限 ${thresholds.maxGapEpisodes}）`,
          fix: '补 payoffEp，或拆成更小的可当场反噬冲突',
        });
      } else {
        push({
          code: 'OPEN_PENDING',
          severity: 'WARN',
          ids: [c.id],
          message: `${c.id} 开于 E${c.openEp}，尚未兑现（窗口内）`,
          fix: '计划在 ≤maxGapEpisodes 内写 payoffEp',
        });
      }
      continue;
    }

    paid += 1;

    if (c.payoffEp < c.openEp) {
      push({
        code: 'PAYOFF_BEFORE_OPEN',
        severity: 'FAIL',
        ids: [c.id],
        message: `${c.id} 兑现 E${c.payoffEp} 早于开冲突 E${c.openEp}`,
        fix: '兑现不能早于开冲突',
      });
      continue;
    }

    if (
      c.payoffEp === c.openEp &&
      c.openAtSec !== undefined &&
      c.payoffAtSec !== undefined &&
      c.payoffAtSec < c.openAtSec
    ) {
      push({
        code: 'PAYOFF_BEFORE_OPEN',
        severity: 'FAIL',
        ids: [c.id],
        message: `${c.id} 同集内兑现 ${c.payoffAtSec}s 早于开冲突 ${c.openAtSec}s`,
        fix: '同集内 payoffAtSec ≥ openAtSec',
      });
      continue;
    }

    const epGap = c.payoffEp - c.openEp;
    if (epGap > thresholds.maxGapEpisodes) {
      push({
        code: 'CONFLICT_GAP_EPISODES',
        severity: 'FAIL',
        ids: [c.id],
        message: `${c.id} 冲突间隔 ${epGap} 集 > ${thresholds.maxGapEpisodes}（不受隔夜气）`,
        fix: '把兑现提前到开冲突当集或下一集，或拆冲突',
      });
    }

    if (
      c.payoffEp === c.openEp &&
      c.openAtSec !== undefined &&
      c.payoffAtSec !== undefined
    ) {
      const secGap = c.payoffAtSec - c.openAtSec;
      if (secGap > thresholds.maxSameEpGapSec) {
        push({
          code: 'CONFLICT_GAP_SEC',
          severity: 'FAIL',
          ids: [c.id],
          message: `${c.id} 同集间隔 ${secGap}s > ${thresholds.maxSameEpGapSec}s`,
          fix: '把反噬镜头提前，或缩短开冲突到兑现之间的铺垫',
        });
      }
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { total: conflicts.length, paid, open, overdue, latestEp },
    findings,
    thresholds,
    gates: GATES,
  };
}
