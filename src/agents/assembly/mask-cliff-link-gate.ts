/**
 * V12 · Persona-Mask × Cliff-Cascade Link Gate (伪装揭穿 × 跨集悬念叠钩 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《伪人降临》: 揭穿常卡在 cliff 窗 prevEp，下集 cascade 承接假人设崩塌.
 *  - 与 cliffMaskLink（cliff 主键）互补：本 gate 以 mask 为主键强制「有 reveal 必须有 cliff」.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_MASK / UNKNOWN_CLIFF
 *  CHILD_MASK_FAIL / CHILD_CASCADE_FAIL
 *  REVEAL_NOT_AT_CLIFF — revealEp 须等于 cliff.prevEp
 *  REVEAL_WITHOUT_CLIFF — 已 reveal 无联表
 *  PENDING_CLIFF (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  CliffCascadeLinkEntrySchema,
  evaluateCliffCascadeLink,
} from './cliff-cascade-link-gate';
import {
  PersonaMaskEntrySchema,
  evaluatePersonaMask,
} from './persona-mask-gate';

const Ep = z.number().int().positive();

export const MaskCliffLinkEntrySchema = z.object({
  id: z.string().min(1),
  maskId: z.string().min(1),
  cliffLinkId: z.string().min(1),
  note: z.string().optional(),
});

export const MaskCliffLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  masks: z.array(PersonaMaskEntrySchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  links: z.array(MaskCliffLinkEntrySchema),
});

export type MaskCliffLinkLedger = z.infer<typeof MaskCliffLinkLedgerSchema>;

export type MaskCliffLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_MASK'
    | 'UNKNOWN_CLIFF'
    | 'CHILD_MASK_FAIL'
    | 'CHILD_CASCADE_FAIL'
    | 'REVEAL_NOT_AT_CLIFF'
    | 'REVEAL_WITHOUT_CLIFF'
    | 'PENDING_CLIFF';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface MaskCliffLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    masks: number;
    cliffLinks: number;
    latestEp: number;
  };
  findings: MaskCliffLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateMaskCliffLink(input: unknown): MaskCliffLinkReport {
  const parsed = MaskCliffLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, masks: 0, cliffLinks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, masks, cliffLinks, links } = parsed.data;
  const findings: MaskCliffLinkFinding[] = [];
  const push = (x: MaskCliffLinkFinding) => findings.push(x);

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

  const cascadeReport = evaluateCliffCascadeLink({ series, latestEp, links: cliffLinks });
  if (cascadeReport.verdict === 'FAIL') {
    const childFails = cascadeReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_CASCADE_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌 cliff-cascade FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 cliff-cascade-link-gate',
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

  const byMask = new Map(masks.map((m) => [m.id, m]));
  const byCliff = new Map(cliffLinks.map((c) => [c.id, c]));
  const pairedMasks = new Set<string>();
  const pairedCliffs = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const mask = byMask.get(link.maskId);
    const cliff = byCliff.get(link.cliffLinkId);
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
    if (!cliff) {
      push({
        code: 'UNKNOWN_CLIFF',
        severity: 'FAIL',
        ids: [link.id, link.cliffLinkId],
        message: `联表 ${link.id} 引用未知 cliff ${link.cliffLinkId}`,
        fix: 'cliffLinkId 须存在于 cliffLinks[]',
      });
      continue;
    }
    pairedMasks.add(mask.id);
    pairedCliffs.add(cliff.id);

    if (mask.revealEp === undefined || mask.revealEp !== cliff.prevEp) {
      push({
        code: 'REVEAL_NOT_AT_CLIFF',
        severity: 'FAIL',
        ids: [link.id, cliff.id, mask.id],
        message: `${link.id}: revealEp=${mask.revealEp ?? '未揭穿'} ≠ cliff.prevEp=E${cliff.prevEp}`,
        fix: '伪装揭穿须落在悬念上一集',
      });
      continue;
    }

    aligned += 1;
  }

  for (const m of masks) {
    if (m.revealEp !== undefined && !pairedMasks.has(m.id)) {
      push({
        code: 'REVEAL_WITHOUT_CLIFF',
        severity: 'FAIL',
        ids: [m.id],
        message: `mask ${m.id} revealEp=E${m.revealEp} 无 cliff 联表`,
        fix: '在 links[] 挂 maskId↔cliffLinkId',
      });
    }
  }
  for (const c of cliffLinks) {
    if (!pairedCliffs.has(c.id)) {
      push({
        code: 'PENDING_CLIFF',
        severity: 'WARN',
        ids: [c.id],
        message: `cliff ${c.id} 尚未联表到 mask`,
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
      cliffLinks: cliffLinks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
