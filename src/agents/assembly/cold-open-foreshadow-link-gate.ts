/**
 * V12 · Cold-Open × Foreshadow Link Gate (冷开钩 × 伏笔兑现 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 冷开快入常与 S/A 伏笔 payoff 同集种下或兑现.
 *
 * coldOpens[]: { id, ep, shotSpec }
 *  SCHEMA / DUP_ID / UNKNOWN_COLD_OPEN / UNKNOWN_FORESHADOW / FUTURE_EP
 *  CHILD_COLD_OPEN_FAIL / CHILD_FORESHADOW_FAIL
 *  EP_NOT_PAYOFF — link.ep = coldOpen.ep = payoffEp
 *  COLD_OPEN_WITHOUT_FORESHADOW / PAYOFF_WITHOUT_COLD_OPEN
 *  PENDING_FORESHADOW (WARN)
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

export const ColdOpenForeshadowColdOpenEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const ColdOpenForeshadowLinkEntrySchema = z.object({
  id: z.string().min(1),
  coldOpenId: z.string().min(1),
  foreshadowId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const ColdOpenForeshadowLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  coldOpens: z.array(ColdOpenForeshadowColdOpenEntrySchema),
  items: z.array(ForeshadowItemSchema),
  links: z.array(ColdOpenForeshadowLinkEntrySchema),
});

export type ColdOpenForeshadowLinkLedger = z.infer<typeof ColdOpenForeshadowLinkLedgerSchema>;

export type ColdOpenForeshadowLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_COLD_OPEN'
    | 'UNKNOWN_FORESHADOW'
    | 'FUTURE_EP'
    | 'CHILD_COLD_OPEN_FAIL'
    | 'CHILD_FORESHADOW_FAIL'
    | 'EP_NOT_PAYOFF'
    | 'COLD_OPEN_WITHOUT_FORESHADOW'
    | 'PAYOFF_WITHOUT_COLD_OPEN'
    | 'PENDING_FORESHADOW';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface ColdOpenForeshadowLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    coldOpens: number;
    items: number;
    latestEp: number;
  };
  findings: ColdOpenForeshadowLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateColdOpenForeshadowLink(input: unknown): ColdOpenForeshadowLinkReport {
  const parsed = ColdOpenForeshadowLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, coldOpens: 0, items: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, coldOpens, items, links } = parsed.data;
  const findings: ColdOpenForeshadowLinkFinding[] = [];
  const push = (x: ColdOpenForeshadowLinkFinding) => findings.push(x);

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

  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const l of links) {
    if (seen.has(l.id)) dups.add(l.id);
    else seen.add(l.id);
  }
  for (const id of dups) {
    push({ code: 'DUP_ID', severity: 'FAIL', ids: [id], message: `联表ID重复：${id}`, fix: '联表 id 须唯一' });
  }

  const byC = new Map(coldOpens.map((c) => [c.id, c]));
  const byItem = new Map(items.map((it) => [it.id, it]));
  const pairedC = new Set<string>();
  const pairedItems = new Set<string>();
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

    if (item.payoffEp === undefined || link.ep !== item.payoffEp || link.ep !== co.ep) {
      push({
        code: 'EP_NOT_PAYOFF',
        severity: 'FAIL',
        ids: [link.id, co.id, item.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 coldOpen=${co.ep}/fs=${item.payoffEp ?? '无'}`,
        fix: '伏笔 payoff 须踩冷开同集',
      });
      continue;
    }

    pairedC.add(co.id);
    pairedItems.add(item.id);
    aligned += 1;
  }

  for (const co of coldOpens) {
    if (!pairedC.has(co.id)) {
      push({
        code: 'COLD_OPEN_WITHOUT_FORESHADOW',
        severity: 'FAIL',
        ids: [co.id],
        message: `coldOpen ${co.id} 无 foreshadow 联表`,
        fix: '为冷开挂 ColdOpenForeshadowLink',
      });
    }
  }
  for (const it of items) {
    if (it.payoffEp !== undefined && !pairedItems.has(it.id)) {
      push({
        code: 'PAYOFF_WITHOUT_COLD_OPEN',
        severity: 'FAIL',
        ids: [it.id],
        message: `foreshadow ${it.id} payoffEp=E${it.payoffEp} 无 coldOpen 联表`,
        fix: '为伏笔兑现集挂 ColdOpenForeshadowLink',
      });
    } else if (!pairedItems.has(it.id)) {
      push({
        code: 'PENDING_FORESHADOW',
        severity: 'WARN',
        ids: [it.id],
        message: `foreshadow ${it.id} 尚未联表到 coldOpen`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      coldOpens: coldOpens.length,
      items: items.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
