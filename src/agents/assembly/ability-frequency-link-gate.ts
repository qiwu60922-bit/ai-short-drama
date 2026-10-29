/**
 * V12 · Ability-Rule × Frequency-Tipping Link Gate (金手指 × 第N次 tipping 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《一块钱硬币…》: 金手指 use 当集须对齐 tipping（拿到就用）.
 *  - 与 frequencyAbilityLink（frequency 主键）互补：本 gate 以 ability 为主键强制「有 tip 窗用须 tip」.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_ABILITY / UNKNOWN_FREQUENCY
 *  CHILD_ABILITY_FAIL / CHILD_FREQUENCY_FAIL
 *  USE_WITHOUT_TIP — tipEp 未标但 ability 在窗口有 use，或 tip 与 use 不同集
 *  TIP_WITHOUT_ABILITY — tip 已标但未联表（via unpaired tip on linked freq?）
 *  PENDING_ABILITY (WARN)
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

export const AbilityFrequencyLinkEntrySchema = z.object({
  id: z.string().min(1),
  abilityId: z.string().min(1),
  frequencyId: z.string().min(1),
  note: z.string().optional(),
});

export const AbilityFrequencyLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  frequencies: z.array(FrequencyTippingEntrySchema),
  links: z.array(AbilityFrequencyLinkEntrySchema),
});

export type AbilityFrequencyLinkLedger = z.infer<typeof AbilityFrequencyLinkLedgerSchema>;

export type AbilityFrequencyLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_ABILITY'
    | 'UNKNOWN_FREQUENCY'
    | 'CHILD_ABILITY_FAIL'
    | 'CHILD_FREQUENCY_FAIL'
    | 'USE_WITHOUT_TIP'
    | 'TIP_WITHOUT_USE'
    | 'PENDING_ABILITY';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AbilityFrequencyLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    pending: number;
    abilities: number;
    frequencies: number;
    latestEp: number;
  };
  findings: AbilityFrequencyLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAbilityFrequencyLink(input: unknown): AbilityFrequencyLinkReport {
  const parsed = AbilityFrequencyLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, pending: 0, abilities: 0, frequencies: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, abilities, uses, frequencies, links } = parsed.data;
  const findings: AbilityFrequencyLinkFinding[] = [];
  const push = (x: AbilityFrequencyLinkFinding) => findings.push(x);

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

  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const l of links) {
    if (seen.has(l.id)) dups.add(l.id);
    else seen.add(l.id);
  }
  for (const id of dups) {
    push({ code: 'DUP_ID', severity: 'FAIL', ids: [id], message: `联表ID重复：${id}`, fix: '联表 id 须唯一' });
  }

  const byAbility = new Map(abilities.map((a) => [a.id, a]));
  const byFreq = new Map(frequencies.map((f) => [f.id, f]));
  const pairedAbs = new Set<string>();
  let aligned = 0;
  let pending = 0;

  for (const link of links) {
    const ability = byAbility.get(link.abilityId);
    const freq = byFreq.get(link.frequencyId);
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
    pairedAbs.add(ability.id);

    if (freq.tipEp === undefined) {
      pending += 1;
      // ability-primary: if ability already used, fail USE_WITHOUT_TIP; else pending ok as WARN via no tip
      const used = uses.some((u) => u.abilityId === ability.id);
      if (used) {
        push({
          code: 'USE_WITHOUT_TIP',
          severity: 'FAIL',
          ids: [link.id, ability.id, freq.id],
          message: `${link.id}: ability 已有 use，但 frequency ${freq.id} 尚未 tip`,
          fix: '金手指 use 须对齐 tipping：写 tipEp 同集',
        });
      }
      continue;
    }

    const usedAtTip = uses.some((u) => u.abilityId === ability.id && u.ep === freq.tipEp);
    if (!usedAtTip) {
      push({
        code: 'TIP_WITHOUT_USE',
        severity: 'FAIL',
        ids: [link.id, freq.id, ability.id],
        message: `${link.id}: tipEp=E${freq.tipEp} 无 ability ${ability.id} 同集 use`,
        fix: 'tipping 当集立刻使用金手指',
      });
      continue;
    }

    aligned += 1;
  }

  for (const a of abilities) {
    if (!pairedAbs.has(a.id)) {
      push({
        code: 'PENDING_ABILITY',
        severity: 'WARN',
        ids: [a.id],
        message: `ability ${a.id} 尚未联表到 frequency`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      pending,
      abilities: abilities.length,
      frequencies: frequencies.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
