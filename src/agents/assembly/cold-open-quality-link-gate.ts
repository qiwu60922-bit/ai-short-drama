/**
 * V12 · Cold-Open × Quality-Leap Link Gate (冷开钩 × 表演门 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 冷开快入镜须过表演/情绪门，不能空壳抛钩.
 *
 * coldOpens[]: { id, ep, shotSpec }
 *  SCHEMA / DUP_ID / UNKNOWN_COLD_OPEN / FUTURE_EP
 *  CHILD_COLD_OPEN_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_COLD — link.ep = coldOpen.ep
 *  COLD_OPEN_WITHOUT_QUALITY
 *  LOW_INTENSITY_AT_COLD (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { evaluateColdOpenHook } from './cold-open-hook-gate';
import {
  QualityLeapDocSchema,
  evaluateQualityLeap,
} from './quality-leap-gate';

const Ep = z.number().int().positive();

export const ColdOpenQualityColdOpenEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const ColdOpenQualityLinkEntrySchema = z.object({
  id: z.string().min(1),
  coldOpenId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const ColdOpenQualityLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minColdIntense: z.number().int().min(1).max(5).optional(),
  coldOpens: z.array(ColdOpenQualityColdOpenEntrySchema),
  links: z.array(ColdOpenQualityLinkEntrySchema),
});

export type ColdOpenQualityLinkLedger = z.infer<typeof ColdOpenQualityLinkLedgerSchema>;

export type ColdOpenQualityLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_COLD_OPEN'
    | 'FUTURE_EP'
    | 'CHILD_COLD_OPEN_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_COLD'
    | 'COLD_OPEN_WITHOUT_QUALITY'
    | 'LOW_INTENSITY_AT_COLD';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface ColdOpenQualityLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    coldOpens: number;
    latestEp: number;
  };
  findings: ColdOpenQualityLinkFinding[];
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

export function evaluateColdOpenQualityLink(input: unknown): ColdOpenQualityLinkReport {
  const parsed = ColdOpenQualityLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, coldOpens: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, coldOpens, links, minColdIntense = 4 } = parsed.data;
  const findings: ColdOpenQualityLinkFinding[] = [];
  const push = (x: ColdOpenQualityLinkFinding) => findings.push(x);

  for (const co of coldOpens) {
    const r = evaluateColdOpenHook(co.shotSpec);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_COLD_OPEN_FAIL',
        severity: 'FAIL',
        ids: [co.id, ...childFails.flatMap((f) => f.shotIds ?? [])],
        message: `coldOpen ${co.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 cold-open-hook-gate',
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

  const byC = new Map(coldOpens.map((c) => [c.id, c]));
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
    const co = byC.get(link.coldOpenId);
    if (!co) {
      push({
        code: 'UNKNOWN_COLD_OPEN',
        severity: 'FAIL',
        ids: [link.id, link.coldOpenId],
        message: `联表 ${link.id} 引用未知 coldOpen ${link.coldOpenId}`,
        fix: 'coldOpenId 须存在于 coldOpens[]',
      });
      continue;
    }

    const qReport = evaluateQualityLeap(link.qualityLeap);
    if (qReport.verdict === 'FAIL') {
      const childFails = qReport.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_QUALITY_FAIL',
        severity: 'FAIL',
        ids: [link.id, ...(childFails.map((f) => f.shotId).filter(Boolean) as string[])],
        message: `联表 ${link.id} qualityLeap FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 quality-leap-gate',
      });
      continue;
    }

    if (link.ep !== co.ep) {
      push({
        code: 'EP_NOT_COLD',
        severity: 'FAIL',
        ids: [link.id, co.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 coldOpen=${co.ep}`,
        fix: 'link.ep 须等于 coldOpen.ep',
      });
      continue;
    }

    const intense = maxIntensity(link.qualityLeap);
    if (intense < minColdIntense) {
      push({
        code: 'LOW_INTENSITY_AT_COLD',
        severity: 'WARN',
        ids: [link.id, co.id],
        message: `${link.id}: max intensity=${intense} < minColdIntense=${minColdIntense}`,
        fix: '提高表演 intensity 或下调 minColdIntense',
      });
    }

    paired.add(co.id);
    aligned += 1;
  }

  for (const co of coldOpens) {
    if (!paired.has(co.id)) {
      push({
        code: 'COLD_OPEN_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [co.id],
        message: `coldOpen ${co.id} 无 quality 联表`,
        fix: '为冷开挂 ColdOpenQualityLink',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      coldOpens: coldOpens.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
