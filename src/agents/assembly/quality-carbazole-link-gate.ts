/**
 * V12 · Quality-Leap × 咔唑 Link Gate (表演门 × 咔唑 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 咔唑达标集须过表演/情绪门.
 *  - 与 qualityDriftLink / qualityCrestLink 互补：本 gate 以 quality×CarbazoleLink 联表.
 *
 * carbazoles[]: { id, ep, shotSpec }
 *  SCHEMA / DUP_ID / UNKNOWN_CARBAZOLE / FUTURE_EP
 *  CHILD_CARBAZOLE_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_CARBAZOLE — link.ep = entry.ep
 *  CARBAZOLE_WITHOUT_QUALITY
 *  LOW_INTENSITY_AT_CARBAZOLE (WARN)
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

export const QualityCarbazoleEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const QualityCarbazoleLinkEntrySchema = z.object({
  id: z.string().min(1),
  carbazoleId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const QualityCarbazoleLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minCarbazoleIntense: z.number().int().min(1).max(5).optional(),
  carbazoles: z.array(QualityCarbazoleEntrySchema),
  links: z.array(QualityCarbazoleLinkEntrySchema),
});

export type QualityCarbazoleLinkLedger = z.infer<typeof QualityCarbazoleLinkLedgerSchema>;

export type QualityCarbazoleLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_CARBAZOLE'
    | 'FUTURE_EP'
    | 'CHILD_CARBAZOLE_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_CARBAZOLE'
    | 'CARBAZOLE_WITHOUT_QUALITY'
    | 'LOW_INTENSITY_AT_CARBAZOLE';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface QualityCarbazoleLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    carbazoles: number;
    latestEp: number;
  };
  findings: QualityCarbazoleLinkFinding[];
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

export function evaluateQualityCarbazoleLink(input: unknown): QualityCarbazoleLinkReport {
  const parsed = QualityCarbazoleLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, carbazoles: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, carbazoles, links, minCarbazoleIntense = 4 } = parsed.data;
  const findings: QualityCarbazoleLinkFinding[] = [];
  const push = (x: QualityCarbazoleLinkFinding) => findings.push(x);

  for (const ent of carbazoles) {
    const r = evaluateStoryRhythm(ent.shotSpec);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_CARBAZOLE_FAIL',
        severity: 'FAIL',
        ids: [ent.id, ...childFails.flatMap((f) => ('shotIds' in f ? (f.shotIds ?? []) : []))],
        message: `carbazole ${ent.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
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

  const byE = new Map(carbazoles.map((e) => [e.id, e]));
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
    const ent = byE.get(link.carbazoleId);
    if (!ent) {
      push({
        code: 'UNKNOWN_CARBAZOLE',
        severity: 'FAIL',
        ids: [link.id, link.carbazoleId],
        message: `联表 ${link.id} 引用未知 carbazole ${link.carbazoleId}`,
        fix: 'carbazoleId 须存在于 carbazoles[]',
      });
      continue;
    }
    if (link.ep !== ent.ep) {
      push({
        code: 'EP_NOT_CARBAZOLE',
        severity: 'FAIL',
        ids: [link.id, ent.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 carbazole.ep=E${ent.ep}`,
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
        message: `${link.id}: 咔唑镜 E${link.ep} quality-leap FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '咔唑镜须过表演/情绪/口型/镜头门（quality-leap）',
      });
      continue;
    }
    if (maxIntensity(link.qualityLeap) < minCarbazoleIntense) {
      push({
        code: 'LOW_INTENSITY_AT_CARBAZOLE',
        severity: 'WARN',
        ids: [link.id, ent.id],
        message: `${link.id}: 咔唑集强度 < ${minCarbazoleIntense}`,
        fix: '抬高 intensity',
      });
    }
    linked.add(ent.id);
    aligned += 1;
  }

  for (const ent of carbazoles) {
    if (!linked.has(ent.id)) {
      push({
        code: 'CARBAZOLE_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [ent.id],
        message: `carbazole ${ent.id} ep=E${ent.ep} 无 quality 联表`,
        fix: '为咔唑挂 QualityCarbazoleLink',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { links: links.length, aligned, carbazoles: carbazoles.length, latestEp },
    findings,
    gates: GATES,
  };
}
