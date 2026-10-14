/**
 * V12 · Foreshadow Ledger Gate (伏笔账本闸门), pre-generation, offline, deterministic.
 *
 * Rules adapted from mengxiujie/ManjuForge `scripts/consistency_check.py` (MIT-0, MIT No Attribution):
 * that tool checks a serial drama's markdown memory files against each other. Here the same rules run on
 * one JSON ledger (+ optional per-episode beat refs), rewritten in TypeScript for the V11 pipeline.
 *
 *  SCHEMA (FAIL)               ledger fails ForeshadowLedgerSchema
 *  DUP_ID (FAIL)               F5 · ID is the cross-file key; duplicates break payoff pointers
 *  CLOSED_NO_PAYOFF (FAIL)     F2 · status closed but payoffEp empty
 *  PAYOFF_ON_OPEN (FAIL)       F2 · status active/dropped but payoffEp set (contradiction)
 *  PAYOFF_BEFORE_PLANT (FAIL)  payoffEp < plantEp
 *  FUTURE_EP (FAIL)            plantEp / payoffEp beyond latestEp
 *  STALE (FAIL)                F3 · active and idle > maxIdleEps since last advance (audience forgot it)
 *  PAYOFF_TOO_FAST (WARN)      F1 · payoff gap < minFermentEps episodes
 *  CONCURRENCY (WARN)          F4 · active S > 3 or active A > 5 (every episode feels like a finale)
 *  DANGLING_REF (FAIL)         M5 · episode beats reference an ID not in the ledger
 *  STATUS_DESYNC (FAIL)        M4 · episode beats disagree with ledger plant/payoff episode or status
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';

const Ep = z.number().int().positive();
const Ids = z.array(z.string().min(1)).optional();

export const ForeshadowItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  priority: z.enum(['S', 'A', 'B', 'C']).default('B'),
  plantEp: Ep,
  status: z.enum(['active', 'closed', 'dropped']),
  plannedPayoffEp: Ep.optional(),
  payoffEp: Ep.optional(),
  lastAdvancedEp: Ep.optional(),
  note: z.string().optional(),
});

export const ForeshadowLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  items: z.array(ForeshadowItemSchema),
  episodes: z.array(z.object({ ep: Ep, plants: Ids, advances: Ids, payoffs: Ids })).optional(),
});

export type ForeshadowLedger = z.infer<typeof ForeshadowLedgerSchema>;

export interface ForeshadowLedgerOptions {
  minFermentEps?: number;
  maxIdleEps?: number;
  maxActiveS?: number;
  maxActiveA?: number;
}

export type ForeshadowFinding = {
  code:
    | 'SCHEMA' | 'DUP_ID' | 'CLOSED_NO_PAYOFF' | 'PAYOFF_ON_OPEN' | 'PAYOFF_BEFORE_PLANT' | 'FUTURE_EP'
    | 'STALE' | 'PAYOFF_TOO_FAST' | 'CONCURRENCY' | 'DANGLING_REF' | 'STATUS_DESYNC';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface ForeshadowLedgerReport {
  verdict: 'PASS' | 'FAIL';
  metrics: { total: number; active: number; closed: number; dropped: number; latestEp: number };
  findings: ForeshadowFinding[];
  thresholds: Required<ForeshadowLedgerOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const DEFAULTS: Required<ForeshadowLedgerOptions> = { minFermentEps: 2, maxIdleEps: 8, maxActiveS: 3, maxActiveA: 5 };
const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateForeshadowLedger(input: unknown, opts: ForeshadowLedgerOptions = {}): ForeshadowLedgerReport {
  const thresholds = { ...DEFAULTS, ...opts };
  const parsed = ForeshadowLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { total: 0, active: 0, closed: 0, dropped: 0, latestEp: 0 },
      findings: [{ code: 'SCHEMA', severity: 'FAIL', message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') }],
      thresholds,
      gates: GATES,
    };
  }
  const { latestEp, items, episodes = [] } = parsed.data;
  const findings: ForeshadowFinding[] = [];
  const push = (x: ForeshadowFinding) => findings.push(x);

  // F5 unique IDs
  const byId = new Map<string, (typeof items)[number]>();
  const dups = new Set<string>();
  for (const it of items) {
    if (byId.has(it.id)) dups.add(it.id);
    else byId.set(it.id, it);
  }
  for (const id of dups) {
    push({ code: 'DUP_ID', severity: 'FAIL', ids: [id], message: `伏笔ID重复：${id}`, fix: 'ID 是回收指针的主键，改成唯一ID' });
  }

  // Episode beat refs → last-advance evidence, dangling, desync (M4/M5)
  const seenAt = new Map<string, number>();
  const dangling = new Set<string>();
  for (const e of episodes) {
    const refs: Array<[string, 'plants' | 'advances' | 'payoffs']> = [
      ...(e.plants ?? []).map((id) => [id, 'plants'] as [string, 'plants']),
      ...(e.advances ?? []).map((id) => [id, 'advances'] as [string, 'advances']),
      ...(e.payoffs ?? []).map((id) => [id, 'payoffs'] as [string, 'payoffs']),
    ];
    for (const [id, kind] of refs) {
      const it = byId.get(id);
      if (!it) { dangling.add(id); continue; }
      seenAt.set(id, Math.max(seenAt.get(id) ?? 0, e.ep));
      if (kind === 'plants' && it.plantEp !== e.ep) {
        push({ code: 'STATUS_DESYNC', severity: 'FAIL', ids: [id], message: `E${e.ep} 分集写了埋设 ${id}，账本埋设集却是 E${it.plantEp}`, fix: '以成片为准，改账本 plantEp 或分集引用' });
      }
      if (kind === 'payoffs' && (it.status !== 'closed' || it.payoffEp !== e.ep)) {
        push({ code: 'STATUS_DESYNC', severity: 'FAIL', ids: [id], message: `E${e.ep} 分集写了回收 ${id}，账本是 ${it.status}${it.payoffEp ? `@E${it.payoffEp}` : ''}`, fix: '回收后同步账本：status=closed、payoffEp=回收集' });
      }
    }
  }
  if (dangling.size) {
    push({ code: 'DANGLING_REF', severity: 'FAIL', ids: [...dangling].sort(), message: `分集引用了账本里没有的伏笔：${[...dangling].sort().join('、')}`, fix: '先在账本登记该伏笔，或修正分集里的ID' });
  }

  for (const it of byId.values()) {
    const tag = `${it.id}「${it.name}」`;
    if (it.status === 'closed' && it.payoffEp === undefined) {
      push({ code: 'CLOSED_NO_PAYOFF', severity: 'FAIL', ids: [it.id], message: `${tag} 标记已回收但没填回收集`, fix: '补 payoffEp，或改回 active' });
    }
    if (it.status !== 'closed' && it.payoffEp !== undefined) {
      push({ code: 'PAYOFF_ON_OPEN', severity: 'FAIL', ids: [it.id], message: `${tag} 状态是 ${it.status} 却填了回收集 E${it.payoffEp}`, fix: '已回收就改 status=closed，没回收就清空 payoffEp' });
    }
    if (it.plantEp > latestEp || (it.payoffEp !== undefined && it.payoffEp > latestEp)) {
      push({ code: 'FUTURE_EP', severity: 'FAIL', ids: [it.id], message: `${tag} 的埋设/回收集超过当前最新 E${latestEp}`, fix: '计划中的回收写 plannedPayoffEp，不要写 payoffEp' });
    }
    if (it.payoffEp !== undefined) {
      const gap = it.payoffEp - it.plantEp;
      if (gap < 0) {
        push({ code: 'PAYOFF_BEFORE_PLANT', severity: 'FAIL', ids: [it.id], message: `${tag} 回收集 E${it.payoffEp} 早于埋设集 E${it.plantEp}`, fix: '检查集数是否填反' });
      } else if (gap < thresholds.minFermentEps) {
        push({ code: 'PAYOFF_TOO_FAST', severity: 'WARN', ids: [it.id], message: `${tag} 埋于 E${it.plantEp}、收于 E${it.payoffEp}，只发酵了 ${gap} 集（建议 ≥${thresholds.minFermentEps}）`, fix: '可保留，但同类伏笔下次至少隔一集再回收' });
      }
    }
    if (it.status === 'active') {
      const last = Math.max(it.plantEp, it.lastAdvancedEp ?? 0, seenAt.get(it.id) ?? 0);
      const idle = latestEp - last;
      if (idle > thresholds.maxIdleEps) {
        push({ code: 'STALE', severity: 'FAIL', ids: [it.id], message: `${tag} 最近推进在 E${last}，已悬置 ${idle} 集（上限 ${thresholds.maxIdleEps}）`, fix: '插一次推进/回收，或人工决定标记 dropped' });
      }
    }
  }

  const active = [...byId.values()].filter((i) => i.status === 'active');
  for (const [grade, cap] of [['S', thresholds.maxActiveS], ['A', thresholds.maxActiveA]] as const) {
    const ids = active.filter((i) => i.priority === grade).map((i) => i.id);
    if (ids.length > cap) {
      push({ code: 'CONCURRENCY', severity: 'WARN', ids, message: `${grade} 级活跃伏笔 ${ids.length} 条，超过上限 ${cap}`, fix: `优先回收或降级其中 ${ids.length - cap} 条` });
    }
  }

  const all = [...byId.values()];
  return {
    verdict: findings.some((x) => x.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      total: all.length,
      active: active.length,
      closed: all.filter((i) => i.status === 'closed').length,
      dropped: all.filter((i) => i.status === 'dropped').length,
      latestEp,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
