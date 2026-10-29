/**
 * V12 · Ability-Rule × Stage-Goal Link Gate (金手指规则 × 季级阶段目标 跨账本联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《伪人降临…》: 每日查验服务于「找出伪人」阶段目标，use 须落在 goal 窗口内并有 advances.
 *  - 《一块钱硬币…》: 觉醒预知当集推进「翻盘致富」destination.
 *  - 《家有五女…》: 现代知识金手指持续推进事业阶段目标.
 *
 * Embeds child ability-rule + stage-goal (CHILD_* bubbles).
 * Link rules:
 *  SCHEMA / DUP_ID / UNKNOWN_ABILITY / UNKNOWN_GOAL
 *  CHILD_ABILITY_FAIL / CHILD_STAGE_FAIL
 *  USE_BEFORE_GOAL_START — use.ep < goal.startEp
 *  USE_WITHOUT_PROGRESS — 有 use 但 goal 在该集无 advances
 *  GOAL_MET_WITHOUT_USE — goal met 但挂靠 ability 在 startEp..latest 零使用
 *  PENDING_PAIR (WARN) — goal open 且尚无 use
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  AbilityEntrySchema,
  AbilityUseSchema,
  evaluateAbilityRules,
} from './ability-rule-gate';
import {
  StageGoalEntrySchema,
  StageProgressSchema,
  StageCountdownSchema,
  evaluateStageGoals,
} from './stage-goal-gate';

const Ep = z.number().int().positive();

export const AbilityStageLinkEntrySchema = z.object({
  id: z.string().min(1),
  abilityId: z.string().min(1),
  goalId: z.string().min(1),
  note: z.string().optional(),
});

export const AbilityStageLinkLedgerSchema = z.object({
  series: z.string().min(1),
  seasonId: z.string().min(1),
  latestEp: Ep,
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  goals: z.array(StageGoalEntrySchema).min(1),
  progress: z.array(StageProgressSchema),
  countdowns: z.array(StageCountdownSchema).optional(),
  links: z.array(AbilityStageLinkEntrySchema),
});

export type AbilityStageLinkLedger = z.infer<typeof AbilityStageLinkLedgerSchema>;

export type AbilityStageLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_ABILITY'
    | 'UNKNOWN_GOAL'
    | 'CHILD_ABILITY_FAIL'
    | 'CHILD_STAGE_FAIL'
    | 'USE_BEFORE_GOAL_START'
    | 'USE_WITHOUT_PROGRESS'
    | 'GOAL_MET_WITHOUT_USE'
    | 'PENDING_PAIR';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AbilityStageLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    pending: number;
    abilities: number;
    goals: number;
    latestEp: number;
  };
  findings: AbilityStageLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAbilityStageLink(input: unknown): AbilityStageLinkReport {
  const parsed = AbilityStageLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, pending: 0, abilities: 0, goals: 0, latestEp: 0 },
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

  const {
    series,
    seasonId,
    latestEp,
    abilities,
    uses,
    goals,
    progress,
    countdowns,
    links,
  } = parsed.data;
  const findings: AbilityStageLinkFinding[] = [];
  const push = (x: AbilityStageLinkFinding) => findings.push(x);

  const abilityReport = evaluateAbilityRules({ series, latestEp, abilities, uses });
  if (abilityReport.verdict === 'FAIL') {
    const childFails = abilityReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_ABILITY_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌金手指账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 ability-rule-gate 再跑联表',
    });
  }

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
      message: `内嵌阶段目标账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 stage-goal-gate 再跑联表',
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

  const byAbility = new Map(abilities.map((a) => [a.id, a]));
  const byGoal = new Map(goals.map((g) => [g.id, g]));
  let aligned = 0;
  let pending = 0;

  for (const link of links) {
    const ability = byAbility.get(link.abilityId);
    const goal = byGoal.get(link.goalId);
    if (!ability) {
      push({
        code: 'UNKNOWN_ABILITY',
        severity: 'FAIL',
        ids: [link.id, link.abilityId],
        message: `联表 ${link.id} 引用未知 ability ${link.abilityId}`,
        fix: 'abilityId 须存在于 abilities[]',
      });
      continue;
    }
    if (!goal) {
      push({
        code: 'UNKNOWN_GOAL',
        severity: 'FAIL',
        ids: [link.id, link.goalId],
        message: `联表 ${link.id} 引用未知 goal ${link.goalId}`,
        fix: 'goalId 须存在于 goals[]',
      });
      continue;
    }

    const linkedUses = uses.filter((u) => u.abilityId === ability.id);
    const early = linkedUses.filter((u) => u.ep < goal.startEp);
    if (early.length) {
      push({
        code: 'USE_BEFORE_GOAL_START',
        severity: 'FAIL',
        ids: [link.id, ability.id, goal.id],
        message: `${link.id}: ability ${ability.id} 在 goal ${goal.id} startEp E${goal.startEp} 前已使用`,
        fix: '金手指使用须服务本阶段：use.ep ≥ goal.startEp',
      });
      continue;
    }

    const windowUses = linkedUses.filter((u) => u.ep >= goal.startEp && u.ep <= latestEp);
    if (windowUses.length === 0) {
      if (goal.status === 'met') {
        push({
          code: 'GOAL_MET_WITHOUT_USE',
          severity: 'FAIL',
          ids: [link.id, ability.id, goal.id],
          message: `${link.id}: 目标 ${goal.id} 已 met，但挂靠 ability ${ability.id} 在窗口内零使用`,
          fix: '阶段闭环前至少用一次金手指推进，或拆联表',
        });
      } else {
        pending += 1;
        push({
          code: 'PENDING_PAIR',
          severity: 'WARN',
          ids: [link.id, ability.id, goal.id],
          message: `${link.id}: 目标 ${goal.id} open，ability ${ability.id} 尚未在窗口内使用`,
          fix: '拿到就用：在 goal 窗口内写 use，并同步 advances 进度',
        });
      }
      continue;
    }

    const badUse = windowUses.find(
      (u) => !progress.some((p) => p.goalId === goal.id && p.advances && p.ep === u.ep),
    );
    if (badUse) {
      push({
        code: 'USE_WITHOUT_PROGRESS',
        severity: 'FAIL',
        ids: [link.id, ability.id, goal.id],
        message: `${link.id}: ability ${ability.id} 于 E${badUse.ep} 使用，但目标 ${goal.id} 同集无 advances 进度`,
        fix: '金手指使用集须同步一条 advances=true 的 progress',
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
      abilities: abilities.length,
      goals: goals.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
