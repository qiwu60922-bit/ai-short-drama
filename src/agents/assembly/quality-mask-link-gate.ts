/**
 * V12 · Quality-Leap × Persona-Mask Link Gate (表演门 × 伪装人设 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《逃婚三年，江少的花心人设崩了》: mask reveal 镜须过表演/情绪门，不能空壳崩塌脸.
 *  - 《枝头春意闹》: 当场抓包同集 plant+reveal，揭穿镜挂 quality-leap.
 *  - quality-leap 管表演可见度；persona-mask 管 plant→reveal——本 gate 硬联表揭穿镜.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_MASK / FUTURE_EP
 *  CHILD_MASK_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_REVEAL — link.ep 须等于 mask.revealEp
 *  REVEAL_WITHOUT_QUALITY — 已 reveal 的 mask 无联表 quality
 *  LOW_INTENSITY_AT_REVEAL (WARN) — reveal 联表 max intensity < minRevealIntense
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

export const QualityMaskLinkEntrySchema = z.object({
  id: z.string().min(1),
  maskId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const QualityMaskLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  /** Intensity floor for LOW_INTENSITY_AT_REVEAL WARN. Default 4. */
  minRevealIntense: z.number().int().min(1).max(5).optional(),
  masks: z.array(PersonaMaskEntrySchema),
  links: z.array(QualityMaskLinkEntrySchema),
});

export type QualityMaskLinkLedger = z.infer<typeof QualityMaskLinkLedgerSchema>;

export type QualityMaskLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_MASK'
    | 'FUTURE_EP'
    | 'CHILD_MASK_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_REVEAL'
    | 'REVEAL_WITHOUT_QUALITY'
    | 'LOW_INTENSITY_AT_REVEAL';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface QualityMaskLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    masks: number;
    latestEp: number;
  };
  findings: QualityMaskLinkFinding[];
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

export function evaluateQualityMaskLink(input: unknown): QualityMaskLinkReport {
  const parsed = QualityMaskLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, masks: 0, latestEp: 0 },
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

  const { series, latestEp, masks, links, minRevealIntense = 4 } = parsed.data;
  const findings: QualityMaskLinkFinding[] = [];
  const push = (x: QualityMaskLinkFinding) => findings.push(x);

  const maskReport = evaluatePersonaMask({ series, latestEp, entries: masks });
  if (maskReport.verdict === 'FAIL') {
    const childFails = maskReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_MASK_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌伪装账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 persona-mask-gate（plant→maintain→reveal）',
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

  const byMask = new Map(masks.map((m) => [m.id, m]));
  const linkedMasks = new Set<string>();
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

    const mask = byMask.get(link.maskId);
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

    if (mask.revealEp === undefined || link.ep !== mask.revealEp) {
      push({
        code: 'EP_NOT_REVEAL',
        severity: 'FAIL',
        ids: [link.id, mask.id],
        message: `${link.id}: ep=E${link.ep} 不是 mask.revealEp（${mask.revealEp ?? '未揭穿'}）`,
        fix: 'link.ep 对准伪装揭穿集',
      });
      continue;
    }
    linkedMasks.add(mask.id);

    const ql = evaluateQualityLeap(link.qualityLeap);
    if (ql.verdict === 'FAIL') {
      const childFails = ql.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_QUALITY_FAIL',
        severity: 'FAIL',
        ids: [link.id, mask.id, ...(childFails.map((f) => f.shotId).filter(Boolean) as string[])],
        message: `${link.id}: E${link.ep} quality-leap FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '揭穿镜须过表演/情绪/口型/镜头门',
      });
      continue;
    }

    const mi = maxIntensity(link.qualityLeap);
    if (mi < minRevealIntense) {
      push({
        code: 'LOW_INTENSITY_AT_REVEAL',
        severity: 'WARN',
        ids: [link.id, mask.id],
        message: `${link.id}: 揭穿 E${link.ep} max intensity=${mi} < ${minRevealIntense}`,
        fix: '揭穿镜补高强度表演（intensity≥阈值）',
      });
    }

    aligned += 1;
  }

  for (const mask of masks) {
    if (mask.revealEp !== undefined && !linkedMasks.has(mask.id)) {
      push({
        code: 'REVEAL_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [mask.id],
        message: `mask ${mask.id} revealEp=E${mask.revealEp} 无 qualityLeap 联表`,
        fix: '为揭穿集挂 QualityMaskLink（qualityLeap）',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { links: links.length, aligned, masks: masks.length, latestEp },
    findings,
    gates: GATES,
  };
}
