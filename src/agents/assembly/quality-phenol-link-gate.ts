/**
 * V12 · Quality-Leap × 苯酚 Link Gate (表演门 × 苯酚 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 苯酚达标集须过表演/情绪门.
 *  - 与 qualityDriftLink / qualityCrestLink 互补：本 gate 以 quality×PhenolLink 联表.
 *
 * phenols[]: { id, ep, shotSpec }
 *  SCHEMA / DUP_ID / UNKNOWN_PHENOL / FUTURE_EP
 *  CHILD_PHENOL_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_PHENOL — link.ep = entry.ep
 *  PHENOL_WITHOUT_QUALITY
 *  LOW_INTENSITY_AT_PHENOL (WARN)
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

export const QualityPhenolEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const QualityPhenolLinkEntrySchema = z.object({
  id: z.string().min(1),
  phenolId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const QualityPhenolLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minPhenolIntense: z.number().int().min(1).max(5).optional(),
  phenols: z.array(QualityPhenolEntrySchema),
  links: z.array(QualityPhenolLinkEntrySchema),
});

export type QualityPhenolLinkLedger = z.infer<typeof QualityPhenolLinkLedgerSchema>;

export type QualityPhenolLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_PHENOL'
    | 'FUTURE_EP'
    | 'CHILD_PHENOL_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_PHENOL'
    | 'PHENOL_WITHOUT_QUALITY'
    | 'LOW_INTENSITY_AT_PHENOL';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface QualityPhenolLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    phenols: number;
    latestEp: number;
  };
  findings: QualityPhenolLinkFinding[];
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

export function evaluateQualityPhenolLink(input: unknown): QualityPhenolLinkReport {
  const parsed = QualityPhenolLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, phenols: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, phenols, links, minPhenolIntense = 4 } = parsed.data;
  const findings: QualityPhenolLinkFinding[] = [];
  const push = (x: QualityPhenolLinkFinding) => findings.push(x);

  for (const ent of phenols) {
    const r = evaluateStoryRhythm(ent.shotSpec);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_PHENOL_FAIL',
        severity: 'FAIL',
        ids: [ent.id, ...childFails.flatMap((f) => ('shotIds' in f ? (f.shotIds ?? []) : []))],
        message: `phenol ${ent.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
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

  const byE = new Map(phenols.map((e) => [e.id, e]));
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
    const ent = byE.get(link.phenolId);
    if (!ent) {
      push({
        code: 'UNKNOWN_PHENOL',
        severity: 'FAIL',
        ids: [link.id, link.phenolId],
        message: `联表 ${link.id} 引用未知 phenol ${link.phenolId}`,
        fix: 'phenolId 须存在于 phenols[]',
      });
      continue;
    }
    if (link.ep !== ent.ep) {
      push({
        code: 'EP_NOT_PHENOL',
        severity: 'FAIL',
        ids: [link.id, ent.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 phenol.ep=E${ent.ep}`,
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
        message: `${link.id}: 苯酚镜 E${link.ep} quality-leap FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '苯酚镜须过表演/情绪/口型/镜头门（quality-leap）',
      });
      continue;
    }
    if (maxIntensity(link.qualityLeap) < minPhenolIntense) {
      push({
        code: 'LOW_INTENSITY_AT_PHENOL',
        severity: 'WARN',
        ids: [link.id, ent.id],
        message: `${link.id}: 苯酚集强度 < ${minPhenolIntense}`,
        fix: '抬高 intensity',
      });
    }
    linked.add(ent.id);
    aligned += 1;
  }

  for (const ent of phenols) {
    if (!linked.has(ent.id)) {
      push({
        code: 'PHENOL_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [ent.id],
        message: `phenol ${ent.id} ep=E${ent.ep} 无 quality 联表`,
        fix: '为苯酚挂 QualityPhenolLink',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { links: links.length, aligned, phenols: phenols.length, latestEp },
    findings,
    gates: GATES,
  };
}
