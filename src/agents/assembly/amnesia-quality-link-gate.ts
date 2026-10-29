/**
 * V12 · Amnesia × Quality-Leap Link Gate (失忆唤回 × 表演门 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《反派拿捏》: 唤回 recover 镜须过表演/情绪门，不能空壳喊名字.
 *  - amnesia-arc 管 plant→recover；quality-leap 管唤回镜可见表演——本 gate 硬联表.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_AMNESIA / FUTURE_EP
 *  CHILD_AMNESIA_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_RECOVER — link.ep 须等于 recoverEp
 *  RECOVER_WITHOUT_QUALITY — 已 recover 无联表 quality
 *  PENDING_AMNESIA (WARN)
 *  LOW_INTENSITY_AT_RECOVER (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  AmnesiaArcEntrySchema,
  evaluateAmnesiaArc,
} from './amnesia-arc-gate';
import {
  QualityLeapDocSchema,
  evaluateQualityLeap,
} from './quality-leap-gate';

const Ep = z.number().int().positive();

export const AmnesiaQualityLinkEntrySchema = z.object({
  id: z.string().min(1),
  amnesiaId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const AmnesiaQualityLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minRecoverIntense: z.number().int().min(1).max(5).optional(),
  amnesias: z.array(AmnesiaArcEntrySchema),
  links: z.array(AmnesiaQualityLinkEntrySchema),
});

export type AmnesiaQualityLinkLedger = z.infer<typeof AmnesiaQualityLinkLedgerSchema>;

export type AmnesiaQualityLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_AMNESIA'
    | 'FUTURE_EP'
    | 'CHILD_AMNESIA_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_RECOVER'
    | 'RECOVER_WITHOUT_QUALITY'
    | 'PENDING_AMNESIA'
    | 'LOW_INTENSITY_AT_RECOVER';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AmnesiaQualityLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    amnesias: number;
    latestEp: number;
  };
  findings: AmnesiaQualityLinkFinding[];
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

export function evaluateAmnesiaQualityLink(input: unknown): AmnesiaQualityLinkReport {
  const parsed = AmnesiaQualityLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, amnesias: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, amnesias, links, minRecoverIntense = 4 } = parsed.data;
  const findings: AmnesiaQualityLinkFinding[] = [];
  const push = (x: AmnesiaQualityLinkFinding) => findings.push(x);

  const amReport = evaluateAmnesiaArc({ series, latestEp, entries: amnesias });
  if (amReport.verdict === 'FAIL') {
    const childFails = amReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_AMNESIA_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌失忆账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 amnesia-arc-gate',
    });
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

  const byAm = new Map(amnesias.map((a) => [a.id, a]));
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
    const am = byAm.get(link.amnesiaId);
    if (!am) {
      push({
        code: 'UNKNOWN_AMNESIA',
        severity: 'FAIL',
        ids: [link.id, link.amnesiaId],
        message: `联表 ${link.id} 引用未知 amnesia ${link.amnesiaId}`,
        fix: 'amnesiaId 须存在于 amnesias[]',
      });
      continue;
    }

    if (am.recoverEp === undefined || link.ep !== am.recoverEp) {
      push({
        code: 'EP_NOT_RECOVER',
        severity: 'FAIL',
        ids: [link.id, am.id],
        message: `${link.id}: ep=E${link.ep} ≠ recoverEp=${am.recoverEp ?? '未唤回'}`,
        fix: '唤回集须挂表演门',
      });
      continue;
    }

    const ql = evaluateQualityLeap(link.qualityLeap);
    if (ql.verdict === 'FAIL') {
      const childFails = ql.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_QUALITY_FAIL',
        severity: 'FAIL',
        ids: [link.id, am.id, ...(childFails.flatMap((f) => f.ids ?? []))],
        message: `${link.id}: qualityLeap FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '唤回镜须过表演/情绪/口型门',
      });
      continue;
    }

    const intense = maxIntensity(link.qualityLeap);
    if (intense < minRecoverIntense) {
      push({
        code: 'LOW_INTENSITY_AT_RECOVER',
        severity: 'WARN',
        ids: [link.id, am.id],
        message: `${link.id}: recover 镜 max intensity=${intense} < ${minRecoverIntense}`,
        fix: '唤回镜建议抬高强度表演',
      });
    }

    linked.add(am.id);
    aligned += 1;
  }

  for (const am of amnesias) {
    if (am.recoverEp !== undefined && !linked.has(am.id)) {
      push({
        code: 'RECOVER_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [am.id],
        message: `amnesia ${am.id} recoverEp=E${am.recoverEp} 无 quality 联表`,
        fix: '为唤回集挂 AmnesiaQualityLink',
      });
    } else if (!linked.has(am.id)) {
      push({
        code: 'PENDING_AMNESIA',
        severity: 'WARN',
        ids: [am.id],
        message: `amnesia ${am.id} 尚未联表到 quality`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { links: links.length, aligned, amnesias: amnesias.length, latestEp },
    findings,
    gates: GATES,
  };
}
