/**
 * V12 · Foreshadow × Cliffhanger-Handoff Link Gate (伏笔账本 × 季间/集间悬念承接 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《持械入宋》: S/A 级伏笔 payoff 当集开场须 cliff→hook 承接，勿软重置.
 *  - 《聚宝仙盆》: 季间悬念与主伏笔 payoff 同窗.
 *  - foreshadow-ledger 管栽种/回收；cliffhanger-handoff 管两 ShotSpec 承接——本 gate 硬联表.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_FORESHADOW / UNKNOWN_HANDOFF
 *  CHILD_FORESHADOW_FAIL / CHILD_HANDOFF_FAIL
 *  PAYOFF_WITHOUT_HANDOFF — S/A 级已 payoff，须有 handoff 落在 payoffEp-1→payoffEp 或 nextEp=payoffEp
 *  HANDOFF_OUTSIDE_PLANT_WINDOW — handoff 早于 plantEp（WARN）
 *  PENDING_PAIR (WARN) — 伏笔仍 active 未 payoff
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import {
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
} from './foreshadow-ledger-gate';
import { evaluateCliffhangerHandoff } from './cliffhanger-handoff-gate';

const Ep = z.number().int().positive();

export const ForeshadowHandoffEntrySchema = z.object({
  id: z.string().min(1),
  prevEp: Ep,
  nextEp: Ep,
  prev: ShotSpecDocSchema,
  next: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const ForeshadowHandoffLinkEntrySchema = z.object({
  id: z.string().min(1),
  foreshadowId: z.string().min(1),
  handoffId: z.string().min(1),
  note: z.string().optional(),
});

export const ForeshadowHandoffLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  foreshadows: z.array(ForeshadowItemSchema),
  handoffs: z.array(ForeshadowHandoffEntrySchema),
  links: z.array(ForeshadowHandoffLinkEntrySchema),
});

export type ForeshadowHandoffLinkLedger = z.infer<typeof ForeshadowHandoffLinkLedgerSchema>;

export type ForeshadowHandoffLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_FORESHADOW'
    | 'UNKNOWN_HANDOFF'
    | 'CHILD_FORESHADOW_FAIL'
    | 'CHILD_HANDOFF_FAIL'
    | 'PAYOFF_WITHOUT_HANDOFF'
    | 'HANDOFF_OUTSIDE_PLANT_WINDOW'
    | 'PENDING_PAIR';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface ForeshadowHandoffLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    pending: number;
    foreshadows: number;
    handoffs: number;
    latestEp: number;
  };
  findings: ForeshadowHandoffLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

function handoffCoversPayoff(
  handoff: { prevEp: number; nextEp: number },
  payoffEp: number,
): boolean {
  return (
    handoff.nextEp === payoffEp ||
    handoff.prevEp === payoffEp - 1 ||
    (handoff.prevEp === payoffEp && handoff.nextEp === payoffEp + 1)
  );
}

export function evaluateForeshadowHandoffLink(input: unknown): ForeshadowHandoffLinkReport {
  const parsed = ForeshadowHandoffLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: {
        links: 0,
        aligned: 0,
        pending: 0,
        foreshadows: 0,
        handoffs: 0,
        latestEp: 0,
      },
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

  const { series, latestEp, foreshadows, handoffs, links } = parsed.data;
  const findings: ForeshadowHandoffLinkFinding[] = [];
  const push = (x: ForeshadowHandoffLinkFinding) => findings.push(x);

  const fsReport = evaluateForeshadowLedger({ series, latestEp, items: foreshadows });
  if (fsReport.verdict === 'FAIL') {
    const childFails = fsReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_FORESHADOW_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌伏笔账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 foreshadow-ledger-gate 再跑联表',
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

  const byFs = new Map(foreshadows.map((f) => [f.id, f]));
  const byH = new Map(handoffs.map((h) => [h.id, h]));
  let aligned = 0;
  let pending = 0;

  for (const link of links) {
    const fs = byFs.get(link.foreshadowId);
    const handoff = byH.get(link.handoffId);
    if (!fs) {
      push({
        code: 'UNKNOWN_FORESHADOW',
        severity: 'FAIL',
        ids: [link.id, link.foreshadowId],
        message: `联表 ${link.id} 引用未知 foreshadow ${link.foreshadowId}`,
        fix: 'foreshadowId 须存在于 foreshadows[]',
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

    if (handoff.nextEp < fs.plantEp && handoff.prevEp < fs.plantEp) {
      push({
        code: 'HANDOFF_OUTSIDE_PLANT_WINDOW',
        severity: 'WARN',
        ids: [link.id, fs.id, handoff.id],
        message: `${link.id}: handoff E${handoff.prevEp}→E${handoff.nextEp} 早于伏笔 plant@E${fs.plantEp}`,
        fix: '悬念承接应在栽种之后，或下调 plantEp',
      });
    }

    if (fs.payoffEp !== undefined && (fs.priority === 'S' || fs.priority === 'A')) {
      if (!handoffCoversPayoff(handoff, fs.payoffEp)) {
        push({
          code: 'PAYOFF_WITHOUT_HANDOFF',
          severity: 'FAIL',
          ids: [link.id, fs.id, handoff.id],
          message: `${link.id}: S/A 伏笔 ${fs.id} payoff@E${fs.payoffEp}，但 handoff E${handoff.prevEp}→E${handoff.nextEp} 未承接（期望 nextEp=payoff 或 prevEp=payoff-1）`,
          fix: 'payoff 当集开场 hook 或 payoff-1→payoff 悬念承接',
        });
        continue;
      }
      aligned += 1;
      continue;
    }

    if (fs.status === 'active' && fs.payoffEp === undefined) {
      pending += 1;
      push({
        code: 'PENDING_PAIR',
        severity: 'WARN',
        ids: [link.id, fs.id],
        message: `${link.id}: 伏笔 ${fs.id} 仍 active 未 payoff，handoff 已规划`,
        fix: '回收集写 payoffEp，并保证 handoff 落在 payoff 窗',
      });
      continue;
    }

    aligned += 1;
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      pending,
      foreshadows: foreshadows.length,
      handoffs: handoffs.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
