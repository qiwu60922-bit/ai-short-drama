/**
 * V12 · Frequency-Tipping × Motif Link Gate (第N次 tipping × 视觉母题 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《机长先生》: tipping 兑现集须挂母题回扣，避免空兑现.
 *  - 与 motifFrequencyLink（motif 主键）互补：本 gate 以 frequency 为主键强制「有 tip 须对齐 motif」。
 *
 *  SCHEMA / DUP_ID / UNKNOWN_MOTIF / UNKNOWN_FREQUENCY / FUTURE_EP
 *  CHILD_MOTIF_FAIL / CHILD_FREQUENCY_FAIL
 *  EP_NOT_TIP — tipEp 须有 motif appearance
 *  TIP_WITHOUT_MOTIF — tip 无联表（frequency 主键）
 *  PENDING_MOTIF (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  MotifEntrySchema,
  MotifAppearanceSchema,
  evaluateMotifCallbacks,
} from './motif-callback-gate';
import {
  FrequencyTippingEntrySchema,
  evaluateFrequencyTipping,
} from './frequency-tipping-gate';

const Ep = z.number().int().positive();

export const FrequencyMotifLinkEntrySchema = z.object({
  id: z.string().min(1),
  frequencyId: z.string().min(1),
  motifId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const FrequencyMotifLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  frequencies: z.array(FrequencyTippingEntrySchema),
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  links: z.array(FrequencyMotifLinkEntrySchema),
});

export type FrequencyMotifLinkLedger = z.infer<typeof FrequencyMotifLinkLedgerSchema>;

export type FrequencyMotifLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_MOTIF'
    | 'UNKNOWN_FREQUENCY'
    | 'FUTURE_EP'
    | 'CHILD_MOTIF_FAIL'
    | 'CHILD_FREQUENCY_FAIL'
    | 'EP_NOT_TIP'
    | 'TIP_WITHOUT_MOTIF'
    | 'PENDING_MOTIF';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface FrequencyMotifLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    frequencies: number;
    motifs: number;
    latestEp: number;
  };
  findings: FrequencyMotifLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateFrequencyMotifLink(input: unknown): FrequencyMotifLinkReport {
  const parsed = FrequencyMotifLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, frequencies: 0, motifs: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, frequencies, motifs, appearances, links } = parsed.data;
  const findings: FrequencyMotifLinkFinding[] = [];
  const push = (x: FrequencyMotifLinkFinding) => findings.push(x);

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

  const motifReport = evaluateMotifCallbacks({ series, latestEp, motifs, appearances });
  if (motifReport.verdict === 'FAIL') {
    const childFails = motifReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_MOTIF_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌母题账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 motif-callback-gate',
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

  const byMotif = new Map(motifs.map((m) => [m.id, m]));
  const byFreq = new Map(frequencies.map((f) => [f.id, f]));
  const pairedMotifs = new Set<string>();
  const pairedFreqs = new Set<string>();
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
    const motif = byMotif.get(link.motifId);
    if (!motif) {
      push({
        code: 'UNKNOWN_MOTIF',
        severity: 'FAIL',
        ids: [link.id, link.motifId],
        message: `联表 ${link.id} 引用未知 motif ${link.motifId}`,
        fix: 'motifId 须存在于 motifs[]',
      });
      continue;
    }

    const hasAppearance = appearances.some((a) => a.motifId === motif.id && a.ep === link.ep);
    if (freq.tipEp === undefined || link.ep !== freq.tipEp || !hasAppearance) {
      push({
        code: 'EP_NOT_TIP',
        severity: 'FAIL',
        ids: [link.id, freq.id, motif.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 tip=${freq.tipEp ?? '无'}/appearance=${hasAppearance ? '有' : '无'}`,
        fix: 'link.ep = tipEp 且 motif appearance@ep',
      });
      continue;
    }

    pairedMotifs.add(motif.id);
    pairedFreqs.add(freq.id);
    aligned += 1;
  }

  for (const f of frequencies) {
    if (f.tipEp !== undefined && !pairedFreqs.has(f.id)) {
      push({
        code: 'TIP_WITHOUT_MOTIF',
        severity: 'FAIL',
        ids: [f.id],
        message: `frequency ${f.id} tipEp=E${f.tipEp} 无 motif 联表`,
        fix: '为 tipping 集挂 FrequencyMotifLink',
      });
    }
  }
  for (const m of motifs) {
    if (!pairedMotifs.has(m.id)) {
      push({
        code: 'PENDING_MOTIF',
        severity: 'WARN',
        ids: [m.id],
        message: `motif ${m.id} 尚未联表到 frequency（frequency 主键）`,
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
      motifs: motifs.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
