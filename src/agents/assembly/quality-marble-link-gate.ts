/**
 * V12 · Quality-Leap × 大理石节奏 Link Gate (表演门 × 大理石节奏 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 大理石节奏达标集须过表演/情绪门.
 *  - 与 qualityDriftLink / qualityCrestLink 互补：本 gate 以 quality×MarbleLink 联表.
 *
 * marbles[]: { id, ep, shotSpec }
 *  SCHEMA / DUP_ID / UNKNOWN_MARBLE / FUTURE_EP
 *  CHILD_MARBLE_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_MARBLE — link.ep = entry.ep
 *  MARBLE_WITHOUT_QUALITY
 *  LOW_INTENSITY_AT_MARBLE (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { evaluateStoryRhythm } from './story-rhythm-gate';
import {
  QualityLeapDocSchema,
  evaluateQualityLeap,
} from './quality-leap-gate';

const Ep = z.number().int().positive();

export const QualityMarbleEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const QualityMarbleLinkEntrySchema = z.object({
  id: z.string().min(1),
  marbleId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const QualityMarbleLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minMarbleIntense: z.number().int().min(1).max(5).optional(),
  marbles: z.array(QualityMarbleEntrySchema),
  links: z.array(QualityMarbleLinkEntrySchema),
});

export type QualityMarbleLinkLedger = z.infer<typeof QualityMarbleLinkLedgerSchema>;

export type QualityMarbleLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_MARBLE'
    | 'FUTURE_EP'
    | 'CHILD_MARBLE_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_MARBLE'
    | 'MARBLE_WITHOUT_QUALITY'
    | 'LOW_INTENSITY_AT_MARBLE';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface QualityMarbleLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    marbles: number;
    latestEp: number;
  };
  findings: QualityMarbleLinkFinding[];
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

export function evaluateQualityMarbleLink(input: unknown): QualityMarbleLinkReport {
  const parsed = QualityMarbleLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, marbles: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, marbles, links, minMarbleIntense = 4 } = parsed.data;
  const findings: QualityMarbleLinkFinding[] = [];
  const push = (x: QualityMarbleLinkFinding) => findings.push(x);

  for (const ent of marbles) {
    const r = evaluateStoryRhythm(ent.shotSpec);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_MARBLE_FAIL',
        severity: 'FAIL',
        ids: [ent.id, ...childFails.flatMap((f) => ('shotIds' in f ? (f.shotIds ?? []) : []))],
        message: `marble ${ent.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修子门',
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

  const byE = new Map(marbles.map((e) => [e.id, e]));
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
    const ent = byE.get(link.marbleId);
    if (!ent) {
      push({
        code: 'UNKNOWN_MARBLE',
        severity: 'FAIL',
        ids: [link.id, link.marbleId],
        message: `联表 ${link.id} 引用未知 marble ${link.marbleId}`,
        fix: 'marbleId 须存在于 marbles[]',
      });
      continue;
    }
    if (link.ep !== ent.ep) {
      push({
        code: 'EP_NOT_MARBLE',
        severity: 'FAIL',
        ids: [link.id, ent.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 marble.ep=E${ent.ep}`,
        fix: 'link.ep 须等于 entry.ep',
      });
      continue;
    }
    const ql = evaluateQualityLeap(link.qualityLeap);
    if (ql.verdict === 'FAIL') {
      const childFails = ql.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_QUALITY_FAIL',
        severity: 'FAIL',
        ids: [link.id, ent.id, ...childFails.map((f) => f.shotId).filter(Boolean) as string[]],
        message: `${link.id}: 大理石节奏镜 E${link.ep} quality-leap FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '大理石节奏镜须过表演/情绪/口型/镜头门（quality-leap）',
      });
      continue;
    }
    if (maxIntensity(link.qualityLeap) < minMarbleIntense) {
      push({
        code: 'LOW_INTENSITY_AT_MARBLE',
        severity: 'WARN',
        ids: [link.id, ent.id],
        message: `${link.id}: 大理石节奏集强度 < ${minMarbleIntense}`,
        fix: '抬高 intensity',
      });
    }
    linked.add(ent.id);
    aligned += 1;
  }

  for (const ent of marbles) {
    if (!linked.has(ent.id)) {
      push({
        code: 'MARBLE_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [ent.id],
        message: `marble ${ent.id} ep=E${ent.ep} 无 quality 联表`,
        fix: '为大理石节奏挂 QualityMarbleLink',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { links: links.length, aligned, marbles: marbles.length, latestEp },
    findings,
    gates: GATES,
  };
}
