/**
 * V12 · Persona-Mask × Cliffhanger-Handoff Link Gate (伪装揭穿 × 集间悬念承接 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《逃婚三年，江少的花心人设崩了》: reveal 当集尾卡悬念，下集 hook 承接真心线.
 *  - 《枝头春意闹》: 当场抓包后须有跨集承接，勿把揭穿做成孤立单集.
 *  - persona-mask 管 plant→reveal；cliffhanger-handoff 管两 ShotSpec——本 gate 硬对齐 revealEp=prevEp.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_MASK / UNKNOWN_HANDOFF
 *  CHILD_MASK_FAIL / CHILD_HANDOFF_FAIL
 *  HANDOFF_NOT_AT_REVEAL — handoff.prevEp 须等于 mask.revealEp
 *  REVEAL_WITHOUT_HANDOFF — 已 reveal 无联表
 *  PENDING_HANDOFF (WARN) — handoff 未挂 mask
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import {
  PersonaMaskEntrySchema,
  evaluatePersonaMask,
} from './persona-mask-gate';
import { evaluateCliffhangerHandoff } from './cliffhanger-handoff-gate';

const Ep = z.number().int().positive();

export const MaskHandoffEntrySchema = z.object({
  id: z.string().min(1),
  prevEp: Ep,
  nextEp: Ep,
  prev: ShotSpecDocSchema,
  next: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const MaskHandoffLinkEntrySchema = z.object({
  id: z.string().min(1),
  maskId: z.string().min(1),
  handoffId: z.string().min(1),
  note: z.string().optional(),
});

export const MaskHandoffLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  masks: z.array(PersonaMaskEntrySchema),
  handoffs: z.array(MaskHandoffEntrySchema),
  links: z.array(MaskHandoffLinkEntrySchema),
});

export type MaskHandoffLinkLedger = z.infer<typeof MaskHandoffLinkLedgerSchema>;

export type MaskHandoffLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_MASK'
    | 'UNKNOWN_HANDOFF'
    | 'CHILD_MASK_FAIL'
    | 'CHILD_HANDOFF_FAIL'
    | 'HANDOFF_NOT_AT_REVEAL'
    | 'REVEAL_WITHOUT_HANDOFF'
    | 'PENDING_HANDOFF';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface MaskHandoffLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    masks: number;
    handoffs: number;
    latestEp: number;
  };
  findings: MaskHandoffLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateMaskHandoffLink(input: unknown): MaskHandoffLinkReport {
  const parsed = MaskHandoffLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, masks: 0, handoffs: 0, latestEp: 0 },
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

  const { series, latestEp, masks, handoffs, links } = parsed.data;
  const findings: MaskHandoffLinkFinding[] = [];
  const push = (x: MaskHandoffLinkFinding) => findings.push(x);

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

  const byMask = new Map(masks.map((m) => [m.id, m]));
  const byH = new Map(handoffs.map((h) => [h.id, h]));
  const paired = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const mask = byMask.get(link.maskId);
    const handoff = byH.get(link.handoffId);
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
    paired.add(mask.id);

    if (mask.revealEp === undefined || handoff.prevEp !== mask.revealEp) {
      push({
        code: 'HANDOFF_NOT_AT_REVEAL',
        severity: 'FAIL',
        ids: [link.id, mask.id, handoff.id],
        message: `${link.id}: handoff.prevEp=E${handoff.prevEp} 不是 mask.revealEp（${mask.revealEp ?? '未揭穿'}）`,
        fix: 'handoff 上一集对准伪装揭穿集',
      });
      continue;
    }

    aligned += 1;
  }

  for (const mask of masks) {
    if (mask.revealEp !== undefined && !paired.has(mask.id)) {
      push({
        code: 'REVEAL_WITHOUT_HANDOFF',
        severity: 'FAIL',
        ids: [mask.id],
        message: `mask ${mask.id} revealEp=E${mask.revealEp} 无 handoff 联表`,
        fix: '在 links[] 挂 maskId↔handoffId',
      });
    }
  }

  for (const h of handoffs) {
    if (![...links].some((l) => l.handoffId === h.id)) {
      push({
        code: 'PENDING_HANDOFF',
        severity: 'WARN',
        ids: [h.id],
        message: `handoff ${h.id} 尚未联表到 mask`,
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
      handoffs: handoffs.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
