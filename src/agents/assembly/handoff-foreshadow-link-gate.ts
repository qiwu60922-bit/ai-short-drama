/**
 * V12 · Handoff × Foreshadow Link Gate (集间承接 × 伏笔兑现 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《持械入宋》: 伏笔 payoff 常卡在悬念上一集交给下集.
 *  - 与 foreshadowHandoffLink（foreshadow 主键）互补：本 gate 以 handoff 为主键硬对齐.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_HANDOFF / UNKNOWN_FORESHADOW / FUTURE_EP
 *  CHILD_HANDOFF_FAIL / CHILD_FORESHADOW_FAIL
 *  EP_NOT_PREV_PAYOFF — link.ep = handoff.prevEp = payoffEp
 *  HANDOFF_WITHOUT_FORESHADOW / PAYOFF_WITHOUT_HANDOFF
 *  PENDING_FORESHADOW (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import {
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
} from './foreshadow-ledger-gate';
import { evaluateCliffhangerHandoff } from './cliffhanger-handoff-gate';

const Ep = z.number().int().positive();

export const HandoffForeshadowHandoffEntrySchema = z.object({
  id: z.string().min(1),
  prevEp: Ep,
  nextEp: Ep,
  prev: ShotSpecDocSchema,
  next: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const HandoffForeshadowLinkEntrySchema = z.object({
  id: z.string().min(1),
  handoffId: z.string().min(1),
  foreshadowId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const HandoffForeshadowLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  handoffs: z.array(HandoffForeshadowHandoffEntrySchema),
  items: z.array(ForeshadowItemSchema),
  links: z.array(HandoffForeshadowLinkEntrySchema),
});

export type HandoffForeshadowLinkLedger = z.infer<typeof HandoffForeshadowLinkLedgerSchema>;

export type HandoffForeshadowLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_HANDOFF'
    | 'UNKNOWN_FORESHADOW'
    | 'FUTURE_EP'
    | 'CHILD_HANDOFF_FAIL'
    | 'CHILD_FORESHADOW_FAIL'
    | 'EP_NOT_PREV_PAYOFF'
    | 'HANDOFF_WITHOUT_FORESHADOW'
    | 'PAYOFF_WITHOUT_HANDOFF'
    | 'PENDING_FORESHADOW';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface HandoffForeshadowLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    handoffs: number;
    items: number;
    latestEp: number;
  };
  findings: HandoffForeshadowLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateHandoffForeshadowLink(input: unknown): HandoffForeshadowLinkReport {
  const parsed = HandoffForeshadowLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, handoffs: 0, items: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, handoffs, items, links } = parsed.data;
  const findings: HandoffForeshadowLinkFinding[] = [];
  const push = (x: HandoffForeshadowLinkFinding) => findings.push(x);

  for (const h of handoffs) {
    const r = evaluateCliffhangerHandoff(h.prev, h.next);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_HANDOFF_FAIL',
        severity: 'FAIL',
        ids: [h.id, ...childFails.flatMap((f) => f.shotIds ?? [])],
        message: `handoff ${h.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 cliffhanger-handoff-gate',
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

  const byH = new Map(handoffs.map((h) => [h.id, h]));
  const byItem = new Map(items.map((it) => [it.id, it]));
  const pairedH = new Set<string>();
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
    const handoff = byH.get(link.handoffId);
    if (!handoff) {
      push({
        code: 'UNKNOWN_HANDOFF',
        severity: 'FAIL',
        ids: [link.id, link.handoffId],
        message: `联表 ${link.id} 引用未知 handoff ${link.handoffId}`,
        fix: 'handoffId 须存在于 handoffs[]',
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
      link.ep !== handoff.prevEp ||
      link.ep !== item.payoffEp
    ) {
      push({
        code: 'EP_NOT_PREV_PAYOFF',
        severity: 'FAIL',
        ids: [link.id, handoff.id, item.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 prev=${handoff.prevEp}/fs=${item.payoffEp ?? '无'}`,
        fix: 'handoff.prevEp 须踩伏笔 payoff 同集',
      });
      continue;
    }

    pairedH.add(handoff.id);
    pairedItems.add(item.id);
    aligned += 1;
  }

  for (const h of handoffs) {
    if (!pairedH.has(h.id)) {
      push({
        code: 'HANDOFF_WITHOUT_FORESHADOW',
        severity: 'FAIL',
        ids: [h.id],
        message: `handoff ${h.id} 无 foreshadow 联表`,
        fix: '为承接集挂 HandoffForeshadowLink',
      });
    }
  }
  for (const it of items) {
    if (it.payoffEp !== undefined && !pairedItems.has(it.id)) {
      push({
        code: 'PAYOFF_WITHOUT_HANDOFF',
        severity: 'FAIL',
        ids: [it.id],
        message: `foreshadow ${it.id} payoffEp=E${it.payoffEp} 无 handoff 联表`,
        fix: '为伏笔兑现集挂 HandoffForeshadowLink',
      });
    } else if (!pairedItems.has(it.id)) {
      push({
        code: 'PENDING_FORESHADOW',
        severity: 'WARN',
        ids: [it.id],
        message: `foreshadow ${it.id} 尚未联表到 handoff`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      handoffs: handoffs.length,
      items: items.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
