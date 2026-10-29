/**
 * V12 · Persona-Mask × Frequency-Tipping Link Gate (伪装揭穿 × 第N次 tipping 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《轻烟染日暮》: 假人设崩塌与第N次 tipping 同集兑现.
 *  - 与 frequencyMaskLink（frequency 主键）互补：本 gate 以 mask 为主键强制「有 tip 必须有 mask」.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_MASK / UNKNOWN_FREQUENCY
 *  CHILD_MASK_FAIL / CHILD_FREQUENCY_FAIL
 *  TIP_NOT_AT_REVEAL — tipEp 须等于 revealEp
 *  TIP_WITHOUT_MASK — 已 tip 无联表
 *  PENDING_MASK (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  FrequencyTippingEntrySchema,
  evaluateFrequencyTipping,
} from './frequency-tipping-gate';
import {
  PersonaMaskEntrySchema,
  evaluatePersonaMask,
} from './persona-mask-gate';

const Ep = z.number().int().positive();

export const MaskFrequencyLinkEntrySchema = z.object({
  id: z.string().min(1),
  maskId: z.string().min(1),
  frequencyId: z.string().min(1),
  note: z.string().optional(),
});

export const MaskFrequencyLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  masks: z.array(PersonaMaskEntrySchema),
  frequencies: z.array(FrequencyTippingEntrySchema),
  links: z.array(MaskFrequencyLinkEntrySchema),
});

export type MaskFrequencyLinkLedger = z.infer<typeof MaskFrequencyLinkLedgerSchema>;

export type MaskFrequencyLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_MASK'
    | 'UNKNOWN_FREQUENCY'
    | 'CHILD_MASK_FAIL'
    | 'CHILD_FREQUENCY_FAIL'
    | 'TIP_NOT_AT_REVEAL'
    | 'TIP_WITHOUT_MASK'
    | 'PENDING_MASK';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface MaskFrequencyLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    masks: number;
    frequencies: number;
    latestEp: number;
  };
  findings: MaskFrequencyLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateMaskFrequencyLink(input: unknown): MaskFrequencyLinkReport {
  const parsed = MaskFrequencyLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, masks: 0, frequencies: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, masks, frequencies, links } = parsed.data;
  const findings: MaskFrequencyLinkFinding[] = [];
  const push = (x: MaskFrequencyLinkFinding) => findings.push(x);

  const maskReport = evaluatePersonaMask({ series, latestEp, entries: masks });
  if (maskReport.verdict === 'FAIL') {
    const childFails = maskReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_MASK_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌伪装账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 persona-mask-gate',
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

  const byMask = new Map(masks.map((m) => [m.id, m]));
  const byFreq = new Map(frequencies.map((f) => [f.id, f]));
  const pairedMasks = new Set<string>();
  const pairedFreqs = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const mask = byMask.get(link.maskId);
    const freq = byFreq.get(link.frequencyId);
    if (!mask) {
      push({
        code: 'UNKNOWN_MASK',
        severity: 'FAIL',
        ids: [link.id, link.maskId],
        message: `联表 ${link.id} 引用未知 mask ${link.maskId}`,
        fix: 'maskId 须存在于 masks[]',
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
    pairedMasks.add(mask.id);
    pairedFreqs.add(freq.id);

    if (
      freq.tipEp === undefined ||
      mask.revealEp === undefined ||
      freq.tipEp !== mask.revealEp
    ) {
      push({
        code: 'TIP_NOT_AT_REVEAL',
        severity: 'FAIL',
        ids: [link.id, freq.id, mask.id],
        message: `${link.id}: tipEp=${freq.tipEp ?? '未 tip'} ≠ revealEp=${mask.revealEp ?? '未揭穿'}`,
        fix: '第N次 tipping 与伪装揭穿同集',
      });
      continue;
    }

    aligned += 1;
  }

  for (const f of frequencies) {
    if (f.tipEp !== undefined && !pairedFreqs.has(f.id)) {
      push({
        code: 'TIP_WITHOUT_MASK',
        severity: 'FAIL',
        ids: [f.id],
        message: `frequency ${f.id} tipEp=E${f.tipEp} 无 mask 联表`,
        fix: '在 links[] 挂 maskId↔frequencyId',
      });
    }
  }
  for (const m of masks) {
    if (!pairedMasks.has(m.id)) {
      push({
        code: 'PENDING_MASK',
        severity: 'WARN',
        ids: [m.id],
        message: `mask ${m.id} 尚未联表到 frequency`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      masks: masks.length,
      frequencies: frequencies.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
