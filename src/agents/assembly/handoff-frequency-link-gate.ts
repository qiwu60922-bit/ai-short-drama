/**
 * V12 · Cliffhanger-Handoff × Frequency Link Gate (集间悬念承接 × 第N次 tipping 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《轻烟染日暮》: tipping 当集卡悬念，下集 hook 承接第N次后果.
 *  - 与 frequencyHandoffLink（frequency 主键）互补：本 gate 以 handoff 为主键强制「有 handoff 须对齐 tip」。
 *
 *  SCHEMA / DUP_ID / UNKNOWN_FREQUENCY / UNKNOWN_HANDOFF
 *  CHILD_FREQUENCY_FAIL / CHILD_HANDOFF_FAIL
 *  HANDOFF_NOT_AT_TIP — tipEp 须等于 handoff.prevEp
 *  FREQUENCY_WITHOUT_HANDOFF — handoff 未联表
 *  PENDING_HANDOFF (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import {
  FrequencyTippingEntrySchema,
  evaluateFrequencyTipping,
} from './frequency-tipping-gate';
import { evaluateCliffhangerHandoff } from './cliffhanger-handoff-gate';

const Ep = z.number().int().positive();

export const HandoffFrequencyEntrySchema = z.object({
  id: z.string().min(1),
  prevEp: Ep,
  nextEp: Ep,
  prev: ShotSpecDocSchema,
  next: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const HandoffFrequencyLinkEntrySchema = z.object({
  id: z.string().min(1),
  frequencyId: z.string().min(1),
  handoffId: z.string().min(1),
  note: z.string().optional(),
});

export const HandoffFrequencyLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  frequencies: z.array(FrequencyTippingEntrySchema),
  handoffs: z.array(HandoffFrequencyEntrySchema),
  links: z.array(HandoffFrequencyLinkEntrySchema),
});

export type HandoffFrequencyLinkLedger = z.infer<typeof HandoffFrequencyLinkLedgerSchema>;

export type HandoffFrequencyLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_FREQUENCY'
    | 'UNKNOWN_HANDOFF'
    | 'CHILD_FREQUENCY_FAIL'
    | 'CHILD_HANDOFF_FAIL'
    | 'HANDOFF_NOT_AT_TIP'
    | 'FREQUENCY_WITHOUT_HANDOFF'
    | 'PENDING_HANDOFF';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface HandoffFrequencyLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    frequencies: number;
    handoffs: number;
    latestEp: number;
  };
  findings: HandoffFrequencyLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateHandoffFrequencyLink(input: unknown): HandoffFrequencyLinkReport {
  const parsed = HandoffFrequencyLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, frequencies: 0, handoffs: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, frequencies, handoffs, links } = parsed.data;
  const findings: HandoffFrequencyLinkFinding[] = [];
  const push = (x: HandoffFrequencyLinkFinding) => findings.push(x);

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

  for (const h of handoffs) {
    const r = evaluateCliffhangerHandoff(h.prev, h.next);
    if (r.verdict === 'FAIL') {
      const codes = r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
      push({
        code: 'CHILD_HANDOFF_FAIL',
        severity: 'FAIL',
        ids: [h.id],
        message: `handoff ${h.id} FAIL：${codes.join(',') || 'unknown'}`,
        fix: '先修 cliffhanger-handoff-gate',
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

  const byFreq = new Map(frequencies.map((f) => [f.id, f]));
  const byH = new Map(handoffs.map((h) => [h.id, h]));
  const pairedH = new Set<string>();
  const pairedFreqs = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const freq = byFreq.get(link.frequencyId);
    const handoff = byH.get(link.handoffId);
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
    if (!handoff) {
      push({
        code: 'UNKNOWN_HANDOFF',
        severity: 'FAIL',
        ids: [link.id, link.handoffId],
        message: `联表 ${link.id} 引用未知 handoff ${link.handoffId}`,
        fix: 'handoffId 须存在于 handoffs[]',
      });
      continue;
    }
    pairedH.add(handoff.id);
    pairedFreqs.add(freq.id);

    if (freq.tipEp === undefined || freq.tipEp !== handoff.prevEp) {
      push({
        code: 'HANDOFF_NOT_AT_TIP',
        severity: 'FAIL',
        ids: [link.id, freq.id, handoff.id],
        message: `${link.id}: tipEp=${freq.tipEp ?? '未 tip'} ≠ handoff.prevEp=E${handoff.prevEp}`,
        fix: '第N次 tipping 须落在悬念上一集',
      });
      continue;
    }

    aligned += 1;
  }

  for (const h of handoffs) {
    if (!pairedH.has(h.id)) {
      push({
        code: 'FREQUENCY_WITHOUT_HANDOFF',
        severity: 'FAIL',
        ids: [h.id],
        message: `handoff ${h.id} 未挂 frequency 联表`,
        fix: '在 links[] 挂 frequencyId↔handoffId',
      });
    }
  }
  for (const f of frequencies) {
    if (!pairedFreqs.has(f.id)) {
      push({
        code: 'PENDING_HANDOFF',
        severity: 'WARN',
        ids: [f.id],
        message: `frequency ${f.id} 尚未联表到 handoff`,
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
      handoffs: handoffs.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
