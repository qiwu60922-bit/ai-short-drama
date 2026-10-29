/**
 * V12 · Foreshadow × Amnesia Link Gate (伏笔兑现 × 失忆唤回 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《反派拿捏》/《帐中香》: S/A 伏笔 payoff 常与失忆唤回同集.
 *  - foreshadow-ledger 管 plant→payoff；amnesia-arc 管 plant→recover——本 gate 硬对齐.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_FORESHADOW / UNKNOWN_AMNESIA / FUTURE_EP
 *  CHILD_FORESHADOW_FAIL / CHILD_AMNESIA_FAIL
 *  EP_NOT_PAYOFF_RECOVER — link.ep = item.payoffEp = recoverEp
 *  FORESHADOW_WITHOUT_AMNESIA / RECOVER_WITHOUT_FORESHADOW
 *  PENDING_FORESHADOW / PENDING_AMNESIA (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
} from './foreshadow-ledger-gate';
import {
  AmnesiaArcEntrySchema,
  evaluateAmnesiaArc,
} from './amnesia-arc-gate';

const Ep = z.number().int().positive();

export const ForeshadowAmnesiaLinkEntrySchema = z.object({
  id: z.string().min(1),
  foreshadowId: z.string().min(1),
  amnesiaId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const ForeshadowAmnesiaLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  items: z.array(ForeshadowItemSchema),
  amnesias: z.array(AmnesiaArcEntrySchema),
  links: z.array(ForeshadowAmnesiaLinkEntrySchema),
});

export type ForeshadowAmnesiaLinkLedger = z.infer<typeof ForeshadowAmnesiaLinkLedgerSchema>;

export type ForeshadowAmnesiaLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_FORESHADOW'
    | 'UNKNOWN_AMNESIA'
    | 'FUTURE_EP'
    | 'CHILD_FORESHADOW_FAIL'
    | 'CHILD_AMNESIA_FAIL'
    | 'EP_NOT_PAYOFF_RECOVER'
    | 'FORESHADOW_WITHOUT_AMNESIA'
    | 'RECOVER_WITHOUT_FORESHADOW'
    | 'PENDING_FORESHADOW'
    | 'PENDING_AMNESIA';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface ForeshadowAmnesiaLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    items: number;
    amnesias: number;
    latestEp: number;
  };
  findings: ForeshadowAmnesiaLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateForeshadowAmnesiaLink(input: unknown): ForeshadowAmnesiaLinkReport {
  const parsed = ForeshadowAmnesiaLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, items: 0, amnesias: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, items, amnesias, links } = parsed.data;
  const findings: ForeshadowAmnesiaLinkFinding[] = [];
  const push = (x: ForeshadowAmnesiaLinkFinding) => findings.push(x);

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

  const amReport = evaluateAmnesiaArc({ series, latestEp, entries: amnesias });
  if (amReport.verdict === 'FAIL') {
    const childFails = amReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_AMNESIA_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌失忆账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 amnesia-arc-gate',
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
  const byAm = new Map(amnesias.map((a) => [a.id, a]));
  const pairedItems = new Set<string>();
  const pairedAm = new Set<string>();
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
    const amnesia = byAm.get(link.amnesiaId);
    if (!amnesia) {
      push({
        code: 'UNKNOWN_AMNESIA',
        severity: 'FAIL',
        ids: [link.id, link.amnesiaId],
        message: `联表 ${link.id} 引用未知 amnesia ${link.amnesiaId}`,
        fix: 'amnesiaId 须存在于 amnesias[]',
      });
      continue;
    }

    if (
      item.payoffEp === undefined ||
      amnesia.recoverEp === undefined ||
      link.ep !== item.payoffEp ||
      link.ep !== amnesia.recoverEp
    ) {
      push({
        code: 'EP_NOT_PAYOFF_RECOVER',
        severity: 'FAIL',
        ids: [link.id, item.id, amnesia.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 fs=${item.payoffEp ?? '无'}/recover=${amnesia.recoverEp ?? '无'}`,
        fix: '伏笔 payoff 须踩失忆 recoverEp',
      });
      continue;
    }

    pairedItems.add(item.id);
    pairedAm.add(amnesia.id);
    aligned += 1;
  }

  for (const it of items) {
    if (it.payoffEp !== undefined && !pairedItems.has(it.id)) {
      push({
        code: 'FORESHADOW_WITHOUT_AMNESIA',
        severity: 'FAIL',
        ids: [it.id],
        message: `foreshadow ${it.id} payoffEp=E${it.payoffEp} 无 amnesia 联表`,
        fix: '为伏笔兑现集挂 ForeshadowAmnesiaLink',
      });
    } else if (!pairedItems.has(it.id)) {
      push({
        code: 'PENDING_FORESHADOW',
        severity: 'WARN',
        ids: [it.id],
        message: `foreshadow ${it.id} 尚未联表到 amnesia`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const am of amnesias) {
    if (am.recoverEp !== undefined && !pairedAm.has(am.id)) {
      push({
        code: 'RECOVER_WITHOUT_FORESHADOW',
        severity: 'FAIL',
        ids: [am.id],
        message: `amnesia ${am.id} recoverEp=E${am.recoverEp} 无 foreshadow 联表`,
        fix: '为唤回集挂 ForeshadowAmnesiaLink',
      });
    } else if (!pairedAm.has(am.id)) {
      push({
        code: 'PENDING_AMNESIA',
        severity: 'WARN',
        ids: [am.id],
        message: `amnesia ${am.id} 尚未联表到 foreshadow`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      items: items.length,
      amnesias: amnesias.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
