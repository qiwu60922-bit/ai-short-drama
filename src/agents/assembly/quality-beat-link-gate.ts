/**
 * V12 · Quality-Leap × 节拍结构 Link Gate (表演门 × 节拍结构 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 节拍结构达标集须过表演/情绪门.
 *  - 与 qualityHookLink 互补：本 gate 以 quality×BeatLink 联表.
 *
 * beats[]: { id, ep, shotSpec }
 *  SCHEMA / DUP_ID / UNKNOWN_BEAT / FUTURE_EP
 *  CHILD_BEAT_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_BEAT — link.ep = entry.ep
 *  BEAT_WITHOUT_QUALITY
 *  LOW_INTENSITY_AT_BEAT (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { evaluateHookStructure } from './hook-structure-gate';
import {
  QualityLeapDocSchema,
  evaluateQualityLeap,
} from './quality-leap-gate';

const Ep = z.number().int().positive();

export const QualityBeatEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const QualityBeatLinkEntrySchema = z.object({
  id: z.string().min(1),
  beatId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const QualityBeatLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minBeatIntense: z.number().int().min(1).max(5).optional(),
  beats: z.array(QualityBeatEntrySchema),
  links: z.array(QualityBeatLinkEntrySchema),
});

export type QualityBeatLinkLedger = z.infer<typeof QualityBeatLinkLedgerSchema>;

export type QualityBeatLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_BEAT'
    | 'FUTURE_EP'
    | 'CHILD_BEAT_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_BEAT'
    | 'BEAT_WITHOUT_QUALITY'
    | 'LOW_INTENSITY_AT_BEAT';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface QualityBeatLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    beats: number;
    latestEp: number;
  };
  findings: QualityBeatLinkFinding[];
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

export function evaluateQualityBeatLink(input: unknown): QualityBeatLinkReport {
  const parsed = QualityBeatLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, beats: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, beats, links, minBeatIntense = 4 } = parsed.data;
  const findings: QualityBeatLinkFinding[] = [];
  const push = (x: QualityBeatLinkFinding) => findings.push(x);

  for (const ent of beats) {
    const r = evaluateHookStructure(ent.shotSpec);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_BEAT_FAIL',
        severity: 'FAIL',
        ids: [ent.id, ...childFails.flatMap((f) => ('shotIds' in f ? (f.shotIds ?? []) : []))],
        message: `beat ${ent.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
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

  const byE = new Map(beats.map((e) => [e.id, e]));
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
    const ent = byE.get(link.beatId);
    if (!ent) {
      push({
        code: 'UNKNOWN_BEAT',
        severity: 'FAIL',
        ids: [link.id, link.beatId],
        message: `联表 ${link.id} 引用未知 beat ${link.beatId}`,
        fix: 'beatId 须存在于 beats[]',
      });
      continue;
    }
    if (link.ep !== ent.ep) {
      push({
        code: 'EP_NOT_BEAT',
        severity: 'FAIL',
        ids: [link.id, ent.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 beat.ep=E${ent.ep}`,
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
        message: `${link.id}: 节拍结构镜 E${link.ep} quality-leap FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '节拍结构镜须过表演/情绪/口型/镜头门（quality-leap）',
      });
      continue;
    }
    if (maxIntensity(link.qualityLeap) < minBeatIntense) {
      push({
        code: 'LOW_INTENSITY_AT_BEAT',
        severity: 'WARN',
        ids: [link.id, ent.id],
        message: `${link.id}: 节拍结构集强度 < ${minBeatIntense}`,
        fix: '抬高 intensity',
      });
    }
    linked.add(ent.id);
    aligned += 1;
  }

  for (const ent of beats) {
    if (!linked.has(ent.id)) {
      push({
        code: 'BEAT_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [ent.id],
        message: `beat ${ent.id} ep=E${ent.ep} 无 quality 联表`,
        fix: '为节拍结构挂 QualityBeatLink',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { links: links.length, aligned, beats: beats.length, latestEp },
    findings,
    gates: GATES,
  };
}
