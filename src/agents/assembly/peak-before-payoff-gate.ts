/**
 * V12 · Peak-Before-Payoff / Deferred-Revenge Gate (巅峰后再兑现), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text breakdowns of 2026-10-22～10-23 hits (structure only, no footage):
 *  - 《卖掉养老房那天，我重获新生》: 被逼腾房→卖房蓄势→公开清算（对手处于占便宜/嫌弃峰值时再兑现）.
 *  - 《婆婆装瘫七年，我高调离婚！》(昨日候选): 发现骗局后不吵不闹，等丈夫升副院长站到最高处再清算.
 *  - 《和离后我带女儿横扫魔域》: 身份底牌留到羞辱/对峙峰值才揭，羞辱量级才够.
 *
 * Opposite of conflict-payoff-gap-gate「要快兑现 / 不受隔夜气」:
 * deferred revenge MAY span many episodes; what MUST hold is peakEp ≤ payoffEp (and peakLabel present).
 *
 *  SCHEMA (FAIL)                 ledger fails PeakBeforePayoffLedgerSchema
 *  DUP_ID (FAIL)                 entry id duplicated
 *  FUTURE_EP (FAIL)              open/peak/payoff beyond latestEp
 *  PAYOFF_BEFORE_OPEN (FAIL)     payoff earlier than open
 *  PEAK_BEFORE_OPEN (FAIL)       peak earlier than open
 *  PAYOFF_WITHOUT_PEAK (FAIL)    payoff set but peakEp missing
 *  PEAK_LABEL_MISSING (FAIL)     peakEp set but peakLabel empty
 *  PEAK_AFTER_PAYOFF (FAIL)      peak after payoff (ep or same-ep sec)
 *  OPEN_PENDING (WARN)           no payoff yet (蓄仇中)
 *  NO_PEAK_PLAN (WARN)           open and no peakEp planned yet
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';

const Ep = z.number().int().positive();
const Sec = z.number().nonnegative().optional();

export const PeakBeforePayoffEntrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  openEp: Ep,
  openAtSec: Sec,
  /** Episode when opponent / situation hits the peak that makes payoff land. */
  peakEp: Ep.optional(),
  peakAtSec: Sec,
  /** Human-readable peak marker, e.g. 「升副院长」「订婚宴嫌弃」. Required when peakEp set. */
  peakLabel: z.string().min(1).optional(),
  payoffEp: Ep.optional(),
  payoffAtSec: Sec,
  note: z.string().optional(),
});

export const PeakBeforePayoffLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  entries: z.array(PeakBeforePayoffEntrySchema),
});

export type PeakBeforePayoffLedger = z.infer<typeof PeakBeforePayoffLedgerSchema>;

export interface PeakBeforePayoffOptions {
  /** Minimum episodes from peak to payoff; 0 = same ep allowed. */
  minPeakToPayoffEps?: number;
}

export const PEAK_BEFORE_PAYOFF_DEFAULTS: Required<PeakBeforePayoffOptions> = {
  minPeakToPayoffEps: 0,
};

export type PeakBeforePayoffFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'FUTURE_EP'
    | 'PAYOFF_BEFORE_OPEN'
    | 'PEAK_BEFORE_OPEN'
    | 'PAYOFF_WITHOUT_PEAK'
    | 'PEAK_LABEL_MISSING'
    | 'PEAK_AFTER_PAYOFF'
    | 'OPEN_PENDING'
    | 'NO_PEAK_PLAN';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface PeakBeforePayoffReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    total: number;
    paid: number;
    open: number;
    withPeak: number;
    latestEp: number;
  };
  findings: PeakBeforePayoffFinding[];
  thresholds: Required<PeakBeforePayoffOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluatePeakBeforePayoff(
  input: unknown,
  opts: PeakBeforePayoffOptions = {},
): PeakBeforePayoffReport {
  const thresholds = { ...PEAK_BEFORE_PAYOFF_DEFAULTS, ...opts };
  const parsed = PeakBeforePayoffLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { total: 0, paid: 0, open: 0, withPeak: 0, latestEp: 0 },
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

  const { latestEp, entries } = parsed.data;
  const findings: PeakBeforePayoffFinding[] = [];
  const push = (x: PeakBeforePayoffFinding) => findings.push(x);

  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const e of entries) {
    if (seen.has(e.id)) dups.add(e.id);
    else seen.add(e.id);
  }
  for (const id of dups) {
    push({
      code: 'DUP_ID',
      severity: 'FAIL',
      ids: [id],
      message: `蓄仇ID重复：${id}`,
      fix: '蓄仇条目 ID 是巅峰/兑现指针主键，改成唯一 ID',
    });
  }

  let paid = 0;
  let open = 0;
  let withPeak = 0;

  for (const e of entries) {
    if (e.peakEp !== undefined) withPeak += 1;

    const futureBits: string[] = [];
    if (e.openEp > latestEp) futureBits.push(`openEp=E${e.openEp}`);
    if (e.peakEp !== undefined && e.peakEp > latestEp) futureBits.push(`peakEp=E${e.peakEp}`);
    if (e.payoffEp !== undefined && e.payoffEp > latestEp) futureBits.push(`payoffEp=E${e.payoffEp}`);
    if (futureBits.length) {
      push({
        code: 'FUTURE_EP',
        severity: 'FAIL',
        ids: [e.id],
        message: `${e.id} ${futureBits.join('/')} 超出 latestEp=E${latestEp}`,
        fix: '改 openEp/peakEp/payoffEp，或上调 latestEp',
      });
    }

    if (e.peakEp !== undefined && e.peakEp < e.openEp) {
      push({
        code: 'PEAK_BEFORE_OPEN',
        severity: 'FAIL',
        ids: [e.id],
        message: `${e.id} 巅峰 E${e.peakEp} 早于开冲突 E${e.openEp}`,
        fix: '巅峰须发生在蓄仇开场之后（或同集开场之后）',
      });
    }

    if (e.peakEp !== undefined && (!e.peakLabel || !e.peakLabel.trim())) {
      push({
        code: 'PEAK_LABEL_MISSING',
        severity: 'FAIL',
        ids: [e.id],
        message: `${e.id} 有 peakEp=E${e.peakEp} 但缺少 peakLabel（巅峰标签）`,
        fix: '补 peakLabel，如「升副院长」「订婚宴嫌弃」「对峙羞辱峰值」',
      });
    }

    if (e.payoffEp === undefined) {
      open += 1;
      if (e.peakEp === undefined) {
        push({
          code: 'NO_PEAK_PLAN',
          severity: 'WARN',
          ids: [e.id],
          message: `${e.id} 开于 E${e.openEp}，尚未规划巅峰点`,
          fix: '为蓄仇清算补 peakEp + peakLabel（对手达巅峰后再兑现）',
        });
      } else {
        push({
          code: 'OPEN_PENDING',
          severity: 'WARN',
          ids: [e.id],
          message: `${e.id} 开于 E${e.openEp}，巅峰计划 E${e.peakEp}（${e.peakLabel ?? '?'}），尚未兑现`,
          fix: '在巅峰当集或之后写 payoffEp',
        });
      }
      continue;
    }

    paid += 1;

    if (e.payoffEp < e.openEp) {
      push({
        code: 'PAYOFF_BEFORE_OPEN',
        severity: 'FAIL',
        ids: [e.id],
        message: `${e.id} 兑现 E${e.payoffEp} 早于开冲突 E${e.openEp}`,
        fix: '兑现不能早于开冲突',
      });
      continue;
    }

    if (
      e.payoffEp === e.openEp &&
      e.openAtSec !== undefined &&
      e.payoffAtSec !== undefined &&
      e.payoffAtSec < e.openAtSec
    ) {
      push({
        code: 'PAYOFF_BEFORE_OPEN',
        severity: 'FAIL',
        ids: [e.id],
        message: `${e.id} 同集内兑现 ${e.payoffAtSec}s 早于开冲突 ${e.openAtSec}s`,
        fix: '同集内 payoffAtSec ≥ openAtSec',
      });
      continue;
    }

    if (e.peakEp === undefined) {
      push({
        code: 'PAYOFF_WITHOUT_PEAK',
        severity: 'FAIL',
        ids: [e.id],
        message: `${e.id} 已兑现 E${e.payoffEp} 但缺少巅峰标记 peakEp（巅峰后再兑现）`,
        fix: '补 peakEp + peakLabel；若本条其实是快兑现冲突，改走 conflict-payoff-gap-gate',
      });
      continue;
    }

    if (e.peakEp > e.payoffEp) {
      push({
        code: 'PEAK_AFTER_PAYOFF',
        severity: 'FAIL',
        ids: [e.id],
        message: `${e.id} 巅峰 E${e.peakEp} 晚于兑现 E${e.payoffEp}`,
        fix: '把清算挪到巅峰当集或之后，或把巅峰提前',
      });
      continue;
    }

    if (
      e.peakEp === e.payoffEp &&
      e.peakAtSec !== undefined &&
      e.payoffAtSec !== undefined &&
      e.peakAtSec > e.payoffAtSec
    ) {
      push({
        code: 'PEAK_AFTER_PAYOFF',
        severity: 'FAIL',
        ids: [e.id],
        message: `${e.id} 同集巅峰 ${e.peakAtSec}s 晚于兑现 ${e.payoffAtSec}s`,
        fix: '同集内先到巅峰再清算：peakAtSec ≤ payoffAtSec',
      });
      continue;
    }

    const peakToPayoff = e.payoffEp - e.peakEp;
    if (peakToPayoff < thresholds.minPeakToPayoffEps) {
      // reserved for stricter packs; default 0 never trips
      push({
        code: 'PEAK_AFTER_PAYOFF',
        severity: 'FAIL',
        ids: [e.id],
        message: `${e.id} 巅峰→兑现间隔 ${peakToPayoff} < minPeakToPayoffEps=${thresholds.minPeakToPayoffEps}`,
        fix: '拉长巅峰到兑现的间隔，或下调 minPeakToPayoffEps',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { total: entries.length, paid, open, withPeak, latestEp },
    findings,
    thresholds,
    gates: GATES,
  };
}
