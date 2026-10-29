/**
 * V12 · Quality-Leap × 束光节奏 Link Gate (表演门 × 束光节奏 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 束光节奏达标集须过表演/情绪门.
 *  - 与 qualityDriftLink / qualityCrestLink 互补：本 gate 以 quality×BeamLink 联表.
 *
 * beams[]: { id, ep, shotSpec }
 *  SCHEMA / DUP_ID / UNKNOWN_BEAM / FUTURE_EP
 *  CHILD_BEAM_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_BEAM — link.ep = entry.ep
 *  BEAM_WITHOUT_QUALITY
 *  LOW_INTENSITY_AT_BEAM (WARN)
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

export const QualityBeamEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const QualityBeamLinkEntrySchema = z.object({
  id: z.string().min(1),
  beamId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const QualityBeamLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minBeamIntense: z.number().int().min(1).max(5).optional(),
  beams: z.array(QualityBeamEntrySchema),
  links: z.array(QualityBeamLinkEntrySchema),
});

export type QualityBeamLinkLedger = z.infer<typeof QualityBeamLinkLedgerSchema>;

export type QualityBeamLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_BEAM'
    | 'FUTURE_EP'
    | 'CHILD_BEAM_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_BEAM'
    | 'BEAM_WITHOUT_QUALITY'
    | 'LOW_INTENSITY_AT_BEAM';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface QualityBeamLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    beams: number;
    latestEp: number;
  };
  findings: QualityBeamLinkFinding[];
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

export function evaluateQualityBeamLink(input: unknown): QualityBeamLinkReport {
  const parsed = QualityBeamLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, beams: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, beams, links, minBeamIntense = 4 } = parsed.data;
  const findings: QualityBeamLinkFinding[] = [];
  const push = (x: QualityBeamLinkFinding) => findings.push(x);

  for (const ent of beams) {
    const r = evaluateStoryRhythm(ent.shotSpec);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_BEAM_FAIL',
        severity: 'FAIL',
        ids: [ent.id, ...childFails.flatMap((f) => ('shotIds' in f ? (f.shotIds ?? []) : []))],
        message: `beam ${ent.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
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

  const byE = new Map(beams.map((e) => [e.id, e]));
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
    const ent = byE.get(link.beamId);
    if (!ent) {
      push({
        code: 'UNKNOWN_BEAM',
        severity: 'FAIL',
        ids: [link.id, link.beamId],
        message: `联表 ${link.id} 引用未知 beam ${link.beamId}`,
        fix: 'beamId 须存在于 beams[]',
      });
      continue;
    }
    if (link.ep !== ent.ep) {
      push({
        code: 'EP_NOT_BEAM',
        severity: 'FAIL',
        ids: [link.id, ent.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 beam.ep=E${ent.ep}`,
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
        message: `${link.id}: 束光节奏镜 E${link.ep} quality-leap FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '束光节奏镜须过表演/情绪/口型/镜头门（quality-leap）',
      });
      continue;
    }
    if (maxIntensity(link.qualityLeap) < minBeamIntense) {
      push({
        code: 'LOW_INTENSITY_AT_BEAM',
        severity: 'WARN',
        ids: [link.id, ent.id],
        message: `${link.id}: 束光节奏集强度 < ${minBeamIntense}`,
        fix: '抬高 intensity',
      });
    }
    linked.add(ent.id);
    aligned += 1;
  }

  for (const ent of beams) {
    if (!linked.has(ent.id)) {
      push({
        code: 'BEAM_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [ent.id],
        message: `beam ${ent.id} ep=E${ent.ep} 无 quality 联表`,
        fix: '为束光节奏挂 QualityBeamLink',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { links: links.length, aligned, beams: beams.length, latestEp },
    findings,
    gates: GATES,
  };
}
