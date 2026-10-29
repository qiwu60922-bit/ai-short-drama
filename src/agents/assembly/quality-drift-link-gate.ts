/**
 * V12 · Quality-Leap × 漂移节奏 Link Gate (表演门 × 漂移节奏 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 漂移节奏达标集须过表演/情绪门.
 *  - 与 qualityArcLink / qualityPulseLink 互补：本 gate 以 quality×DriftLink 联表.
 *
 * drifts[]: { id, ep, shotSpec }
 *  SCHEMA / DUP_ID / UNKNOWN_DRIFT / FUTURE_EP
 *  CHILD_DRIFT_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_DRIFT — link.ep = entry.ep
 *  DRIFT_WITHOUT_QUALITY
 *  LOW_INTENSITY_AT_DRIFT (WARN)
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

export const QualityDriftEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const QualityDriftLinkEntrySchema = z.object({
  id: z.string().min(1),
  driftId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const QualityDriftLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minDriftIntense: z.number().int().min(1).max(5).optional(),
  drifts: z.array(QualityDriftEntrySchema),
  links: z.array(QualityDriftLinkEntrySchema),
});

export type QualityDriftLinkLedger = z.infer<typeof QualityDriftLinkLedgerSchema>;

export type QualityDriftLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_DRIFT'
    | 'FUTURE_EP'
    | 'CHILD_DRIFT_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_DRIFT'
    | 'DRIFT_WITHOUT_QUALITY'
    | 'LOW_INTENSITY_AT_DRIFT';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface QualityDriftLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    drifts: number;
    latestEp: number;
  };
  findings: QualityDriftLinkFinding[];
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

export function evaluateQualityDriftLink(input: unknown): QualityDriftLinkReport {
  const parsed = QualityDriftLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, drifts: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, drifts, links, minDriftIntense = 4 } = parsed.data;
  const findings: QualityDriftLinkFinding[] = [];
  const push = (x: QualityDriftLinkFinding) => findings.push(x);

  for (const ent of drifts) {
    const r = evaluateStoryRhythm(ent.shotSpec);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_DRIFT_FAIL',
        severity: 'FAIL',
        ids: [ent.id, ...childFails.flatMap((f) => ('shotIds' in f ? (f.shotIds ?? []) : []))],
        message: `drift ${ent.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
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

  const byE = new Map(drifts.map((e) => [e.id, e]));
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
    const ent = byE.get(link.driftId);
    if (!ent) {
      push({
        code: 'UNKNOWN_DRIFT',
        severity: 'FAIL',
        ids: [link.id, link.driftId],
        message: `联表 ${link.id} 引用未知 drift ${link.driftId}`,
        fix: 'driftId 须存在于 drifts[]',
      });
      continue;
    }
    if (link.ep !== ent.ep) {
      push({
        code: 'EP_NOT_DRIFT',
        severity: 'FAIL',
        ids: [link.id, ent.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 drift.ep=E${ent.ep}`,
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
        message: `${link.id}: 漂移节奏镜 E${link.ep} quality-leap FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '漂移节奏镜须过表演/情绪/口型/镜头门（quality-leap）',
      });
      continue;
    }
    if (maxIntensity(link.qualityLeap) < minDriftIntense) {
      push({
        code: 'LOW_INTENSITY_AT_DRIFT',
        severity: 'WARN',
        ids: [link.id, ent.id],
        message: `${link.id}: 漂移节奏集强度 < ${minDriftIntense}`,
        fix: '抬高 intensity',
      });
    }
    linked.add(ent.id);
    aligned += 1;
  }

  for (const ent of drifts) {
    if (!linked.has(ent.id)) {
      push({
        code: 'DRIFT_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [ent.id],
        message: `drift ${ent.id} ep=E${ent.ep} 无 quality 联表`,
        fix: '为漂移节奏挂 QualityDriftLink',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { links: links.length, aligned, drifts: drifts.length, latestEp },
    findings,
    gates: GATES,
  };
}
