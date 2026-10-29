/**
 * V12 · Motif × Conflict Link Gate (视觉母题 × 冲突欠账兑现 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《反派拿捏》/《盛夏芬德拉》: 母题回扣常踩冲突当场兑现集.
 *  - 与 conflictMotifLink（conflict 主键）互补：本 gate 以 motif 为主键.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_MOTIF / UNKNOWN_CONFLICT / FUTURE_EP
 *  CHILD_MOTIF_FAIL / CHILD_CONFLICT_FAIL
 *  EP_NOT_PAYOFF_APPEARANCE — link.ep = conflict.payoffEp 且 motif appearance@ep
 *  MOTIF_WITHOUT_CONFLICT / PAYOFF_WITHOUT_MOTIF
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  ConflictEntrySchema,
  evaluateConflictPayoffGap,
} from './conflict-payoff-gap-gate';
import {
  MotifEntrySchema,
  MotifAppearanceSchema,
  evaluateMotifCallbacks,
} from './motif-callback-gate';

const Ep = z.number().int().positive();

export const MotifConflictLinkEntrySchema = z.object({
  id: z.string().min(1),
  motifId: z.string().min(1),
  conflictId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const MotifConflictLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  conflicts: z.array(ConflictEntrySchema),
  links: z.array(MotifConflictLinkEntrySchema),
});

export type MotifConflictLinkLedger = z.infer<typeof MotifConflictLinkLedgerSchema>;

export type MotifConflictLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_MOTIF'
    | 'UNKNOWN_CONFLICT'
    | 'FUTURE_EP'
    | 'CHILD_MOTIF_FAIL'
    | 'CHILD_CONFLICT_FAIL'
    | 'EP_NOT_PAYOFF_APPEARANCE'
    | 'MOTIF_WITHOUT_CONFLICT'
    | 'PAYOFF_WITHOUT_MOTIF';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface MotifConflictLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    motifs: number;
    conflicts: number;
    latestEp: number;
  };
  findings: MotifConflictLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateMotifConflictLink(input: unknown): MotifConflictLinkReport {
  const parsed = MotifConflictLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, motifs: 0, conflicts: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, motifs, appearances, conflicts, links } = parsed.data;
  const findings: MotifConflictLinkFinding[] = [];
  const push = (x: MotifConflictLinkFinding) => findings.push(x);

  const motifReport = evaluateMotifCallbacks({ series, latestEp, motifs, appearances });
  if (motifReport.verdict === 'FAIL') {
    const childFails = motifReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_MOTIF_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌母题账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 motif-callback-gate',
    });
  }

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

  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const l of links) {
    if (seen.has(l.id)) dups.add(l.id);
    else seen.add(l.id);
  }
  for (const id of dups) {
    push({ code: 'DUP_ID', severity: 'FAIL', ids: [id], message: `联表ID重复：${id}`, fix: '联表 id 须唯一' });
  }

  const byMotif = new Map(motifs.map((m) => [m.id, m]));
  const byC = new Map(conflicts.map((c) => [c.id, c]));
  const pairedMotifs = new Set<string>();
  const pairedCs = new Set<string>();
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
    const motif = byMotif.get(link.motifId);
    if (!motif) {
      push({
        code: 'UNKNOWN_MOTIF',
        severity: 'FAIL',
        ids: [link.id, link.motifId],
        message: `联表 ${link.id} 引用未知 motif ${link.motifId}`,
        fix: 'motifId 须存在于 motifs[]',
      });
      continue;
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

    const hasAppearance = appearances.some((a) => a.motifId === motif.id && a.ep === link.ep);
    if (
      conflict.payoffEp === undefined ||
      link.ep !== conflict.payoffEp ||
      !hasAppearance
    ) {
      push({
        code: 'EP_NOT_PAYOFF_APPEARANCE',
        severity: 'FAIL',
        ids: [link.id, motif.id, conflict.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 payoff=${conflict.payoffEp ?? '无'}/appearance=${hasAppearance ? '有' : '无'}`,
        fix: 'link.ep = conflict.payoffEp 且 motif appearance@ep',
      });
      continue;
    }

    pairedMotifs.add(motif.id);
    pairedCs.add(conflict.id);
    aligned += 1;
  }

  for (const motif of motifs) {
    const hasPayoff = appearances.some((a) => a.motifId === motif.id && a.role === 'payoff');
    if (hasPayoff && !pairedMotifs.has(motif.id)) {
      push({
        code: 'MOTIF_WITHOUT_CONFLICT',
        severity: 'FAIL',
        ids: [motif.id],
        message: `motif ${motif.id} 有 payoff appearance 无 conflict 联表`,
        fix: '为母题回扣集挂 MotifConflictLink',
      });
    }
  }
  for (const c of conflicts) {
    if (c.payoffEp !== undefined && !pairedCs.has(c.id)) {
      push({
        code: 'PAYOFF_WITHOUT_MOTIF',
        severity: 'FAIL',
        ids: [c.id],
        message: `conflict ${c.id} payoffEp=E${c.payoffEp} 无 motif 联表`,
        fix: '为冲突兑现集挂 MotifConflictLink',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      motifs: motifs.length,
      conflicts: conflicts.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
