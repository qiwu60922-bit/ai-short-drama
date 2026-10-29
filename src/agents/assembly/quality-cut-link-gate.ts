/**
 * V12 · Quality-Leap × Cut-Timeline Link Gate (表演门 × 帧级分镜时间轴 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 关键分镜时间轴当集须过表演/情绪门.
 *  - 与 qualityOpeningLink / qualityDialogueLink 互补：本 gate 以 quality×CutTimeline 联表.
 *
 * cuts[]: { id, ep, cutTimeline }
 *  SCHEMA / DUP_ID / UNKNOWN_CUT / FUTURE_EP
 *  CHILD_CUT_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_CUT — link.ep = entry.ep
 *  CUT_WITHOUT_QUALITY
 *  LOW_INTENSITY_AT_CUT (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { CutTimelineSchema, evaluateCutTimeline } from './cut-timeline-gate';
import {
  QualityLeapDocSchema,
  evaluateQualityLeap,
} from './quality-leap-gate';

const Ep = z.number().int().positive();

export const QualityCutEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  cutTimeline: CutTimelineSchema,
  note: z.string().optional(),
});

export const QualityCutLinkEntrySchema = z.object({
  id: z.string().min(1),
  cutId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const QualityCutLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minCutIntense: z.number().int().min(1).max(5).optional(),
  cuts: z.array(QualityCutEntrySchema),
  links: z.array(QualityCutLinkEntrySchema),
});

export type QualityCutLinkLedger = z.infer<typeof QualityCutLinkLedgerSchema>;

export type QualityCutLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_CUT'
    | 'FUTURE_EP'
    | 'CHILD_CUT_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_CUT'
    | 'CUT_WITHOUT_QUALITY'
    | 'LOW_INTENSITY_AT_CUT';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface QualityCutLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    cuts: number;
    latestEp: number;
  };
  findings: QualityCutLinkFinding[];
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

export function evaluateQualityCutLink(input: unknown): QualityCutLinkReport {
  const parsed = QualityCutLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, cuts: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { latestEp, cuts, links, minCutIntense = 4 } = parsed.data;
  const findings: QualityCutLinkFinding[] = [];
  const push = (x: QualityCutLinkFinding) => findings.push(x);

  for (const entry of cuts) {
    const cr = evaluateCutTimeline(entry.cutTimeline);
    if (cr.verdict === 'FAIL') {
      const childFails = cr.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_CUT_FAIL',
        severity: 'FAIL',
        ids: [entry.id, ...childFails.flatMap((f) => f.ids ?? [])],
        message: `cut ${entry.id} cut-timeline FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 cut-timeline-gate',
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

  const byCut = new Map(cuts.map((c) => [c.id, c]));
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
    const entry = byCut.get(link.cutId);
    if (!entry) {
      push({
        code: 'UNKNOWN_CUT',
        severity: 'FAIL',
        ids: [link.id, link.cutId],
        message: `联表 ${link.id} 引用未知 cut ${link.cutId}`,
        fix: 'cutId 须存在于 cuts[]',
      });
      continue;
    }
    if (link.ep !== entry.ep) {
      push({
        code: 'EP_NOT_CUT',
        severity: 'FAIL',
        ids: [link.id, entry.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 cut.ep=E${entry.ep}`,
        fix: 'link.ep 须等于 cut.ep',
      });
      continue;
    }
    const ql = evaluateQualityLeap(link.qualityLeap);
    if (ql.verdict === 'FAIL') {
      const childFails = ql.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_QUALITY_FAIL',
        severity: 'FAIL',
        ids: [link.id, entry.id, ...childFails.map((f) => f.shotId).filter(Boolean) as string[]],
        message: `${link.id}: 分镜集 E${link.ep} quality-leap FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '分镜集须过表演/情绪/口型/镜头门（quality-leap）',
      });
      continue;
    }
    if (maxIntensity(link.qualityLeap) < minCutIntense) {
      push({
        code: 'LOW_INTENSITY_AT_CUT',
        severity: 'WARN',
        ids: [link.id, entry.id],
        message: `${link.id}: cut 集强度 < ${minCutIntense}`,
        fix: '抬高 cut 镜 intensity',
      });
    }
    linked.add(entry.id);
    aligned += 1;
  }

  for (const entry of cuts) {
    if (!linked.has(entry.id)) {
      push({
        code: 'CUT_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [entry.id],
        message: `cut ${entry.id} ep=E${entry.ep} 无 quality 联表`,
        fix: '为分镜时间轴挂 QualityCutLink',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { links: links.length, aligned, cuts: cuts.length, latestEp },
    findings,
    gates: GATES,
  };
}
