/**
 * V12 · Frequency × Amnesia Link Gate (第N次 tipping × 失忆唤回 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《反派拿捏》/《机长先生》: tipping 兑现常与失忆唤回同集对齐.
 *  - 与 amnesiaFrequencyLink（amnesia 主键）互补：本 gate 以 frequency 为主键.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_FREQUENCY / UNKNOWN_AMNESIA
 *  CHILD_FREQUENCY_FAIL / CHILD_AMNESIA_FAIL
 *  TIP_NOT_AT_RECOVER — tipEp 须等于 recoverEp
 *  TIP_WITHOUT_AMNESIA — 已 tip 无联表
 *  PENDING_FREQUENCY (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  FrequencyTippingEntrySchema,
  evaluateFrequencyTipping,
} from './frequency-tipping-gate';
import {
  AmnesiaArcEntrySchema,
  evaluateAmnesiaArc,
} from './amnesia-arc-gate';

const Ep = z.number().int().positive();

export const FrequencyAmnesiaLinkEntrySchema = z.object({
  id: z.string().min(1),
  frequencyId: z.string().min(1),
  amnesiaId: z.string().min(1),
  note: z.string().optional(),
});

export const FrequencyAmnesiaLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  frequencies: z.array(FrequencyTippingEntrySchema),
  amnesias: z.array(AmnesiaArcEntrySchema),
  links: z.array(FrequencyAmnesiaLinkEntrySchema),
});

export type FrequencyAmnesiaLinkLedger = z.infer<typeof FrequencyAmnesiaLinkLedgerSchema>;

export type FrequencyAmnesiaLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_FREQUENCY'
    | 'UNKNOWN_AMNESIA'
    | 'CHILD_FREQUENCY_FAIL'
    | 'CHILD_AMNESIA_FAIL'
    | 'TIP_NOT_AT_RECOVER'
    | 'TIP_WITHOUT_AMNESIA'
    | 'PENDING_FREQUENCY';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface FrequencyAmnesiaLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    frequencies: number;
    amnesias: number;
    latestEp: number;
  };
  findings: FrequencyAmnesiaLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateFrequencyAmnesiaLink(input: unknown): FrequencyAmnesiaLinkReport {
  const parsed = FrequencyAmnesiaLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, frequencies: 0, amnesias: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, frequencies, amnesias, links } = parsed.data;
  const findings: FrequencyAmnesiaLinkFinding[] = [];
  const push = (x: FrequencyAmnesiaLinkFinding) => findings.push(x);

  const fReport = evaluateFrequencyTipping({ series, latestEp, entries: frequencies });
  if (fReport.verdict === 'FAIL') {
    const childFails = fReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_FREQUENCY_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌频率账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 frequency-tipping-gate',
    });
  }

  const amReport = evaluateAmnesiaArc({ series, latestEp, entries: amnesias });
  if (amReport.verdict === 'FAIL') {
    const childFails = amReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_AMNESIA_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌失忆账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 amnesia-arc-gate',
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
  const byAm = new Map(amnesias.map((a) => [a.id, a]));
  const linkedFreqs = new Set<string>();
  let aligned = 0;

  for (const link of links) {
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
    const am = byAm.get(link.amnesiaId);
    if (!am) {
      push({
        code: 'UNKNOWN_AMNESIA',
        severity: 'FAIL',
        ids: [link.id, link.amnesiaId],
        message: `联表 ${link.id} 引用未知 amnesia ${link.amnesiaId}`,
        fix: 'amnesiaId 须存在于 amnesias[]',
      });
      continue;
    }
    if (freq.tipEp === undefined || am.recoverEp === undefined || freq.tipEp !== am.recoverEp) {
      push({
        code: 'TIP_NOT_AT_RECOVER',
        severity: 'FAIL',
        ids: [link.id, freq.id, am.id],
        message: `${link.id}: tip=${freq.tipEp ?? '无'} 未对齐 recover=${am.recoverEp ?? '无'}`,
        fix: 'tipEp 须等于 recoverEp',
      });
      continue;
    }
    linkedFreqs.add(freq.id);
    aligned += 1;
  }

  for (const f of frequencies) {
    if (f.tipEp !== undefined && !linkedFreqs.has(f.id)) {
      push({
        code: 'TIP_WITHOUT_AMNESIA',
        severity: 'FAIL',
        ids: [f.id],
        message: `frequency ${f.id} tipEp=E${f.tipEp} 无 frequency×amnesia 联表`,
        fix: '为 tipping 集挂 FrequencyAmnesiaLink',
      });
    } else if (!linkedFreqs.has(f.id)) {
      push({
        code: 'PENDING_FREQUENCY',
        severity: 'WARN',
        ids: [f.id],
        message: `frequency ${f.id} 尚未联表到 frequency×amnesia`,
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
      amnesias: amnesias.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
