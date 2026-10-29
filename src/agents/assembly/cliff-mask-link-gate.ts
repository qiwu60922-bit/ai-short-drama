/**
 * V12 · Cliff-Cascade × Persona-Mask Link Gate (跨集悬念叠钩 × 伪装揭穿 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《伪人降临》: 揭穿常卡在 cliff 窗 prevEp，下集 cascade 承接假人设崩塌.
 *  - cliff-cascade 管 prev→next；persona-mask 管 reveal——本 gate 硬对齐 revealEp=prevEp.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_CLIFF / UNKNOWN_MASK
 *  CHILD_CASCADE_FAIL / CHILD_MASK_FAIL
 *  REVEAL_NOT_AT_CLIFF — revealEp 须等于 cliff.prevEp
 *  CLIFF_WITHOUT_MASK — cliff 未联表
 *  PENDING_MASK (WARN)
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

export const CliffMaskLinkEntrySchema = z.object({
  id: z.string().min(1),
  cliffLinkId: z.string().min(1),
  maskId: z.string().min(1),
  note: z.string().optional(),
});

export const CliffMaskLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  masks: z.array(PersonaMaskEntrySchema),
  links: z.array(CliffMaskLinkEntrySchema),
});

export type CliffMaskLinkLedger = z.infer<typeof CliffMaskLinkLedgerSchema>;

export type CliffMaskLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_CLIFF'
    | 'UNKNOWN_MASK'
    | 'CHILD_CASCADE_FAIL'
    | 'CHILD_MASK_FAIL'
    | 'REVEAL_NOT_AT_CLIFF'
    | 'CLIFF_WITHOUT_MASK'
    | 'PENDING_MASK';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface CliffMaskLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    cliffLinks: number;
    masks: number;
    latestEp: number;
  };
  findings: CliffMaskLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateCliffMaskLink(input: unknown): CliffMaskLinkReport {
  const parsed = CliffMaskLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, cliffLinks: 0, masks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, cliffLinks, masks, links } = parsed.data;
  const findings: CliffMaskLinkFinding[] = [];
  const push = (x: CliffMaskLinkFinding) => findings.push(x);

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

  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const l of links) {
    if (seen.has(l.id)) dups.add(l.id);
    else seen.add(l.id);
  }
  for (const id of dups) {
    push({ code: 'DUP_ID', severity: 'FAIL', ids: [id], message: `联表ID重复：${id}`, fix: '联表 id 须唯一' });
  }

  const byCliff = new Map(cliffLinks.map((c) => [c.id, c]));
  const byMask = new Map(masks.map((m) => [m.id, m]));
  const pairedCliffs = new Set<string>();
  const pairedMasks = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const cliff = byCliff.get(link.cliffLinkId);
    const mask = byMask.get(link.maskId);
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
    pairedCliffs.add(cliff.id);
    pairedMasks.add(mask.id);

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

  for (const c of cliffLinks) {
    if (!pairedCliffs.has(c.id)) {
      push({
        code: 'CLIFF_WITHOUT_MASK',
        severity: 'FAIL',
        ids: [c.id],
        message: `cliff ${c.id} 未挂 mask 联表`,
        fix: '在 links[] 挂 cliffLinkId↔maskId',
      });
    }
  }
  for (const m of masks) {
    if (!pairedMasks.has(m.id)) {
      push({
        code: 'PENDING_MASK',
        severity: 'WARN',
        ids: [m.id],
        message: `mask ${m.id} 尚未联表到 cliff`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      cliffLinks: cliffLinks.length,
      masks: masks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
