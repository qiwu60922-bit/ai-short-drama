/**
 * V12 · Conflict × Foreshadow Link Gate (冲突欠账兑现 × 伏笔兑现 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《帐中香》: 冲突当场兑现常与 S/A 伏笔 payoff 同集.
 *  - conflict-payoff 管 open→payoff；foreshadow-ledger 管 plant→payoff——本 gate 硬联表.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_CONFLICT / UNKNOWN_FORESHADOW / FUTURE_EP
 *  CHILD_CONFLICT_FAIL / CHILD_FORESHADOW_FAIL
 *  EP_NOT_DUAL_PAYOFF — link.ep = conflict.payoffEp = item.payoffEp
 *  CONFLICT_WITHOUT_FORESHADOW / FORESHADOW_WITHOUT_CONFLICT
 *  PENDING_CONFLICT (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  ConflictEntrySchema,
  evaluateConflictPayoffGap,
} from './conflict-payoff-gap-gate';
import {
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
} from './foreshadow-ledger-gate';

const Ep = z.number().int().positive();

export const ConflictForeshadowLinkEntrySchema = z.object({
  id: z.string().min(1),
  conflictId: z.string().min(1),
  foreshadowId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const ConflictForeshadowLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  conflicts: z.array(ConflictEntrySchema),
  items: z.array(ForeshadowItemSchema),
  links: z.array(ConflictForeshadowLinkEntrySchema),
});

export type ConflictForeshadowLinkLedger = z.infer<typeof ConflictForeshadowLinkLedgerSchema>;

export type ConflictForeshadowLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_CONFLICT'
    | 'UNKNOWN_FORESHADOW'
    | 'FUTURE_EP'
    | 'CHILD_CONFLICT_FAIL'
    | 'CHILD_FORESHADOW_FAIL'
    | 'EP_NOT_DUAL_PAYOFF'
    | 'CONFLICT_WITHOUT_FORESHADOW'
    | 'FORESHADOW_WITHOUT_CONFLICT'
    | 'PENDING_CONFLICT';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface ConflictForeshadowLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    conflicts: number;
    items: number;
    latestEp: number;
  };
  findings: ConflictForeshadowLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateConflictForeshadowLink(input: unknown): ConflictForeshadowLinkReport {
  const parsed = ConflictForeshadowLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, conflicts: 0, items: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, conflicts, items, links } = parsed.data;
  const findings: ConflictForeshadowLinkFinding[] = [];
  const push = (x: ConflictForeshadowLinkFinding) => findings.push(x);

  const cReport = evaluateConflictPayoffGap({ series, latestEp, conflicts });
  if (cReport.verdict === 'FAIL') {
    const childFails = cReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_CONFLICT_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌冲突账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 conflict-payoff-gap-gate',
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

  const byC = new Map(conflicts.map((c) => [c.id, c]));
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
    const conflict = byC.get(link.conflictId);
    if (!conflict) {
      push({
        code: 'UNKNOWN_CONFLICT',
        severity: 'FAIL',
        ids: [link.id, link.conflictId],
        message: `联表 ${link.id} 引用未知 conflict ${link.conflictId}`,
        fix: 'conflictId 须存在于 conflicts[]',
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
      conflict.payoffEp === undefined ||
      item.payoffEp === undefined ||
      link.ep !== conflict.payoffEp ||
      link.ep !== item.payoffEp
    ) {
      push({
        code: 'EP_NOT_DUAL_PAYOFF',
        severity: 'FAIL',
        ids: [link.id, conflict.id, item.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 cPayoff=${conflict.payoffEp ?? '无'}/fs=${item.payoffEp ?? '无'}`,
        fix: '冲突 payoff 须踩伏笔 payoffEp',
      });
      continue;
    }

    pairedC.add(conflict.id);
    pairedItems.add(item.id);
    aligned += 1;
  }

  for (const c of conflicts) {
    if (c.payoffEp !== undefined && !pairedC.has(c.id)) {
      push({
        code: 'CONFLICT_WITHOUT_FORESHADOW',
        severity: 'FAIL',
        ids: [c.id],
        message: `conflict ${c.id} payoffEp=E${c.payoffEp} 无 foreshadow 联表`,
        fix: '为冲突兑现集挂 ConflictForeshadowLink',
      });
    } else if (!pairedC.has(c.id)) {
      push({
        code: 'PENDING_CONFLICT',
        severity: 'WARN',
        ids: [c.id],
        message: `conflict ${c.id} 尚未联表到 foreshadow`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const it of items) {
    if (it.payoffEp !== undefined && !pairedItems.has(it.id)) {
      push({
        code: 'FORESHADOW_WITHOUT_CONFLICT',
        severity: 'FAIL',
        ids: [it.id],
        message: `foreshadow ${it.id} payoffEp=E${it.payoffEp} 无 conflict 联表`,
        fix: '在 links[] 挂 conflictId↔foreshadowId',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      conflicts: conflicts.length,
      items: items.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
