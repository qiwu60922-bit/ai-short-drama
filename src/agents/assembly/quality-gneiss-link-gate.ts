/**
 * V12 · Quality-Leap × 片麻岩节奏 Link Gate (表演门 × 片麻岩节奏 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 片麻岩节奏达标集须过表演/情绪门.
 *  - 与 qualityDriftLink / qualityCrestLink 互补：本 gate 以 quality×GneissLink 联表.
 *
 * gneisses[]: { id, ep, shotSpec }
 *  SCHEMA / DUP_ID / UNKNOWN_GNEISS / FUTURE_EP
 *  CHILD_GNEISS_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_GNEISS — link.ep = entry.ep
 *  GNEISS_WITHOUT_QUALITY
 *  LOW_INTENSITY_AT_GNEISS (WARN)
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

export const QualityGneissEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const QualityGneissLinkEntrySchema = z.object({
  id: z.string().min(1),
  gneissId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const QualityGneissLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minGneissIntense: z.number().int().min(1).max(5).optional(),
  gneisses: z.array(QualityGneissEntrySchema),
  links: z.array(QualityGneissLinkEntrySchema),
});

export type QualityGneissLinkLedger = z.infer<typeof QualityGneissLinkLedgerSchema>;

export type QualityGneissLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_GNEISS'
    | 'FUTURE_EP'
    | 'CHILD_GNEISS_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_GNEISS'
    | 'GNEISS_WITHOUT_QUALITY'
    | 'LOW_INTENSITY_AT_GNEISS';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface QualityGneissLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    gneisses: number;
    latestEp: number;
  };
  findings: QualityGneissLinkFinding[];
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

export function evaluateQualityGneissLink(input: unknown): QualityGneissLinkReport {
  const parsed = QualityGneissLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, gneisses: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, gneisses, links, minGneissIntense = 4 } = parsed.data;
  const findings: QualityGneissLinkFinding[] = [];
  const push = (x: QualityGneissLinkFinding) => findings.push(x);

  for (const ent of gneisses) {
    const r = evaluateStoryRhythm(ent.shotSpec);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_GNEISS_FAIL',
        severity: 'FAIL',
        ids: [ent.id, ...childFails.flatMap((f) => ('shotIds' in f ? (f.shotIds ?? []) : []))],
        message: `gneiss ${ent.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
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

  const byE = new Map(gneisses.map((e) => [e.id, e]));
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
    const ent = byE.get(link.gneissId);
    if (!ent) {
      push({
        code: 'UNKNOWN_GNEISS',
        severity: 'FAIL',
        ids: [link.id, link.gneissId],
        message: `联表 ${link.id} 引用未知 gneiss ${link.gneissId}`,
        fix: 'gneissId 须存在于 gneisses[]',
      });
      continue;
    }
    if (link.ep !== ent.ep) {
      push({
        code: 'EP_NOT_GNEISS',
        severity: 'FAIL',
        ids: [link.id, ent.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 gneiss.ep=E${ent.ep}`,
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
        message: `${link.id}: 片麻岩节奏镜 E${link.ep} quality-leap FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '片麻岩节奏镜须过表演/情绪/口型/镜头门（quality-leap）',
      });
      continue;
    }
    if (maxIntensity(link.qualityLeap) < minGneissIntense) {
      push({
        code: 'LOW_INTENSITY_AT_GNEISS',
        severity: 'WARN',
        ids: [link.id, ent.id],
        message: `${link.id}: 片麻岩节奏集强度 < ${minGneissIntense}`,
        fix: '抬高 intensity',
      });
    }
    linked.add(ent.id);
    aligned += 1;
  }

  for (const ent of gneisses) {
    if (!linked.has(ent.id)) {
      push({
        code: 'GNEISS_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [ent.id],
        message: `gneiss ${ent.id} ep=E${ent.ep} 无 quality 联表`,
        fix: '为片麻岩节奏挂 QualityGneissLink',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { links: links.length, aligned, gneisses: gneisses.length, latestEp },
    findings,
    gates: GATES,
  };
}
