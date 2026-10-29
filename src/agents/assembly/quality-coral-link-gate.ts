/**
 * V12 · Quality-Leap × 珊瑚节奏 Link Gate (表演门 × 烈焰节奏 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 珊瑚节奏达标集须过表演/情绪门.
 *  - 与 qualityDriftLink / qualityCrestLink 互补：本 gate 以 quality×CoralLink 联表.
 *
 * corals[]: { id, ep, shotSpec }
 *  SCHEMA / DUP_ID / UNKNOWN_CORAL / FUTURE_EP
 *  CHILD_CORAL_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_CORAL — link.ep = entry.ep
 *  CORAL_WITHOUT_QUALITY
 *  LOW_INTENSITY_AT_CORAL (WARN)
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

export const QualityCoralEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const QualityCoralLinkEntrySchema = z.object({
  id: z.string().min(1),
  coralId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const QualityCoralLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minCoralIntense: z.number().int().min(1).max(5).optional(),
  corals: z.array(QualityCoralEntrySchema),
  links: z.array(QualityCoralLinkEntrySchema),
});

export type QualityCoralLinkLedger = z.infer<typeof QualityCoralLinkLedgerSchema>;

export type QualityCoralLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_CORAL'
    | 'FUTURE_EP'
    | 'CHILD_CORAL_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_CORAL'
    | 'CORAL_WITHOUT_QUALITY'
    | 'LOW_INTENSITY_AT_CORAL';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface QualityCoralLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    corals: number;
    latestEp: number;
  };
  findings: QualityCoralLinkFinding[];
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

export function evaluateQualityCoralLink(input: unknown): QualityCoralLinkReport {
  const parsed = QualityCoralLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, corals: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, corals, links, minCoralIntense = 4 } = parsed.data;
  const findings: QualityCoralLinkFinding[] = [];
  const push = (x: QualityCoralLinkFinding) => findings.push(x);

  for (const ent of corals) {
    const r = evaluateStoryRhythm(ent.shotSpec);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_CORAL_FAIL',
        severity: 'FAIL',
        ids: [ent.id, ...childFails.flatMap((f) => ('shotIds' in f ? (f.shotIds ?? []) : []))],
        message: `coral ${ent.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
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

  const byE = new Map(corals.map((e) => [e.id, e]));
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
    const ent = byE.get(link.coralId);
    if (!ent) {
      push({
        code: 'UNKNOWN_CORAL',
        severity: 'FAIL',
        ids: [link.id, link.coralId],
        message: `联表 ${link.id} 引用未知 coral ${link.coralId}`,
        fix: 'coralId 须存在于 corals[]',
      });
      continue;
    }
    if (link.ep !== ent.ep) {
      push({
        code: 'EP_NOT_CORAL',
        severity: 'FAIL',
        ids: [link.id, ent.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 coral.ep=E${ent.ep}`,
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
        message: `${link.id}: 珊瑚节奏镜 E${link.ep} quality-leap FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '珊瑚节奏镜须过表演/情绪/口型/镜头门（quality-leap）',
      });
      continue;
    }
    if (maxIntensity(link.qualityLeap) < minCoralIntense) {
      push({
        code: 'LOW_INTENSITY_AT_CORAL',
        severity: 'WARN',
        ids: [link.id, ent.id],
        message: `${link.id}: 珊瑚节奏集强度 < ${minCoralIntense}`,
        fix: '抬高 intensity',
      });
    }
    linked.add(ent.id);
    aligned += 1;
  }

  for (const ent of corals) {
    if (!linked.has(ent.id)) {
      push({
        code: 'CORAL_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [ent.id],
        message: `coral ${ent.id} ep=E${ent.ep} 无 quality 联表`,
        fix: '为珊瑚节奏挂 QualityCoralLink',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { links: links.length, aligned, corals: corals.length, latestEp },
    findings,
    gates: GATES,
  };
}
