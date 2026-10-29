/**
 * V12 · Foreshadow × Quality-Leap Link Gate (伏笔回收 × 表演门 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《伪人降临》: 高优伏笔 payoff 镜须过表演/情绪门，不能空壳甩真相.
 *  - foreshadow-ledger 管 plant→payoff；quality-leap 管回收镜可见表演——本 gate 硬联表.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_FORESHADOW / FUTURE_EP
 *  CHILD_FORESHADOW_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_PAYOFF — link.ep 须等于 payoffEp
 *  PAYOFF_WITHOUT_QUALITY — 已 payoff 无联表 quality
 *  PENDING_FORESHADOW (WARN)
 *  LOW_INTENSITY_AT_PAYOFF (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
} from './foreshadow-ledger-gate';
import {
  QualityLeapDocSchema,
  evaluateQualityLeap,
} from './quality-leap-gate';

const Ep = z.number().int().positive();

export const ForeshadowQualityLinkEntrySchema = z.object({
  id: z.string().min(1),
  foreshadowId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const ForeshadowQualityLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minPayoffIntense: z.number().int().min(1).max(5).optional(),
  items: z.array(ForeshadowItemSchema),
  links: z.array(ForeshadowQualityLinkEntrySchema),
});

export type ForeshadowQualityLinkLedger = z.infer<typeof ForeshadowQualityLinkLedgerSchema>;

export type ForeshadowQualityLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_FORESHADOW'
    | 'FUTURE_EP'
    | 'CHILD_FORESHADOW_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_PAYOFF'
    | 'PAYOFF_WITHOUT_QUALITY'
    | 'PENDING_FORESHADOW'
    | 'LOW_INTENSITY_AT_PAYOFF';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface ForeshadowQualityLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    items: number;
    latestEp: number;
  };
  findings: ForeshadowQualityLinkFinding[];
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

export function evaluateForeshadowQualityLink(input: unknown): ForeshadowQualityLinkReport {
  const parsed = ForeshadowQualityLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, items: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, items, links, minPayoffIntense = 4 } = parsed.data;
  const findings: ForeshadowQualityLinkFinding[] = [];
  const push = (x: ForeshadowQualityLinkFinding) => findings.push(x);

  const fsReport = evaluateForeshadowLedger({ series, latestEp, items });
  if (fsReport.verdict === 'FAIL') {
    const childFails = fsReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_FORESHADOW_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌伏笔账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 foreshadow-ledger-gate',
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

  const byItem = new Map(items.map((i) => [i.id, i]));
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
    const item = byItem.get(link.foreshadowId);
    if (!item) {
      push({
        code: 'UNKNOWN_FORESHADOW',
        severity: 'FAIL',
        ids: [link.id, link.foreshadowId],
        message: `联表 ${link.id} 引用未知 foreshadow ${link.foreshadowId}`,
        fix: 'foreshadowId 须存在于 items[]',
      });
      continue;
    }
    if (item.payoffEp === undefined || link.ep !== item.payoffEp) {
      push({
        code: 'EP_NOT_PAYOFF',
        severity: 'FAIL',
        ids: [link.id, item.id],
        message: `${link.id}: ep=E${link.ep} ≠ payoffEp=${item.payoffEp ?? '无'}`,
        fix: '伏笔回收集须挂表演门',
      });
      continue;
    }

    const ql = evaluateQualityLeap(link.qualityLeap);
    if (ql.verdict === 'FAIL') {
      const childFails = ql.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_QUALITY_FAIL',
        severity: 'FAIL',
        ids: [link.id, item.id, ...(childFails.flatMap((f) => f.ids ?? []))],
        message: `${link.id}: qualityLeap FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '伏笔回收镜须过表演/情绪/口型门',
      });
      continue;
    }

    if (maxIntensity(link.qualityLeap) < minPayoffIntense) {
      push({
        code: 'LOW_INTENSITY_AT_PAYOFF',
        severity: 'WARN',
        ids: [link.id, item.id],
        message: `${link.id}: payoff 强度 ${maxIntensity(link.qualityLeap)} < ${minPayoffIntense}`,
        fix: '回收镜建议抬高强度',
      });
    }

    linked.add(item.id);
    aligned += 1;
  }

  for (const item of items) {
    if (item.payoffEp !== undefined && !linked.has(item.id)) {
      push({
        code: 'PAYOFF_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [item.id],
        message: `foreshadow ${item.id} payoffEp=E${item.payoffEp} 无 quality 联表`,
        fix: '为回收集挂 ForeshadowQualityLink',
      });
    } else if (!linked.has(item.id)) {
      push({
        code: 'PENDING_FORESHADOW',
        severity: 'WARN',
        ids: [item.id],
        message: `foreshadow ${item.id} 尚未联表到 quality`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { links: links.length, aligned, items: items.length, latestEp },
    findings,
    gates: GATES,
  };
}
