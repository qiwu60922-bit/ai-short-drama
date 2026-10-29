/**
 * V12 · Frequency × Persona-Mask Link Gate (第N次 tipping × 伪装揭穿 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《轻烟染日暮》: 第N次 tipping 与假人设崩塌同集兑现.
 *  - frequency-tipping 管 tip；persona-mask 管 reveal——本 gate 硬对齐 tipEp=revealEp.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_FREQUENCY / UNKNOWN_MASK
 *  CHILD_FREQUENCY_FAIL / CHILD_MASK_FAIL
 *  TIP_NOT_AT_REVEAL — tipEp 须等于 revealEp
 *  REVEAL_WITHOUT_FREQUENCY — 已 reveal 无联表
 *  PENDING_FREQUENCY (WARN)
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

export const FrequencyMaskLinkEntrySchema = z.object({
  id: z.string().min(1),
  frequencyId: z.string().min(1),
  maskId: z.string().min(1),
  note: z.string().optional(),
});

export const FrequencyMaskLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  frequencies: z.array(FrequencyTippingEntrySchema),
  masks: z.array(PersonaMaskEntrySchema),
  links: z.array(FrequencyMaskLinkEntrySchema),
});

export type FrequencyMaskLinkLedger = z.infer<typeof FrequencyMaskLinkLedgerSchema>;

export type FrequencyMaskLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_FREQUENCY'
    | 'UNKNOWN_MASK'
    | 'CHILD_FREQUENCY_FAIL'
    | 'CHILD_MASK_FAIL'
    | 'TIP_NOT_AT_REVEAL'
    | 'REVEAL_WITHOUT_FREQUENCY'
    | 'PENDING_FREQUENCY';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface FrequencyMaskLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    frequencies: number;
    masks: number;
    latestEp: number;
  };
  findings: FrequencyMaskLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateFrequencyMaskLink(input: unknown): FrequencyMaskLinkReport {
  const parsed = FrequencyMaskLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, frequencies: 0, masks: 0, latestEp: 0 },
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

  const { series, latestEp, frequencies, masks, links } = parsed.data;
  const findings: FrequencyMaskLinkFinding[] = [];
  const push = (x: FrequencyMaskLinkFinding) => findings.push(x);

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
      message: `联表ID重复：${id}`,
      fix: '联表 id 须唯一',
    });
  }

  const byFreq = new Map(frequencies.map((f) => [f.id, f]));
  const byMask = new Map(masks.map((m) => [m.id, m]));
  const pairedMasks = new Set<string>();
  const pairedFreqs = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const freq = byFreq.get(link.frequencyId);
    const mask = byMask.get(link.maskId);
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

  for (const mask of masks) {
    if (mask.revealEp !== undefined && !pairedMasks.has(mask.id)) {
      push({
        code: 'REVEAL_WITHOUT_FREQUENCY',
        severity: 'FAIL',
        ids: [mask.id],
        message: `mask ${mask.id} revealEp=E${mask.revealEp} 无 frequency 联表`,
        fix: '在 links[] 挂 frequencyId↔maskId',
      });
    }
  }

  for (const f of frequencies) {
    if (!pairedFreqs.has(f.id)) {
      push({
        code: 'PENDING_FREQUENCY',
        severity: 'WARN',
        ids: [f.id],
        message: `frequency ${f.id} 尚未联表到 mask`,
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
      masks: masks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
