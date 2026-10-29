/**
 * V12 · Mask × Reveal Quality Link Gate (伪装揭穿 × 表演门 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - mask reveal 镜须过表演/情绪门，不能空壳抓包.
 *  - 与 revealQualityPeakBridge / maskQualityLink 互补：本 gate 以 maskReveal 命名.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_MASK / FUTURE_EP
 *  CHILD_MASK_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_REVEAL — link.ep = revealEp
 *  REVEAL_WITHOUT_QUALITY
 *  PENDING_MASK (WARN) / LOW_INTENSITY_AT_REVEAL (WARN)
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

export const MaskRevealLinkEntrySchema = z.object({
  id: z.string().min(1),
  maskId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const MaskRevealLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minRevealIntense: z.number().int().min(1).max(5).optional(),
  masks: z.array(PersonaMaskEntrySchema),
  links: z.array(MaskRevealLinkEntrySchema),
});

export type MaskRevealLinkLedger = z.infer<typeof MaskRevealLinkLedgerSchema>;

export type MaskRevealLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_MASK'
    | 'FUTURE_EP'
    | 'CHILD_MASK_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_REVEAL'
    | 'REVEAL_WITHOUT_QUALITY'
    | 'PENDING_MASK'
    | 'LOW_INTENSITY_AT_REVEAL';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface MaskRevealLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    masks: number;
    latestEp: number;
  };
  findings: MaskRevealLinkFinding[];
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

export function evaluateMaskRevealLink(input: unknown): MaskRevealLinkReport {
  const parsed = MaskRevealLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, masks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, masks, links, minRevealIntense = 4 } = parsed.data;
  const findings: MaskRevealLinkFinding[] = [];
  const push = (x: MaskRevealLinkFinding) => findings.push(x);

  const mReport = evaluatePersonaMask({ series, latestEp, entries: masks });
  if (mReport.verdict === 'FAIL') {
    const childFails = mReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_MASK_FAIL',
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
    push({ code: 'DUP_ID', severity: 'FAIL', ids: [id], message: `联表ID重复：${id}`, fix: '联表 id 须唯一' });
  }

  const byM = new Map(masks.map((m) => [m.id, m]));
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
    const mask = byM.get(link.maskId);
    if (!mask) {
      push({
        code: 'UNKNOWN_MASK',
        severity: 'FAIL',
        ids: [link.id, link.maskId],
        message: `联表 ${link.id} 引用未知 mask ${link.maskId}`,
        fix: 'maskId 须存在于 masks[]',
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

    if (mask.revealEp === undefined || link.ep !== mask.revealEp) {
      push({
        code: 'EP_NOT_REVEAL',
        severity: 'FAIL',
        ids: [link.id, mask.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 reveal=${mask.revealEp ?? '无'}`,
        fix: 'link.ep 须等于 mask.revealEp',
      });
      continue;
    }

    const intense = maxIntensity(link.qualityLeap);
    if (intense < minRevealIntense) {
      push({
        code: 'LOW_INTENSITY_AT_REVEAL',
        severity: 'WARN',
        ids: [link.id, mask.id],
        message: `${link.id}: max intensity=${intense} < minRevealIntense=${minRevealIntense}`,
        fix: '提高表演 intensity 或下调 minRevealIntense',
      });
    }

    paired.add(mask.id);
    aligned += 1;
  }

  for (const mask of masks) {
    if (mask.revealEp !== undefined && !paired.has(mask.id)) {
      push({
        code: 'REVEAL_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [mask.id],
        message: `mask ${mask.id} revealEp=E${mask.revealEp} 无 quality 联表`,
        fix: '为揭穿集挂 MaskRevealLink',
      });
    } else if (!paired.has(mask.id)) {
      push({
        code: 'PENDING_MASK',
        severity: 'WARN',
        ids: [mask.id],
        message: `mask ${mask.id} 尚未联表到 maskReveal`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      masks: masks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
