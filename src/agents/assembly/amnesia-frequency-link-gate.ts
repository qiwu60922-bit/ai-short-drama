/**
 * V12 · Amnesia × Frequency Link Gate (失忆唤回 × 第N次 tipping 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《反派拿捏》: recover 常踩 tipping 兑现窗.
 *  - 与 frequencyAmnesiaLink（frequency 主键）互补：本 gate 以 amnesia 为主键.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_AMNESIA / UNKNOWN_FREQUENCY
 *  CHILD_AMNESIA_FAIL / CHILD_FREQUENCY_FAIL
 *  RECOVER_NOT_AT_TIP — recoverEp 须等于 tipEp
 *  RECOVER_WITHOUT_FREQUENCY — 已 recover 无联表
 *  PENDING_AMNESIA (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  AmnesiaArcEntrySchema,
  evaluateAmnesiaArc,
} from './amnesia-arc-gate';
import {
  FrequencyTippingEntrySchema,
  evaluateFrequencyTipping,
} from './frequency-tipping-gate';

const Ep = z.number().int().positive();

export const AmnesiaFrequencyLinkEntrySchema = z.object({
  id: z.string().min(1),
  amnesiaId: z.string().min(1),
  frequencyId: z.string().min(1),
  note: z.string().optional(),
});

export const AmnesiaFrequencyLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  amnesias: z.array(AmnesiaArcEntrySchema),
  frequencies: z.array(FrequencyTippingEntrySchema),
  links: z.array(AmnesiaFrequencyLinkEntrySchema),
});

export type AmnesiaFrequencyLinkLedger = z.infer<typeof AmnesiaFrequencyLinkLedgerSchema>;

export type AmnesiaFrequencyLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_AMNESIA'
    | 'UNKNOWN_FREQUENCY'
    | 'CHILD_AMNESIA_FAIL'
    | 'CHILD_FREQUENCY_FAIL'
    | 'RECOVER_NOT_AT_TIP'
    | 'RECOVER_WITHOUT_FREQUENCY'
    | 'PENDING_AMNESIA';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AmnesiaFrequencyLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    amnesias: number;
    frequencies: number;
    latestEp: number;
  };
  findings: AmnesiaFrequencyLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAmnesiaFrequencyLink(input: unknown): AmnesiaFrequencyLinkReport {
  const parsed = AmnesiaFrequencyLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, amnesias: 0, frequencies: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, amnesias, frequencies, links } = parsed.data;
  const findings: AmnesiaFrequencyLinkFinding[] = [];
  const push = (x: AmnesiaFrequencyLinkFinding) => findings.push(x);

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

  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const l of links) {
    if (seen.has(l.id)) dups.add(l.id);
    else seen.add(l.id);
  }
  for (const id of dups) {
    push({ code: 'DUP_ID', severity: 'FAIL', ids: [id], message: `联表ID重复：${id}`, fix: '联表 id 须唯一' });
  }

  const byAm = new Map(amnesias.map((a) => [a.id, a]));
  const byFreq = new Map(frequencies.map((f) => [f.id, f]));
  const linkedAms = new Set<string>();
  let aligned = 0;

  for (const link of links) {
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
    if (am.recoverEp === undefined || freq.tipEp === undefined || am.recoverEp !== freq.tipEp) {
      push({
        code: 'RECOVER_NOT_AT_TIP',
        severity: 'FAIL',
        ids: [link.id, am.id, freq.id],
        message: `${link.id}: recover=${am.recoverEp ?? '无'} 未对齐 tip=${freq.tipEp ?? '无'}`,
        fix: 'recoverEp 须等于 tipEp',
      });
      continue;
    }
    linkedAms.add(am.id);
    aligned += 1;
  }

  for (const a of amnesias) {
    if (a.recoverEp !== undefined && !linkedAms.has(a.id)) {
      push({
        code: 'RECOVER_WITHOUT_FREQUENCY',
        severity: 'FAIL',
        ids: [a.id],
        message: `amnesia ${a.id} recoverEp=E${a.recoverEp} 无 amnesia×frequency 联表`,
        fix: '为唤回集挂 AmnesiaFrequencyLink',
      });
    } else if (!linkedAms.has(a.id)) {
      push({
        code: 'PENDING_AMNESIA',
        severity: 'WARN',
        ids: [a.id],
        message: `amnesia ${a.id} 尚未联表到 amnesia×frequency`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      amnesias: amnesias.length,
      frequencies: frequencies.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
