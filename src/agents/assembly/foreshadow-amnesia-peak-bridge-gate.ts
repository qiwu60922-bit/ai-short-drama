/**
 * V12 · Foreshadow × Amnesia × Peak Ternary Bridge
 * (伏笔兑现 × 失忆唤回 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《反派拿捏》/《帐中香》: S/A 伏笔 payoff 常与失忆唤回、对峙峰值同拍.
 *  - foreshadowAmnesiaLink / foreshadowPeakLink 已各自联表——本 gate 硬对齐同 ep 三元同框.
 *
 * Per link: foreshadowId + amnesiaId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_FORESHADOW / UNKNOWN_AMNESIA / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_FORESHADOW_FAIL / CHILD_AMNESIA_FAIL / CHILD_PEAK_FAIL
 *  EP_NOT_TERNARY — link.ep = item.payoffEp = recoverEp = peakEp
 *  PEAK_WITHOUT_BRIDGE / PAYOFF_WITHOUT_BRIDGE / RECOVER_WITHOUT_BRIDGE
 *  PENDING_FORESHADOW / PENDING_AMNESIA (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
} from './foreshadow-ledger-gate';
import {
  AmnesiaArcEntrySchema,
  evaluateAmnesiaArc,
} from './amnesia-arc-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const ForeshadowAmnesiaPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  foreshadowId: z.string().min(1),
  amnesiaId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const ForeshadowAmnesiaPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  items: z.array(ForeshadowItemSchema),
  amnesias: z.array(AmnesiaArcEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(ForeshadowAmnesiaPeakBridgeLinkSchema),
});

export type ForeshadowAmnesiaPeakBridgeLedger = z.infer<typeof ForeshadowAmnesiaPeakBridgeLedgerSchema>;

export type ForeshadowAmnesiaPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_FORESHADOW'
    | 'UNKNOWN_AMNESIA'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_FORESHADOW_FAIL'
    | 'CHILD_AMNESIA_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'EP_NOT_TERNARY'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'PAYOFF_WITHOUT_BRIDGE'
    | 'RECOVER_WITHOUT_BRIDGE'
    | 'PENDING_FORESHADOW'
    | 'PENDING_AMNESIA';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface ForeshadowAmnesiaPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    items: number;
    amnesias: number;
    peaks: number;
    latestEp: number;
  };
  findings: ForeshadowAmnesiaPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateForeshadowAmnesiaPeakBridge(input: unknown): ForeshadowAmnesiaPeakBridgeReport {
  const parsed = ForeshadowAmnesiaPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, items: 0, amnesias: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, items, amnesias, peaks, links } = parsed.data;
  const findings: ForeshadowAmnesiaPeakBridgeFinding[] = [];
  const push = (x: ForeshadowAmnesiaPeakBridgeFinding) => findings.push(x);

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

  const peakReport = evaluatePeakBeforePayoff({ series, latestEp, entries: peaks });
  if (peakReport.verdict === 'FAIL') {
    const childFails = peakReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_PEAK_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌峰值账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 peak-before-payoff-gate',
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

  const byItem = new Map(items.map((it) => [it.id, it]));
  const byAm = new Map(amnesias.map((a) => [a.id, a]));
  const byPeak = new Map(peaks.map((p) => [p.id, p]));
  const linkedItems = new Set<string>();
  const linkedAm = new Set<string>();
  const linkedPeaks = new Set<string>();
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
    const amnesia = byAm.get(link.amnesiaId);
    if (!amnesia) {
      push({
        code: 'UNKNOWN_AMNESIA',
        severity: 'FAIL',
        ids: [link.id, link.amnesiaId],
        message: `联表 ${link.id} 引用未知 amnesia ${link.amnesiaId}`,
        fix: 'amnesiaId 须存在于 amnesias[]',
      });
      continue;
    }
    const peak = byPeak.get(link.peakId);
    if (!peak) {
      push({
        code: 'UNKNOWN_PEAK',
        severity: 'FAIL',
        ids: [link.id, link.peakId],
        message: `联表 ${link.id} 引用未知 peak ${link.peakId}`,
        fix: 'peakId 须存在于 peaks[]',
      });
      continue;
    }

    if (
      item.payoffEp === undefined ||
      amnesia.recoverEp === undefined ||
      peak.peakEp === undefined ||
      link.ep !== item.payoffEp ||
      link.ep !== amnesia.recoverEp ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, item.id, amnesia.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 fs=${item.payoffEp ?? '无'}/recover=${amnesia.recoverEp ?? '无'}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = item.payoffEp = recoverEp = peakEp',
      });
      continue;
    }

    linkedItems.add(item.id);
    linkedAm.add(amnesia.id);
    linkedPeaks.add(peak.id);
    aligned += 1;
  }

  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedPeaks.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 foreshadow×amnesia×peak 桥`,
        fix: '为峰值集挂 ForeshadowAmnesiaPeakBridge',
      });
    }
  }
  for (const it of items) {
    if (it.payoffEp !== undefined && !linkedItems.has(it.id)) {
      push({
        code: 'PAYOFF_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [it.id],
        message: `foreshadow ${it.id} payoffEp=E${it.payoffEp} 无 foreshadow×amnesia×peak 桥`,
        fix: '为伏笔兑现集挂 ForeshadowAmnesiaPeakBridge',
      });
    } else if (!linkedItems.has(it.id)) {
      push({
        code: 'PENDING_FORESHADOW',
        severity: 'WARN',
        ids: [it.id],
        message: `foreshadow ${it.id} 尚未联表到 foreshadow×amnesia×peak 桥`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const am of amnesias) {
    if (am.recoverEp !== undefined && !linkedAm.has(am.id)) {
      push({
        code: 'RECOVER_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [am.id],
        message: `amnesia ${am.id} recoverEp=E${am.recoverEp} 无 foreshadow×amnesia×peak 桥`,
        fix: '为唤回集挂 ForeshadowAmnesiaPeakBridge',
      });
    } else if (!linkedAm.has(am.id)) {
      push({
        code: 'PENDING_AMNESIA',
        severity: 'WARN',
        ids: [am.id],
        message: `amnesia ${am.id} 尚未联表到 foreshadow×amnesia×peak 桥`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      items: items.length,
      amnesias: amnesias.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
