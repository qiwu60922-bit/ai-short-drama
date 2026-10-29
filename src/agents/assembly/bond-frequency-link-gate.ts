/**
 * V12 · Bond×Frequency Link Gate (契约升级/解除 × 第N次 tipping 跨账本联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text breakdowns of 2026-10-29 hits (structure only, no footage):
 *  - 《警报！叶楚出狱》(河马·微短剧热力榜 TOP1): 入狱替罪 → 出狱入赘姜家(契约) →
 *    婚后培养感情(帮扶 ticks) → 真情站稳(upgrade tip) — bond.upgrade ↔ frequency.tip.
 *  - 《云海不相逢》(同日热力榜 TOP2): 报恩五年婚姻(契约) → 多次为白月光伤害原配(ticks) →
 *    心死离婚(dissolve tip) — bond.dissolve ↔ frequency.tip.
 *  - 《飞上枝头难成凤凰》(同日热力榜 TOP3 对照): 飞机羞辱峰值掉「未来婆婆」身份 —
 *    vest×peak 候选，本 gate 不绑.
 *
 * Closes 2026-10-28 candidate: bond-contract × frequency-tipping 联表
 * （升级/解除拍须满足「第N次帮扶/伤害」计数 tipping）.
 *
 * Embeds child bond + frequency ledgers and reuses their evaluators (CHILD_* bubbles).
 * Link rules (per link.terminal = upgrade|dissolve):
 *  SCHEMA / DUP_ID / UNKNOWN_BOND / UNKNOWN_FREQUENCY
 *  CHILD_BOND_FAIL / CHILD_FREQUENCY_FAIL
 *  TERMINAL_WITHOUT_TIP — bond 已升级/解除但频率未 tip
 *  TIP_WITHOUT_TERMINAL — 频率已 tip 但契约缺对应终端
 *  EP_MISMATCH — terminalEp ≠ tipEp
 *  WRONG_TERMINAL — link 要 upgrade 但 bond 走了 dissolve（或反之）
 *  PENDING_PAIR (WARN) — 双方都还没落地
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  BondContractEntrySchema,
  evaluateBondContract,
} from './bond-contract-gate';
import {
  FrequencyTippingEntrySchema,
  evaluateFrequencyTipping,
} from './frequency-tipping-gate';

const Ep = z.number().int().positive();

export const BondFrequencyLinkEntrySchema = z.object({
  id: z.string().min(1),
  bondId: z.string().min(1),
  frequencyId: z.string().min(1),
  /** Which bond terminal the frequency tip must align with. */
  terminal: z.enum(['upgrade', 'dissolve']),
  note: z.string().optional(),
});

export const BondFrequencyLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  bonds: z.array(BondContractEntrySchema),
  frequencies: z.array(FrequencyTippingEntrySchema),
  links: z.array(BondFrequencyLinkEntrySchema),
});

export type BondFrequencyLinkLedger = z.infer<typeof BondFrequencyLinkLedgerSchema>;

export type BondFrequencyLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_BOND'
    | 'UNKNOWN_FREQUENCY'
    | 'CHILD_BOND_FAIL'
    | 'CHILD_FREQUENCY_FAIL'
    | 'TERMINAL_WITHOUT_TIP'
    | 'TIP_WITHOUT_TERMINAL'
    | 'EP_MISMATCH'
    | 'WRONG_TERMINAL'
    | 'PENDING_PAIR';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface BondFrequencyLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    pending: number;
    bonds: number;
    frequencies: number;
    latestEp: number;
  };
  findings: BondFrequencyLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateBondFrequencyLink(input: unknown): BondFrequencyLinkReport {
  const parsed = BondFrequencyLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, pending: 0, bonds: 0, frequencies: 0, latestEp: 0 },
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

  const { series, latestEp, bonds, frequencies, links } = parsed.data;
  const findings: BondFrequencyLinkFinding[] = [];
  const push = (x: BondFrequencyLinkFinding) => findings.push(x);

  // Child bond ledger (reuse evaluator; bubble FAILs).
  const bondReport = evaluateBondContract({ series, latestEp, entries: bonds });
  if (bondReport.verdict === 'FAIL') {
    const childFails = bondReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_BOND_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌契约账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 bond-contract-gate 再跑联表（升级/解除/帮扶时序与标签）',
    });
  }

  // Child frequency ledger.
  const freqReport = evaluateFrequencyTipping({ series, latestEp, entries: frequencies });
  if (freqReport.verdict === 'FAIL') {
    const childFails = freqReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_FREQUENCY_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌频率账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 frequency-tipping-gate 再跑联表（threshold/ticks/tipLabel）',
    });
  }

  const bondById = new Map(bonds.map((b) => [b.id, b]));
  const freqById = new Map(frequencies.map((f) => [f.id, f]));

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
      message: `联表链接 ID 重复：${id}`,
      fix: 'links[].id 是跨账本指针主键，改成唯一 ID',
    });
  }

  let aligned = 0;
  let pending = 0;

  for (const l of links) {
    const bond = bondById.get(l.bondId);
    const freq = freqById.get(l.frequencyId);

    if (!bond) {
      push({
        code: 'UNKNOWN_BOND',
        severity: 'FAIL',
        ids: [l.id],
        message: `${l.id} 指向不存在的 bondId=${l.bondId}`,
        fix: 'bondId 须对应 bonds[].id',
      });
      continue;
    }
    if (!freq) {
      push({
        code: 'UNKNOWN_FREQUENCY',
        severity: 'FAIL',
        ids: [l.id],
        message: `${l.id} 指向不存在的 frequencyId=${l.frequencyId}`,
        fix: 'frequencyId 须对应 frequencies[].id',
      });
      continue;
    }

    const hasUpgrade = bond.upgradeEp !== undefined;
    const hasDissolve = bond.dissolveEp !== undefined;
    const tipped = freq.tipEp !== undefined;

    if (l.terminal === 'upgrade' && hasDissolve && !hasUpgrade) {
      push({
        code: 'WRONG_TERMINAL',
        severity: 'FAIL',
        ids: [l.id, l.bondId],
        message: `${l.id} 要求 upgrade，但契约 ${l.bondId} 走了 dissolve@E${bond.dissolveEp}`,
        fix: '改 link.terminal=dissolve，或把契约终端改成 upgrade',
      });
      continue;
    }
    if (l.terminal === 'dissolve' && hasUpgrade && !hasDissolve) {
      push({
        code: 'WRONG_TERMINAL',
        severity: 'FAIL',
        ids: [l.id, l.bondId],
        message: `${l.id} 要求 dissolve，但契约 ${l.bondId} 走了 upgrade@E${bond.upgradeEp}`,
        fix: '改 link.terminal=upgrade，或把契约终端改成 dissolve',
      });
      continue;
    }

    const terminalEp =
      l.terminal === 'upgrade' ? bond.upgradeEp : bond.dissolveEp;
    const hasTerminal = terminalEp !== undefined;

    if (!hasTerminal && !tipped) {
      pending += 1;
      push({
        code: 'PENDING_PAIR',
        severity: 'WARN',
        ids: [l.id],
        message: `${l.id} 契约与频率都尚未落地（蓄势中）`,
        fix: '帮扶/伤害 ticks 攒满后，同一集写 tipEp 与 upgradeEp|dissolveEp',
      });
      continue;
    }

    if (hasTerminal && !tipped) {
      push({
        code: 'TERMINAL_WITHOUT_TIP',
        severity: 'FAIL',
        ids: [l.id, l.bondId, l.frequencyId],
        message: `${l.id} 契约已 ${l.terminal}@E${terminalEp}，但频率 ${l.frequencyId} 尚未 tip（缺第N次计数兑现）`,
        fix: '升级/解除前须先达到 frequency.threshold 并写 tipEp/tipLabel',
      });
      continue;
    }

    if (tipped && !hasTerminal) {
      push({
        code: 'TIP_WITHOUT_TERMINAL',
        severity: 'FAIL',
        ids: [l.id, l.bondId, l.frequencyId],
        message: `${l.id} 频率已 tip@E${freq.tipEp}，但契约 ${l.bondId} 缺 ${l.terminal} 终端`,
        fix: `在契约条目写 ${l.terminal}Ep + ${l.terminal}Label，且集号对齐 tipEp`,
      });
      continue;
    }

    // Both present: require same episode.
    if (terminalEp !== freq.tipEp) {
      push({
        code: 'EP_MISMATCH',
        severity: 'FAIL',
        ids: [l.id, l.bondId, l.frequencyId],
        message: `${l.id} ${l.terminal}Ep=E${terminalEp} ≠ tipEp=E${freq.tipEp}（第N次 tipping 与契约终端须同集）`,
        fix: '把 upgradeEp|dissolveEp 与 tipEp 改成同一集（同拍兑现）',
      });
      continue;
    }

    aligned += 1;
  }

  const hasFail = findings.some((f) => f.severity === 'FAIL');
  return {
    verdict: hasFail ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      pending,
      bonds: bonds.length,
      frequencies: frequencies.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
