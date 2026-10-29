/**
 * V12 · Mask × Quality × Foreshadow Link Gate
 * (伪装揭穿 × 表演门 × 伏笔兑现 联表), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - mask reveal 常与 S/A 伏笔 payoff 同集，且须过表演门.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_MASK / UNKNOWN_FORESHADOW / FUTURE_EP
 *  CHILD_MASK_FAIL / CHILD_FORESHADOW_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_PAYOFF — link.ep = revealEp = payoffEp
 *  REVEAL_WITHOUT_LINK / PAYOFF_WITHOUT_LINK
 *  PENDING_MASK / PENDING_FORESHADOW (WARN)
 *  LOW_INTENSITY_AT_PAYOFF (WARN)
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
import {
  QualityLeapDocSchema,
  evaluateQualityLeap,
} from './quality-leap-gate';

const Ep = z.number().int().positive();

export const MaskQualityForeshadowLinkEntrySchema = z.object({
  id: z.string().min(1),
  maskId: z.string().min(1),
  foreshadowId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const MaskQualityForeshadowLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minPayoffIntense: z.number().int().min(1).max(5).optional(),
  masks: z.array(PersonaMaskEntrySchema),
  items: z.array(ForeshadowItemSchema),
  links: z.array(MaskQualityForeshadowLinkEntrySchema),
});

export type MaskQualityForeshadowLinkLedger = z.infer<typeof MaskQualityForeshadowLinkLedgerSchema>;

export type MaskQualityForeshadowLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_MASK'
    | 'UNKNOWN_FORESHADOW'
    | 'FUTURE_EP'
    | 'CHILD_MASK_FAIL'
    | 'CHILD_FORESHADOW_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_PAYOFF'
    | 'REVEAL_WITHOUT_LINK'
    | 'PAYOFF_WITHOUT_LINK'
    | 'PENDING_MASK'
    | 'PENDING_FORESHADOW'
    | 'LOW_INTENSITY_AT_PAYOFF';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface MaskQualityForeshadowLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    masks: number;
    items: number;
    latestEp: number;
  };
  findings: MaskQualityForeshadowLinkFinding[];
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

export function evaluateMaskQualityForeshadowLink(input: unknown): MaskQualityForeshadowLinkReport {
  const parsed = MaskQualityForeshadowLinkLedgerSchema.safeParse(input);
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

  const { series, latestEp, masks, items, links, minPayoffIntense = 4 } = parsed.data;
  const findings: MaskQualityForeshadowLinkFinding[] = [];
  const push = (x: MaskQualityForeshadowLinkFinding) => findings.push(x);

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

    if (
      mask.revealEp === undefined ||
      item.payoffEp === undefined ||
      link.ep !== mask.revealEp ||
      link.ep !== item.payoffEp
    ) {
      push({
        code: 'EP_NOT_PAYOFF',
        severity: 'FAIL',
        ids: [link.id, mask.id, item.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 reveal=${mask.revealEp ?? '无'}/fs=${item.payoffEp ?? '无'}`,
        fix: '揭穿 + 伏笔 payoff + quality 须同集',
      });
      continue;
    }

    const intense = maxIntensity(link.qualityLeap);
    if (intense < minPayoffIntense) {
      push({
        code: 'LOW_INTENSITY_AT_PAYOFF',
        severity: 'WARN',
        ids: [link.id, mask.id, item.id],
        message: `${link.id}: max intensity=${intense} < minPayoffIntense=${minPayoffIntense}`,
        fix: '提高表演 intensity 或下调 minPayoffIntense',
      });
    }

    pairedM.add(mask.id);
    pairedItems.add(item.id);
    aligned += 1;
  }

  for (const mask of masks) {
    if (mask.revealEp !== undefined && !pairedM.has(mask.id)) {
      push({
        code: 'REVEAL_WITHOUT_LINK',
        severity: 'FAIL',
        ids: [mask.id],
        message: `mask ${mask.id} revealEp=E${mask.revealEp} 无 mask×quality×foreshadow 联表`,
        fix: '为揭穿集挂 MaskQualityForeshadowLink',
      });
    } else if (!pairedM.has(mask.id)) {
      push({
        code: 'PENDING_MASK',
        severity: 'WARN',
        ids: [mask.id],
        message: `mask ${mask.id} 尚未联表`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const it of items) {
    if (it.payoffEp !== undefined && !pairedItems.has(it.id)) {
      push({
        code: 'PAYOFF_WITHOUT_LINK',
        severity: 'FAIL',
        ids: [it.id],
        message: `foreshadow ${it.id} payoffEp=E${it.payoffEp} 无 mask×quality 联表`,
        fix: '为伏笔兑现集挂 MaskQualityForeshadowLink',
      });
    } else if (!pairedItems.has(it.id)) {
      push({
        code: 'PENDING_FORESHADOW',
        severity: 'WARN',
        ids: [it.id],
        message: `foreshadow ${it.id} 尚未联表`,
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
