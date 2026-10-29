/**
 * V12 · Quality-Leap × Reaction-Beat Link Gate (表演/情绪门 × 反应镜 跨账本联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《天幕直播》: 揭晓/反转后反应镜须过表演强度门（脸/呼吸/节奏），不能空壳定格.
 *  - quality-leap 管表演可见度；reaction-beat 管「反转后有没有脸」——本 gate 硬联表.
 *
 * Per link: evaluateReactionBeats(requireReaction) + evaluateQualityLeap.
 *  SCHEMA / DUP_ID / FUTURE_EP
 *  CHILD_REACTION_FAIL / CHILD_QUALITY_FAIL
 *  INTENSE_WITHOUT_REACTION — qualityLeap 存在 intensity≥minIntense 但反应镜缺失
 *  REACTION_WITHOUT_PERFORMANCE (WARN) — 有反应镜但 qualityLeap 无 intensity≥minIntense 表演（空壳定格风险）
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { evaluateReactionBeats } from './reaction-beat-gate';
import {
  QualityLeapDocSchema,
  evaluateQualityLeap,
} from './quality-leap-gate';

const Ep = z.number().int().positive();

export const QualityReactionLinkEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const QualityReactionLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  /** Intensity threshold for INTENSE_WITHOUT_REACTION. Default 4. */
  minIntense: z.number().int().min(1).max(5).optional(),
  links: z.array(QualityReactionLinkEntrySchema),
});

export type QualityReactionLinkLedger = z.infer<typeof QualityReactionLinkLedgerSchema>;

export type QualityReactionLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'FUTURE_EP'
    | 'CHILD_REACTION_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'INTENSE_WITHOUT_REACTION'
    | 'REACTION_WITHOUT_PERFORMANCE';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface QualityReactionLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    latestEp: number;
  };
  findings: QualityReactionLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateQualityReactionLink(input: unknown): QualityReactionLinkReport {
  const parsed = QualityReactionLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, latestEp: 0 },
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

  const { latestEp, links, minIntense = 4 } = parsed.data;
  const findings: QualityReactionLinkFinding[] = [];
  const push = (x: QualityReactionLinkFinding) => findings.push(x);

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

    const rx = evaluateReactionBeats(link.shotSpec, { requireReaction: true });
    if (rx.verdict === 'FAIL') {
      const childFails = rx.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_REACTION_FAIL',
        severity: 'FAIL',
        ids: [link.id, ...(childFails.flatMap((f) => f.shotIds ?? []))],
        message: `${link.id}: 反应镜闸 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: 'reversal/increment/cliffhanger 后补 reaction',
      });
      continue;
    }

    const ql = evaluateQualityLeap(link.qualityLeap);
    if (ql.verdict === 'FAIL') {
      const childFails = ql.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_QUALITY_FAIL',
        severity: 'FAIL',
        ids: [link.id, ...childFails.map((f) => f.shotId).filter(Boolean) as string[]],
        message: `${link.id}: 表演门 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 quality-leap-gate（emotion/intensity/performance/camera）',
      });
      continue;
    }

    const shots = link.qualityLeap.shots ?? [];
    const intense = shots.filter((s) => {
      const perf = s.performance as { intensity?: number } | undefined;
      return typeof perf?.intensity === 'number' && perf.intensity >= minIntense;
    });

    if (intense.length > 0 && rx.metrics.reactionShots === 0) {
      push({
        code: 'INTENSE_WITHOUT_REACTION',
        severity: 'FAIL',
        ids: [link.id, ...intense.map((s) => s.id)],
        message: `${link.id}: qualityLeap 有 intensity≥${minIntense} 表演，但 ShotSpec 无 reaction 镜`,
        fix: '高强度情绪落地后立刻补 reaction beatRole',
      });
      continue;
    }

    if (rx.metrics.reactionShots > 0 && intense.length === 0) {
      push({
        code: 'REACTION_WITHOUT_PERFORMANCE',
        severity: 'WARN',
        ids: [link.id],
        message: `${link.id}: 有反应镜但 qualityLeap 无 intensity≥${minIntense} 表演（空壳定格风险）`,
        fix: '为反应镜补高强度 emotion/face/gaze/breath 表演字段',
      });
    }

    aligned += 1;
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { links: links.length, aligned, latestEp },
    findings,
    gates: GATES,
  };
}
