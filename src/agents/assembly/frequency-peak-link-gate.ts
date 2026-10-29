/**
 * V12 · Frequency×Peak Link Gate (第N次 tipping × 情绪峰值 跨账本联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text breakdowns (structure only, no footage):
 *  - 《轻烟染日暮》候选：第99次离婚 tipping 须踩在羞辱/对峙峰值集.
 *  - 《备用联系人（完）》: 分手第70天吻 = day tip 对齐情感峰值.
 *  - 《警报！叶楚出狱》对照：帮扶第N次 tip 可对齐对峙/真情峰值
 *    （bond×frequency 已由另一 gate 覆盖终端；本 gate 专管 tip×peak）.
 *
 * Closes 2026-10-29 candidate: frequency-tipping × peak-before-payoff 联表.
 *
 * Embeds child frequency + peak ledgers (CHILD_* bubbles).
 * Link rules:
 *  SCHEMA / DUP_ID / UNKNOWN_FREQUENCY / UNKNOWN_PEAK
 *  CHILD_FREQUENCY_FAIL / CHILD_PEAK_FAIL
 *  TIP_WITHOUT_PEAK / PEAK_WITHOUT_TIP / EP_MISMATCH
 *  PENDING_PAIR (WARN)
 * tipEp === peak.peakEp（同集兑现）.
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  FrequencyTippingEntrySchema,
  evaluateFrequencyTipping,
} from './frequency-tipping-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const FrequencyPeakLinkEntrySchema = z.object({
  id: z.string().min(1),
  frequencyId: z.string().min(1),
  peakId: z.string().min(1),
  note: z.string().optional(),
});

export const FrequencyPeakLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  frequencies: z.array(FrequencyTippingEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(FrequencyPeakLinkEntrySchema),
});

export type FrequencyPeakLinkLedger = z.infer<typeof FrequencyPeakLinkLedgerSchema>;

export type FrequencyPeakLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_FREQUENCY'
    | 'UNKNOWN_PEAK'
    | 'CHILD_FREQUENCY_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'TIP_WITHOUT_PEAK'
    | 'PEAK_WITHOUT_TIP'
    | 'EP_MISMATCH'
    | 'PENDING_PAIR';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface FrequencyPeakLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    pending: number;
    frequencies: number;
    peaks: number;
    latestEp: number;
  };
  findings: FrequencyPeakLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateFrequencyPeakLink(input: unknown): FrequencyPeakLinkReport {
  const parsed = FrequencyPeakLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, pending: 0, frequencies: 0, peaks: 0, latestEp: 0 },
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

  const { series, latestEp, frequencies, peaks, links } = parsed.data;
  const findings: FrequencyPeakLinkFinding[] = [];
  const push = (x: FrequencyPeakLinkFinding) => findings.push(x);

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

  const peakReport = evaluatePeakBeforePayoff({ series, latestEp, entries: peaks });
  if (peakReport.verdict === 'FAIL') {
    const childFails = peakReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_PEAK_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌峰值账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 peak-before-payoff-gate 再跑联表（open/peak/payoff）',
    });
  }

  const freqById = new Map(frequencies.map((f) => [f.id, f]));
  const peakById = new Map(peaks.map((p) => [p.id, p]));

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
    const freq = freqById.get(l.frequencyId);
    const peak = peakById.get(l.peakId);

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
    if (!peak) {
      push({
        code: 'UNKNOWN_PEAK',
        severity: 'FAIL',
        ids: [l.id],
        message: `${l.id} 指向不存在的 peakId=${l.peakId}`,
        fix: 'peakId 须对应 peaks[].id',
      });
      continue;
    }

    const tipped = freq.tipEp !== undefined;
    const hasPeak = peak.peakEp !== undefined;

    if (!tipped && !hasPeak) {
      pending += 1;
      push({
        code: 'PENDING_PAIR',
        severity: 'WARN',
        ids: [l.id],
        message: `${l.id} 频率与峰值都尚未落地（蓄势中）`,
        fix: 'ticks 攒满后，同一集写 tipEp 与 peakEp',
      });
      continue;
    }

    if (tipped && !hasPeak) {
      push({
        code: 'TIP_WITHOUT_PEAK',
        severity: 'FAIL',
        ids: [l.id, l.frequencyId, l.peakId],
        message: `${l.id} 频率已 tip@E${freq.tipEp}，但峰值 ${l.peakId} 尚未标 peakEp`,
        fix: '第N次 tipping 须踩在情绪峰值集：先写 peakEp/peakLabel',
      });
      continue;
    }

    if (hasPeak && !tipped) {
      push({
        code: 'PEAK_WITHOUT_TIP',
        severity: 'FAIL',
        ids: [l.id, l.frequencyId, l.peakId],
        message: `${l.id} 峰值已标@E${peak.peakEp}，但频率 ${l.frequencyId} 尚未 tip`,
        fix: '在峰值集写 tipEp + tipLabel（第N次 tipping 同集兑现）',
      });
      continue;
    }

    if (freq.tipEp !== peak.peakEp) {
      push({
        code: 'EP_MISMATCH',
        severity: 'FAIL',
        ids: [l.id, l.frequencyId, l.peakId],
        message: `${l.id} tipEp=E${freq.tipEp} ≠ peakEp=E${peak.peakEp}（第N次 tipping 须与情绪峰值同集）`,
        fix: '把 tipEp 与 peakEp 改成同一集（同拍兑现）',
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
      frequencies: frequencies.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
