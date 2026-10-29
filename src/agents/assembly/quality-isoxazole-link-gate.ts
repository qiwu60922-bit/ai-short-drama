/**
 * V12 · Quality-Leap × 异噁唑 Link Gate (表演门 × 异噁唑 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 异噁唑达标集须过表演/情绪门.
 *  - 与 qualityDriftLink / qualityCrestLink 互补：本 gate 以 quality×IsoxazoleLink 联表.
 *
 * isoxazoles[]: { id, ep, shotSpec }
 *  SCHEMA / DUP_ID / UNKNOWN_ISOXAZOLE / FUTURE_EP
 *  CHILD_ISOXAZOLE_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_ISOXAZOLE — link.ep = entry.ep
 *  ISOXAZOLE_WITHOUT_QUALITY
 *  LOW_INTENSITY_AT_ISOXAZOLE (WARN)
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

export const QualityIsoxazoleEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const QualityIsoxazoleLinkEntrySchema = z.object({
  id: z.string().min(1),
  isoxazoleId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const QualityIsoxazoleLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minIsoxazoleIntense: z.number().int().min(1).max(5).optional(),
  isoxazoles: z.array(QualityIsoxazoleEntrySchema),
  links: z.array(QualityIsoxazoleLinkEntrySchema),
});

export type QualityIsoxazoleLinkLedger = z.infer<typeof QualityIsoxazoleLinkLedgerSchema>;

export type QualityIsoxazoleLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_ISOXAZOLE'
    | 'FUTURE_EP'
    | 'CHILD_ISOXAZOLE_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_ISOXAZOLE'
    | 'ISOXAZOLE_WITHOUT_QUALITY'
    | 'LOW_INTENSITY_AT_ISOXAZOLE';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface QualityIsoxazoleLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    isoxazoles: number;
    latestEp: number;
  };
  findings: QualityIsoxazoleLinkFinding[];
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

export function evaluateQualityIsoxazoleLink(input: unknown): QualityIsoxazoleLinkReport {
  const parsed = QualityIsoxazoleLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, isoxazoles: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, isoxazoles, links, minIsoxazoleIntense = 4 } = parsed.data;
  const findings: QualityIsoxazoleLinkFinding[] = [];
  const push = (x: QualityIsoxazoleLinkFinding) => findings.push(x);

  for (const ent of isoxazoles) {
    const r = evaluateStoryRhythm(ent.shotSpec);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_ISOXAZOLE_FAIL',
        severity: 'FAIL',
        ids: [ent.id, ...childFails.flatMap((f) => ('shotIds' in f ? (f.shotIds ?? []) : []))],
        message: `isoxazole ${ent.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
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

  const byE = new Map(isoxazoles.map((e) => [e.id, e]));
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
    const ent = byE.get(link.isoxazoleId);
    if (!ent) {
      push({
        code: 'UNKNOWN_ISOXAZOLE',
        severity: 'FAIL',
        ids: [link.id, link.isoxazoleId],
        message: `联表 ${link.id} 引用未知 isoxazole ${link.isoxazoleId}`,
        fix: 'isoxazoleId 须存在于 isoxazoles[]',
      });
      continue;
    }
    if (link.ep !== ent.ep) {
      push({
        code: 'EP_NOT_ISOXAZOLE',
        severity: 'FAIL',
        ids: [link.id, ent.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 isoxazole.ep=E${ent.ep}`,
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
        message: `${link.id}: 异噁唑镜 E${link.ep} quality-leap FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '异噁唑镜须过表演/情绪/口型/镜头门（quality-leap）',
      });
      continue;
    }
    if (maxIntensity(link.qualityLeap) < minIsoxazoleIntense) {
      push({
        code: 'LOW_INTENSITY_AT_ISOXAZOLE',
        severity: 'WARN',
        ids: [link.id, ent.id],
        message: `${link.id}: 异噁唑集强度 < ${minIsoxazoleIntense}`,
        fix: '抬高 intensity',
      });
    }
    linked.add(ent.id);
    aligned += 1;
  }

  for (const ent of isoxazoles) {
    if (!linked.has(ent.id)) {
      push({
        code: 'ISOXAZOLE_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [ent.id],
        message: `isoxazole ${ent.id} ep=E${ent.ep} 无 quality 联表`,
        fix: '为异噁唑挂 QualityIsoxazoleLink',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { links: links.length, aligned, isoxazoles: isoxazoles.length, latestEp },
    findings,
    gates: GATES,
  };
}
