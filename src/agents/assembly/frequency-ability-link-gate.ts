/**
 * V12 · Frequency-Tipping × Ability-Rule Link Gate (第N次 tipping × 金手指规则 跨账本联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《一块钱硬币…》: tipping/觉醒当集立刻用预知金手指（tipEp 须有 ability use）.
 *  - 《伪人降临…》对照: 关键 tipping 日与查验 use 对齐.
 *  - 《轻烟染日暮》候选: 第N次 tipping 踩在能力兑现集.
 *
 * Embeds child frequency + ability (CHILD_* bubbles).
 * Link rules:
 *  SCHEMA / DUP_ID / UNKNOWN_FREQUENCY / UNKNOWN_ABILITY
 *  CHILD_FREQUENCY_FAIL / CHILD_ABILITY_FAIL
 *  TIP_WITHOUT_USE — tipEp 已标但该集无挂靠 ability 的 use
 *  USE_WITHOUT_TIP — tipEp 未标但窗口内已有 ability use（蓄 tip 中用能力）→ WARN PENDING or FAIL?
 *  PENDING_PAIR (WARN) — 双方均未 tip/密集 use
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  FrequencyTippingEntrySchema,
  evaluateFrequencyTipping,
} from './frequency-tipping-gate';
import {
  AbilityEntrySchema,
  AbilityUseSchema,
  evaluateAbilityRules,
} from './ability-rule-gate';

const Ep = z.number().int().positive();

export const FrequencyAbilityLinkEntrySchema = z.object({
  id: z.string().min(1),
  frequencyId: z.string().min(1),
  abilityId: z.string().min(1),
  note: z.string().optional(),
});

export const FrequencyAbilityLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  frequencies: z.array(FrequencyTippingEntrySchema),
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  links: z.array(FrequencyAbilityLinkEntrySchema),
});

export type FrequencyAbilityLinkLedger = z.infer<typeof FrequencyAbilityLinkLedgerSchema>;

export type FrequencyAbilityLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_FREQUENCY'
    | 'UNKNOWN_ABILITY'
    | 'CHILD_FREQUENCY_FAIL'
    | 'CHILD_ABILITY_FAIL'
    | 'TIP_WITHOUT_USE'
    | 'PENDING_PAIR';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface FrequencyAbilityLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    pending: number;
    frequencies: number;
    abilities: number;
    latestEp: number;
  };
  findings: FrequencyAbilityLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateFrequencyAbilityLink(input: unknown): FrequencyAbilityLinkReport {
  const parsed = FrequencyAbilityLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, pending: 0, frequencies: 0, abilities: 0, latestEp: 0 },
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

  const { series, latestEp, frequencies, abilities, uses, links } = parsed.data;
  const findings: FrequencyAbilityLinkFinding[] = [];
  const push = (x: FrequencyAbilityLinkFinding) => findings.push(x);

  const freqReport = evaluateFrequencyTipping({ series, latestEp, entries: frequencies });
  if (freqReport.verdict === 'FAIL') {
    const childFails = freqReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_FREQUENCY_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌 frequency 账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 frequency-tipping-gate 再跑联表',
    });
  }

  const abilityReport = evaluateAbilityRules({ series, latestEp, abilities, uses });
  if (abilityReport.verdict === 'FAIL') {
    const childFails = abilityReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_ABILITY_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌 ability 账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 ability-rule-gate 再跑联表',
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

  const byFreq = new Map(frequencies.map((f) => [f.id, f]));
  const byAbility = new Map(abilities.map((a) => [a.id, a]));
  let aligned = 0;
  let pending = 0;

  for (const link of links) {
    const freq = byFreq.get(link.frequencyId);
    const ability = byAbility.get(link.abilityId);
    if (!freq) {
      push({
        code: 'UNKNOWN_FREQUENCY',
        severity: 'FAIL',
        ids: [link.id, link.frequencyId],
        message: `联表 ${link.id} 引用未知 frequency ${link.frequencyId}`,
        fix: 'frequencyId 须存在于 frequencies[]',
      });
      continue;
    }
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

    if (freq.tipEp === undefined) {
      pending += 1;
      push({
        code: 'PENDING_PAIR',
        severity: 'WARN',
        ids: [link.id, freq.id, ability.id],
        message: `${link.id}: frequency ${freq.id} 尚未 tip，能力联表待 tipping 落地`,
        fix: '达 threshold 后写 tipEp，并在同集写 ability use',
      });
      continue;
    }

    const usedAtTip = uses.some((u) => u.abilityId === ability.id && u.ep === freq.tipEp);
    if (!usedAtTip) {
      push({
        code: 'TIP_WITHOUT_USE',
        severity: 'FAIL',
        ids: [link.id, freq.id, ability.id],
        message: `${link.id}: tipEp=E${freq.tipEp}（${freq.tipLabel ?? '?'}）无 ability ${ability.id} 同集 use`,
        fix: 'tipping 当集立刻使用金手指（拿到就用 / 第N次兑现）',
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
      frequencies: frequencies.length,
      abilities: abilities.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
