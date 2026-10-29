/**
 * V12 · Frequency-Tipping × Quality-Leap Link Gate (第N次 tipping × 表演门 联表),
 * pre-generation, offline, deterministic.
 *
 *  - 与 qualityFrequencyLink（quality 主键）互补：本 gate 以 frequency 为主键。
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《一块钱硬币》: tipping/觉醒当集须过表演强度门，不能空壳喊「第N次」.
 *  - quality-leap 管表演；frequency-tipping 管 tipEp——本 gate 硬联表 tip@ep 表演.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_FREQUENCY / FUTURE_EP
 *  CHILD_FREQUENCY_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_TIP — link.ep 须等于 tipEp
 *  TIP_WITHOUT_QUALITY — 已 tip 无联表 quality
 *  PENDING_FREQUENCY (WARN)
 *  LOW_INTENSITY_AT_TIP (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  FrequencyTippingEntrySchema,
  evaluateFrequencyTipping,
} from './frequency-tipping-gate';
import {
  QualityLeapDocSchema,
  evaluateQualityLeap,
} from './quality-leap-gate';

const Ep = z.number().int().positive();

export const FrequencyQualityLinkEntrySchema = z.object({
  id: z.string().min(1),
  frequencyId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const FrequencyQualityLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minTipIntense: z.number().int().min(1).max(5).optional(),
  frequencies: z.array(FrequencyTippingEntrySchema),
  links: z.array(FrequencyQualityLinkEntrySchema),
});

export type FrequencyQualityLinkLedger = z.infer<typeof FrequencyQualityLinkLedgerSchema>;

export type FrequencyQualityLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_FREQUENCY'
    | 'FUTURE_EP'
    | 'CHILD_FREQUENCY_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_TIP'
    | 'TIP_WITHOUT_QUALITY'
    | 'PENDING_FREQUENCY'
    | 'LOW_INTENSITY_AT_TIP';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface FrequencyQualityLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    frequencies: number;
    latestEp: number;
  };
  findings: FrequencyQualityLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

function maxIntensity(ql: {
  shots?: Array<{ performance?: { intensity?: number } | null }>;
}): number {
  let m = 0;
  for (const s of ql.shots ?? []) {
    const i = s.performance?.intensity;
    if (typeof i === 'number' && i > m) m = i;
  }
  return m;
}

export function evaluateFrequencyQualityLink(input: unknown): FrequencyQualityLinkReport {
  const parsed = FrequencyQualityLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, frequencies: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, frequencies, links, minTipIntense = 4 } = parsed.data;
  const findings: FrequencyQualityLinkFinding[] = [];
  const push = (x: FrequencyQualityLinkFinding) => findings.push(x);

  const freqReport = evaluateFrequencyTipping({ series, latestEp, entries: frequencies });
  if (freqReport.verdict === 'FAIL') {
    const childFails = freqReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_FREQUENCY_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌 frequency 账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
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

  const byFreq = new Map(frequencies.map((f) => [f.id, f]));
  const linked = new Set<string>();
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
    const freq = byFreq.get(link.frequencyId);
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

    if (freq.tipEp === undefined || link.ep !== freq.tipEp) {
      push({
        code: 'EP_NOT_TIP',
        severity: 'FAIL',
        ids: [link.id, freq.id],
        message: `${link.id}: ep=E${link.ep} ≠ tipEp=${freq.tipEp ?? '未 tip'}`,
        fix: 'tipping 集须挂表演门',
      });
      continue;
    }

    const ql = evaluateQualityLeap(link.qualityLeap);
    if (ql.verdict === 'FAIL') {
      const childFails = ql.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_QUALITY_FAIL',
        severity: 'FAIL',
        ids: [link.id, freq.id, ...(childFails.map((f) => f.shotId).filter(Boolean) as string[])],
        message: `${link.id}: qualityLeap FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: 'tipping 镜须过表演/情绪/口型门',
      });
      continue;
    }

    const mi = maxIntensity(link.qualityLeap);
    if (mi < minTipIntense) {
      push({
        code: 'LOW_INTENSITY_AT_TIP',
        severity: 'WARN',
        ids: [link.id, freq.id],
        message: `${link.id}: tipping E${link.ep} max intensity=${mi} < ${minTipIntense}`,
        fix: 'tipping 集补高强度表演',
      });
    }

    linked.add(freq.id);
    aligned += 1;
  }

  for (const f of frequencies) {
    if (f.tipEp !== undefined && !linked.has(f.id)) {
      push({
        code: 'TIP_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [f.id],
        message: `frequency ${f.id} tipEp=E${f.tipEp} 无 quality 联表`,
        fix: '为 tipping 集挂 FrequencyQualityLink',
      });
    } else if (!linked.has(f.id)) {
      push({
        code: 'PENDING_FREQUENCY',
        severity: 'WARN',
        ids: [f.id],
        message: `frequency ${f.id} 尚未联表到 quality`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      frequencies: frequencies.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
