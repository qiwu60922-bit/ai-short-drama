/**
 * V12 · Quality-Leap × 开场级联 Cascade Link Gate (表演门 × 开场级联 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 开场级联达标集须过表演/情绪门（Cascade 主键）.
 *  - 与 qualityOpeningLink 互补：本 gate 以 quality×CascadeLink 联表（同 opening-cascade 子门）.
 *
 * cascades[]: { id, ep, shotSpec }
 *  SCHEMA / DUP_ID / UNKNOWN_CASCADE / FUTURE_EP
 *  CHILD_CASCADE_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_CASCADE — link.ep = entry.ep
 *  CASCADE_WITHOUT_QUALITY
 *  LOW_INTENSITY_AT_CASCADE (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { evaluateOpeningCascade } from './opening-cascade-gate';
import {
  QualityLeapDocSchema,
  evaluateQualityLeap,
} from './quality-leap-gate';

const Ep = z.number().int().positive();

export const QualityCascadeEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const QualityCascadeLinkEntrySchema = z.object({
  id: z.string().min(1),
  cascadeId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const QualityCascadeLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minCascadeIntense: z.number().int().min(1).max(5).optional(),
  cascades: z.array(QualityCascadeEntrySchema),
  links: z.array(QualityCascadeLinkEntrySchema),
});

export type QualityCascadeLinkLedger = z.infer<typeof QualityCascadeLinkLedgerSchema>;

export type QualityCascadeLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_CASCADE'
    | 'FUTURE_EP'
    | 'CHILD_CASCADE_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_CASCADE'
    | 'CASCADE_WITHOUT_QUALITY'
    | 'LOW_INTENSITY_AT_CASCADE';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface QualityCascadeLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    cascades: number;
    latestEp: number;
  };
  findings: QualityCascadeLinkFinding[];
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

export function evaluateQualityCascadeLink(input: unknown): QualityCascadeLinkReport {
  const parsed = QualityCascadeLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, cascades: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, cascades, links, minCascadeIntense = 4 } = parsed.data;
  const findings: QualityCascadeLinkFinding[] = [];
  const push = (x: QualityCascadeLinkFinding) => findings.push(x);

  for (const ent of cascades) {
    const r = evaluateOpeningCascade(ent.shotSpec);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_CASCADE_FAIL',
        severity: 'FAIL',
        ids: [ent.id, ...childFails.flatMap((f) => f.shotIds ?? [])],
        message: `cascade ${ent.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修子闸',
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

  const byE = new Map(cascades.map((r) => [r.id, r]));
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
    const ent = byE.get(link.cascadeId);
    if (!ent) {
      push({
        code: 'UNKNOWN_CASCADE',
        severity: 'FAIL',
        ids: [link.id, link.cascadeId],
        message: `联表 ${link.id} 引用未知 cascade ${link.cascadeId}`,
        fix: 'cascadeId 须存在于 cascades[]',
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

    if (link.ep !== ent.ep) {
      push({
        code: 'EP_NOT_CASCADE',
        severity: 'FAIL',
        ids: [link.id, ent.id],
        message: `${link.id}: ep=E${link.ep} ≠ entry.ep=E${ent.ep}`,
        fix: 'link.ep 须等于 entry.ep',
      });
      continue;
    }

    const intense = maxIntensity(link.qualityLeap);
    if (intense < minCascadeIntense) {
      push({
        code: 'LOW_INTENSITY_AT_CASCADE',
        severity: 'WARN',
        ids: [link.id],
        message: `${link.id}: max intensity=${intense} < ${minCascadeIntense}`,
        fix: '抬高镜 intensity',
      });
    }

    paired.add(ent.id);
    aligned += 1;
  }

  for (const ent of cascades) {
    if (!paired.has(ent.id)) {
      push({
        code: 'CASCADE_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [ent.id],
        message: `cascade ${ent.id} ep=E${ent.ep} 无 quality 联表`,
        fix: '挂 QualityCascadeLink',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      cascades: cascades.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
