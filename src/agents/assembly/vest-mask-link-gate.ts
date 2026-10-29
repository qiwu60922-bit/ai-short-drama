/**
 * V12 · Identity-Vest × Persona-Mask Link Gate (马甲延迟掉落 × 伪装人设 跨账本联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《逃婚三年，江少的花心人设崩了》: 花心 mask reveal 对齐真身份/马甲落地.
 *  - 《机长先生…》对照: 马甲 drop 与伪装揭穿可同集互证.
 *  - 《枝头春意闹》: 假人设当场抓包 — mask.reveal 与 vest.drop 同窗.
 *
 * 与 maskVestLink（mask 主键）互补：本 gate 以 vest 为主键。
 * Embeds child mask + vest (CHILD_* bubbles).
 * Link rules:
 *  SCHEMA / DUP_ID / UNKNOWN_MASK / UNKNOWN_VEST
 *  CHILD_MASK_FAIL / CHILD_VEST_FAIL
 *  WEARER_MISMATCH — mask.wearer === vest.wearer
 *  REVEAL_DROP_MISMATCH — 双方已终端时 revealEp === dropEp
 *  TERMINAL_WITHOUT_PAIR — 一方已终端另一方未终端
 *  PENDING_PAIR (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  PersonaMaskEntrySchema,
  evaluatePersonaMask,
} from './persona-mask-gate';
import {
  IdentityVestEntrySchema,
  evaluateIdentityVest,
} from './identity-vest-gate';

const Ep = z.number().int().positive();

export const VestMaskLinkEntrySchema = z.object({
  id: z.string().min(1),
  maskId: z.string().min(1),
  vestId: z.string().min(1),
  note: z.string().optional(),
});

export const VestMaskLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  masks: z.array(PersonaMaskEntrySchema),
  vests: z.array(IdentityVestEntrySchema),
  links: z.array(VestMaskLinkEntrySchema),
});

export type VestMaskLinkLedger = z.infer<typeof VestMaskLinkLedgerSchema>;

export type VestMaskLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_MASK'
    | 'UNKNOWN_VEST'
    | 'CHILD_MASK_FAIL'
    | 'CHILD_VEST_FAIL'
    | 'WEARER_MISMATCH'
    | 'REVEAL_DROP_MISMATCH'
    | 'TERMINAL_WITHOUT_PAIR'
    | 'PENDING_PAIR';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface VestMaskLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    pending: number;
    masks: number;
    vests: number;
    latestEp: number;
  };
  findings: VestMaskLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateVestMaskLink(input: unknown): VestMaskLinkReport {
  const parsed = VestMaskLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, pending: 0, masks: 0, vests: 0, latestEp: 0 },
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

  const { series, latestEp, masks, vests, links } = parsed.data;
  const findings: VestMaskLinkFinding[] = [];
  const push = (x: VestMaskLinkFinding) => findings.push(x);

  const maskReport = evaluatePersonaMask({ series, latestEp, entries: masks });
  if (maskReport.verdict === 'FAIL') {
    const childFails = maskReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_MASK_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌伪装账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 persona-mask-gate 再跑联表',
    });
  }

  const vestReport = evaluateIdentityVest({ series, latestEp, entries: vests });
  if (vestReport.verdict === 'FAIL') {
    const childFails = vestReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_VEST_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌马甲账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 identity-vest-gate 再跑联表',
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
  const byVest = new Map(vests.map((v) => [v.id, v]));
  let aligned = 0;
  let pending = 0;

  for (const link of links) {
    const mask = byMask.get(link.maskId);
    const vest = byVest.get(link.vestId);
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
    if (!vest) {
      push({
        code: 'UNKNOWN_VEST',
        severity: 'FAIL',
        ids: [link.id, link.vestId],
        message: `联表 ${link.id} 引用未知 vest ${link.vestId}`,
        fix: 'vestId 须存在于 vests[]',
      });
      continue;
    }

    if (mask.wearer !== vest.wearer) {
      push({
        code: 'WEARER_MISMATCH',
        severity: 'FAIL',
        ids: [link.id, mask.id, vest.id],
        message: `${link.id}: mask.wearer「${mask.wearer}」≠ vest.wearer「${vest.wearer}」`,
        fix: '伪装与马甲须挂同一角色',
      });
      continue;
    }

    const maskDone = mask.revealEp !== undefined;
    const vestDone = vest.dropEp !== undefined;

    if (maskDone && vestDone) {
      if (mask.revealEp !== vest.dropEp) {
        push({
          code: 'REVEAL_DROP_MISMATCH',
          severity: 'FAIL',
          ids: [link.id, mask.id, vest.id],
          message: `${link.id}: mask.revealEp=E${mask.revealEp} ≠ vest.dropEp=E${vest.dropEp}`,
          fix: '假人设揭穿与马甲掉落须同集互证',
        });
        continue;
      }
      aligned += 1;
      continue;
    }

    if (maskDone !== vestDone) {
      push({
        code: 'TERMINAL_WITHOUT_PAIR',
        severity: 'FAIL',
        ids: [link.id, mask.id, vest.id],
        message: `${link.id}: ${maskDone ? 'mask 已 reveal' : 'vest 已 drop'} 但另一方尚未终端`,
        fix: '揭穿与掉马甲成对落地，或双方都保持 pending',
      });
      continue;
    }

    pending += 1;
    push({
      code: 'PENDING_PAIR',
      severity: 'WARN',
      ids: [link.id, mask.id, vest.id],
      message: `${link.id}: mask+vest 均未终端（蓄势中）`,
      fix: '规划同集 revealEp/dropEp',
    });
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      pending,
      masks: masks.length,
      vests: vests.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
