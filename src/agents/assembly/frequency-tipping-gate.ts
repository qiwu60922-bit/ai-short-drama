/**
 * V12 · Frequency-Tipping Gate (第 N 次/第 N 天 tipping 计数器), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text breakdowns of 2026-10-25～10-26 hits (structure only, no footage):
 *  - 《备用联系人（完）》: 分手第70天吻了宋淮聿 — day-unit tipping（天数阈值到阈值点）.
 *  - 《边军破刀：一路砍到裂土封王》: 战功/封赏阶梯可叠 count 对照（本 gate 通用次数账本）.
 *  - 《修仙满级回现代，我让全家横着走》: 护家打脸可叠次数爽点.
 * Closes 10-25 candidate from 《轻烟染日暮》第99次离婚 tipping.
 *
 * plantEp → ticks[{ep,n}] → tipEp(+tipLabel) when n reaches threshold.
 * unit: 'count'（第N次）| 'day'（第N天）. Same-ep plant+tip allowed.
 *
 *  SCHEMA (FAIL)                     ledger fails FrequencyTippingLedgerSchema
 *  DUP_ID (FAIL)                     entry id duplicated
 *  FUTURE_EP (FAIL)                  plant/tip/tick beyond latestEp
 *  TIP_BEFORE_PLANT (FAIL)           tip earlier than plant (ep or same-ep sec)
 *  TIP_WITHOUT_LABEL (FAIL)          tipEp set but tipLabel empty
 *  TICK_BEFORE_PLANT (FAIL)          a tick.ep < plantEp
 *  TICK_AFTER_TIP (FAIL)             a tick.ep > tipEp (when tipped)
 *  TICK_N_NOT_ASCENDING (FAIL)       ticks sorted by ep have decreasing n
 *  TICK_N_EXCEEDS_THRESHOLD (FAIL)   any tick.n > threshold
 *  THRESHOLD_NOT_REACHED (FAIL)      tipped but max tick.n < threshold (when ticks present)
 *  TIP_PENDING (WARN)                planted, not yet tipped
 *  NO_TICKS (WARN)                   tipped with empty ticks (直达阈值，缺蓄势)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';

const Ep = z.number().int().positive();
const Sec = z.number().nonnegative().optional();

export const FrequencyTickSchema = z.object({
  ep: Ep,
  /** Current count/day N at this beat. Must be ≤ threshold; ascending across ticks by ep. */
  n: z.number().int().positive(),
  label: z.string().min(1).optional(),
});

export const FrequencyTippingEntrySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).optional(),
  /** Character who performs / suffers the repeated act. */
  actor: z.string().min(1),
  /** Motif name, e.g. 「离婚要挟」「分手后天数」「暗恋年限」. */
  motif: z.string().min(1),
  /** count = 第N次; day = 第N天. */
  unit: z.enum(['count', 'day']),
  /** Threshold N that tips the story (99次离婚 / 第70天). */
  threshold: z.number().int().positive(),
  plantEp: Ep,
  plantAtSec: Sec,
  tipEp: Ep.optional(),
  tipAtSec: Sec,
  /** Human-readable tip marker, e.g. 「接受第99次离婚」「分手第70天吻了」. Required when tipEp set. */
  tipLabel: z.string().min(1).optional(),
  /** Intermediate progression beats toward threshold. */
  ticks: z.array(FrequencyTickSchema).optional(),
  note: z.string().optional(),
});

export const FrequencyTippingLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  entries: z.array(FrequencyTippingEntrySchema),
});

export type FrequencyTippingLedger = z.infer<typeof FrequencyTippingLedgerSchema>;

export type FrequencyTippingFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'FUTURE_EP'
    | 'TIP_BEFORE_PLANT'
    | 'TIP_WITHOUT_LABEL'
    | 'TICK_BEFORE_PLANT'
    | 'TICK_AFTER_TIP'
    | 'TICK_N_NOT_ASCENDING'
    | 'TICK_N_EXCEEDS_THRESHOLD'
    | 'THRESHOLD_NOT_REACHED'
    | 'TIP_PENDING'
    | 'NO_TICKS';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface FrequencyTippingReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    total: number;
    tipped: number;
    pending: number;
    withTicks: number;
    latestEp: number;
  };
  findings: FrequencyTippingFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateFrequencyTipping(input: unknown): FrequencyTippingReport {
  const parsed = FrequencyTippingLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { total: 0, tipped: 0, pending: 0, withTicks: 0, latestEp: 0 },
      findings: [
        {
          code: 'SCHEMA',
          severity: 'FAIL',
          message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        },
      ],
      gates: GATES,
    };
  }

  const { latestEp, entries } = parsed.data;
  const findings: FrequencyTippingFinding[] = [];
  const push = (x: FrequencyTippingFinding) => findings.push(x);

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
      message: `频率 tipping 账本ID重复：${id}`,
      fix: '频率条目 ID 是 plant/tick/tip 指针主键，改成唯一 ID',
    });
  }

  let tipped = 0;
  let pending = 0;
  let withTicks = 0;

  for (const e of entries) {
    const ticks = e.ticks ?? [];
    if (ticks.length > 0) withTicks += 1;

    const futureBits: string[] = [];
    if (e.plantEp > latestEp) futureBits.push(`plantEp=E${e.plantEp}`);
    if (e.tipEp !== undefined && e.tipEp > latestEp) {
      futureBits.push(`tipEp=E${e.tipEp}`);
    }
    for (const t of ticks) {
      if (t.ep > latestEp) futureBits.push(`tickEp=E${t.ep}`);
    }
    if (futureBits.length) {
      push({
        code: 'FUTURE_EP',
        severity: 'FAIL',
        ids: [e.id],
        message: `${e.id} ${futureBits.join('/')} 超出 latestEp=E${latestEp}`,
        fix: '改 plantEp/tipEp/ticks[].ep，或上调 latestEp',
      });
    }

    for (const t of ticks) {
      if (t.ep < e.plantEp) {
        push({
          code: 'TICK_BEFORE_PLANT',
          severity: 'FAIL',
          ids: [e.id],
          message: `${e.id} 计数拍 E${t.ep}(n=${t.n}) 早于栽种 E${e.plantEp}`,
          fix: 'tick 须发生在频率母题栽种之后',
        });
      }
      if (t.n > e.threshold) {
        push({
          code: 'TICK_N_EXCEEDS_THRESHOLD',
          severity: 'FAIL',
          ids: [e.id],
          message: `${e.id} tick n=${t.n} 超过 threshold=${e.threshold}（ tipping 阈值应落在 tip，不在 tick 超阈）`,
          fix: '把超阈拍记到 tipEp，或上调 threshold',
        });
      }
    }

    // Ascending n when sorted by ep (stable by original order for equal ep).
    const sorted = [...ticks].sort((a, b) => a.ep - b.ep);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].n < sorted[i - 1].n) {
        push({
          code: 'TICK_N_NOT_ASCENDING',
          severity: 'FAIL',
          ids: [e.id],
          message: `${e.id} 计数未递增：E${sorted[i - 1].ep} n=${sorted[i - 1].n} → E${sorted[i].ep} n=${sorted[i].n}`,
          fix: 'ticks 按集序 n 须非递减（第N次/第N天只加不减）',
        });
        break;
      }
    }

    if (e.tipEp === undefined) {
      pending += 1;
      push({
        code: 'TIP_PENDING',
        severity: 'WARN',
        ids: [e.id],
        message: `${e.id}（${e.actor}·${e.motif}/${e.unit}·阈${e.threshold}）栽于 E${e.plantEp}，尚未 tipping`,
        fix: '规划 tipEp + tipLabel（第N次离婚签字 / 分手第70天吻了）',
      });
      continue;
    }

    tipped += 1;

    if (!e.tipLabel || !e.tipLabel.trim()) {
      push({
        code: 'TIP_WITHOUT_LABEL',
        severity: 'FAIL',
        ids: [e.id],
        message: `${e.id} 有 tipEp=E${e.tipEp} 但缺少 tipLabel（ tipping 标签）`,
        fix: '补 tipLabel，如「接受第99次离婚」「分手第70天吻了宋淮聿」',
      });
    }

    if (e.tipEp < e.plantEp) {
      push({
        code: 'TIP_BEFORE_PLANT',
        severity: 'FAIL',
        ids: [e.id],
        message: `${e.id} tipping E${e.tipEp} 早于栽种 E${e.plantEp}`,
        fix: ' tipping 不能早于频率母题栽种',
      });
    } else if (
      e.tipEp === e.plantEp &&
      e.plantAtSec !== undefined &&
      e.tipAtSec !== undefined &&
      e.tipAtSec < e.plantAtSec
    ) {
      push({
        code: 'TIP_BEFORE_PLANT',
        severity: 'FAIL',
        ids: [e.id],
        message: `${e.id} 同集内 tipping ${e.tipAtSec}s 早于栽种 ${e.plantAtSec}s`,
        fix: '同集内 tipAtSec ≥ plantAtSec',
      });
    }

    for (const t of ticks) {
      if (t.ep > e.tipEp) {
        push({
          code: 'TICK_AFTER_TIP',
          severity: 'FAIL',
          ids: [e.id],
          message: `${e.id} 计数拍 E${t.ep}(n=${t.n}) 晚于 tipping E${e.tipEp}`,
          fix: ' tipping 后不应再记同母题 tick；若是新一轮，另开一条目',
        });
      }
    }

    if (ticks.length === 0) {
      push({
        code: 'NO_TICKS',
        severity: 'WARN',
        ids: [e.id],
        message: `${e.id} tipping 于 E${e.tipEp}，缺少 ticks 蓄势（直达第${e.threshold}${e.unit === 'day' ? '天' : '次'}）`,
        fix: '补中间 ticks；若开场即 tipping 短线，可忽略此 WARN',
      });
    } else {
      const maxN = Math.max(...ticks.map((t) => t.n));
      if (maxN < e.threshold) {
        push({
          code: 'THRESHOLD_NOT_REACHED',
          severity: 'FAIL',
          ids: [e.id],
          message: `${e.id} 已 tip 于 E${e.tipEp}，但 ticks 最大 n=${maxN} < threshold=${e.threshold}`,
          fix: '补一条 n=threshold 的 tick，或下调 threshold 与 tipLabel 对齐',
        });
      }
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      total: entries.length,
      tipped,
      pending,
      withTicks,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
