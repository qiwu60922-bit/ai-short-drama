/**
 * V12 · H3 Budget Gate (离线 H3 成本方案·分层2K·渠道对比), pre-gen, offline, deterministic.
 *
 * Method rewritten in TypeScript from unrealinux/minimax-h3-budget-video
 * (MIT, Copyright (c) 2026 unrealinux) — scripts/cost_calc.py + prices.json
 * mechanical cost math & input validation only:
 * https://github.com/unrealinux/minimax-h3-budget-video
 * Not wholesale vendoring: no SKILL.md long-form prompts / check_prices web crawl /
 * evals / fixtures HTML. We encode the pure cost scenarios:
 *   全量2K / 全量768P / 分层768+选择性2K / 草稿优先 / fal Turbo /
 *   混渠道 fal+官方 regen / Replicate 2K · plus optional input-video cost.
 *
 * Default price table from upstream prices.json updated 2026-10-27
 * (official_cny + third_party_usd + usd_to_cny=7.15). input.prices may override.
 *
 *  SCHEMA (FAIL)              overall parse fail / non-object
 *  FINALS_REQUIRED (FAIL)     finals missing
 *  FINALS_INVALID (FAIL)      finals ≤0 or non-integer
 *  UPGRADE_GT_FINALS (FAIL)   upgrade > finals
 *  SECONDS_INVALID (FAIL)     seconds ≤0
 *  DRAFTS_INVALID (FAIL)      drafts < 0 or non-integer
 *  INPUT_VIDEO_INVALID (FAIL) inputVideoSeconds < 0
 *  DRAFTS_LT_FINALS (WARN)    0 < drafts < finals
 *  ALL_UPGRADE_NO_SAVE (WARN) upgrade === finals (分层相对全2K无折扣)
 *  INPUT_VIDEO_COSTLY (WARN)  inputVideoSeconds > 0
 *
 * Engineering gate only: PASS ≠ Final ≠ G3. No MiniMax / paid APIs / network.
 */
import { z } from 'zod';

/** Default prices from unrealinux/minimax-h3-budget-video prices.json (2026-10-27). */
export const DEFAULT_H3_PRICES = {
  updated: '2026-10-27',
  usd_to_cny: 7.15,
  official_cny: {
    lite_480: 0.16,
    lite_768: 0.26,
    max_480: 0.33,
    highspeed_768: 0.4,
    h3_768: 0.5,
    h3_2k: 0.8,
    regen_2k: 0.3,
    input_video_h3: 0.5,
    input_video_max_768: 0.97,
  },
  third_party_usd: {
    fal_turbo: 0.025,
    fal_turbo_ref: 0.05,
    fal_h3: 0.05,
    replicate_768: 0.08,
    replicate_2k: 0.13,
  },
} as const;

export type H3OfficialCnyKey = keyof typeof DEFAULT_H3_PRICES.official_cny;
export type H3ThirdPartyUsdKey = keyof typeof DEFAULT_H3_PRICES.third_party_usd;

export interface H3PriceTable {
  updated?: string;
  usd_to_cny: number;
  official_cny: Record<string, number>;
  third_party_usd: Record<string, number>;
}

const PricesOverrideSchema = z
  .object({
    updated: z.string().optional(),
    usd_to_cny: z.number().positive().optional(),
    official_cny: z.record(z.string(), z.number()).optional(),
    third_party_usd: z.record(z.string(), z.number()).optional(),
  })
  .passthrough()
  .optional();

export const H3BudgetInputSchema = z
  .object({
    finals: z.number().optional(),
    seconds: z.number().optional(),
    drafts: z.number().optional(),
    upgrade: z.number().optional(),
    inputVideoSeconds: z.number().optional(),
    inputModel: z.enum(['h3', 'max']).optional(),
    falMode: z.enum(['t2v', 'ref']).optional(),
    prices: PricesOverrideSchema,
  })
  .passthrough();

export type H3BudgetInput = z.infer<typeof H3BudgetInputSchema>;

export type H3BudgetFindingCode =
  | 'SCHEMA'
  | 'FINALS_REQUIRED'
  | 'FINALS_INVALID'
  | 'UPGRADE_GT_FINALS'
  | 'SECONDS_INVALID'
  | 'DRAFTS_INVALID'
  | 'INPUT_VIDEO_INVALID'
  | 'DRAFTS_LT_FINALS'
  | 'ALL_UPGRADE_NO_SAVE'
  | 'INPUT_VIDEO_COSTLY';

export interface H3BudgetFinding {
  code: H3BudgetFindingCode;
  severity: 'FAIL' | 'WARN';
  message: string;
  path?: string;
}

export interface H3BudgetScenario {
  name: string;
  detail: string;
  cny: number;
  vsAll2k: number;
  vsAll2kPct: number | null;
}

export interface H3BudgetReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    finals: number;
    seconds: number;
    drafts: number;
    upgrade: number;
    inputVideoSeconds: number;
    inputModel: 'h3' | 'max';
    falMode: 't2v' | 'ref';
    baselineAll2k: number;
    inputVideoCost: number;
    scenarios: H3BudgetScenario[];
    cheapestScenario: { name: string; cny: number } | null;
    findingCounts: { FAIL: number; WARN: number };
  };
  findings: H3BudgetFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
  summary?: string;
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

function emptyMetrics(
  overrides: Partial<H3BudgetReport['metrics']> = {},
): H3BudgetReport['metrics'] {
  return {
    finals: 0,
    seconds: 5,
    drafts: 0,
    upgrade: 0,
    inputVideoSeconds: 0,
    inputModel: 'h3',
    falMode: 't2v',
    baselineAll2k: 0,
    inputVideoCost: 0,
    scenarios: [],
    cheapestScenario: null,
    findingCounts: { FAIL: 0, WARN: 0 },
    ...overrides,
  };
}

function failReport(
  findings: H3BudgetFinding[],
  metricsPartial: Partial<H3BudgetReport['metrics']> = {},
): H3BudgetReport {
  const findingCounts = {
    FAIL: findings.filter((f) => f.severity === 'FAIL').length,
    WARN: findings.filter((f) => f.severity === 'WARN').length,
  };
  return {
    verdict: 'FAIL',
    metrics: emptyMetrics({ ...metricsPartial, findingCounts }),
    findings,
    gates: GATES,
    summary: `FAIL (${findings
      .filter((f) => f.severity === 'FAIL')
      .map((f) => f.code)
      .join(',')})`,
  };
}

function mergePrices(override?: H3BudgetInput['prices']): H3PriceTable {
  const base: H3PriceTable = {
    updated: DEFAULT_H3_PRICES.updated,
    usd_to_cny: DEFAULT_H3_PRICES.usd_to_cny,
    official_cny: { ...DEFAULT_H3_PRICES.official_cny },
    third_party_usd: { ...DEFAULT_H3_PRICES.third_party_usd },
  };
  if (!override) return base;
  if (typeof override.usd_to_cny === 'number') base.usd_to_cny = override.usd_to_cny;
  if (override.updated) base.updated = override.updated;
  if (override.official_cny) {
    base.official_cny = { ...base.official_cny, ...override.official_cny };
  }
  if (override.third_party_usd) {
    base.third_party_usd = { ...base.third_party_usd, ...override.third_party_usd };
  }
  return base;
}

function isPositiveInt(n: number): boolean {
  return Number.isInteger(n) && n > 0;
}

function isNonNegInt(n: number): boolean {
  return Number.isInteger(n) && n >= 0;
}

function buildScenarios(args: {
  finals: number;
  seconds: number;
  drafts: number;
  upgrade: number;
  inputVideoSeconds: number;
  inputModel: 'h3' | 'max';
  falMode: 't2v' | 'ref';
  prices: H3PriceTable;
}): { scenarios: H3BudgetScenario[]; baselineAll2k: number; inputVideoCost: number } {
  const { finals: n, seconds: s, drafts: d, upgrade: u, prices } = args;
  const oc = prices.official_cny;
  const tu = prices.third_party_usd;
  const usdToCny = prices.usd_to_cny;

  let inputVideoCost = 0;
  if (args.inputVideoSeconds > 0) {
    const rate =
      args.inputModel === 'max'
        ? (oc.input_video_max_768 ?? DEFAULT_H3_PRICES.official_cny.input_video_max_768)
        : (oc.input_video_h3 ?? DEFAULT_H3_PRICES.official_cny.input_video_h3);
    inputVideoCost = args.inputVideoSeconds * rate * n;
  }

  const h3_2k = oc.h3_2k ?? DEFAULT_H3_PRICES.official_cny.h3_2k;
  const h3_768 = oc.h3_768 ?? DEFAULT_H3_PRICES.official_cny.h3_768;
  const regen_2k = oc.regen_2k ?? DEFAULT_H3_PRICES.official_cny.regen_2k;
  const lite_480 = oc.lite_480 ?? DEFAULT_H3_PRICES.official_cny.lite_480;
  const fal_turbo = tu.fal_turbo ?? DEFAULT_H3_PRICES.third_party_usd.fal_turbo;
  const fal_turbo_ref =
    tu.fal_turbo_ref ?? DEFAULT_H3_PRICES.third_party_usd.fal_turbo_ref;
  const replicate_2k =
    tu.replicate_2k ?? DEFAULT_H3_PRICES.third_party_usd.replicate_2k;

  const raw: { name: string; detail: string; cny: number }[] = [];

  const all2k = n * s * h3_2k + inputVideoCost;
  raw.push({
    name: '全量 2K（直接生成）',
    detail: `${n} 条 × ${s}s × ¥${h3_2k}/s`,
    cny: all2k,
  });

  raw.push({
    name: '全量 768P（后期超分）',
    detail: `${n} 条 × ${s}s × ¥${h3_768}/s`,
    cny: n * s * h3_768 + inputVideoCost,
  });

  raw.push({
    name: '分层：768P 打底 + 选择性 2K',
    detail: `${n} 条 768P + ${u} 条 Regenerate`,
    cny: n * s * h3_768 + u * s * regen_2k + inputVideoCost,
  });

  if (d > 0) {
    raw.push({
      name: '草稿优先：480P 试错 + 768P 定稿 + 选择性 2K',
      detail: `${d} 条 480P 草稿 + ${n} 条 768P + ${u} 条 Regenerate`,
      cny: d * s * lite_480 + n * s * h3_768 + u * s * regen_2k + inputVideoCost,
    });
  }

  const falTurboCny = n * s * fal_turbo * usdToCny;
  raw.push({
    name: 'fal Turbo（768P，美元结算）',
    detail: `${n} 条 × ${s}s × $${fal_turbo}/s`,
    cny: falTurboCny,
  });

  const falRate = args.falMode === 'ref' ? fal_turbo_ref : fal_turbo;
  raw.push({
    name: '混渠道：fal 出 768P + 官方升级 2K',
    detail: `${n} 条 fal（$${falRate}/s）+ ${u} 条官方 Regenerate`,
    cny: n * s * falRate * usdToCny + u * s * regen_2k,
  });

  raw.push({
    name: 'Replicate 2K（美元结算）',
    detail: `${n} 条 × ${s}s × $${replicate_2k}/s`,
    cny: n * s * replicate_2k * usdToCny,
  });

  const scenarios: H3BudgetScenario[] = raw.map((sc) => {
    const vs = sc.cny - all2k;
    return {
      ...sc,
      vsAll2k: vs,
      vsAll2kPct: all2k === 0 ? null : (vs / all2k) * 100,
    };
  });

  return { scenarios, baselineAll2k: all2k, inputVideoCost };
}

/**
 * Evaluate offline H3 cost scenarios. Pure function, zero network.
 */
export function evaluateH3Budget(input: unknown): H3BudgetReport {
  if (input === null || input === undefined || typeof input !== 'object' || Array.isArray(input)) {
    return failReport([
      {
        code: 'SCHEMA',
        severity: 'FAIL',
        message: 'input must be a non-null object { finals, seconds?, ... }',
      },
    ]);
  }

  const parsed = H3BudgetInputSchema.safeParse(input);
  if (!parsed.success) {
    return failReport([
      {
        code: 'SCHEMA',
        severity: 'FAIL',
        message: `schema: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      },
    ]);
  }

  const data = parsed.data;
  const findings: H3BudgetFinding[] = [];

  if (data.finals === undefined || data.finals === null) {
    findings.push({
      code: 'FINALS_REQUIRED',
      severity: 'FAIL',
      message: 'finals is required (positive integer count of final clips)',
      path: 'finals',
    });
  } else if (!isPositiveInt(data.finals)) {
    findings.push({
      code: 'FINALS_INVALID',
      severity: 'FAIL',
      message: `finals must be a positive integer, got ${data.finals}`,
      path: 'finals',
    });
  }

  const seconds = data.seconds === undefined ? 5 : data.seconds;
  if (!(typeof seconds === 'number' && Number.isFinite(seconds) && seconds > 0)) {
    findings.push({
      code: 'SECONDS_INVALID',
      severity: 'FAIL',
      message: `seconds must be > 0, got ${seconds}`,
      path: 'seconds',
    });
  }

  const drafts = data.drafts === undefined ? 0 : data.drafts;
  if (!(typeof drafts === 'number' && isNonNegInt(drafts))) {
    findings.push({
      code: 'DRAFTS_INVALID',
      severity: 'FAIL',
      message: `drafts must be a non-negative integer, got ${drafts}`,
      path: 'drafts',
    });
  }

  const upgrade = data.upgrade === undefined ? 0 : data.upgrade;
  if (!(typeof upgrade === 'number' && isNonNegInt(upgrade))) {
    findings.push({
      code: 'SCHEMA',
      severity: 'FAIL',
      message: `upgrade must be a non-negative integer, got ${upgrade}`,
      path: 'upgrade',
    });
  }

  const inputVideoSeconds =
    data.inputVideoSeconds === undefined ? 0 : data.inputVideoSeconds;
  if (
    !(
      typeof inputVideoSeconds === 'number' &&
      Number.isFinite(inputVideoSeconds) &&
      inputVideoSeconds >= 0
    )
  ) {
    findings.push({
      code: 'INPUT_VIDEO_INVALID',
      severity: 'FAIL',
      message: `inputVideoSeconds must be ≥ 0, got ${inputVideoSeconds}`,
      path: 'inputVideoSeconds',
    });
  }

  const finals = data.finals ?? 0;
  if (
    findings.every((f) => f.code !== 'FINALS_INVALID' && f.code !== 'FINALS_REQUIRED') &&
    isNonNegInt(upgrade) &&
    upgrade > finals
  ) {
    findings.push({
      code: 'UPGRADE_GT_FINALS',
      severity: 'FAIL',
      message: `upgrade (${upgrade}) cannot exceed finals (${finals})`,
      path: 'upgrade',
    });
  }

  const failFindings = findings.filter((f) => f.severity === 'FAIL');
  if (failFindings.length > 0) {
    return failReport(findings, {
      finals: typeof data.finals === 'number' ? data.finals : 0,
      seconds: typeof seconds === 'number' && seconds > 0 ? seconds : 5,
      drafts: typeof drafts === 'number' && drafts >= 0 ? drafts : 0,
      upgrade: typeof upgrade === 'number' && upgrade >= 0 ? upgrade : 0,
      inputVideoSeconds:
        typeof inputVideoSeconds === 'number' && inputVideoSeconds >= 0
          ? inputVideoSeconds
          : 0,
      inputModel: data.inputModel ?? 'h3',
      falMode: data.falMode ?? 't2v',
    });
  }

  // WARN checks
  if (drafts > 0 && drafts < finals) {
    findings.push({
      code: 'DRAFTS_LT_FINALS',
      severity: 'WARN',
      message: `草稿数（${drafts}）少于成片数（${finals}），草稿优先方案的草稿成本会偏低`,
      path: 'drafts',
    });
  }
  if (upgrade === finals) {
    findings.push({
      code: 'ALL_UPGRADE_NO_SAVE',
      severity: 'WARN',
      message:
        '全部镜头都要 2K 时，分层与直接 2K 总价相同（0.50+0.30=0.80），没有折扣',
      path: 'upgrade',
    });
  }
  if (inputVideoSeconds > 0) {
    findings.push({
      code: 'INPUT_VIDEO_COSTLY',
      severity: 'WARN',
      message: `参考输入视频按秒计费（${inputVideoSeconds}s × ${finals} 条），成本偏贵`,
      path: 'inputVideoSeconds',
    });
  }

  const inputModel = data.inputModel ?? 'h3';
  const falMode = data.falMode ?? 't2v';
  const prices = mergePrices(data.prices);

  const { scenarios, baselineAll2k, inputVideoCost } = buildScenarios({
    finals,
    seconds,
    drafts,
    upgrade,
    inputVideoSeconds,
    inputModel,
    falMode,
    prices,
  });

  let cheapest: { name: string; cny: number } | null = null;
  for (const sc of scenarios) {
    if (!cheapest || sc.cny < cheapest.cny) {
      cheapest = { name: sc.name, cny: sc.cny };
    }
  }

  const findingCounts = {
    FAIL: findings.filter((f) => f.severity === 'FAIL').length,
    WARN: findings.filter((f) => f.severity === 'WARN').length,
  };

  return {
    verdict: 'PASS',
    metrics: {
      finals,
      seconds,
      drafts,
      upgrade,
      inputVideoSeconds,
      inputModel,
      falMode,
      baselineAll2k,
      inputVideoCost,
      scenarios,
      cheapestScenario: cheapest,
      findingCounts,
    },
    findings,
    gates: GATES,
    summary:
      findingCounts.WARN > 0
        ? `PASS with ${findingCounts.WARN} WARN`
        : 'PASS',
  };
}
