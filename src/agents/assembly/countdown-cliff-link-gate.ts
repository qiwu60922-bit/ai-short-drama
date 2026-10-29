/**
 * V12 · Countdown × Cliff-Cascade Link Gate (阶段倒计时 × 跨集悬念叠钩 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《天幕直播》: 访客时限倒计时逼近时，集末 cliff → 下集开场 cascade 必须承接时限压力.
 *  - 《持械入宋》: 季末/阶段 deadline 前后的 cliff×cascade 须落在 countdown 窗口内.
 *  - 《公路求生…》: 燃油/时限 countdown 与跨集危机钩子对齐.
 *
 * Embeds child cliff-cascade-link; countdowns validated against stage-goal child
 * (requires ≥1 open goal so stage gate stays green).
 * Link rules:
 *  SCHEMA / DUP_ID / UNKNOWN_COUNTDOWN / UNKNOWN_CLIFF_LINK
 *  CHILD_CLIFF_FAIL / CHILD_STAGE_FAIL
 *  CLIFF_OUTSIDE_WINDOW — cliff prev/next 须落在 [startEp, deadlineEp]
 *  DEADLINE_WITHOUT_HANDOFF — deadline 已到/已过 但无 nextEp===deadlineEp 的承接
 *  PENDING_PAIR (WARN) — countdown 仍 open 且未到 deadline
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  StageGoalEntrySchema,
  StageProgressSchema,
  StageCountdownSchema,
  evaluateStageGoals,
} from './stage-goal-gate';
import {
  CliffCascadeLinkEntrySchema,
  evaluateCliffCascadeLink,
} from './cliff-cascade-link-gate';

const Ep = z.number().int().positive();

export const CountdownCliffLinkEntrySchema = z.object({
  id: z.string().min(1),
  countdownId: z.string().min(1),
  cliffLinkId: z.string().min(1),
  note: z.string().optional(),
});

export const CountdownCliffLinkLedgerSchema = z.object({
  series: z.string().min(1),
  seasonId: z.string().min(1),
  latestEp: Ep,
  goals: z.array(StageGoalEntrySchema).min(1),
  progress: z.array(StageProgressSchema),
  countdowns: z.array(StageCountdownSchema).min(1),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  links: z.array(CountdownCliffLinkEntrySchema),
});

export type CountdownCliffLinkLedger = z.infer<typeof CountdownCliffLinkLedgerSchema>;

export type CountdownCliffLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_COUNTDOWN'
    | 'UNKNOWN_CLIFF_LINK'
    | 'CHILD_CLIFF_FAIL'
    | 'CHILD_STAGE_FAIL'
    | 'CLIFF_OUTSIDE_WINDOW'
    | 'DEADLINE_WITHOUT_HANDOFF'
    | 'PENDING_PAIR';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface CountdownCliffLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    pending: number;
    countdowns: number;
    cliffLinks: number;
    latestEp: number;
  };
  findings: CountdownCliffLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateCountdownCliffLink(input: unknown): CountdownCliffLinkReport {
  const parsed = CountdownCliffLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, pending: 0, countdowns: 0, cliffLinks: 0, latestEp: 0 },
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

  const { series, seasonId, latestEp, goals, progress, countdowns, cliffLinks, links } =
    parsed.data;
  const findings: CountdownCliffLinkFinding[] = [];
  const push = (x: CountdownCliffLinkFinding) => findings.push(x);

  const stageReport = evaluateStageGoals({
    series,
    seasonId,
    latestEp,
    goals,
    progress,
    countdowns,
  });
  if (stageReport.verdict === 'FAIL') {
    const childFails = stageReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_STAGE_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌阶段/倒计时账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 stage-goal-gate（含 countdown）再跑联表',
    });
  }

  const cliffReport = evaluateCliffCascadeLink({ series, latestEp, links: cliffLinks });
  if (cliffReport.verdict === 'FAIL') {
    const childFails = cliffReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_CLIFF_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌 cliff×cascade 联表 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 cliff-cascade-link-gate 再跑本联表',
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

  const byCd = new Map(countdowns.map((c) => [c.id, c]));
  const byCliff = new Map(cliffLinks.map((c) => [c.id, c]));
  let aligned = 0;
  let pending = 0;

  for (const link of links) {
    const cd = byCd.get(link.countdownId);
    const cliff = byCliff.get(link.cliffLinkId);
    if (!cd) {
      push({
        code: 'UNKNOWN_COUNTDOWN',
        severity: 'FAIL',
        ids: [link.id, link.countdownId],
        message: `联表 ${link.id} 引用未知 countdown ${link.countdownId}`,
        fix: 'countdownId 须存在于 countdowns[]',
      });
      continue;
    }
    if (!cliff) {
      push({
        code: 'UNKNOWN_CLIFF_LINK',
        severity: 'FAIL',
        ids: [link.id, link.cliffLinkId],
        message: `联表 ${link.id} 引用未知 cliffLink ${link.cliffLinkId}`,
        fix: 'cliffLinkId 须存在于 cliffLinks[]',
      });
      continue;
    }

    if (cliff.prevEp < cd.startEp || cliff.nextEp > cd.deadlineEp) {
      push({
        code: 'CLIFF_OUTSIDE_WINDOW',
        severity: 'FAIL',
        ids: [link.id, cd.id, cliff.id],
        message: `${link.id}: cliff E${cliff.prevEp}→E${cliff.nextEp} 超出 countdown ${cd.id} 窗口 E${cd.startEp}–E${cd.deadlineEp}`,
        fix: '把悬念承接落在倒计时窗口内',
      });
      continue;
    }

    const status = cd.status ?? (latestEp > cd.deadlineEp ? 'expired' : 'open');
    const deadlineReached = latestEp >= cd.deadlineEp || status === 'met' || status === 'expired';
    if (deadlineReached) {
      if (cliff.nextEp !== cd.deadlineEp && cliff.prevEp !== cd.deadlineEp - 1) {
        push({
          code: 'DEADLINE_WITHOUT_HANDOFF',
          severity: 'FAIL',
          ids: [link.id, cd.id, cliff.id],
          message: `${link.id}: countdown ${cd.id} 已到 deadline E${cd.deadlineEp}，但 cliff 未承接（期望 nextEp=deadline 或 prevEp=deadline-1）`,
          fix: 'deadline 当集开场 cascade 或 deadline-1→deadline 悬念承接',
        });
        continue;
      }
      aligned += 1;
      continue;
    }

    pending += 1;
    push({
      code: 'PENDING_PAIR',
      severity: 'WARN',
      ids: [link.id, cd.id, cliff.id],
      message: `${link.id}: countdown ${cd.id} 仍 open（deadline E${cd.deadlineEp}），cliff 已在窗口内规划`,
      fix: '临近 deadline 保持 cliff×cascade 承接',
    });
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      pending,
      countdowns: countdowns.length,
      cliffLinks: cliffLinks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
