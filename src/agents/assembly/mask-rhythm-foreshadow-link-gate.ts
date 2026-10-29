/**
 * V12 · Mask × Rhythm × Foreshadow Link Gate
 * (伪装揭穿 × 系列节奏 × 伏笔兑现 联表), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - mask reveal 常与伏笔兑现同集，且节奏须过 story-rhythm 密度门.
 *
 * rhythms[]: { id, ep, shotSpec }
 *  SCHEMA / DUP_ID / UNKNOWN_MASK / UNKNOWN_RHYTHM / UNKNOWN_FORESHADOW / FUTURE_EP
 *  CHILD_MASK_FAIL / CHILD_RHYTHM_FAIL / CHILD_FORESHADOW_FAIL
 *  EP_NOT_PAYOFF — link.ep = revealEp = rhythm.ep = payoffEp
 *  REVEAL_WITHOUT_LINK / RHYTHM_WITHOUT_LINK / PAYOFF_WITHOUT_LINK
 *  PENDING_MASK / PENDING_FORESHADOW (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { evaluateStoryRhythm } from './story-rhythm-gate';
import {
  PersonaMaskEntrySchema,
  evaluatePersonaMask,
} from './persona-mask-gate';
import {
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
} from './foreshadow-ledger-gate';

const Ep = z.number().int().positive();

export const MaskRhythmForeshadowRhythmEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const MaskRhythmForeshadowLinkEntrySchema = z.object({
  id: z.string().min(1),
  maskId: z.string().min(1),
  rhythmId: z.string().min(1),
  foreshadowId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const MaskRhythmForeshadowLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  masks: z.array(PersonaMaskEntrySchema),
  rhythms: z.array(MaskRhythmForeshadowRhythmEntrySchema),
  items: z.array(ForeshadowItemSchema),
  links: z.array(MaskRhythmForeshadowLinkEntrySchema),
});

export type MaskRhythmForeshadowLinkLedger = z.infer<typeof MaskRhythmForeshadowLinkLedgerSchema>;

export type MaskRhythmForeshadowLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_MASK'
    | 'UNKNOWN_RHYTHM'
    | 'UNKNOWN_FORESHADOW'
    | 'FUTURE_EP'
    | 'CHILD_MASK_FAIL'
    | 'CHILD_RHYTHM_FAIL'
    | 'CHILD_FORESHADOW_FAIL'
    | 'EP_NOT_PAYOFF'
    | 'REVEAL_WITHOUT_LINK'
    | 'RHYTHM_WITHOUT_LINK'
    | 'PAYOFF_WITHOUT_LINK'
    | 'PENDING_MASK'
    | 'PENDING_FORESHADOW';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface MaskRhythmForeshadowLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    masks: number;
    rhythms: number;
    items: number;
    latestEp: number;
  };
  findings: MaskRhythmForeshadowLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateMaskRhythmForeshadowLink(input: unknown): MaskRhythmForeshadowLinkReport {
  const parsed = MaskRhythmForeshadowLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, masks: 0, rhythms: 0, items: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, masks, rhythms, items, links } = parsed.data;
  const findings: MaskRhythmForeshadowLinkFinding[] = [];
  const push = (x: MaskRhythmForeshadowLinkFinding) => findings.push(x);

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

  for (const ry of rhythms) {
    const r = evaluateStoryRhythm(ry.shotSpec);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_RHYTHM_FAIL',
        severity: 'FAIL',
        ids: [ry.id, ...childFails.flatMap((f) => f.shotIds ?? [])],
        message: `rhythm ${ry.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 story-rhythm-gate',
      });
    }
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
  const byR = new Map(rhythms.map((r) => [r.id, r]));
  const byItem = new Map(items.map((it) => [it.id, it]));
  const pairedM = new Set<string>();
  const pairedR = new Set<string>();
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
    const ry = byR.get(link.rhythmId);
    if (!ry) {
      push({
        code: 'UNKNOWN_RHYTHM',
        severity: 'FAIL',
        ids: [link.id, link.rhythmId],
        message: `联表 ${link.id} 引用未知 rhythm ${link.rhythmId}`,
        fix: 'rhythmId 须存在于 rhythms[]',
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
      link.ep !== item.payoffEp ||
      link.ep !== ry.ep
    ) {
      push({
        code: 'EP_NOT_PAYOFF',
        severity: 'FAIL',
        ids: [link.id, mask.id, ry.id, item.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 reveal=${mask.revealEp ?? '无'}/rhythm=${ry.ep}/fs=${item.payoffEp ?? '无'}`,
        fix: '揭穿 + 节奏档 + 伏笔 payoff 须同集',
      });
      continue;
    }

    pairedM.add(mask.id);
    pairedR.add(ry.id);
    pairedItems.add(item.id);
    aligned += 1;
  }

  for (const mask of masks) {
    if (mask.revealEp !== undefined && !pairedM.has(mask.id)) {
      push({
        code: 'REVEAL_WITHOUT_LINK',
        severity: 'FAIL',
        ids: [mask.id],
        message: `mask ${mask.id} revealEp=E${mask.revealEp} 无 mask×rhythm×foreshadow 联表`,
        fix: '为揭穿挂 MaskRhythmForeshadowLink',
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
  for (const ry of rhythms) {
    if (!pairedR.has(ry.id)) {
      push({
        code: 'RHYTHM_WITHOUT_LINK',
        severity: 'FAIL',
        ids: [ry.id],
        message: `rhythm ${ry.id} 无 mask×rhythm×foreshadow 联表`,
        fix: '为节奏档挂 MaskRhythmForeshadowLink',
      });
    }
  }
  for (const it of items) {
    if (it.payoffEp !== undefined && !pairedItems.has(it.id)) {
      push({
        code: 'PAYOFF_WITHOUT_LINK',
        severity: 'FAIL',
        ids: [it.id],
        message: `foreshadow ${it.id} payoffEp=E${it.payoffEp} 无 mask×rhythm 联表`,
        fix: '为伏笔兑现集挂 MaskRhythmForeshadowLink',
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
      rhythms: rhythms.length,
      items: items.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
