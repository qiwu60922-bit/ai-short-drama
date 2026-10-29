/**
 * V12 · Frequency × Cliff-Cascade Link Gate (第N次 tipping × 跨集悬念叠钩 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《轻烟染日暮》: 第N次 tipping 常踩下集 hook 承接窗，避免软重置.
 *  - frequency-tipping 管 tipEp；cliff-cascade 管 prev→next——本 gate 硬联表 tip@nextEp.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_FREQUENCY / UNKNOWN_CLIFF / FUTURE_EP
 *  CHILD_FREQUENCY_FAIL / CHILD_CASCADE_FAIL
 *  EP_NOT_TIP_NEXT — link.ep = tipEp = cliff.nextEp
 *  TIP_WITHOUT_CLIFF / CLIFF_WITHOUT_FREQUENCY
 *  PENDING_FREQUENCY (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  FrequencyTippingEntrySchema,
  evaluateFrequencyTipping,
} from './frequency-tipping-gate';
import {
  CliffCascadeLinkEntrySchema,
  evaluateCliffCascadeLink,
} from './cliff-cascade-link-gate';

const Ep = z.number().int().positive();

export const FrequencyCliffLinkEntrySchema = z.object({
  id: z.string().min(1),
  frequencyId: z.string().min(1),
  cliffLinkId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const FrequencyCliffLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  frequencies: z.array(FrequencyTippingEntrySchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  links: z.array(FrequencyCliffLinkEntrySchema),
});

export type FrequencyCliffLinkLedger = z.infer<typeof FrequencyCliffLinkLedgerSchema>;

export type FrequencyCliffLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_FREQUENCY'
    | 'UNKNOWN_CLIFF'
    | 'FUTURE_EP'
    | 'CHILD_FREQUENCY_FAIL'
    | 'CHILD_CASCADE_FAIL'
    | 'EP_NOT_TIP_NEXT'
    | 'TIP_WITHOUT_CLIFF'
    | 'CLIFF_WITHOUT_FREQUENCY'
    | 'PENDING_FREQUENCY';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface FrequencyCliffLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    frequencies: number;
    cliffLinks: number;
    latestEp: number;
  };
  findings: FrequencyCliffLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateFrequencyCliffLink(input: unknown): FrequencyCliffLinkReport {
  const parsed = FrequencyCliffLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, frequencies: 0, cliffLinks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, frequencies, cliffLinks, links } = parsed.data;
  const findings: FrequencyCliffLinkFinding[] = [];
  const push = (x: FrequencyCliffLinkFinding) => findings.push(x);

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

  if (cliffLinks.length) {
    const cascade = evaluateCliffCascadeLink({ series, latestEp, links: cliffLinks });
    if (cascade.verdict === 'FAIL') {
      const childFails = cascade.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_CASCADE_FAIL',
        severity: 'FAIL',
        ids: childFails.flatMap((f) => f.ids ?? []),
        message: `内嵌 cliffCascade FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 cliff-cascade-link-gate',
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

  const byF = new Map(frequencies.map((f) => [f.id, f]));
  const byCliff = new Map(cliffLinks.map((c) => [c.id, c]));
  const pairedF = new Set<string>();
  const pairedC = new Set<string>();
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
    const freq = byF.get(link.frequencyId);
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
    const cliff = byCliff.get(link.cliffLinkId);
    if (!cliff) {
      push({
        code: 'UNKNOWN_CLIFF',
        severity: 'FAIL',
        ids: [link.id, link.cliffLinkId],
        message: `联表 ${link.id} 引用未知 cliff ${link.cliffLinkId}`,
        fix: 'cliffLinkId 须存在于 cliffLinks[]',
      });
      continue;
    }

    if (
      freq.tipEp === undefined ||
      link.ep !== freq.tipEp ||
      link.ep !== cliff.nextEp
    ) {
      push({
        code: 'EP_NOT_TIP_NEXT',
        severity: 'FAIL',
        ids: [link.id, freq.id, cliff.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 tip=${freq.tipEp ?? '无'}/nextEp=${cliff.nextEp}`,
        fix: 'tipping 须踩 cliff.nextEp',
      });
      continue;
    }

    pairedF.add(freq.id);
    pairedC.add(cliff.id);
    aligned += 1;
  }

  for (const f of frequencies) {
    if (f.tipEp !== undefined && !pairedF.has(f.id)) {
      push({
        code: 'TIP_WITHOUT_CLIFF',
        severity: 'FAIL',
        ids: [f.id],
        message: `frequency ${f.id} tipEp=E${f.tipEp} 无 cliff 联表`,
        fix: '为 tipping 集挂 FrequencyCliffLink',
      });
    } else if (!pairedF.has(f.id)) {
      push({
        code: 'PENDING_FREQUENCY',
        severity: 'WARN',
        ids: [f.id],
        message: `frequency ${f.id} 尚未联表到 cliff`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const cliff of cliffLinks) {
    if (!pairedC.has(cliff.id)) {
      push({
        code: 'CLIFF_WITHOUT_FREQUENCY',
        severity: 'FAIL',
        ids: [cliff.id],
        message: `cliff ${cliff.id} nextEp=E${cliff.nextEp} 无 frequency 联表`,
        fix: '在 links[] 挂 frequencyId↔cliffLinkId',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      frequencies: frequencies.length,
      cliffLinks: cliffLinks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
