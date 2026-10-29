/**
 * V12 · Cliffhanger-Handoff × Identity-Vest Link Gate (集间悬念承接 × 马甲掉落 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《机长先生》: 悬念上一集常踩掉马甲，下集 hook 承接真身份线.
 *  - 与 vestHandoffLink（vest 主键）互补：本 gate 以 handoff 为主键强制「有 handoff 须对齐 drop」.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_VEST / UNKNOWN_HANDOFF
 *  CHILD_VEST_FAIL / CHILD_HANDOFF_FAIL
 *  HANDOFF_NOT_AT_DROP — handoff.prevEp 须等于 vest.dropEp
 *  HANDOFF_WITHOUT_VEST — handoff 无联表
 *  PENDING_VEST (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import {
  IdentityVestEntrySchema,
  evaluateIdentityVest,
} from './identity-vest-gate';
import { evaluateCliffhangerHandoff } from './cliffhanger-handoff-gate';

const Ep = z.number().int().positive();

export const HandoffVestEntrySchema = z.object({
  id: z.string().min(1),
  prevEp: Ep,
  nextEp: Ep,
  prev: ShotSpecDocSchema,
  next: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const HandoffVestLinkEntrySchema = z.object({
  id: z.string().min(1),
  vestId: z.string().min(1),
  handoffId: z.string().min(1),
  note: z.string().optional(),
});

export const HandoffVestLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  vests: z.array(IdentityVestEntrySchema),
  handoffs: z.array(HandoffVestEntrySchema),
  links: z.array(HandoffVestLinkEntrySchema),
});

export type HandoffVestLinkLedger = z.infer<typeof HandoffVestLinkLedgerSchema>;

export type HandoffVestLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_VEST'
    | 'UNKNOWN_HANDOFF'
    | 'CHILD_VEST_FAIL'
    | 'CHILD_HANDOFF_FAIL'
    | 'HANDOFF_NOT_AT_DROP'
    | 'HANDOFF_WITHOUT_VEST'
    | 'PENDING_VEST';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface HandoffVestLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    vests: number;
    handoffs: number;
    latestEp: number;
  };
  findings: HandoffVestLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateHandoffVestLink(input: unknown): HandoffVestLinkReport {
  const parsed = HandoffVestLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, vests: 0, handoffs: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, vests, handoffs, links } = parsed.data;
  const findings: HandoffVestLinkFinding[] = [];
  const push = (x: HandoffVestLinkFinding) => findings.push(x);

  const vestReport = evaluateIdentityVest({ series, latestEp, entries: vests });
  if (vestReport.verdict === 'FAIL') {
    const childFails = vestReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_VEST_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌马甲账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 identity-vest-gate',
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
    push({ code: 'DUP_ID', severity: 'FAIL', ids: [id], message: `联表ID重复：${id}`, fix: '联表 id 须唯一' });
  }

  const byV = new Map(vests.map((v) => [v.id, v]));
  const byH = new Map(handoffs.map((h) => [h.id, h]));
  const pairedV = new Set<string>();
  const pairedH = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const vest = byV.get(link.vestId);
    const handoff = byH.get(link.handoffId);
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
    pairedV.add(vest.id);
    pairedH.add(handoff.id);

    if (vest.dropEp === undefined || vest.dropEp !== handoff.prevEp) {
      push({
        code: 'HANDOFF_NOT_AT_DROP',
        severity: 'FAIL',
        ids: [link.id, vest.id, handoff.id],
        message: `${link.id}: dropEp=${vest.dropEp ?? '未掉'} ≠ handoff.prevEp=E${handoff.prevEp}`,
        fix: '掉马甲须落在悬念上一集',
      });
      continue;
    }

    aligned += 1;
  }

  for (const h of handoffs) {
    if (!pairedH.has(h.id)) {
      push({
        code: 'HANDOFF_WITHOUT_VEST',
        severity: 'FAIL',
        ids: [h.id],
        message: `handoff ${h.id} 无 vest 联表`,
        fix: '在 links[] 挂 vestId↔handoffId',
      });
    }
  }
  for (const v of vests) {
    if (!pairedV.has(v.id)) {
      push({
        code: 'PENDING_VEST',
        severity: 'WARN',
        ids: [v.id],
        message: `vest ${v.id} 尚未联表到 handoff`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      vests: vests.length,
      handoffs: handoffs.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
