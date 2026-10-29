/**
 * V12 · Cliff-Cascade × Foreshadow Link Gate (跨集悬念叠钩 × 伏笔兑现 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《伪人降临》/密爽向: 跨集悬念叠钩常踩 S/A 伏笔 payoff 窗.
 *  - 与 foreshadowCliffLink（foreshadow 主键）互补：本 gate 以 cliff 为主键强制「有 cliff 须对齐 payoff」。
 *
 *  SCHEMA / DUP_ID / UNKNOWN_FORESHADOW / UNKNOWN_CLIFF / FUTURE_EP
 *  CHILD_FORESHADOW_FAIL / CHILD_CASCADE_FAIL
 *  EP_NOT_PAYOFF_NEXT — link.ep = payoffEp = cliff.nextEp
 *  CLIFF_WITHOUT_FORESHADOW / PAYOFF_WITHOUT_CLIFF
 *  PENDING_CLIFF (WARN)
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

export const CliffForeshadowLinkEntrySchema = z.object({
  id: z.string().min(1),
  cliffLinkId: z.string().min(1),
  foreshadowId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const CliffForeshadowLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  items: z.array(ForeshadowItemSchema),
  links: z.array(CliffForeshadowLinkEntrySchema),
});

export type CliffForeshadowLinkLedger = z.infer<typeof CliffForeshadowLinkLedgerSchema>;

export type CliffForeshadowLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_FORESHADOW'
    | 'UNKNOWN_CLIFF'
    | 'FUTURE_EP'
    | 'CHILD_FORESHADOW_FAIL'
    | 'CHILD_CASCADE_FAIL'
    | 'EP_NOT_PAYOFF_NEXT'
    | 'CLIFF_WITHOUT_FORESHADOW'
    | 'PAYOFF_WITHOUT_CLIFF'
    | 'PENDING_CLIFF';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface CliffForeshadowLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    items: number;
    cliffLinks: number;
    latestEp: number;
  };
  findings: CliffForeshadowLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateCliffForeshadowLink(input: unknown): CliffForeshadowLinkReport {
  const parsed = CliffForeshadowLinkLedgerSchema.safeParse(input);
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
  const findings: CliffForeshadowLinkFinding[] = [];
  const push = (x: CliffForeshadowLinkFinding) => findings.push(x);

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

  const cascade = evaluateCliffCascadeLink({ series, latestEp, links: cliffLinks });
  if (cascade.verdict === 'FAIL') {
    const childFails = cascade.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_CASCADE_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌 cliff-cascade FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 cliff-cascade-link-gate',
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
  const byCliff = new Map(cliffLinks.map((c) => [c.id, c]));
  const pairedC = new Set<string>();
  const pairedF = new Set<string>();
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
    const cliff = byCliff.get(link.cliffLinkId);
    if (!cliff) {
      push({
        code: 'UNKNOWN_CLIFF',
        severity: 'FAIL',
        ids: [link.id, link.cliffLinkId],
        message: `联表 ${link.id} 引用未知 cliff ${link.cliffLinkId}`,
        fix: 'cliffLinkId 须存在于 cliffLinks[]',
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

    if (
      item.payoffEp === undefined ||
      link.ep !== item.payoffEp ||
      link.ep !== cliff.nextEp
    ) {
      push({
        code: 'EP_NOT_PAYOFF_NEXT',
        severity: 'FAIL',
        ids: [link.id, item.id, cliff.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 payoff=${item.payoffEp ?? '无'}/nextEp=${cliff.nextEp}`,
        fix: 'link.ep = payoffEp = cliff.nextEp',
      });
      continue;
    }

    pairedC.add(cliff.id);
    pairedF.add(item.id);
    aligned += 1;
  }

  for (const c of cliffLinks) {
    if (!pairedC.has(c.id)) {
      push({
        code: 'CLIFF_WITHOUT_FORESHADOW',
        severity: 'FAIL',
        ids: [c.id],
        message: `cliff ${c.id} nextEp=E${c.nextEp} 无 cliff×foreshadow 联表`,
        fix: '为叠钩集挂 CliffForeshadowLink',
      });
    }
  }
  for (const it of items) {
    if (it.payoffEp !== undefined && !pairedF.has(it.id)) {
      push({
        code: 'PAYOFF_WITHOUT_CLIFF',
        severity: 'FAIL',
        ids: [it.id],
        message: `foreshadow ${it.id} payoffEp=E${it.payoffEp} 无 cliff×foreshadow 联表`,
        fix: '为兑现集挂 CliffForeshadowLink',
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
