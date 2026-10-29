/**
 * V12 · Conflict × Mask Link Gate (冲突欠账兑现 × 伪装揭穿 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《帐中香》/密爽向: 冲突当场兑现常与 mask reveal 同集，避免空壳揭穿.
 *  - conflict-payoff 管 open→payoff；persona-mask 管 reveal——本 gate 硬联表.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_CONFLICT / UNKNOWN_MASK / FUTURE_EP
 *  CHILD_CONFLICT_FAIL / CHILD_MASK_FAIL
 *  EP_NOT_PAYOFF_REVEAL — link.ep = payoffEp = revealEp
 *  PAYOFF_WITHOUT_MASK / REVEAL_WITHOUT_CONFLICT
 *  PENDING_CONFLICT (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  ConflictEntrySchema,
  evaluateConflictPayoffGap,
} from './conflict-payoff-gap-gate';
import {
  PersonaMaskEntrySchema,
  evaluatePersonaMask,
} from './persona-mask-gate';

const Ep = z.number().int().positive();

export const ConflictMaskLinkEntrySchema = z.object({
  id: z.string().min(1),
  conflictId: z.string().min(1),
  maskId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const ConflictMaskLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  conflicts: z.array(ConflictEntrySchema),
  masks: z.array(PersonaMaskEntrySchema),
  links: z.array(ConflictMaskLinkEntrySchema),
});

export type ConflictMaskLinkLedger = z.infer<typeof ConflictMaskLinkLedgerSchema>;

export type ConflictMaskLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_CONFLICT'
    | 'UNKNOWN_MASK'
    | 'FUTURE_EP'
    | 'CHILD_CONFLICT_FAIL'
    | 'CHILD_MASK_FAIL'
    | 'EP_NOT_PAYOFF_REVEAL'
    | 'PAYOFF_WITHOUT_MASK'
    | 'REVEAL_WITHOUT_CONFLICT'
    | 'PENDING_CONFLICT';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface ConflictMaskLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    conflicts: number;
    masks: number;
    latestEp: number;
  };
  findings: ConflictMaskLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateConflictMaskLink(input: unknown): ConflictMaskLinkReport {
  const parsed = ConflictMaskLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, conflicts: 0, masks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, conflicts, masks, links } = parsed.data;
  const findings: ConflictMaskLinkFinding[] = [];
  const push = (x: ConflictMaskLinkFinding) => findings.push(x);

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

  const mReport = evaluatePersonaMask({ series, latestEp, entries: masks });
  if (mReport.verdict === 'FAIL') {
    const childFails = mReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_MASK_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌伪装账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 persona-mask-gate',
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
  const byM = new Map(masks.map((m) => [m.id, m]));
  const pairedC = new Set<string>();
  const pairedM = new Set<string>();
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
    const mask = byM.get(link.maskId);
    if (!mask) {
      push({
        code: 'UNKNOWN_MASK',
        severity: 'FAIL',
        ids: [link.id, link.maskId],
        message: `联表 ${link.id} 引用未知 mask ${link.maskId}`,
        fix: 'maskId 须存在于 masks[]',
      });
      continue;
    }

    if (
      conflict.payoffEp === undefined ||
      mask.revealEp === undefined ||
      link.ep !== conflict.payoffEp ||
      link.ep !== mask.revealEp
    ) {
      push({
        code: 'EP_NOT_PAYOFF_REVEAL',
        severity: 'FAIL',
        ids: [link.id, conflict.id, mask.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 payoff=${conflict.payoffEp ?? '无'}/reveal=${mask.revealEp ?? '无'}`,
        fix: '冲突 payoff 须踩 mask revealEp',
      });
      continue;
    }

    pairedC.add(conflict.id);
    pairedM.add(mask.id);
    aligned += 1;
  }

  for (const c of conflicts) {
    if (c.payoffEp !== undefined && !pairedC.has(c.id)) {
      push({
        code: 'PAYOFF_WITHOUT_MASK',
        severity: 'FAIL',
        ids: [c.id],
        message: `conflict ${c.id} payoffEp=E${c.payoffEp} 无 mask 联表`,
        fix: '为冲突兑现集挂 ConflictMaskLink',
      });
    } else if (!pairedC.has(c.id)) {
      push({
        code: 'PENDING_CONFLICT',
        severity: 'WARN',
        ids: [c.id],
        message: `conflict ${c.id} 尚未联表到 mask`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const mask of masks) {
    if (mask.revealEp !== undefined && !pairedM.has(mask.id)) {
      push({
        code: 'REVEAL_WITHOUT_CONFLICT',
        severity: 'FAIL',
        ids: [mask.id],
        message: `mask ${mask.id} revealEp=E${mask.revealEp} 无 conflict 联表`,
        fix: '在 links[] 挂 conflictId↔maskId',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      conflicts: conflicts.length,
      masks: masks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
