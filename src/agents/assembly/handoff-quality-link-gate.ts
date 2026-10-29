/**
 * V12 · Cliffhanger-Handoff × Quality-Leap Link Gate (集间悬念承接 × 表演门 联表),
 * pre-generation, offline, deterministic.
 *
 *  - 与 qualityHandoffLink（quality 主键）互补：本 gate 以 handoff 为主键。
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《持械入宋》: 下集开场 hook 承接须过表演强度门.
 *  - quality-leap 管表演；cliffhanger-handoff 管两 ShotSpec——本 gate 硬联表 nextEp 表演.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_HANDOFF / FUTURE_EP
 *  CHILD_HANDOFF_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_NEXT — link.ep 须等于 handoff.nextEp
 *  HANDOFF_WITHOUT_QUALITY — handoff 无联表 quality
 *  LOW_INTENSITY_AT_HANDOFF (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { evaluateCliffhangerHandoff } from './cliffhanger-handoff-gate';
import {
  QualityLeapDocSchema,
  evaluateQualityLeap,
} from './quality-leap-gate';

const Ep = z.number().int().positive();

export const HandoffQualityEntrySchema = z.object({
  id: z.string().min(1),
  prevEp: Ep,
  nextEp: Ep,
  prev: ShotSpecDocSchema,
  next: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const HandoffQualityLinkEntrySchema = z.object({
  id: z.string().min(1),
  handoffId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const HandoffQualityLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minHandoffIntense: z.number().int().min(1).max(5).optional(),
  handoffs: z.array(HandoffQualityEntrySchema),
  links: z.array(HandoffQualityLinkEntrySchema),
});

export type HandoffQualityLinkLedger = z.infer<typeof HandoffQualityLinkLedgerSchema>;

export type HandoffQualityLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_HANDOFF'
    | 'FUTURE_EP'
    | 'CHILD_HANDOFF_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_NEXT'
    | 'HANDOFF_WITHOUT_QUALITY'
    | 'LOW_INTENSITY_AT_HANDOFF';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface HandoffQualityLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    handoffs: number;
    latestEp: number;
  };
  findings: HandoffQualityLinkFinding[];
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

export function evaluateHandoffQualityLink(input: unknown): HandoffQualityLinkReport {
  const parsed = HandoffQualityLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, handoffs: 0, latestEp: 0 },
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

  const { series: _s, latestEp, handoffs, links, minHandoffIntense = 4 } = parsed.data;
  const findings: HandoffQualityLinkFinding[] = [];
  const push = (x: HandoffQualityLinkFinding) => findings.push(x);

  for (const h of handoffs) {
    const r = evaluateCliffhangerHandoff(h.prev, h.next);
    if (r.verdict === 'FAIL') {
      const codes = r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
      push({
        code: 'CHILD_HANDOFF_FAIL',
        severity: 'FAIL',
        ids: [h.id],
        message: `handoff ${h.id} FAIL：${codes.join(',') || 'unknown'}`,
        fix: '先修 cliffhanger-handoff-gate',
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

  const byH = new Map(handoffs.map((h) => [h.id, h]));
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

    const handoff = byH.get(link.handoffId);
    if (!handoff) {
      push({
        code: 'UNKNOWN_HANDOFF',
        severity: 'FAIL',
        ids: [link.id, link.handoffId],
        message: `联表 ${link.id} 引用未知 handoff ${link.handoffId}`,
        fix: 'handoffId 须存在于 handoffs[]',
      });
      continue;
    }

    const qlReport = evaluateQualityLeap(link.qualityLeap);
    if (qlReport.verdict === 'FAIL') {
      const childFails = qlReport.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_QUALITY_FAIL',
        severity: 'FAIL',
        ids: [link.id, ...childFails.flatMap((f) => f.ids ?? [])],
        message: `${link.id}: qualityLeap FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 quality-leap-gate',
      });
      continue;
    }

    if (link.ep !== handoff.nextEp) {
      push({
        code: 'EP_NOT_NEXT',
        severity: 'FAIL',
        ids: [link.id, handoff.id],
        message: `${link.id}: ep=E${link.ep} ≠ handoff.nextEp=E${handoff.nextEp}`,
        fix: '表演门挂在承接集（nextEp）',
      });
      continue;
    }

    paired.add(handoff.id);
    const intensity = maxIntensity(link.qualityLeap);
    if (intensity < minHandoffIntense) {
      push({
        code: 'LOW_INTENSITY_AT_HANDOFF',
        severity: 'WARN',
        ids: [link.id, handoff.id],
        message: `${link.id}: max intensity ${intensity} < minHandoffIntense=${minHandoffIntense}`,
        fix: '提高承接集表演强度',
      });
    }

    aligned += 1;
  }

  for (const h of handoffs) {
    if (!paired.has(h.id)) {
      push({
        code: 'HANDOFF_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [h.id],
        message: `handoff ${h.id} 无 quality 联表`,
        fix: '在 links[] 挂 handoffId + nextEp qualityLeap',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      handoffs: handoffs.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
