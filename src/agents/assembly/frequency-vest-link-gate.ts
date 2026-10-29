/**
 * V12 · Frequency-Tipping × Identity-Vest Link Gate (第N次 tipping × 马甲掉落 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《机长先生》/《轻烟染日暮》: 掉马甲常与第N次 tipping 同集兑现.
 *  - 与 vestFrequencyLink（vest 主键）互补：本 gate 以 frequency 为主键强制「有 tip 须对齐 drop」。
 *
 *  SCHEMA / DUP_ID / UNKNOWN_VEST / UNKNOWN_FREQUENCY
 *  CHILD_VEST_FAIL / CHILD_FREQUENCY_FAIL
 *  TIP_NOT_AT_DROP — tipEp 须等于 dropEp
 *  TIP_WITHOUT_VEST — 已 tip 无联表
 *  PENDING_FREQUENCY (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  FrequencyTippingEntrySchema,
  evaluateFrequencyTipping,
} from './frequency-tipping-gate';
import {
  IdentityVestEntrySchema,
  evaluateIdentityVest,
} from './identity-vest-gate';

const Ep = z.number().int().positive();

export const FrequencyVestLinkEntrySchema = z.object({
  id: z.string().min(1),
  vestId: z.string().min(1),
  frequencyId: z.string().min(1),
  note: z.string().optional(),
});

export const FrequencyVestLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  vests: z.array(IdentityVestEntrySchema),
  frequencies: z.array(FrequencyTippingEntrySchema),
  links: z.array(FrequencyVestLinkEntrySchema),
});

export type FrequencyVestLinkLedger = z.infer<typeof FrequencyVestLinkLedgerSchema>;

export type FrequencyVestLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_VEST'
    | 'UNKNOWN_FREQUENCY'
    | 'CHILD_VEST_FAIL'
    | 'CHILD_FREQUENCY_FAIL'
    | 'TIP_NOT_AT_DROP'
    | 'TIP_WITHOUT_VEST'
    | 'PENDING_FREQUENCY';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface FrequencyVestLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    vests: number;
    frequencies: number;
    latestEp: number;
  };
  findings: FrequencyVestLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateFrequencyVestLink(input: unknown): FrequencyVestLinkReport {
  const parsed = FrequencyVestLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, vests: 0, frequencies: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, vests, frequencies, links } = parsed.data;
  const findings: FrequencyVestLinkFinding[] = [];
  const push = (x: FrequencyVestLinkFinding) => findings.push(x);

  const vestReport = evaluateIdentityVest({ series, latestEp, entries: vests });
  if (vestReport.verdict === 'FAIL') {
    const childFails = vestReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_VEST_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌马甲账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 identity-vest-gate',
    });
  }

  const freqReport = evaluateFrequencyTipping({ series, latestEp, entries: frequencies });
  if (freqReport.verdict === 'FAIL') {
    const childFails = freqReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_FREQUENCY_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌频率账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 frequency-tipping-gate',
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

  const byVest = new Map(vests.map((v) => [v.id, v]));
  const byFreq = new Map(frequencies.map((f) => [f.id, f]));
  const pairedVests = new Set<string>();
  const pairedFreqs = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const vest = byVest.get(link.vestId);
    const freq = byFreq.get(link.frequencyId);
    if (!vest) {
      push({
        code: 'UNKNOWN_VEST',
        severity: 'FAIL',
        ids: [link.id, link.vestId],
        message: `联表 ${link.id} 引用未知 vest ${link.vestId}`,
        fix: 'vestId 须存在于 vests[]',
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
    pairedVests.add(vest.id);
    pairedFreqs.add(freq.id);

    if (
      freq.tipEp === undefined ||
      vest.dropEp === undefined ||
      freq.tipEp !== vest.dropEp
    ) {
      push({
        code: 'TIP_NOT_AT_DROP',
        severity: 'FAIL',
        ids: [link.id, freq.id, vest.id],
        message: `${link.id}: tipEp=${freq.tipEp ?? '未 tip'} ≠ dropEp=${vest.dropEp ?? '未掉'}`,
        fix: '第N次 tipping 与马甲掉落同集',
      });
      continue;
    }

    aligned += 1;
  }

  for (const f of frequencies) {
    if (f.tipEp !== undefined && !pairedFreqs.has(f.id)) {
      push({
        code: 'TIP_WITHOUT_VEST',
        severity: 'FAIL',
        ids: [f.id],
        message: `frequency ${f.id} tipEp=E${f.tipEp} 无 vest 联表`,
        fix: '在 links[] 挂 vestId↔frequencyId',
      });
    }
  }
  for (const f of frequencies) {
    if (f.tipEp === undefined && !pairedFreqs.has(f.id)) {
      push({
        code: 'PENDING_FREQUENCY',
        severity: 'WARN',
        ids: [f.id],
        message: `frequency ${f.id} 尚未联表到 vest（frequency 主键）`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      vests: vests.length,
      frequencies: frequencies.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
