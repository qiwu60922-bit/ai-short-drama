/**
 * V12 · Quality-Leap × 萘酚 Link Gate (表演门 × 萘酚 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 萘酚达标集须过表演/情绪门.
 *  - 与 qualityDriftLink / qualityCrestLink 互补：本 gate 以 quality×NaphtholLink 联表.
 *
 * naphthols[]: { id, ep, shotSpec }
 *  SCHEMA / DUP_ID / UNKNOWN_NAPHTHOL / FUTURE_EP
 *  CHILD_NAPHTHOL_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_NAPHTHOL — link.ep = entry.ep
 *  NAPHTHOL_WITHOUT_QUALITY
 *  LOW_INTENSITY_AT_NAPHTHOL (WARN)
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

export const QualityNaphtholEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const QualityNaphtholLinkEntrySchema = z.object({
  id: z.string().min(1),
  naphtholId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const QualityNaphtholLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minNaphtholIntense: z.number().int().min(1).max(5).optional(),
  naphthols: z.array(QualityNaphtholEntrySchema),
  links: z.array(QualityNaphtholLinkEntrySchema),
});

export type QualityNaphtholLinkLedger = z.infer<typeof QualityNaphtholLinkLedgerSchema>;

export type QualityNaphtholLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_NAPHTHOL'
    | 'FUTURE_EP'
    | 'CHILD_NAPHTHOL_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_NAPHTHOL'
    | 'NAPHTHOL_WITHOUT_QUALITY'
    | 'LOW_INTENSITY_AT_NAPHTHOL';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface QualityNaphtholLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    naphthols: number;
    latestEp: number;
  };
  findings: QualityNaphtholLinkFinding[];
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

export function evaluateQualityNaphtholLink(input: unknown): QualityNaphtholLinkReport {
  const parsed = QualityNaphtholLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, naphthols: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, naphthols, links, minNaphtholIntense = 4 } = parsed.data;
  const findings: QualityNaphtholLinkFinding[] = [];
  const push = (x: QualityNaphtholLinkFinding) => findings.push(x);

  for (const ent of naphthols) {
    const r = evaluateStoryRhythm(ent.shotSpec);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_NAPHTHOL_FAIL',
        severity: 'FAIL',
        ids: [ent.id, ...childFails.flatMap((f) => ('shotIds' in f ? (f.shotIds ?? []) : []))],
        message: `naphthol ${ent.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
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

  const byE = new Map(naphthols.map((e) => [e.id, e]));
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
    const ent = byE.get(link.naphtholId);
    if (!ent) {
      push({
        code: 'UNKNOWN_NAPHTHOL',
        severity: 'FAIL',
        ids: [link.id, link.naphtholId],
        message: `联表 ${link.id} 引用未知 naphthol ${link.naphtholId}`,
        fix: 'naphtholId 须存在于 naphthols[]',
      });
      continue;
    }
    if (link.ep !== ent.ep) {
      push({
        code: 'EP_NOT_NAPHTHOL',
        severity: 'FAIL',
        ids: [link.id, ent.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 naphthol.ep=E${ent.ep}`,
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
        message: `${link.id}: 萘酚镜 E${link.ep} quality-leap FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '萘酚镜须过表演/情绪/口型/镜头门（quality-leap）',
      });
      continue;
    }
    if (maxIntensity(link.qualityLeap) < minNaphtholIntense) {
      push({
        code: 'LOW_INTENSITY_AT_NAPHTHOL',
        severity: 'WARN',
        ids: [link.id, ent.id],
        message: `${link.id}: 萘酚集强度 < ${minNaphtholIntense}`,
        fix: '抬高 intensity',
      });
    }
    linked.add(ent.id);
    aligned += 1;
  }

  for (const ent of naphthols) {
    if (!linked.has(ent.id)) {
      push({
        code: 'NAPHTHOL_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [ent.id],
        message: `naphthol ${ent.id} ep=E${ent.ep} 无 quality 联表`,
        fix: '为萘酚挂 QualityNaphtholLink',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { links: links.length, aligned, naphthols: naphthols.length, latestEp },
    findings,
    gates: GATES,
  };
}
