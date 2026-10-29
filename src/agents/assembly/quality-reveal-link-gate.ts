/**
 * V12 · Quality-Leap × Reveal Link Gate (表演门 × 伪装揭穿 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 伪装揭穿当集镜须过表演/情绪门，不能空壳甩面具.
 *  - 与 qualityBondLink / qualityEnsembleLink 已占用互补：本 gate 以 quality×reveal 联表.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_REVEAL / FUTURE_EP
 *  CHILD_REVEAL_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_REVEAL — link.ep 须等于 revealEp
 *  REVEAL_WITHOUT_QUALITY — 已 reveal 无联表 quality
 *  PENDING_REVEAL (WARN)
 *  LOW_INTENSITY_AT_REVEAL (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  PersonaMaskEntrySchema,
  evaluatePersonaMask,
} from './persona-mask-gate';
import {
  QualityLeapDocSchema,
  evaluateQualityLeap,
} from './quality-leap-gate';

const Ep = z.number().int().positive();

export const QualityRevealLinkEntrySchema = z.object({
  id: z.string().min(1),
  revealId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const QualityRevealLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  /** Intensity floor for LOW_INTENSITY_AT_REVEAL WARN. Default 4. */
  minRevealIntense: z.number().int().min(1).max(5).optional(),
  reveals: z.array(PersonaMaskEntrySchema),
  links: z.array(QualityRevealLinkEntrySchema),
});

export type QualityRevealLinkLedger = z.infer<typeof QualityRevealLinkLedgerSchema>;

export type QualityRevealLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_REVEAL'
    | 'FUTURE_EP'
    | 'CHILD_REVEAL_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_REVEAL'
    | 'REVEAL_WITHOUT_QUALITY'
    | 'PENDING_REVEAL'
    | 'LOW_INTENSITY_AT_REVEAL';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface QualityRevealLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    reveals: number;
    latestEp: number;
  };
  findings: QualityRevealLinkFinding[];
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

export function evaluateQualityRevealLink(input: unknown): QualityRevealLinkReport {
  const parsed = QualityRevealLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, reveals: 0, latestEp: 0 },
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

  const { series, latestEp, reveals, links, minRevealIntense = 4 } = parsed.data;
  const findings: QualityRevealLinkFinding[] = [];
  const push = (x: QualityRevealLinkFinding) => findings.push(x);

  const maskReport = evaluatePersonaMask({ series, latestEp, entries: reveals });
  if (maskReport.verdict === 'FAIL') {
    const childFails = maskReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_REVEAL_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌伪装账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 persona-mask-gate',
    });
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

  const byReveal = new Map(reveals.map((r) => [r.id, r]));
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

    const reveal = byReveal.get(link.revealId);
    if (!reveal) {
      push({
        code: 'UNKNOWN_REVEAL',
        severity: 'FAIL',
        ids: [link.id, link.revealId],
        message: `联表 ${link.id} 引用未知 reveal ${link.revealId}`,
        fix: 'revealId 须存在于 reveals[]',
      });
      continue;
    }

    if (reveal.revealEp === undefined || link.ep !== reveal.revealEp) {
      push({
        code: 'EP_NOT_REVEAL',
        severity: 'FAIL',
        ids: [link.id, reveal.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 revealEp=${reveal.revealEp ?? '无'}`,
        fix: 'link.ep 须等于 revealEp',
      });
      continue;
    }

    const ql = evaluateQualityLeap(link.qualityLeap);
    if (ql.verdict === 'FAIL') {
      const childFails = ql.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_QUALITY_FAIL',
        severity: 'FAIL',
        ids: [link.id, reveal.id, ...childFails.map((f) => f.shotId).filter(Boolean) as string[]],
        message: `${link.id}: 揭穿镜 E${link.ep} quality-leap FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '揭穿镜须过表演/情绪/口型/镜头门（quality-leap）',
      });
      continue;
    }

    if (maxIntensity(link.qualityLeap) < minRevealIntense) {
      push({
        code: 'LOW_INTENSITY_AT_REVEAL',
        severity: 'WARN',
        ids: [link.id, reveal.id],
        message: `${link.id}: 揭穿集强度 < ${minRevealIntense}`,
        fix: '抬高揭穿镜 intensity',
      });
    }

    linked.add(reveal.id);
    aligned += 1;
  }

  for (const reveal of reveals) {
    if (reveal.revealEp !== undefined && !linked.has(reveal.id)) {
      push({
        code: 'REVEAL_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [reveal.id],
        message: `reveal ${reveal.id} revealEp=E${reveal.revealEp} 无 quality 联表`,
        fix: '为揭穿集挂 QualityRevealLink',
      });
    } else if (reveal.revealEp === undefined && !linked.has(reveal.id)) {
      push({
        code: 'PENDING_REVEAL',
        severity: 'WARN',
        ids: [reveal.id],
        message: `reveal ${reveal.id} 尚未揭穿/联表`,
        fix: '规划 revealEp 或补 links[]',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      reveals: reveals.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
