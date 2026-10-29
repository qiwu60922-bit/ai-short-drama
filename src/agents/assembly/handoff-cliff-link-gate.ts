/**
 * V12 · Cliffhanger-Handoff × Cliff-Cascade Link Gate (集间悬念承接 × 开场叠钩联表 再联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《持械入宋》: cliff→cascade 联表与 handoff 同窗（prevEp→nextEp），勿拆成两套日历.
 *  - 《聚宝仙盆》: 季间悬念承接须同时过 cascade 叠钩与 handoff cliff→hook.
 *  - 与 cliffHandoffLink（cliff 主键）互补：本 gate 以 handoff 为主键强制「有 handoff 须对齐 cascade」。
 *
 *  SCHEMA / DUP_ID / UNKNOWN_CLIFF / UNKNOWN_HANDOFF
 *  CHILD_CASCADE_FAIL / CHILD_HANDOFF_FAIL
 *  EP_WINDOW_MISMATCH — cliff.prev/next ≠ handoff.prev/next
 *  HANDOFF_WITHOUT_PAIR — handoff 条目未被任何 link 挂上
 *  PENDING_PAIR (WARN) — 仅一侧登记
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import {
  CliffCascadeLinkEntrySchema,
  evaluateCliffCascadeLink,
} from './cliff-cascade-link-gate';
import { evaluateCliffhangerHandoff } from './cliffhanger-handoff-gate';

const Ep = z.number().int().positive();

export const HandoffCliffEntrySchema = z.object({
  id: z.string().min(1),
  prevEp: Ep,
  nextEp: Ep,
  prev: ShotSpecDocSchema,
  next: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const HandoffCliffLinkEntrySchema = z.object({
  id: z.string().min(1),
  cliffLinkId: z.string().min(1),
  handoffId: z.string().min(1),
  note: z.string().optional(),
});

export const HandoffCliffLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  handoffs: z.array(HandoffCliffEntrySchema),
  links: z.array(HandoffCliffLinkEntrySchema),
});

export type HandoffCliffLinkLedger = z.infer<typeof HandoffCliffLinkLedgerSchema>;

export type HandoffCliffLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_CLIFF'
    | 'UNKNOWN_HANDOFF'
    | 'CHILD_CASCADE_FAIL'
    | 'CHILD_HANDOFF_FAIL'
    | 'EP_WINDOW_MISMATCH'
    | 'HANDOFF_WITHOUT_PAIR'
    | 'PENDING_PAIR';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface HandoffCliffLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    cliffLinks: number;
    handoffs: number;
    latestEp: number;
  };
  findings: HandoffCliffLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateHandoffCliffLink(input: unknown): HandoffCliffLinkReport {
  const parsed = HandoffCliffLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, cliffLinks: 0, handoffs: 0, latestEp: 0 },
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

  const { series, latestEp, cliffLinks, handoffs, links } = parsed.data;
  const findings: HandoffCliffLinkFinding[] = [];
  const push = (x: HandoffCliffLinkFinding) => findings.push(x);

  if (cliffLinks.length) {
    const cascade = evaluateCliffCascadeLink({ series, latestEp, links: cliffLinks });
    if (cascade.verdict === 'FAIL') {
      const childFails = cascade.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_CASCADE_FAIL',
        severity: 'FAIL',
        ids: childFails.flatMap((f) => f.ids ?? []),
        message: `内嵌 cliffCascade FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 cliff-cascade-link-gate（handoff + opening cascade）',
      });
    }
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
        fix: '先修 cliffhanger-handoff-gate（prev cliff + next hook）',
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

  const byCliff = new Map(cliffLinks.map((c) => [c.id, c]));
  const byH = new Map(handoffs.map((h) => [h.id, h]));
  const pairedCliffs = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const cliff = byCliff.get(link.cliffLinkId);
    const handoff = byH.get(link.handoffId);
    if (!cliff) {
      push({
        code: 'UNKNOWN_CLIFF',
        severity: 'FAIL',
        ids: [link.id, link.cliffLinkId],
        message: `联表 ${link.id} 引用未知 cliffLink ${link.cliffLinkId}`,
        fix: 'cliffLinkId 须存在于 cliffLinks[]',
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
    pairedCliffs.add(cliff.id);

    if (cliff.prevEp !== handoff.prevEp || cliff.nextEp !== handoff.nextEp) {
      push({
        code: 'EP_WINDOW_MISMATCH',
        severity: 'FAIL',
        ids: [link.id, cliff.id, handoff.id],
        message: `${link.id}: cliff E${cliff.prevEp}→E${cliff.nextEp} ≠ handoff E${handoff.prevEp}→E${handoff.nextEp}`,
        fix: '两侧 prevEp/nextEp 必须同窗',
      });
      continue;
    }

    aligned += 1;
  }

  const pairedH = new Set(links.map((l) => l.handoffId));
  for (const h of handoffs) {
    if (!pairedH.has(h.id)) {
      push({
        code: 'HANDOFF_WITHOUT_PAIR',
        severity: 'FAIL',
        ids: [h.id],
        message: `handoff ${h.id} 未挂 cliffCascade 联表`,
        fix: '在 links[] 挂 handoffId↔cliffLinkId',
      });
    }
  }

  for (const c of cliffLinks) {
    if (!pairedCliffs.has(c.id)) {
      push({
        code: 'PENDING_PAIR',
        severity: 'WARN',
        ids: [c.id],
        message: `cliffLink ${c.id} 尚未联表到 handoff`,
        fix: '补 links[] 或确认该 cliff 仅作旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      cliffLinks: cliffLinks.length,
      handoffs: handoffs.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
