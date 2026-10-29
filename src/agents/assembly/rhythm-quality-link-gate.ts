/**
 * V12 · Rhythm × Quality Link Gate (系列节奏 × 表演门 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 节奏达标集须过表演/情绪门.
 *  - 与 rhythmBondLink / qualityBondLink 互补：本 gate 以 rhythm 联 quality.
 *
 * rhythms[]: { id, ep, shotSpec }
 *  SCHEMA / DUP_ID / UNKNOWN_RHYTHM / FUTURE_EP
 *  CHILD_RHYTHM_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_RHYTHM — link.ep = rhythm.ep
 *  RHYTHM_WITHOUT_QUALITY
 *  LOW_INTENSITY_AT_RHYTHM (WARN)
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

export const RhythmQualityRhythmEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const RhythmQualityLinkEntrySchema = z.object({
  id: z.string().min(1),
  rhythmId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const RhythmQualityLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minRhythmIntense: z.number().int().min(1).max(5).optional(),
  rhythms: z.array(RhythmQualityRhythmEntrySchema),
  links: z.array(RhythmQualityLinkEntrySchema),
});

export type RhythmQualityLinkLedger = z.infer<typeof RhythmQualityLinkLedgerSchema>;

export type RhythmQualityLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_RHYTHM'
    | 'FUTURE_EP'
    | 'CHILD_RHYTHM_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_RHYTHM'
    | 'RHYTHM_WITHOUT_QUALITY'
    | 'LOW_INTENSITY_AT_RHYTHM';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface RhythmQualityLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    rhythms: number;
    latestEp: number;
  };
  findings: RhythmQualityLinkFinding[];
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

export function evaluateRhythmQualityLink(input: unknown): RhythmQualityLinkReport {
  const parsed = RhythmQualityLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, rhythms: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, rhythms, links, minRhythmIntense = 4 } = parsed.data;
  const findings: RhythmQualityLinkFinding[] = [];
  const push = (x: RhythmQualityLinkFinding) => findings.push(x);

  for (const rh of rhythms) {
    const r = evaluateStoryRhythm(rh.shotSpec);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_RHYTHM_FAIL',
        severity: 'FAIL',
        ids: [rh.id, ...childFails.flatMap((f) => f.shotIds ?? [])],
        message: `rhythm ${rh.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 story-rhythm-gate',
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

  const byR = new Map(rhythms.map((r) => [r.id, r]));
  const paired = new Set<string>();
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
    const rh = byR.get(link.rhythmId);
    if (!rh) {
      push({
        code: 'UNKNOWN_RHYTHM',
        severity: 'FAIL',
        ids: [link.id, link.rhythmId],
        message: `联表 ${link.id} 引用未知 rhythm ${link.rhythmId}`,
        fix: 'rhythmId 须存在于 rhythms[]',
      });
      continue;
    }

    const ql = evaluateQualityLeap(link.qualityLeap);
    if (ql.verdict === 'FAIL') {
      const childFails = ql.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_QUALITY_FAIL',
        severity: 'FAIL',
        ids: [link.id, ...childFails.flatMap((f) => f.ids ?? [])],
        message: `内嵌表演门 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 quality-leap-gate',
      });
      continue;
    }

    if (link.ep !== rh.ep) {
      push({
        code: 'EP_NOT_RHYTHM',
        severity: 'FAIL',
        ids: [link.id, rh.id],
        message: `${link.id}: ep=E${link.ep} ≠ rhythm.ep=E${rh.ep}`,
        fix: 'link.ep 须等于 rhythm.ep',
      });
      continue;
    }

    const intense = maxIntensity(link.qualityLeap);
    if (intense < minRhythmIntense) {
      push({
        code: 'LOW_INTENSITY_AT_RHYTHM',
        severity: 'WARN',
        ids: [link.id],
        message: `${link.id}: rhythm 镜 max intensity=${intense} < ${minRhythmIntense}`,
        fix: '抬高节奏集镜 intensity',
      });
    }

    paired.add(rh.id);
    aligned += 1;
  }

  for (const rh of rhythms) {
    if (!paired.has(rh.id)) {
      push({
        code: 'RHYTHM_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [rh.id],
        message: `rhythm ${rh.id} ep=E${rh.ep} 无 rhythm×quality 联表`,
        fix: '为节奏集挂 RhythmQualityLink',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      rhythms: rhythms.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
