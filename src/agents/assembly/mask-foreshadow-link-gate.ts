/**
 * V12 · Mask × Foreshadow Link Gate (伪装人设 × 伏笔兑现 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《逃婚三年》: mask reveal 常与 S/A 伏笔 payoff 同集.
 *  - 与 foreshadowMaskLink（foreshadow 主键）互补：本 gate 以 mask 为主键.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_MASK / UNKNOWN_FORESHADOW / FUTURE_EP
 *  CHILD_MASK_FAIL / CHILD_FORESHADOW_FAIL
 *  EP_NOT_PAYOFF_REVEAL — link.ep = revealEp = payoffEp
 *  REVEAL_WITHOUT_FORESHADOW / PAYOFF_WITHOUT_MASK
 *  PENDING_MASK / PENDING_FORESHADOW (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  PersonaMaskEntrySchema,
  evaluatePersonaMask,
} from './persona-mask-gate';
import {
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
} from './foreshadow-ledger-gate';

const Ep = z.number().int().positive();

export const MaskForeshadowLinkEntrySchema = z.object({
  id: z.string().min(1),
  maskId: z.string().min(1),
  foreshadowId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const MaskForeshadowLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  masks: z.array(PersonaMaskEntrySchema),
  items: z.array(ForeshadowItemSchema),
  links: z.array(MaskForeshadowLinkEntrySchema),
});

export type MaskForeshadowLinkLedger = z.infer<typeof MaskForeshadowLinkLedgerSchema>;

export type MaskForeshadowLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_MASK'
    | 'UNKNOWN_FORESHADOW'
    | 'FUTURE_EP'
    | 'CHILD_MASK_FAIL'
    | 'CHILD_FORESHADOW_FAIL'
    | 'EP_NOT_PAYOFF_REVEAL'
    | 'REVEAL_WITHOUT_FORESHADOW'
    | 'PAYOFF_WITHOUT_MASK'
    | 'PENDING_MASK'
    | 'PENDING_FORESHADOW';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface MaskForeshadowLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    masks: number;
    items: number;
    latestEp: number;
  };
  findings: MaskForeshadowLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateMaskForeshadowLink(input: unknown): MaskForeshadowLinkReport {
  const parsed = MaskForeshadowLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, masks: 0, items: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, masks, items, links } = parsed.data;
  const findings: MaskForeshadowLinkFinding[] = [];
  const push = (x: MaskForeshadowLinkFinding) => findings.push(x);

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

  const byM = new Map(masks.map((m) => [m.id, m]));
  const byItem = new Map(items.map((it) => [it.id, it]));
  const pairedM = new Set<string>();
  const pairedItems = new Set<string>();
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

    if (
      mask.revealEp === undefined ||
      item.payoffEp === undefined ||
      link.ep !== mask.revealEp ||
      link.ep !== item.payoffEp
    ) {
      push({
        code: 'EP_NOT_PAYOFF_REVEAL',
        severity: 'FAIL',
        ids: [link.id, mask.id, item.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 reveal=${mask.revealEp ?? '无'}/fs=${item.payoffEp ?? '无'}`,
        fix: '伏笔 payoff 须踩 mask reveal 同集',
      });
      continue;
    }

    pairedM.add(mask.id);
    pairedItems.add(item.id);
    aligned += 1;
  }

  for (const mask of masks) {
    if (mask.revealEp !== undefined && !pairedM.has(mask.id)) {
      push({
        code: 'REVEAL_WITHOUT_FORESHADOW',
        severity: 'FAIL',
        ids: [mask.id],
        message: `mask ${mask.id} revealEp=E${mask.revealEp} 无 foreshadow 联表`,
        fix: '为伪装崩塌挂 MaskForeshadowLink',
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
  for (const it of items) {
    if (it.payoffEp !== undefined && !pairedItems.has(it.id)) {
      push({
        code: 'PAYOFF_WITHOUT_MASK',
        severity: 'FAIL',
        ids: [it.id],
        message: `foreshadow ${it.id} payoffEp=E${it.payoffEp} 无 mask 联表`,
        fix: '为伏笔兑现集挂 MaskForeshadowLink',
      });
    } else if (!pairedItems.has(it.id)) {
      push({
        code: 'PENDING_FORESHADOW',
        severity: 'WARN',
        ids: [it.id],
        message: `foreshadow ${it.id} 尚未联表到 mask`,
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
      items: items.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
