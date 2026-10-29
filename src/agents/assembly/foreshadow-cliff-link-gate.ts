/**
 * V12 · Foreshadow × Cliff-Cascade Link Gate (伏笔兑现 × 跨集悬念叠钩 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《伪人降临》/密爽向: S/A 伏笔 payoff 常踩下集 hook 承接窗.
 *  - foreshadow-ledger 管 plant→payoff；cliff-cascade 管 prev→next——本 gate 硬联表 payoff@nextEp.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_FORESHADOW / UNKNOWN_CLIFF / FUTURE_EP
 *  CHILD_FORESHADOW_FAIL / CHILD_CASCADE_FAIL
 *  EP_NOT_PAYOFF_NEXT — link.ep = payoffEp = cliff.nextEp
 *  PAYOFF_WITHOUT_CLIFF / CLIFF_WITHOUT_FORESHADOW
 *  PENDING_FORESHADOW (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
} from './foreshadow-ledger-gate';
import {
  CliffCascadeLinkEntrySchema,
  evaluateCliffCascadeLink,
} from './cliff-cascade-link-gate';

const Ep = z.number().int().positive();

export const ForeshadowCliffLinkEntrySchema = z.object({
  id: z.string().min(1),
  foreshadowId: z.string().min(1),
  cliffLinkId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const ForeshadowCliffLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  items: z.array(ForeshadowItemSchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  links: z.array(ForeshadowCliffLinkEntrySchema),
});

export type ForeshadowCliffLinkLedger = z.infer<typeof ForeshadowCliffLinkLedgerSchema>;

export type ForeshadowCliffLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_FORESHADOW'
    | 'UNKNOWN_CLIFF'
    | 'FUTURE_EP'
    | 'CHILD_FORESHADOW_FAIL'
    | 'CHILD_CASCADE_FAIL'
    | 'EP_NOT_PAYOFF_NEXT'
    | 'PAYOFF_WITHOUT_CLIFF'
    | 'CLIFF_WITHOUT_FORESHADOW'
    | 'PENDING_FORESHADOW';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface ForeshadowCliffLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    items: number;
    cliffLinks: number;
    latestEp: number;
  };
  findings: ForeshadowCliffLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateForeshadowCliffLink(input: unknown): ForeshadowCliffLinkReport {
  const parsed = ForeshadowCliffLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, items: 0, cliffLinks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, items, cliffLinks, links } = parsed.data;
  const findings: ForeshadowCliffLinkFinding[] = [];
  const push = (x: ForeshadowCliffLinkFinding) => findings.push(x);

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

  if (cliffLinks.length) {
    const cascade = evaluateCliffCascadeLink({ series, latestEp, links: cliffLinks });
    if (cascade.verdict === 'FAIL') {
      const childFails = cascade.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_CASCADE_FAIL',
        severity: 'FAIL',
        ids: childFails.flatMap((f) => f.ids ?? []),
        message: `内嵌 cliffCascade FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 cliff-cascade-link-gate',
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

  const byItem = new Map(items.map((it) => [it.id, it]));
  const byCliff = new Map(cliffLinks.map((c) => [c.id, c]));
  const pairedItems = new Set<string>();
  const pairedCliff = new Set<string>();
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
    const cliff = byCliff.get(link.cliffLinkId);
    if (!cliff) {
      push({
        code: 'UNKNOWN_CLIFF',
        severity: 'FAIL',
        ids: [link.id, link.cliffLinkId],
        message: `联表 ${link.id} 引用未知 cliffLink ${link.cliffLinkId}`,
        fix: 'cliffLinkId 须存在于 cliffLinks[]',
      });
      continue;
    }

    if (
      item.payoffEp === undefined ||
      link.ep !== item.payoffEp ||
      link.ep !== cliff.nextEp
    ) {
      push({
        code: 'EP_NOT_PAYOFF_NEXT',
        severity: 'FAIL',
        ids: [link.id, item.id, cliff.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 payoff=${item.payoffEp ?? '无'}/next=E${cliff.nextEp}`,
        fix: '伏笔兑现须踩 cliff.nextEp',
      });
      continue;
    }

    pairedItems.add(item.id);
    pairedCliff.add(cliff.id);
    aligned += 1;
  }

  for (const it of items) {
    if (it.payoffEp !== undefined && !pairedItems.has(it.id)) {
      push({
        code: 'PAYOFF_WITHOUT_CLIFF',
        severity: 'FAIL',
        ids: [it.id],
        message: `foreshadow ${it.id} payoffEp=E${it.payoffEp} 无 cliff 联表`,
        fix: '为兑现集挂 ForeshadowCliffLink',
      });
    } else if (!pairedItems.has(it.id)) {
      push({
        code: 'PENDING_FORESHADOW',
        severity: 'WARN',
        ids: [it.id],
        message: `foreshadow ${it.id} 尚未联表到 cliff`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const c of cliffLinks) {
    if (!pairedCliff.has(c.id)) {
      push({
        code: 'CLIFF_WITHOUT_FORESHADOW',
        severity: 'FAIL',
        ids: [c.id],
        message: `cliffLink ${c.id} 无 foreshadow 联表`,
        fix: '在 links[] 挂 foreshadowId↔cliffLinkId',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      items: items.length,
      cliffLinks: cliffLinks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
