/**
 * V12 · Reveal × Foreshadow Link Gate (伪装揭穿 × 伏笔兑现 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - mask reveal 常与 S/A 伏笔 payoff 同集.
 *  - 与 maskForeshadowLink 互补：本 gate 以 reveal 为主键命名.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_REVEAL / UNKNOWN_FORESHADOW / FUTURE_EP
 *  CHILD_REVEAL_FAIL / CHILD_FORESHADOW_FAIL
 *  EP_NOT_PAYOFF_REVEAL — link.ep = revealEp = payoffEp
 *  REVEAL_WITHOUT_FORESHADOW / PAYOFF_WITHOUT_REVEAL
 *  PENDING_REVEAL / PENDING_FORESHADOW (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  PersonaMaskEntrySchema,
  evaluatePersonaMask,
} from './persona-mask-gate';
import {
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
} from './foreshadow-ledger-gate';

const Ep = z.number().int().positive();

export const RevealForeshadowLinkEntrySchema = z.object({
  id: z.string().min(1),
  revealId: z.string().min(1),
  foreshadowId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const RevealForeshadowLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  reveals: z.array(PersonaMaskEntrySchema),
  items: z.array(ForeshadowItemSchema),
  links: z.array(RevealForeshadowLinkEntrySchema),
});

export type RevealForeshadowLinkLedger = z.infer<typeof RevealForeshadowLinkLedgerSchema>;

export type RevealForeshadowLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_REVEAL'
    | 'UNKNOWN_FORESHADOW'
    | 'FUTURE_EP'
    | 'CHILD_REVEAL_FAIL'
    | 'CHILD_FORESHADOW_FAIL'
    | 'EP_NOT_PAYOFF_REVEAL'
    | 'REVEAL_WITHOUT_FORESHADOW'
    | 'PAYOFF_WITHOUT_REVEAL'
    | 'PENDING_REVEAL'
    | 'PENDING_FORESHADOW';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface RevealForeshadowLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    reveals: number;
    items: number;
    latestEp: number;
  };
  findings: RevealForeshadowLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateRevealForeshadowLink(input: unknown): RevealForeshadowLinkReport {
  const parsed = RevealForeshadowLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, reveals: 0, items: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, reveals, items, links } = parsed.data;
  const findings: RevealForeshadowLinkFinding[] = [];
  const push = (x: RevealForeshadowLinkFinding) => findings.push(x);

  const rReport = evaluatePersonaMask({ series, latestEp, entries: reveals });
  if (rReport.verdict === 'FAIL') {
    const childFails = rReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_REVEAL_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌揭穿账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 persona-mask-gate',
    });
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

  const byR = new Map(reveals.map((r) => [r.id, r]));
  const byItem = new Map(items.map((it) => [it.id, it]));
  const pairedR = new Set<string>();
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
    const reveal = byR.get(link.revealId);
    if (!reveal) {
      push({
        code: 'UNKNOWN_REVEAL',
        severity: 'FAIL',
        ids: [link.id, link.revealId],
        message: `联表 ${link.id} 引用未知 reveal ${link.revealId}`,
        fix: 'revealId 须存在于 reveals[]',
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
      reveal.revealEp === undefined ||
      item.payoffEp === undefined ||
      link.ep !== reveal.revealEp ||
      link.ep !== item.payoffEp
    ) {
      push({
        code: 'EP_NOT_PAYOFF_REVEAL',
        severity: 'FAIL',
        ids: [link.id, reveal.id, item.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 reveal=${reveal.revealEp ?? '无'}/fs=${item.payoffEp ?? '无'}`,
        fix: '伏笔 payoff 须踩揭穿同集',
      });
      continue;
    }

    pairedR.add(reveal.id);
    pairedItems.add(item.id);
    aligned += 1;
  }

  for (const reveal of reveals) {
    if (reveal.revealEp !== undefined && !pairedR.has(reveal.id)) {
      push({
        code: 'REVEAL_WITHOUT_FORESHADOW',
        severity: 'FAIL',
        ids: [reveal.id],
        message: `reveal ${reveal.id} revealEp=E${reveal.revealEp} 无 foreshadow 联表`,
        fix: '为揭穿集挂 RevealForeshadowLink',
      });
    } else if (!pairedR.has(reveal.id)) {
      push({
        code: 'PENDING_REVEAL',
        severity: 'WARN',
        ids: [reveal.id],
        message: `reveal ${reveal.id} 尚未联表到 foreshadow`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const it of items) {
    if (it.payoffEp !== undefined && !pairedItems.has(it.id)) {
      push({
        code: 'PAYOFF_WITHOUT_REVEAL',
        severity: 'FAIL',
        ids: [it.id],
        message: `foreshadow ${it.id} payoffEp=E${it.payoffEp} 无 reveal 联表`,
        fix: '为伏笔兑现集挂 RevealForeshadowLink',
      });
    } else if (!pairedItems.has(it.id)) {
      push({
        code: 'PENDING_FORESHADOW',
        severity: 'WARN',
        ids: [it.id],
        message: `foreshadow ${it.id} 尚未联表到 reveal`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      reveals: reveals.length,
      items: items.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
