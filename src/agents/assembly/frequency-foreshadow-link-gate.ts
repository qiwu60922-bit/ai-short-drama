/**
 * V12 · Frequency × Foreshadow Link Gate (第N次 tipping × 伏笔兑现 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《一块钱硬币》: tipping 常与 S/A 伏笔 payoff 同集.
 *  - 与 foreshadowFrequencyLink（若有）互补：本 gate 以 frequency 为主键硬对齐.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_FREQUENCY / UNKNOWN_FORESHADOW / FUTURE_EP
 *  CHILD_FREQUENCY_FAIL / CHILD_FORESHADOW_FAIL
 *  EP_NOT_TIP_PAYOFF — link.ep = tipEp = payoffEp
 *  TIP_WITHOUT_FORESHADOW / PAYOFF_WITHOUT_FREQUENCY
 *  PENDING_FREQUENCY / PENDING_FORESHADOW (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
} from './foreshadow-ledger-gate';
import {
  FrequencyTippingEntrySchema,
  evaluateFrequencyTipping,
} from './frequency-tipping-gate';

const Ep = z.number().int().positive();

export const FrequencyForeshadowLinkEntrySchema = z.object({
  id: z.string().min(1),
  frequencyId: z.string().min(1),
  foreshadowId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const FrequencyForeshadowLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  frequencies: z.array(FrequencyTippingEntrySchema),
  items: z.array(ForeshadowItemSchema),
  links: z.array(FrequencyForeshadowLinkEntrySchema),
});

export type FrequencyForeshadowLinkLedger = z.infer<typeof FrequencyForeshadowLinkLedgerSchema>;

export type FrequencyForeshadowLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_FREQUENCY'
    | 'UNKNOWN_FORESHADOW'
    | 'FUTURE_EP'
    | 'CHILD_FREQUENCY_FAIL'
    | 'CHILD_FORESHADOW_FAIL'
    | 'EP_NOT_TIP_PAYOFF'
    | 'TIP_WITHOUT_FORESHADOW'
    | 'PAYOFF_WITHOUT_FREQUENCY'
    | 'PENDING_FREQUENCY'
    | 'PENDING_FORESHADOW';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface FrequencyForeshadowLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    frequencies: number;
    items: number;
    latestEp: number;
  };
  findings: FrequencyForeshadowLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateFrequencyForeshadowLink(input: unknown): FrequencyForeshadowLinkReport {
  const parsed = FrequencyForeshadowLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, frequencies: 0, items: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, frequencies, items, links } = parsed.data;
  const findings: FrequencyForeshadowLinkFinding[] = [];
  const push = (x: FrequencyForeshadowLinkFinding) => findings.push(x);

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

  const fsReport = evaluateForeshadowLedger({ series, latestEp, items });
  if (fsReport.verdict === 'FAIL') {
    const childFails = fsReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_FORESHADOW_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌伏笔账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 foreshadow-ledger-gate',
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

  const byF = new Map(frequencies.map((f) => [f.id, f]));
  const byItem = new Map(items.map((it) => [it.id, it]));
  const pairedF = new Set<string>();
  const pairedItems = new Set<string>();
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
    const item = byItem.get(link.foreshadowId);
    if (!item) {
      push({
        code: 'UNKNOWN_FORESHADOW',
        severity: 'FAIL',
        ids: [link.id, link.foreshadowId],
        message: `联表 ${link.id} 引用未知 foreshadow ${link.foreshadowId}`,
        fix: 'foreshadowId 须存在于 items[]',
      });
      continue;
    }

    if (
      freq.tipEp === undefined ||
      item.payoffEp === undefined ||
      link.ep !== freq.tipEp ||
      link.ep !== item.payoffEp
    ) {
      push({
        code: 'EP_NOT_TIP_PAYOFF',
        severity: 'FAIL',
        ids: [link.id, freq.id, item.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 tip=${freq.tipEp ?? '无'}/fs=${item.payoffEp ?? '无'}`,
        fix: 'tipping 须踩伏笔 payoff 同集',
      });
      continue;
    }

    pairedF.add(freq.id);
    pairedItems.add(item.id);
    aligned += 1;
  }

  for (const f of frequencies) {
    if (f.tipEp !== undefined && !pairedF.has(f.id)) {
      push({
        code: 'TIP_WITHOUT_FORESHADOW',
        severity: 'FAIL',
        ids: [f.id],
        message: `frequency ${f.id} tipEp=E${f.tipEp} 无 foreshadow 联表`,
        fix: '为 tipping 集挂 FrequencyForeshadowLink',
      });
    } else if (!pairedF.has(f.id)) {
      push({
        code: 'PENDING_FREQUENCY',
        severity: 'WARN',
        ids: [f.id],
        message: `frequency ${f.id} 尚未联表到 foreshadow`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const it of items) {
    if (it.payoffEp !== undefined && !pairedItems.has(it.id)) {
      push({
        code: 'PAYOFF_WITHOUT_FREQUENCY',
        severity: 'FAIL',
        ids: [it.id],
        message: `foreshadow ${it.id} payoffEp=E${it.payoffEp} 无 frequency 联表`,
        fix: '为伏笔兑现集挂 FrequencyForeshadowLink',
      });
    } else if (!pairedItems.has(it.id)) {
      push({
        code: 'PENDING_FORESHADOW',
        severity: 'WARN',
        ids: [it.id],
        message: `foreshadow ${it.id} 尚未联表到 frequency`,
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
      items: items.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
