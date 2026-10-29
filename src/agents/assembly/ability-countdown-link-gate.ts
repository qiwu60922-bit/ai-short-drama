/**
 * V12 · Ability × Countdown Link Gate (金手指 × 阶段倒计时 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - deadline 当集常兑现金手指，避免能力空转.
 *  - 与 abilityEnsembleLink / motifCountdownLink 互补：本 gate 以 ability 联 countdown.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_ABILITY / UNKNOWN_COUNTDOWN / FUTURE_EP
 *  CHILD_ABILITY_FAIL / BAD_COUNTDOWN_WINDOW
 *  EP_NOT_DEADLINE — link.ep = deadlineEp 且 holder 在该 ep 有 use
 *  DEADLINE_WITHOUT_ABILITY / NO_USE_AT_DEADLINE
 *  PENDING_ABILITY / PENDING_COUNTDOWN (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { StageCountdownSchema } from './stage-goal-gate';
import {
  AbilityEntrySchema,
  AbilityUseSchema,
  evaluateAbilityRules,
} from './ability-rule-gate';

const Ep = z.number().int().positive();

export const AbilityCountdownLinkEntrySchema = z.object({
  id: z.string().min(1),
  abilityId: z.string().min(1),
  countdownId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const AbilityCountdownLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  countdowns: z.array(StageCountdownSchema),
  links: z.array(AbilityCountdownLinkEntrySchema),
});

export type AbilityCountdownLinkLedger = z.infer<typeof AbilityCountdownLinkLedgerSchema>;

export type AbilityCountdownLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_ABILITY'
    | 'UNKNOWN_COUNTDOWN'
    | 'FUTURE_EP'
    | 'CHILD_ABILITY_FAIL'
    | 'BAD_COUNTDOWN_WINDOW'
    | 'EP_NOT_DEADLINE'
    | 'DEADLINE_WITHOUT_ABILITY'
    | 'NO_USE_AT_DEADLINE'
    | 'PENDING_ABILITY'
    | 'PENDING_COUNTDOWN';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AbilityCountdownLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    abilities: number;
    countdowns: number;
    latestEp: number;
  };
  findings: AbilityCountdownLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAbilityCountdownLink(input: unknown): AbilityCountdownLinkReport {
  const parsed = AbilityCountdownLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, abilities: 0, countdowns: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, abilities, uses, countdowns, links } = parsed.data;
  const findings: AbilityCountdownLinkFinding[] = [];
  const push = (x: AbilityCountdownLinkFinding) => findings.push(x);

  const abReport = evaluateAbilityRules({ series, latestEp, abilities, uses });
  if (abReport.verdict === 'FAIL') {
    const childFails = abReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_ABILITY_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌金手指账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 ability-rule-gate',
    });
  }

  for (const c of countdowns) {
    if (c.deadlineEp < c.startEp) {
      push({
        code: 'BAD_COUNTDOWN_WINDOW',
        severity: 'FAIL',
        ids: [c.id],
        message: `countdown ${c.id} deadlineEp=E${c.deadlineEp} < startEp=E${c.startEp}`,
        fix: 'deadlineEp 须 ≥ startEp',
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

  const byAb = new Map(abilities.map((a) => [a.id, a]));
  const byCd = new Map(countdowns.map((c) => [c.id, c]));
  const pairedAbs = new Set<string>();
  const pairedCds = new Set<string>();
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
    const ab = byAb.get(link.abilityId);
    if (!ab) {
      push({
        code: 'UNKNOWN_ABILITY',
        severity: 'FAIL',
        ids: [link.id, link.abilityId],
        message: `联表 ${link.id} 引用未知 ability ${link.abilityId}`,
        fix: 'abilityId 须存在于 abilities[]',
      });
      continue;
    }
    const cd = byCd.get(link.countdownId);
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

    if (link.ep !== cd.deadlineEp) {
      push({
        code: 'EP_NOT_DEADLINE',
        severity: 'FAIL',
        ids: [link.id, ab.id, cd.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 deadline=${cd.deadlineEp}`,
        fix: '金手指使用须踩 deadline 同集',
      });
      continue;
    }

    const used = uses.some((u) => u.abilityId === ab.id && u.by === ab.holder && u.ep === link.ep);
    if (!used) {
      push({
        code: 'NO_USE_AT_DEADLINE',
        severity: 'FAIL',
        ids: [link.id, ab.id],
        message: `${link.id}: ability ${ab.id} 在 deadline E${link.ep} 无 holder 使用`,
        fix: 'deadline 集须有金手指使用',
      });
      continue;
    }

    pairedAbs.add(ab.id);
    pairedCds.add(cd.id);
    aligned += 1;
  }

  for (const cd of countdowns) {
    if (cd.deadlineEp <= latestEp && !pairedCds.has(cd.id)) {
      push({
        code: 'DEADLINE_WITHOUT_ABILITY',
        severity: 'FAIL',
        ids: [cd.id],
        message: `countdown ${cd.id} deadlineEp=E${cd.deadlineEp} 无 ability 联表`,
        fix: '为 deadline 集挂 AbilityCountdownLink',
      });
    } else if (!pairedCds.has(cd.id)) {
      push({
        code: 'PENDING_COUNTDOWN',
        severity: 'WARN',
        ids: [cd.id],
        message: `countdown ${cd.id} 尚未联表到 ability`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const a of abilities) {
    if (!pairedAbs.has(a.id)) {
      push({
        code: 'PENDING_ABILITY',
        severity: 'WARN',
        ids: [a.id],
        message: `ability ${a.id} 尚未联表到 countdown`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      abilities: abilities.length,
      countdowns: countdowns.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
