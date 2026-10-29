/**
 * V12 · Conflict × Cliff-Cascade Link Gate (冲突欠账兑现 × 跨集悬念叠钩 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《帐中香》/密爽向: 冲突当场兑现常踩下集 hook 承接窗，避免隔夜软重置.
 *  - conflict-payoff 管 open→payoff；cliff-cascade 管 prev→next——本 gate 硬联表 payoff@nextEp.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_CONFLICT / UNKNOWN_CLIFF / FUTURE_EP
 *  CHILD_CONFLICT_FAIL / CHILD_CASCADE_FAIL
 *  EP_NOT_PAYOFF_NEXT — link.ep = payoffEp = cliff.nextEp
 *  PAYOFF_WITHOUT_CLIFF / CLIFF_WITHOUT_CONFLICT
 *  PENDING_CONFLICT (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  ConflictEntrySchema,
  evaluateConflictPayoffGap,
} from './conflict-payoff-gap-gate';
import {
  CliffCascadeLinkEntrySchema,
  evaluateCliffCascadeLink,
} from './cliff-cascade-link-gate';

const Ep = z.number().int().positive();

export const ConflictCliffLinkEntrySchema = z.object({
  id: z.string().min(1),
  conflictId: z.string().min(1),
  cliffLinkId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const ConflictCliffLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  conflicts: z.array(ConflictEntrySchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  links: z.array(ConflictCliffLinkEntrySchema),
});

export type ConflictCliffLinkLedger = z.infer<typeof ConflictCliffLinkLedgerSchema>;

export type ConflictCliffLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_CONFLICT'
    | 'UNKNOWN_CLIFF'
    | 'FUTURE_EP'
    | 'CHILD_CONFLICT_FAIL'
    | 'CHILD_CASCADE_FAIL'
    | 'EP_NOT_PAYOFF_NEXT'
    | 'PAYOFF_WITHOUT_CLIFF'
    | 'CLIFF_WITHOUT_CONFLICT'
    | 'PENDING_CONFLICT';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface ConflictCliffLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    conflicts: number;
    cliffLinks: number;
    latestEp: number;
  };
  findings: ConflictCliffLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateConflictCliffLink(input: unknown): ConflictCliffLinkReport {
  const parsed = ConflictCliffLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, conflicts: 0, cliffLinks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, conflicts, cliffLinks, links } = parsed.data;
  const findings: ConflictCliffLinkFinding[] = [];
  const push = (x: ConflictCliffLinkFinding) => findings.push(x);

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

  const byC = new Map(conflicts.map((c) => [c.id, c]));
  const byCliff = new Map(cliffLinks.map((c) => [c.id, c]));
  const pairedC = new Set<string>();
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
      conflict.payoffEp === undefined ||
      link.ep !== conflict.payoffEp ||
      link.ep !== cliff.nextEp
    ) {
      push({
        code: 'EP_NOT_PAYOFF_NEXT',
        severity: 'FAIL',
        ids: [link.id, conflict.id, cliff.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 payoff=${conflict.payoffEp ?? '无'}/next=E${cliff.nextEp}`,
        fix: '冲突兑现须踩 cliff.nextEp',
      });
      continue;
    }

    pairedC.add(conflict.id);
    pairedCliff.add(cliff.id);
    aligned += 1;
  }

  for (const c of conflicts) {
    if (c.payoffEp !== undefined && !pairedC.has(c.id)) {
      push({
        code: 'PAYOFF_WITHOUT_CLIFF',
        severity: 'FAIL',
        ids: [c.id],
        message: `conflict ${c.id} payoffEp=E${c.payoffEp} 无 cliff 联表`,
        fix: '为兑现集挂 ConflictCliffLink',
      });
    } else if (!pairedC.has(c.id)) {
      push({
        code: 'PENDING_CONFLICT',
        severity: 'WARN',
        ids: [c.id],
        message: `conflict ${c.id} 尚未联表到 cliff`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const c of cliffLinks) {
    if (!pairedCliff.has(c.id)) {
      push({
        code: 'CLIFF_WITHOUT_CONFLICT',
        severity: 'FAIL',
        ids: [c.id],
        message: `cliffLink ${c.id} 无 conflict 联表`,
        fix: '在 links[] 挂 conflictId↔cliffLinkId',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      conflicts: conflicts.length,
      cliffLinks: cliffLinks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
