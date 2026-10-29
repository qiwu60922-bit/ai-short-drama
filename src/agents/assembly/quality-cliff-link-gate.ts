/**
 * V12 · Quality-Leap × Cliff-Cascade Link Gate (表演门 × 跨集悬念叠钩 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《持械入宋》: 下集开场 hook 承接须过表演强度门，不能空壳对峙.
 *  - 《聚宝仙盆》: 季间悬念兑现镜挂 quality-leap.
 *  - quality-leap 管表演；cliff-cascade 管 prev→next——本 gate 硬联表 nextEp 表演.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_CLIFF / FUTURE_EP
 *  CHILD_CASCADE_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_NEXT — link.ep 须等于 cliff.nextEp
 *  CLIFF_WITHOUT_QUALITY — cliff 无联表 quality
 *  LOW_INTENSITY_AT_HANDOFF (WARN) — nextEp 联表 max intensity < minHandoffIntense
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  CliffCascadeLinkEntrySchema,
  evaluateCliffCascadeLink,
} from './cliff-cascade-link-gate';
import {
  QualityLeapDocSchema,
  evaluateQualityLeap,
} from './quality-leap-gate';

const Ep = z.number().int().positive();

export const QualityCliffLinkEntrySchema = z.object({
  id: z.string().min(1),
  cliffLinkId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const QualityCliffLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minHandoffIntense: z.number().int().min(1).max(5).optional(),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  links: z.array(QualityCliffLinkEntrySchema),
});

export type QualityCliffLinkLedger = z.infer<typeof QualityCliffLinkLedgerSchema>;

export type QualityCliffLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_CLIFF'
    | 'FUTURE_EP'
    | 'CHILD_CASCADE_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_NEXT'
    | 'CLIFF_WITHOUT_QUALITY'
    | 'LOW_INTENSITY_AT_HANDOFF';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface QualityCliffLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    cliffLinks: number;
    latestEp: number;
  };
  findings: QualityCliffLinkFinding[];
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

export function evaluateQualityCliffLink(input: unknown): QualityCliffLinkReport {
  const parsed = QualityCliffLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, cliffLinks: 0, latestEp: 0 },
      findings: [
        {
          code: 'SCHEMA',
          severity: 'FAIL',
          message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        },
      ],
      gates: GATES,
    };
  }

  const { series, latestEp, cliffLinks, links, minHandoffIntense = 4 } = parsed.data;
  const findings: QualityCliffLinkFinding[] = [];
  const push = (x: QualityCliffLinkFinding) => findings.push(x);

  if (cliffLinks.length) {
    const cascade = evaluateCliffCascadeLink({ series, latestEp, links: cliffLinks });
    if (cascade.verdict === 'FAIL') {
      const childFails = cascade.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_CASCADE_FAIL',
        severity: 'FAIL',
        ids: childFails.flatMap((f) => f.ids ?? []),
        message: `内嵌 cliffCascade FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 cliff-cascade-link-gate',
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
    push({
      code: 'DUP_ID',
      severity: 'FAIL',
      ids: [id],
      message: `联表ID重复：${id}`,
      fix: '联表 id 须唯一',
    });
  }

  const byCliff = new Map(cliffLinks.map((c) => [c.id, c]));
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

    const cliff = byCliff.get(link.cliffLinkId);
    if (!cliff) {
      push({
        code: 'UNKNOWN_CLIFF',
        severity: 'FAIL',
        ids: [link.id, link.cliffLinkId],
        message: `联表 ${link.id} 引用未知 cliffLink ${link.cliffLinkId}`,
        fix: 'cliffLinkId 须存在于 cliffLinks[]',
      });
      continue;
    }

    if (link.ep !== cliff.nextEp) {
      push({
        code: 'EP_NOT_NEXT',
        severity: 'FAIL',
        ids: [link.id, cliff.id],
        message: `${link.id}: ep=E${link.ep} 不是 cliff.nextEp=E${cliff.nextEp}`,
        fix: '承接表演挂在下集（nextEp）',
      });
      continue;
    }
    paired.add(cliff.id);

    const ql = evaluateQualityLeap(link.qualityLeap);
    if (ql.verdict === 'FAIL') {
      const childFails = ql.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_QUALITY_FAIL',
        severity: 'FAIL',
        ids: [link.id, cliff.id, ...(childFails.map((f) => f.shotId).filter(Boolean) as string[])],
        message: `${link.id}: E${link.ep} quality-leap FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '承接镜须过表演/情绪门',
      });
      continue;
    }

    const mi = maxIntensity(link.qualityLeap);
    if (mi < minHandoffIntense) {
      push({
        code: 'LOW_INTENSITY_AT_HANDOFF',
        severity: 'WARN',
        ids: [link.id, cliff.id],
        message: `${link.id}: 承接 E${link.ep} max intensity=${mi} < ${minHandoffIntense}`,
        fix: '下集开场补高强度表演',
      });
    }

    aligned += 1;
  }

  for (const c of cliffLinks) {
    if (!paired.has(c.id)) {
      push({
        code: 'CLIFF_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [c.id],
        message: `cliffLink ${c.id} 无 qualityLeap 联表`,
        fix: '为 nextEp 挂 QualityCliffLink',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      cliffLinks: cliffLinks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
