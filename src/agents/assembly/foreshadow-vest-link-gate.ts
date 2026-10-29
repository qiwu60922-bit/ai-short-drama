/**
 * V12 · Foreshadow × Identity-Vest Link Gate (伏笔兑现 × 马甲掉落 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《机长先生》: S/A 伏笔 payoff 常与掉马甲同集，避免空壳揭晓.
 *  - foreshadow-ledger 管 plant→payoff；identity-vest 管 plant→drop——本 gate 硬对齐.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_FORESHADOW / UNKNOWN_VEST
 *  CHILD_FORESHADOW_FAIL / CHILD_VEST_FAIL
 *  PAYOFF_NOT_AT_DROP — payoffEp 须等于 dropEp
 *  DROP_WITHOUT_FORESHADOW / PAYOFF_WITHOUT_VEST
 *  PENDING_VEST (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
} from './foreshadow-ledger-gate';
import {
  IdentityVestEntrySchema,
  evaluateIdentityVest,
} from './identity-vest-gate';

const Ep = z.number().int().positive();

export const ForeshadowVestLinkEntrySchema = z.object({
  id: z.string().min(1),
  foreshadowId: z.string().min(1),
  vestId: z.string().min(1),
  note: z.string().optional(),
});

export const ForeshadowVestLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  items: z.array(ForeshadowItemSchema),
  vests: z.array(IdentityVestEntrySchema),
  links: z.array(ForeshadowVestLinkEntrySchema),
});

export type ForeshadowVestLinkLedger = z.infer<typeof ForeshadowVestLinkLedgerSchema>;

export type ForeshadowVestLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_FORESHADOW'
    | 'UNKNOWN_VEST'
    | 'CHILD_FORESHADOW_FAIL'
    | 'CHILD_VEST_FAIL'
    | 'PAYOFF_NOT_AT_DROP'
    | 'DROP_WITHOUT_FORESHADOW'
    | 'PAYOFF_WITHOUT_VEST'
    | 'PENDING_VEST';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface ForeshadowVestLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    items: number;
    vests: number;
    latestEp: number;
  };
  findings: ForeshadowVestLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateForeshadowVestLink(input: unknown): ForeshadowVestLinkReport {
  const parsed = ForeshadowVestLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, items: 0, vests: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, items, vests, links } = parsed.data;
  const findings: ForeshadowVestLinkFinding[] = [];
  const push = (x: ForeshadowVestLinkFinding) => findings.push(x);

  const fsReport = evaluateForeshadowLedger({ series, latestEp, items });
  if (fsReport.verdict === 'FAIL') {
    const childFails = fsReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_FORESHADOW_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌伏笔账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 foreshadow-ledger-gate',
    });
  }

  const vReport = evaluateIdentityVest({ series, latestEp, entries: vests });
  if (vReport.verdict === 'FAIL') {
    const childFails = vReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_VEST_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌马甲账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 identity-vest-gate',
    });
  }

  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const l of links) {
    if (seen.has(l.id)) dups.add(l.id);
    else seen.add(l.id);
  }
  for (const id of dups) {
    push({ code: 'DUP_ID', severity: 'FAIL', ids: [id], message: `联表ID重复：${id}`, fix: '联表 id 须唯一' });
  }

  const byItem = new Map(items.map((it) => [it.id, it]));
  const byVest = new Map(vests.map((v) => [v.id, v]));
  const pairedItems = new Set<string>();
  const pairedVests = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const item = byItem.get(link.foreshadowId);
    if (!item) {
      push({
        code: 'UNKNOWN_FORESHADOW',
        severity: 'FAIL',
        ids: [link.id, link.foreshadowId],
        message: `联表 ${link.id} 引用未知 foreshadow ${link.foreshadowId}`,
        fix: 'foreshadowId 须存在于 items[]',
      });
      continue;
    }
    const vest = byVest.get(link.vestId);
    if (!vest) {
      push({
        code: 'UNKNOWN_VEST',
        severity: 'FAIL',
        ids: [link.id, link.vestId],
        message: `联表 ${link.id} 引用未知 vest ${link.vestId}`,
        fix: 'vestId 须存在于 vests[]',
      });
      continue;
    }
    pairedItems.add(item.id);
    pairedVests.add(vest.id);

    if (item.payoffEp === undefined || vest.dropEp === undefined || item.payoffEp !== vest.dropEp) {
      push({
        code: 'PAYOFF_NOT_AT_DROP',
        severity: 'FAIL',
        ids: [link.id, item.id, vest.id],
        message: `${link.id}: payoffEp=${item.payoffEp ?? '无'} ≠ dropEp=${vest.dropEp ?? '无'}`,
        fix: '伏笔兑现须对准掉马甲集',
      });
      continue;
    }

    aligned += 1;
  }

  for (const v of vests) {
    if (v.dropEp !== undefined && !pairedVests.has(v.id)) {
      push({
        code: 'DROP_WITHOUT_FORESHADOW',
        severity: 'FAIL',
        ids: [v.id],
        message: `vest ${v.id} dropEp=E${v.dropEp} 无 foreshadow 联表`,
        fix: '在 links[] 挂 foreshadowId↔vestId',
      });
    } else if (!pairedVests.has(v.id)) {
      push({
        code: 'PENDING_VEST',
        severity: 'WARN',
        ids: [v.id],
        message: `vest ${v.id} 尚未联表到 foreshadow`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const it of items) {
    if (it.payoffEp !== undefined && !pairedItems.has(it.id)) {
      push({
        code: 'PAYOFF_WITHOUT_VEST',
        severity: 'FAIL',
        ids: [it.id],
        message: `foreshadow ${it.id} payoffEp=E${it.payoffEp} 无 vest 联表`,
        fix: '在 links[] 挂 foreshadowId↔vestId',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      items: items.length,
      vests: vests.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
