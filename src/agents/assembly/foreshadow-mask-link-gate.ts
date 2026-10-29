/**
 * V12 · Foreshadow × Persona-Mask Link Gate (伏笔兑现 × 伪装揭穿 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《帐中香》: S/A 伏笔 payoff 常与 mask reveal 同集，避免空壳揭晓.
 *  - foreshadow-ledger 管 plant→payoff；persona-mask 管 reveal——本 gate 硬对齐.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_FORESHADOW / UNKNOWN_MASK
 *  CHILD_FORESHADOW_FAIL / CHILD_MASK_FAIL
 *  PAYOFF_NOT_AT_REVEAL — payoffEp 须等于 revealEp
 *  REVEAL_WITHOUT_FORESHADOW / PAYOFF_WITHOUT_MASK
 *  PENDING_MASK (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
} from './foreshadow-ledger-gate';
import {
  PersonaMaskEntrySchema,
  evaluatePersonaMask,
} from './persona-mask-gate';

const Ep = z.number().int().positive();

export const ForeshadowMaskLinkEntrySchema = z.object({
  id: z.string().min(1),
  foreshadowId: z.string().min(1),
  maskId: z.string().min(1),
  note: z.string().optional(),
});

export const ForeshadowMaskLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  items: z.array(ForeshadowItemSchema),
  masks: z.array(PersonaMaskEntrySchema),
  links: z.array(ForeshadowMaskLinkEntrySchema),
});

export type ForeshadowMaskLinkLedger = z.infer<typeof ForeshadowMaskLinkLedgerSchema>;

export type ForeshadowMaskLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_FORESHADOW'
    | 'UNKNOWN_MASK'
    | 'CHILD_FORESHADOW_FAIL'
    | 'CHILD_MASK_FAIL'
    | 'PAYOFF_NOT_AT_REVEAL'
    | 'REVEAL_WITHOUT_FORESHADOW'
    | 'PAYOFF_WITHOUT_MASK'
    | 'PENDING_MASK';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface ForeshadowMaskLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    items: number;
    masks: number;
    latestEp: number;
  };
  findings: ForeshadowMaskLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateForeshadowMaskLink(input: unknown): ForeshadowMaskLinkReport {
  const parsed = ForeshadowMaskLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, items: 0, masks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, items, masks, links } = parsed.data;
  const findings: ForeshadowMaskLinkFinding[] = [];
  const push = (x: ForeshadowMaskLinkFinding) => findings.push(x);

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

  const byFs = new Map(items.map((i) => [i.id, i]));
  const byM = new Map(masks.map((m) => [m.id, m]));
  const pairedFs = new Set<string>();
  const pairedM = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const item = byFs.get(link.foreshadowId);
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

    if (
      item.payoffEp === undefined ||
      mask.revealEp === undefined ||
      item.payoffEp !== mask.revealEp
    ) {
      push({
        code: 'PAYOFF_NOT_AT_REVEAL',
        severity: 'FAIL',
        ids: [link.id, item.id, mask.id],
        message: `${link.id}: payoff=${item.payoffEp ?? '无'} ≠ reveal=${mask.revealEp ?? '无'}`,
        fix: '伏笔 payoffEp 须等于伪装 revealEp',
      });
      continue;
    }

    pairedFs.add(item.id);
    pairedM.add(mask.id);
    aligned += 1;
  }

  for (const mask of masks) {
    if (mask.revealEp !== undefined && !pairedM.has(mask.id)) {
      push({
        code: 'REVEAL_WITHOUT_FORESHADOW',
        severity: 'FAIL',
        ids: [mask.id],
        message: `mask ${mask.id} revealEp=E${mask.revealEp} 无 foreshadow 联表`,
        fix: '为揭穿集挂 ForeshadowMaskLink',
      });
    } else if (!pairedM.has(mask.id)) {
      push({
        code: 'PENDING_MASK',
        severity: 'WARN',
        ids: [mask.id],
        message: `mask ${mask.id} 尚未联表到 foreshadow`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const item of items) {
    if (item.payoffEp !== undefined && !pairedFs.has(item.id)) {
      push({
        code: 'PAYOFF_WITHOUT_MASK',
        severity: 'FAIL',
        ids: [item.id],
        message: `foreshadow ${item.id} payoffEp=E${item.payoffEp} 无 mask 联表`,
        fix: '在 links[] 挂 foreshadowId↔maskId',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      items: items.length,
      masks: masks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
