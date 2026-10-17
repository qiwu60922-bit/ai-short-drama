/**
 * V12 · Ability Rule Gate (金手指规则账本闸门), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (synopses / chart pages, no footage) of 2026-10-16 红果 hits:
 *  - 《伪人降临！我是全场唯一预言家》: “您每日可查验一人身份，或获得一份生存情报” —
 *    规则写死：每日 1 次、二选一、全场唯一。观众会数次数，破规则就是剧情漏洞。
 *  - 《一块钱硬币，玩出万亿商业帝国》: 离婚关口觉醒预知 → 立刻预判车祸救人（拿到就用）。
 *  - 《家有五女，穿越来的他连夜搞事业啦》: 天崩开局当集亮出现代知识金手指，长线靠它持续推进。
 *
 * Distinct from foreshadow-ledger (伏笔发酵) and conflict-payoff (冲突快兑现):
 * this gate audits the *rules* of a series' power/system so every use stays inside them.
 *
 *  SCHEMA (FAIL)               ledger fails AbilityRuleLedgerSchema (bounded cycles need maxUsesPerCycle)
 *  DUP_ID (FAIL)               ability id duplicated
 *  UNKNOWN_ABILITY (FAIL)      use references an undeclared ability
 *  FUTURE_EP (FAIL)            acquiredEp / use.ep beyond latestEp
 *  USE_BEFORE_ACQUIRED (FAIL)  use.ep < acquiredEp
 *  HOLDER_MISMATCH (FAIL)      exclusive ability used by someone other than holder (全场唯一)
 *  DAY_REQUIRED (FAIL)         cycle=day use without a story day index
 *  DAY_REGRESSION (FAIL)       story day goes backwards across episodes (breaks per-day budget)
 *  OVER_BUDGET (FAIL)          uses in one cycle (story day / episode) > maxUsesPerCycle
 *  OPTION_MISSING (FAIL)       ability declares either/or options but use names none
 *  OPTION_INVALID (FAIL)       use option not in the declared options
 *  FIRST_USE_LATE (FAIL)       first use - acquiredEp > maxFirstUseGapEps (default 1, 拿到就用)
 *  ABILITY_UNUSED (FAIL)       never used and latestEp - acquiredEp > maxFirstUseGapEps
 *  UNUSED_PENDING (WARN)       never used, still inside the first-use window
 *  ABILITY_DORMANT (WARN)      gap between uses (or last use → latestEp) > maxDormantEps (default 3)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';

const Ep = z.number().int().positive();

export const AbilityRuleSchema = z
  .object({
    cycle: z.enum(['day', 'episode', 'unlimited']),
    maxUsesPerCycle: z.number().int().positive().optional(),
    options: z.array(z.string().min(1)).min(1).optional(),
  })
  .refine((r) => r.cycle === 'unlimited' || r.maxUsesPerCycle !== undefined, {
    message: 'maxUsesPerCycle is required when cycle is day/episode',
    path: ['maxUsesPerCycle'],
  });

export const AbilityEntrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  holder: z.string().min(1),
  acquiredEp: Ep,
  exclusive: z.boolean().optional(),
  rule: AbilityRuleSchema,
  note: z.string().optional(),
});

export const AbilityUseSchema = z.object({
  abilityId: z.string().min(1),
  by: z.string().min(1),
  ep: Ep,
  day: z.number().int().positive().optional(),
  option: z.string().min(1).optional(),
  atSec: z.number().nonnegative().optional(),
  note: z.string().optional(),
});

export const AbilityRuleLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
});

export type AbilityRuleLedger = z.infer<typeof AbilityRuleLedgerSchema>;
type AbilityUse = z.infer<typeof AbilityUseSchema>;

export interface AbilityRuleOptions {
  maxFirstUseGapEps?: number;
  maxDormantEps?: number;
}

export const ABILITY_RULE_DEFAULTS: Required<AbilityRuleOptions> = {
  maxFirstUseGapEps: 1,
  maxDormantEps: 3,
};

export type AbilityRuleFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_ABILITY'
    | 'FUTURE_EP'
    | 'USE_BEFORE_ACQUIRED'
    | 'HOLDER_MISMATCH'
    | 'DAY_REQUIRED'
    | 'DAY_REGRESSION'
    | 'OVER_BUDGET'
    | 'OPTION_MISSING'
    | 'OPTION_INVALID'
    | 'FIRST_USE_LATE'
    | 'ABILITY_UNUSED'
    | 'UNUSED_PENDING'
    | 'ABILITY_DORMANT';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AbilityRuleReport {
  verdict: 'PASS' | 'FAIL';
  metrics: { abilities: number; uses: number; overBudget: number; dormant: number; latestEp: number };
  findings: AbilityRuleFinding[];
  thresholds: Required<AbilityRuleOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

const labelOf = (u: AbilityUse) => `${u.abilityId}@E${u.ep}${u.day !== undefined ? `/D${u.day}` : ''}`;

export function evaluateAbilityRules(input: unknown, opts: AbilityRuleOptions = {}): AbilityRuleReport {
  const thresholds = { ...ABILITY_RULE_DEFAULTS, ...opts };
  const parsed = AbilityRuleLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { abilities: 0, uses: 0, overBudget: 0, dormant: 0, latestEp: 0 },
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

  const { latestEp, abilities, uses } = parsed.data;
  const findings: AbilityRuleFinding[] = [];
  const push = (x: AbilityRuleFinding) => findings.push(x);

  const byId = new Map<string, (typeof abilities)[number]>();
  const dups = new Set<string>();
  for (const a of abilities) {
    if (byId.has(a.id)) dups.add(a.id);
    else byId.set(a.id, a);
  }
  for (const id of dups) {
    push({
      code: 'DUP_ID',
      severity: 'FAIL',
      ids: [id],
      message: `金手指ID重复：${id}`,
      fix: '金手指ID是使用记录的主键，改成唯一ID',
    });
  }

  for (const a of byId.values()) {
    if (a.acquiredEp > latestEp) {
      push({
        code: 'FUTURE_EP',
        severity: 'FAIL',
        ids: [a.id],
        message: `${a.id} 获得集 E${a.acquiredEp} 超出 latestEp=E${latestEp}`,
        fix: '改 acquiredEp，或上调 latestEp',
      });
    }
  }

  // Per-use checks
  const valid: AbilityUse[] = [];
  for (const u of uses) {
    const a = byId.get(u.abilityId);
    if (u.ep > latestEp) {
      push({
        code: 'FUTURE_EP',
        severity: 'FAIL',
        ids: [u.abilityId],
        message: `${labelOf(u)} 超出 latestEp=E${latestEp}`,
        fix: '改 use.ep，或上调 latestEp',
      });
    }
    if (!a) {
      push({
        code: 'UNKNOWN_ABILITY',
        severity: 'FAIL',
        ids: [u.abilityId],
        message: `${labelOf(u)} 引用未登记的金手指`,
        fix: '先在 abilities 里登记规则（周期/次数/选项/持有人），再写使用记录',
      });
      continue;
    }
    if (u.ep < a.acquiredEp) {
      push({
        code: 'USE_BEFORE_ACQUIRED',
        severity: 'FAIL',
        ids: [a.id],
        message: `${labelOf(u)} 早于获得集 E${a.acquiredEp}`,
        fix: '把使用挪到获得之后，或提前 acquiredEp（并补获得镜头）',
      });
    }
    if (a.exclusive && u.by !== a.holder) {
      push({
        code: 'HOLDER_MISMATCH',
        severity: 'FAIL',
        ids: [a.id],
        message: `${labelOf(u)} 由 ${u.by} 使用，但该金手指唯一持有人是 ${a.holder}`,
        fix: '改 by，或把“第二个持有人”写成显式新设定（新 ability + 反转说明）',
      });
    }
    if (a.rule.options) {
      if (u.option === undefined) {
        push({
          code: 'OPTION_MISSING',
          severity: 'FAIL',
          ids: [a.id],
          message: `${labelOf(u)} 未写明选了哪一项（${a.rule.options.join(' / ')}）`,
          fix: '写 option，让观众看清这次用掉的是哪一项',
        });
      } else if (!a.rule.options.includes(u.option)) {
        push({
          code: 'OPTION_INVALID',
          severity: 'FAIL',
          ids: [a.id],
          message: `${labelOf(u)} 选项「${u.option}」不在规则内（${a.rule.options.join(' / ')}）`,
          fix: '改成已声明选项，或先修改规则设定并补说明镜头',
        });
      }
    }
    if (a.rule.cycle === 'day' && u.day === undefined) {
      push({
        code: 'DAY_REQUIRED',
        severity: 'FAIL',
        ids: [a.id],
        message: `${labelOf(u)} 是按日计次的金手指，但没写故事日 day`,
        fix: '补 day（故事内第几天）',
      });
      continue;
    }
    valid.push(u);
  }

  // Story-day clock must not go backwards across episodes (series-global).
  const dayed = uses.filter((u) => u.day !== undefined).slice().sort((x, y) => x.ep - y.ep);
  let maxDayPrevEps = 0;
  let curEp = 0;
  let maxDayCurEp = 0;
  const regressed = new Set<string>();
  for (const u of dayed) {
    if (u.ep !== curEp) {
      maxDayPrevEps = Math.max(maxDayPrevEps, maxDayCurEp);
      curEp = u.ep;
      maxDayCurEp = 0;
    }
    const day = u.day as number;
    if (day < maxDayPrevEps && !regressed.has(labelOf(u))) {
      regressed.add(labelOf(u));
      push({
        code: 'DAY_REGRESSION',
        severity: 'FAIL',
        ids: [u.abilityId],
        message: `${labelOf(u)} 故事日倒退（前面集已到第 ${maxDayPrevEps} 天）`,
        fix: '修正 day；闪回请单独标注，不计入当日次数',
      });
    }
    maxDayCurEp = Math.max(maxDayCurEp, day);
  }

  // Budget per cycle
  let overBudget = 0;
  for (const a of byId.values()) {
    if (a.rule.cycle === 'unlimited') continue;
    const max = a.rule.maxUsesPerCycle as number;
    const counts = new Map<number, number>();
    for (const u of valid) {
      if (u.abilityId !== a.id) continue;
      const key = a.rule.cycle === 'day' ? (u.day as number) : u.ep;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    for (const [key, n] of [...counts.entries()].sort((x, y) => x[0] - y[0])) {
      if (n > max) {
        overBudget += 1;
        const unit = a.rule.cycle === 'day' ? `第 ${key} 天` : `E${key}`;
        push({
          code: 'OVER_BUDGET',
          severity: 'FAIL',
          ids: [a.id],
          message: `${a.id} 在${unit}用了 ${n} 次 > 规则上限 ${max}`,
          fix: '删/挪一次使用到下一周期，或改用其他手段解决（规则是爽点的地基）',
        });
      }
    }
  }

  // First use / dormancy
  const dormantIds = new Set<string>();
  for (const a of byId.values()) {
    if (a.acquiredEp > latestEp) continue;
    const eps = [...new Set(valid.filter((u) => u.abilityId === a.id && u.ep >= a.acquiredEp).map((u) => u.ep))].sort(
      (x, y) => x - y,
    );
    if (eps.length === 0) {
      const gap = latestEp - a.acquiredEp;
      if (gap > thresholds.maxFirstUseGapEps) {
        push({
          code: 'ABILITY_UNUSED',
          severity: 'FAIL',
          ids: [a.id],
          message: `${a.id} 获得于 E${a.acquiredEp}，已过 ${gap} 集仍未使用（上限 ${thresholds.maxFirstUseGapEps}）`,
          fix: '获得当集或下一集就让它解决一个具体危机（拿到就用）',
        });
      } else {
        push({
          code: 'UNUSED_PENDING',
          severity: 'WARN',
          ids: [a.id],
          message: `${a.id} 获得于 E${a.acquiredEp}，尚未使用（窗口内）`,
          fix: '计划在 ≤maxFirstUseGapEps 内首次使用',
        });
      }
      continue;
    }
    const firstGap = eps[0] - a.acquiredEp;
    if (firstGap > thresholds.maxFirstUseGapEps) {
      push({
        code: 'FIRST_USE_LATE',
        severity: 'FAIL',
        ids: [a.id],
        message: `${a.id} 获得于 E${a.acquiredEp}，首次使用 E${eps[0]}（间隔 ${firstGap} > ${thresholds.maxFirstUseGapEps}）`,
        fix: '把首次使用提前到获得当集或下一集',
      });
    }
    const points = [...eps, latestEp];
    for (let i = 1; i < points.length; i += 1) {
      const gap = points[i] - points[i - 1];
      if (gap > thresholds.maxDormantEps) {
        dormantIds.add(a.id);
        const tail = i === points.length - 1;
        push({
          code: 'ABILITY_DORMANT',
          severity: 'WARN',
          ids: [a.id],
          message: tail
            ? `${a.id} 自 E${points[i - 1]} 起到 E${latestEp} 已 ${gap} 集未使用（> ${thresholds.maxDormantEps}）`
            : `${a.id} 在 E${points[i - 1]}→E${points[i]} 之间熄火 ${gap} 集（> ${thresholds.maxDormantEps}）`,
          fix: '核心金手指是长线引擎：中间补一次使用，或写明受限原因（冷却/被封印）',
        });
      }
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { abilities: abilities.length, uses: uses.length, overBudget, dormant: dormantIds.size, latestEp },
    findings,
    thresholds,
    gates: GATES,
  };
}
