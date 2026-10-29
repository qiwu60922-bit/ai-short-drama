/**
 * V12 · Foreshadow × Cold-Open Link Gate (伏笔兑现 × 冷开钩 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 伏笔 payoff 当集常冷开快入抛钩.
 *  - 与 vestColdOpenLink / foreshadowVestLink 互补：本 gate 以 foreshadow 联 coldOpen.
 *
 * coldOpens[]: { id, ep, shotSpec }
 *  SCHEMA / DUP_ID / UNKNOWN_FORESHADOW / UNKNOWN_COLD_OPEN / FUTURE_EP
 *  CHILD_FORESHADOW_FAIL / CHILD_COLD_OPEN_FAIL
 *  EP_NOT_PAYOFF — link.ep = payoffEp = coldOpen.ep
 *  PAYOFF_WITHOUT_COLD / COLD_OPEN_WITHOUT_FORESHADOW
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { evaluateColdOpenHook } from './cold-open-hook-gate';
import {
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
} from './foreshadow-ledger-gate';

const Ep = z.number().int().positive();

export const ForeshadowColdOpenColdOpenEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const ForeshadowColdOpenLinkEntrySchema = z.object({
  id: z.string().min(1),
  foreshadowId: z.string().min(1),
  coldOpenId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const ForeshadowColdOpenLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  items: z.array(ForeshadowItemSchema),
  coldOpens: z.array(ForeshadowColdOpenColdOpenEntrySchema),
  links: z.array(ForeshadowColdOpenLinkEntrySchema),
});

export type ForeshadowColdOpenLinkLedger = z.infer<typeof ForeshadowColdOpenLinkLedgerSchema>;

export type ForeshadowColdOpenLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_FORESHADOW'
    | 'UNKNOWN_COLD_OPEN'
    | 'FUTURE_EP'
    | 'CHILD_FORESHADOW_FAIL'
    | 'CHILD_COLD_OPEN_FAIL'
    | 'EP_NOT_PAYOFF'
    | 'PAYOFF_WITHOUT_COLD'
    | 'COLD_OPEN_WITHOUT_FORESHADOW';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface ForeshadowColdOpenLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    items: number;
    coldOpens: number;
    latestEp: number;
  };
  findings: ForeshadowColdOpenLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateForeshadowColdOpenLink(input: unknown): ForeshadowColdOpenLinkReport {
  const parsed = ForeshadowColdOpenLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, items: 0, coldOpens: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, items, coldOpens, links } = parsed.data;
  const findings: ForeshadowColdOpenLinkFinding[] = [];
  const push = (x: ForeshadowColdOpenLinkFinding) => findings.push(x);

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

  for (const co of coldOpens) {
    const r = evaluateColdOpenHook(co.shotSpec);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_COLD_OPEN_FAIL',
        severity: 'FAIL',
        ids: [co.id, ...childFails.flatMap((f) => f.shotIds ?? [])],
        message: `coldOpen ${co.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 cold-open-hook-gate',
      });
    }
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

  const byF = new Map(items.map((i) => [i.id, i]));
  const byC = new Map(coldOpens.map((c) => [c.id, c]));
  const pairedF = new Set<string>();
  const pairedC = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    if (link.ep > latestEp) {
      push({
        code: 'FUTURE_EP',
        severity: 'FAIL',
        ids: [link.id],
        message: `${link.id} ep=E${link.ep} 超出 latestEp=E${latestEp}`,
        fix: '下调 link.ep 或上调 latestEp',
      });
    }
    const item = byF.get(link.foreshadowId);
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
    const co = byC.get(link.coldOpenId);
    if (!co) {
      push({
        code: 'UNKNOWN_COLD_OPEN',
        severity: 'FAIL',
        ids: [link.id, link.coldOpenId],
        message: `联表 ${link.id} 引用未知 coldOpen ${link.coldOpenId}`,
        fix: 'coldOpenId 须存在于 coldOpens[]',
      });
      continue;
    }

    if (item.payoffEp === undefined || link.ep !== item.payoffEp || link.ep !== co.ep) {
      push({
        code: 'EP_NOT_PAYOFF',
        severity: 'FAIL',
        ids: [link.id, item.id, co.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 payoff=${item.payoffEp ?? '无'}/coldOpen=${co.ep}`,
        fix: '伏笔兑现与冷开须同集',
      });
      continue;
    }

    pairedF.add(item.id);
    pairedC.add(co.id);
    aligned += 1;
  }

  for (const item of items) {
    if (item.payoffEp !== undefined && !pairedF.has(item.id)) {
      push({
        code: 'PAYOFF_WITHOUT_COLD',
        severity: 'FAIL',
        ids: [item.id],
        message: `foreshadow ${item.id} payoffEp=E${item.payoffEp} 无 coldOpen 联表`,
        fix: '为兑现挂 ForeshadowColdOpenLink',
      });
    }
  }
  for (const co of coldOpens) {
    if (!pairedC.has(co.id)) {
      push({
        code: 'COLD_OPEN_WITHOUT_FORESHADOW',
        severity: 'FAIL',
        ids: [co.id],
        message: `coldOpen ${co.id} 无 foreshadow 联表`,
        fix: '为冷开挂 ForeshadowColdOpenLink',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      items: items.length,
      coldOpens: coldOpens.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
