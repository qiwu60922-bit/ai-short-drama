/**
 * V12 · Persona-Mask × Motif Link Gate (伪装揭穿 × 视觉母题 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《逃婚三年》: 揭穿镜须回扣已栽种视觉母题.
 *  - 与 motifMaskLink（motif 主键）互补：本 gate 以 mask 为主键强制「有 reveal 须对齐 motif」。
 *
 *  SCHEMA / DUP_ID / UNKNOWN_MOTIF / UNKNOWN_MASK
 *  CHILD_MOTIF_FAIL / CHILD_MASK_FAIL
 *  NO_APPEARANCE_AT_REVEAL
 *  REVEAL_WITHOUT_MOTIF — 已 reveal 无联表（mask 主键）
 *  PENDING_MOTIF (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  MotifEntrySchema,
  MotifAppearanceSchema,
  evaluateMotifCallbacks,
} from './motif-callback-gate';
import {
  PersonaMaskEntrySchema,
  evaluatePersonaMask,
} from './persona-mask-gate';

const Ep = z.number().int().positive();

export const MaskMotifLinkEntrySchema = z.object({
  id: z.string().min(1),
  maskId: z.string().min(1),
  motifId: z.string().min(1),
  note: z.string().optional(),
});

export const MaskMotifLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  masks: z.array(PersonaMaskEntrySchema),
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  links: z.array(MaskMotifLinkEntrySchema),
});

export type MaskMotifLinkLedger = z.infer<typeof MaskMotifLinkLedgerSchema>;

export type MaskMotifLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_MOTIF'
    | 'UNKNOWN_MASK'
    | 'CHILD_MOTIF_FAIL'
    | 'CHILD_MASK_FAIL'
    | 'NO_APPEARANCE_AT_REVEAL'
    | 'REVEAL_WITHOUT_MOTIF'
    | 'PENDING_MOTIF';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface MaskMotifLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    masks: number;
    motifs: number;
    latestEp: number;
  };
  findings: MaskMotifLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateMaskMotifLink(input: unknown): MaskMotifLinkReport {
  const parsed = MaskMotifLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, masks: 0, motifs: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, masks, motifs, appearances, links } = parsed.data;
  const findings: MaskMotifLinkFinding[] = [];
  const push = (x: MaskMotifLinkFinding) => findings.push(x);

  const maskReport = evaluatePersonaMask({ series, latestEp, entries: masks });
  if (maskReport.verdict === 'FAIL') {
    const childFails = maskReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_MASK_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌伪装账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 persona-mask-gate',
    });
  }

  const motifReport = evaluateMotifCallbacks({ series, latestEp, motifs, appearances });
  if (motifReport.verdict === 'FAIL') {
    const childFails = motifReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_MOTIF_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌母题账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 motif-callback-gate',
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

  const motifIds = new Set(motifs.map((m) => m.id));
  const byMask = new Map(masks.map((m) => [m.id, m]));
  const pairedMasks = new Set<string>();
  const pairedMotifs = new Set<string>();
  let aligned = 0;

  for (const link of links) {
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
    if (!motifIds.has(link.motifId)) {
      push({
        code: 'UNKNOWN_MOTIF',
        severity: 'FAIL',
        ids: [link.id, link.motifId],
        message: `联表 ${link.id} 引用未知 motif ${link.motifId}`,
        fix: 'motifId 须存在于 motifs[]',
      });
      continue;
    }
    pairedMasks.add(mask.id);
    pairedMotifs.add(link.motifId);

    if (mask.revealEp === undefined) {
      push({
        code: 'NO_APPEARANCE_AT_REVEAL',
        severity: 'FAIL',
        ids: [link.id, mask.id],
        message: `${link.id}: mask ${mask.id} 尚未 reveal，无法对齐母题`,
        fix: '先设 revealEp，或改挂已揭穿 mask',
      });
      continue;
    }

    const atReveal = appearances.some(
      (a) => a.motifId === link.motifId && a.ep === mask.revealEp,
    );
    if (!atReveal) {
      push({
        code: 'NO_APPEARANCE_AT_REVEAL',
        severity: 'FAIL',
        ids: [link.id, link.motifId, mask.id],
        message: `${link.id}: motif ${link.motifId} 在 revealEp=E${mask.revealEp} 无 appearance`,
        fix: '揭穿集补 motif appearance（常为 payoff/echo）',
      });
      continue;
    }

    aligned += 1;
  }

  for (const mask of masks) {
    if (mask.revealEp !== undefined && !pairedMasks.has(mask.id)) {
      push({
        code: 'REVEAL_WITHOUT_MOTIF',
        severity: 'FAIL',
        ids: [mask.id],
        message: `mask ${mask.id} revealEp=E${mask.revealEp} 无 motif 联表`,
        fix: '在 links[] 挂 maskId↔motifId',
      });
    }
  }

  for (const m of motifs) {
    if (!pairedMotifs.has(m.id)) {
      push({
        code: 'PENDING_MOTIF',
        severity: 'WARN',
        ids: [m.id],
        message: `motif ${m.id} 尚未联表到 mask（mask 主键）`,
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
      motifs: motifs.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
