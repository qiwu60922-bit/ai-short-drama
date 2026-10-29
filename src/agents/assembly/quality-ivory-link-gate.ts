/**
 * V12 · Quality-Leap × 象牙节奏 Link Gate (表演门 × 烈焰节奏 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 象牙节奏达标集须过表演/情绪门.
 *  - 与 qualityDriftLink / qualityCrestLink 互补：本 gate 以 quality×IvoryLink 联表.
 *
 * ivories[]: { id, ep, shotSpec }
 *  SCHEMA / DUP_ID / UNKNOWN_IVORY / FUTURE_EP
 *  CHILD_IVORY_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_IVORY — link.ep = entry.ep
 *  IVORY_WITHOUT_QUALITY
 *  LOW_INTENSITY_AT_IVORY (WARN)
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

export const QualityIvoryEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const QualityIvoryLinkEntrySchema = z.object({
  id: z.string().min(1),
  ivoryId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const QualityIvoryLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minIvoryIntense: z.number().int().min(1).max(5).optional(),
  ivories: z.array(QualityIvoryEntrySchema),
  links: z.array(QualityIvoryLinkEntrySchema),
});

export type QualityIvoryLinkLedger = z.infer<typeof QualityIvoryLinkLedgerSchema>;

export type QualityIvoryLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_IVORY'
    | 'FUTURE_EP'
    | 'CHILD_IVORY_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_IVORY'
    | 'IVORY_WITHOUT_QUALITY'
    | 'LOW_INTENSITY_AT_IVORY';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface QualityIvoryLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    ivories: number;
    latestEp: number;
  };
  findings: QualityIvoryLinkFinding[];
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

export function evaluateQualityIvoryLink(input: unknown): QualityIvoryLinkReport {
  const parsed = QualityIvoryLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, ivories: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, ivories, links, minIvoryIntense = 4 } = parsed.data;
  const findings: QualityIvoryLinkFinding[] = [];
  const push = (x: QualityIvoryLinkFinding) => findings.push(x);

  for (const ent of ivories) {
    const r = evaluateStoryRhythm(ent.shotSpec);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_IVORY_FAIL',
        severity: 'FAIL',
        ids: [ent.id, ...childFails.flatMap((f) => ('shotIds' in f ? (f.shotIds ?? []) : []))],
        message: `ivory ${ent.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
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

  const byE = new Map(ivories.map((e) => [e.id, e]));
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
    const ent = byE.get(link.ivoryId);
    if (!ent) {
      push({
        code: 'UNKNOWN_IVORY',
        severity: 'FAIL',
        ids: [link.id, link.ivoryId],
        message: `联表 ${link.id} 引用未知 ivory ${link.ivoryId}`,
        fix: 'ivoryId 须存在于 ivories[]',
      });
      continue;
    }
    if (link.ep !== ent.ep) {
      push({
        code: 'EP_NOT_IVORY',
        severity: 'FAIL',
        ids: [link.id, ent.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 ivory.ep=E${ent.ep}`,
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
        message: `${link.id}: 象牙节奏镜 E${link.ep} quality-leap FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '象牙节奏镜须过表演/情绪/口型/镜头门（quality-leap）',
      });
      continue;
    }
    if (maxIntensity(link.qualityLeap) < minIvoryIntense) {
      push({
        code: 'LOW_INTENSITY_AT_IVORY',
        severity: 'WARN',
        ids: [link.id, ent.id],
        message: `${link.id}: 象牙节奏集强度 < ${minIvoryIntense}`,
        fix: '抬高 intensity',
      });
    }
    linked.add(ent.id);
    aligned += 1;
  }

  for (const ent of ivories) {
    if (!linked.has(ent.id)) {
      push({
        code: 'IVORY_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [ent.id],
        message: `ivory ${ent.id} ep=E${ent.ep} 无 quality 联表`,
        fix: '为象牙节奏挂 QualityIvoryLink',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { links: links.length, aligned, ivories: ivories.length, latestEp },
    findings,
    gates: GATES,
  };
}
