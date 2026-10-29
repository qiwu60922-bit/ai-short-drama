/**
 * V12 · Cliffhanger-Handoff × Countdown Link Gate (季间悬念承接 × 阶段倒计时 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《持械入宋》: 季末开放悬念 → 下季开篇承接，时限/deadline 压力须落在 handoff 窗口.
 *  - 《天幕直播》: 访客时限逼近时，跨集 cliff→hook 须在 countdown 内.
 *  - 区别于 countdown×cliffCascade：本 gate 绑 cliffhanger-handoff（两 ShotSpec 季间/集间承接）.
 *
 * Embeds child stage-goal (countdowns) + evaluateCliffhangerHandoff per handoff.
 *  SCHEMA / DUP_ID / UNKNOWN_COUNTDOWN / UNKNOWN_HANDOFF
 *  CHILD_HANDOFF_FAIL / CHILD_STAGE_FAIL
 *  HANDOFF_OUTSIDE_WINDOW — handoff prevEp/nextEp 须落在 [startEp, deadlineEp]
 *  DEADLINE_WITHOUT_HANDOFF — deadline 已到但无 nextEp===deadline 或 prevEp===deadline-1
 *  PENDING_PAIR (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import {
  StageGoalEntrySchema,
  StageProgressSchema,
  StageCountdownSchema,
  evaluateStageGoals,
} from './stage-goal-gate';
import { evaluateCliffhangerHandoff } from './cliffhanger-handoff-gate';

const Ep = z.number().int().positive();

export const HandoffEntrySchema = z.object({
  id: z.string().min(1),
  prevEp: Ep,
  nextEp: Ep,
  prev: ShotSpecDocSchema,
  next: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const HandoffCountdownLinkEntrySchema = z.object({
  id: z.string().min(1),
  countdownId: z.string().min(1),
  handoffId: z.string().min(1),
  note: z.string().optional(),
});

export const HandoffCountdownLinkLedgerSchema = z.object({
  series: z.string().min(1),
  seasonId: z.string().min(1),
  latestEp: Ep,
  goals: z.array(StageGoalEntrySchema).min(1),
  progress: z.array(StageProgressSchema),
  countdowns: z.array(StageCountdownSchema).min(1),
  handoffs: z.array(HandoffEntrySchema),
  links: z.array(HandoffCountdownLinkEntrySchema),
});

export type HandoffCountdownLinkLedger = z.infer<typeof HandoffCountdownLinkLedgerSchema>;

export type HandoffCountdownLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_COUNTDOWN'
    | 'UNKNOWN_HANDOFF'
    | 'CHILD_HANDOFF_FAIL'
    | 'CHILD_STAGE_FAIL'
    | 'HANDOFF_OUTSIDE_WINDOW'
    | 'DEADLINE_WITHOUT_HANDOFF'
    | 'PENDING_PAIR';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface HandoffCountdownLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    pending: number;
    countdowns: number;
    handoffs: number;
    latestEp: number;
  };
  findings: HandoffCountdownLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateHandoffCountdownLink(input: unknown): HandoffCountdownLinkReport {
  const parsed = HandoffCountdownLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, pending: 0, countdowns: 0, handoffs: 0, latestEp: 0 },
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

  const { series, seasonId, latestEp, goals, progress, countdowns, handoffs, links } =
    parsed.data;
  const findings: HandoffCountdownLinkFinding[] = [];
  const push = (x: HandoffCountdownLinkFinding) => findings.push(x);

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

  const byCd = new Map(countdowns.map((c) => [c.id, c]));
  const byHandoff = new Map(handoffs.map((h) => [h.id, h]));
  let aligned = 0;
  let pending = 0;

  for (const link of links) {
    const cd = byCd.get(link.countdownId);
    const handoff = byHandoff.get(link.handoffId);
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

    if (handoff.prevEp < cd.startEp || handoff.nextEp > cd.deadlineEp) {
      push({
        code: 'HANDOFF_OUTSIDE_WINDOW',
        severity: 'FAIL',
        ids: [link.id, cd.id, handoff.id],
        message: `${link.id}: handoff E${handoff.prevEp}→E${handoff.nextEp} 超出 countdown ${cd.id} 窗口 E${cd.startEp}–E${cd.deadlineEp}`,
        fix: '把季间/集间悬念承接落在倒计时窗口内',
      });
      continue;
    }

    const status = cd.status ?? (latestEp > cd.deadlineEp ? 'expired' : 'open');
    const deadlineReached = latestEp >= cd.deadlineEp || status === 'met' || status === 'expired';
    if (deadlineReached) {
      if (handoff.nextEp !== cd.deadlineEp && handoff.prevEp !== cd.deadlineEp - 1) {
        push({
          code: 'DEADLINE_WITHOUT_HANDOFF',
          severity: 'FAIL',
          ids: [link.id, cd.id, handoff.id],
          message: `${link.id}: countdown ${cd.id} 已到 deadline E${cd.deadlineEp}，但 handoff 未承接（期望 nextEp=deadline 或 prevEp=deadline-1）`,
          fix: 'deadline 当集开场 hook 或 deadline-1→deadline 悬念承接',
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
      ids: [link.id, cd.id, handoff.id],
      message: `${link.id}: countdown ${cd.id} 仍 open（deadline E${cd.deadlineEp}），handoff 已在窗口内规划`,
      fix: '临近 deadline 保持 cliffhanger handoff 承接',
    });
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      pending,
      countdowns: countdowns.length,
      handoffs: handoffs.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
