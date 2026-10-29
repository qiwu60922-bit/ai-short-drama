/**
 * V12 · Quality-Leap × Conflict Link Gate (表演门 × 冲突欠账兑现 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 冲突 payoff 当集镜须过表演/情绪门，不能空壳甩冲突.
 *  - 与 qualityBondLink / qualityEnsembleLink 已占用互补：本 gate 以 quality×conflict 联表.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_CONFLICT / FUTURE_EP
 *  CHILD_CONFLICT_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_PAYOFF — link.ep 须等于 conflict.payoffEp
 *  PAYOFF_WITHOUT_QUALITY — 已 payoff 无联表 quality
 *  PENDING_CONFLICT (WARN)
 *  LOW_INTENSITY_AT_PAYOFF (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  ConflictEntrySchema,
  evaluateConflictPayoffGap,
} from './conflict-payoff-gap-gate';
import {
  QualityLeapDocSchema,
  evaluateQualityLeap,
} from './quality-leap-gate';

const Ep = z.number().int().positive();

export const QualityConflictLinkEntrySchema = z.object({
  id: z.string().min(1),
  conflictId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const QualityConflictLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minPayoffIntense: z.number().int().min(1).max(5).optional(),
  conflicts: z.array(ConflictEntrySchema),
  links: z.array(QualityConflictLinkEntrySchema),
});

export type QualityConflictLinkLedger = z.infer<typeof QualityConflictLinkLedgerSchema>;

export type QualityConflictLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_CONFLICT'
    | 'FUTURE_EP'
    | 'CHILD_CONFLICT_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_PAYOFF'
    | 'PAYOFF_WITHOUT_QUALITY'
    | 'PENDING_CONFLICT'
    | 'LOW_INTENSITY_AT_PAYOFF';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface QualityConflictLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    conflicts: number;
    latestEp: number;
  };
  findings: QualityConflictLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

function maxIntensity(ql: {
  shots?: Array<{ performance?: { intensity?: number } | null }>;
}): number {
  let m = 0;
  for (const s of ql.shots ?? []) {
    const i = s.performance?.intensity;
    if (typeof i === 'number' && i > m) m = i;
  }
  return m;
}

export function evaluateQualityConflictLink(input: unknown): QualityConflictLinkReport {
  const parsed = QualityConflictLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, conflicts: 0, latestEp: 0 },
      findings: [
        {
          code: 'SCHEMA',
          severity: 'FAIL',
          message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        },
      ],
      gates: GATES,
    };
  }

  const { series, latestEp, conflicts, links, minPayoffIntense = 4 } = parsed.data;
  const findings: QualityConflictLinkFinding[] = [];
  const push = (x: QualityConflictLinkFinding) => findings.push(x);

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
    push({
      code: 'DUP_ID',
      severity: 'FAIL',
      ids: [id],
      message: `联表ID重复：${id}`,
      fix: '联表 id 须唯一',
    });
  }

  const byC = new Map(conflicts.map((c) => [c.id, c]));
  const linked = new Set<string>();
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

    if (conflict.payoffEp === undefined || link.ep !== conflict.payoffEp) {
      push({
        code: 'EP_NOT_PAYOFF',
        severity: 'FAIL',
        ids: [link.id, conflict.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 payoffEp=${conflict.payoffEp ?? '无'}`,
        fix: 'link.ep 须等于 conflict.payoffEp',
      });
      continue;
    }

    const ql = evaluateQualityLeap(link.qualityLeap);
    if (ql.verdict === 'FAIL') {
      const childFails = ql.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_QUALITY_FAIL',
        severity: 'FAIL',
        ids: [link.id, conflict.id, ...childFails.map((f) => f.shotId).filter(Boolean) as string[]],
        message: `${link.id}: 冲突兑现镜 E${link.ep} quality-leap FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '冲突兑现镜须过表演/情绪/口型/镜头门（quality-leap）',
      });
      continue;
    }

    if (maxIntensity(link.qualityLeap) < minPayoffIntense) {
      push({
        code: 'LOW_INTENSITY_AT_PAYOFF',
        severity: 'WARN',
        ids: [link.id, conflict.id],
        message: `${link.id}: payoff 集强度 < ${minPayoffIntense}`,
        fix: '抬高 payoff 镜 intensity',
      });
    }

    linked.add(conflict.id);
    aligned += 1;
  }

  for (const conflict of conflicts) {
    if (conflict.payoffEp !== undefined && !linked.has(conflict.id)) {
      push({
        code: 'PAYOFF_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [conflict.id],
        message: `conflict ${conflict.id} payoffEp=E${conflict.payoffEp} 无 quality 联表`,
        fix: '为冲突兑现集挂 QualityConflictLink',
      });
    } else if (conflict.payoffEp === undefined && !linked.has(conflict.id)) {
      push({
        code: 'PENDING_CONFLICT',
        severity: 'WARN',
        ids: [conflict.id],
        message: `conflict ${conflict.id} 尚未 payoff/联表`,
        fix: '规划 payoffEp 或补 links[]',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      conflicts: conflicts.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
