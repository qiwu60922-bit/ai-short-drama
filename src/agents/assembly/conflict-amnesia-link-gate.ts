/**
 * V12 · Conflict × Amnesia Link Gate (冲突欠账兑现 × 失忆唤回 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《反派拿捏》/《帐中香》: 冲突当场兑现常与失忆唤回同集.
 *  - conflict-payoff 管 open→payoff；amnesia-arc 管 plant→recover——本 gate 硬对齐.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_CONFLICT / UNKNOWN_AMNESIA / FUTURE_EP
 *  CHILD_CONFLICT_FAIL / CHILD_AMNESIA_FAIL
 *  EP_NOT_PAYOFF_RECOVER — link.ep = conflict.payoffEp = recoverEp
 *  CONFLICT_WITHOUT_AMNESIA / RECOVER_WITHOUT_CONFLICT
 *  PENDING_AMNESIA (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  ConflictEntrySchema,
  evaluateConflictPayoffGap,
} from './conflict-payoff-gap-gate';
import {
  AmnesiaArcEntrySchema,
  evaluateAmnesiaArc,
} from './amnesia-arc-gate';

const Ep = z.number().int().positive();

export const ConflictAmnesiaLinkEntrySchema = z.object({
  id: z.string().min(1),
  conflictId: z.string().min(1),
  amnesiaId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const ConflictAmnesiaLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  conflicts: z.array(ConflictEntrySchema),
  amnesias: z.array(AmnesiaArcEntrySchema),
  links: z.array(ConflictAmnesiaLinkEntrySchema),
});

export type ConflictAmnesiaLinkLedger = z.infer<typeof ConflictAmnesiaLinkLedgerSchema>;

export type ConflictAmnesiaLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_CONFLICT'
    | 'UNKNOWN_AMNESIA'
    | 'FUTURE_EP'
    | 'CHILD_CONFLICT_FAIL'
    | 'CHILD_AMNESIA_FAIL'
    | 'EP_NOT_PAYOFF_RECOVER'
    | 'CONFLICT_WITHOUT_AMNESIA'
    | 'RECOVER_WITHOUT_CONFLICT'
    | 'PENDING_AMNESIA';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface ConflictAmnesiaLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    conflicts: number;
    amnesias: number;
    latestEp: number;
  };
  findings: ConflictAmnesiaLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateConflictAmnesiaLink(input: unknown): ConflictAmnesiaLinkReport {
  const parsed = ConflictAmnesiaLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, conflicts: 0, amnesias: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, conflicts, amnesias, links } = parsed.data;
  const findings: ConflictAmnesiaLinkFinding[] = [];
  const push = (x: ConflictAmnesiaLinkFinding) => findings.push(x);

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

  const byC = new Map(conflicts.map((c) => [c.id, c]));
  const byAm = new Map(amnesias.map((a) => [a.id, a]));
  const pairedC = new Set<string>();
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
      conflict.payoffEp === undefined ||
      amnesia.recoverEp === undefined ||
      link.ep !== conflict.payoffEp ||
      link.ep !== amnesia.recoverEp
    ) {
      push({
        code: 'EP_NOT_PAYOFF_RECOVER',
        severity: 'FAIL',
        ids: [link.id, conflict.id, amnesia.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 cPayoff=${conflict.payoffEp ?? '无'}/recover=${amnesia.recoverEp ?? '无'}`,
        fix: '冲突 payoff 须踩失忆 recoverEp',
      });
      continue;
    }

    pairedC.add(conflict.id);
    pairedAm.add(amnesia.id);
    aligned += 1;
  }

  for (const c of conflicts) {
    if (c.payoffEp !== undefined && !pairedC.has(c.id)) {
      push({
        code: 'CONFLICT_WITHOUT_AMNESIA',
        severity: 'FAIL',
        ids: [c.id],
        message: `conflict ${c.id} payoffEp=E${c.payoffEp} 无 amnesia 联表`,
        fix: '为冲突兑现集挂 ConflictAmnesiaLink',
      });
    }
  }
  for (const am of amnesias) {
    if (am.recoverEp !== undefined && !pairedAm.has(am.id)) {
      push({
        code: 'RECOVER_WITHOUT_CONFLICT',
        severity: 'FAIL',
        ids: [am.id],
        message: `amnesia ${am.id} recoverEp=E${am.recoverEp} 无 conflict 联表`,
        fix: '为唤回集挂 ConflictAmnesiaLink',
      });
    } else if (!pairedAm.has(am.id)) {
      push({
        code: 'PENDING_AMNESIA',
        severity: 'WARN',
        ids: [am.id],
        message: `amnesia ${am.id} 尚未联表到 conflict`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      conflicts: conflicts.length,
      amnesias: amnesias.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
