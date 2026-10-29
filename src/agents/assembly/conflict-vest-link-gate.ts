/**
 * V12 · Conflict × Identity-Vest Link Gate (冲突欠账兑现 × 马甲掉落 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《帐中香》/《机长先生》: 冲突当场兑现常与掉马甲同集，避免空壳揭穿.
 *  - conflict-payoff 管 open→payoff；identity-vest 管 drop——本 gate 硬联表.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_CONFLICT / UNKNOWN_VEST / FUTURE_EP
 *  CHILD_CONFLICT_FAIL / CHILD_VEST_FAIL
 *  EP_NOT_PAYOFF_DROP — link.ep = payoffEp = dropEp
 *  PAYOFF_WITHOUT_VEST / DROP_WITHOUT_CONFLICT
 *  PENDING_CONFLICT (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  ConflictEntrySchema,
  evaluateConflictPayoffGap,
} from './conflict-payoff-gap-gate';
import {
  IdentityVestEntrySchema,
  evaluateIdentityVest,
} from './identity-vest-gate';

const Ep = z.number().int().positive();

export const ConflictVestLinkEntrySchema = z.object({
  id: z.string().min(1),
  conflictId: z.string().min(1),
  vestId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const ConflictVestLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  conflicts: z.array(ConflictEntrySchema),
  vests: z.array(IdentityVestEntrySchema),
  links: z.array(ConflictVestLinkEntrySchema),
});

export type ConflictVestLinkLedger = z.infer<typeof ConflictVestLinkLedgerSchema>;

export type ConflictVestLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_CONFLICT'
    | 'UNKNOWN_VEST'
    | 'FUTURE_EP'
    | 'CHILD_CONFLICT_FAIL'
    | 'CHILD_VEST_FAIL'
    | 'EP_NOT_PAYOFF_DROP'
    | 'PAYOFF_WITHOUT_VEST'
    | 'DROP_WITHOUT_CONFLICT'
    | 'PENDING_CONFLICT';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface ConflictVestLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    conflicts: number;
    vests: number;
    latestEp: number;
  };
  findings: ConflictVestLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateConflictVestLink(input: unknown): ConflictVestLinkReport {
  const parsed = ConflictVestLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, conflicts: 0, vests: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, conflicts, vests, links } = parsed.data;
  const findings: ConflictVestLinkFinding[] = [];
  const push = (x: ConflictVestLinkFinding) => findings.push(x);

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

  const vReport = evaluateIdentityVest({ series, latestEp, entries: vests });
  if (vReport.verdict === 'FAIL') {
    const childFails = vReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_VEST_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌马甲账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 identity-vest-gate',
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
  const byV = new Map(vests.map((v) => [v.id, v]));
  const pairedC = new Set<string>();
  const pairedV = new Set<string>();
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
    const vest = byV.get(link.vestId);
    if (!vest) {
      push({
        code: 'UNKNOWN_VEST',
        severity: 'FAIL',
        ids: [link.id, link.vestId],
        message: `联表 ${link.id} 引用未知 vest ${link.vestId}`,
        fix: 'vestId 须存在于 vests[]',
      });
      continue;
    }

    if (
      conflict.payoffEp === undefined ||
      vest.dropEp === undefined ||
      link.ep !== conflict.payoffEp ||
      link.ep !== vest.dropEp
    ) {
      push({
        code: 'EP_NOT_PAYOFF_DROP',
        severity: 'FAIL',
        ids: [link.id, conflict.id, vest.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 payoff=${conflict.payoffEp ?? '无'}/drop=${vest.dropEp ?? '无'}`,
        fix: '冲突 payoff 须踩马甲 dropEp',
      });
      continue;
    }

    pairedC.add(conflict.id);
    pairedV.add(vest.id);
    aligned += 1;
  }

  for (const c of conflicts) {
    if (c.payoffEp !== undefined && !pairedC.has(c.id)) {
      push({
        code: 'PAYOFF_WITHOUT_VEST',
        severity: 'FAIL',
        ids: [c.id],
        message: `conflict ${c.id} payoffEp=E${c.payoffEp} 无 vest 联表`,
        fix: '为冲突兑现集挂 ConflictVestLink',
      });
    } else if (!pairedC.has(c.id)) {
      push({
        code: 'PENDING_CONFLICT',
        severity: 'WARN',
        ids: [c.id],
        message: `conflict ${c.id} 尚未联表到 vest`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const vest of vests) {
    if (vest.dropEp !== undefined && !pairedV.has(vest.id)) {
      push({
        code: 'DROP_WITHOUT_CONFLICT',
        severity: 'FAIL',
        ids: [vest.id],
        message: `vest ${vest.id} dropEp=E${vest.dropEp} 无 conflict 联表`,
        fix: '在 links[] 挂 conflictId↔vestId',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      conflicts: conflicts.length,
      vests: vests.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
