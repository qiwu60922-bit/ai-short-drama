/**
 * V12 · Amnesia × Quality × Peak Ternary Bridge
 * (失忆唤回 × 表演门 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 唤回 recover 镜须过表演门，并踩对峙峰值.
 *  - 与 qualityAmnesiaPeakBridge 互补：本 gate 以 amnesia 为主键命名.
 *
 * Per link: amnesiaId + peakId + ep + qualityLeap.
 *  SCHEMA / DUP_ID / UNKNOWN_AMNESIA / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_AMNESIA_FAIL / CHILD_PEAK_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_TERNARY — link.ep = recoverEp = peakEp
 *  RECOVER_WITHOUT_BRIDGE / PEAK_WITHOUT_BRIDGE
 *  PENDING_AMNESIA (WARN) / LOW_INTENSITY_AT_TERNARY (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  AmnesiaArcEntrySchema,
  evaluateAmnesiaArc,
} from './amnesia-arc-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';
import {
  QualityLeapDocSchema,
  evaluateQualityLeap,
} from './quality-leap-gate';

const Ep = z.number().int().positive();

export const AmnesiaQualityPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  amnesiaId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const AmnesiaQualityPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minTernaryIntense: z.number().int().min(1).max(5).optional(),
  amnesias: z.array(AmnesiaArcEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AmnesiaQualityPeakBridgeLinkSchema),
});

export type AmnesiaQualityPeakBridgeLedger = z.infer<typeof AmnesiaQualityPeakBridgeLedgerSchema>;

export type AmnesiaQualityPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_AMNESIA'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_AMNESIA_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_TERNARY'
    | 'RECOVER_WITHOUT_BRIDGE'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'PENDING_AMNESIA'
    | 'LOW_INTENSITY_AT_TERNARY';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AmnesiaQualityPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    amnesias: number;
    peaks: number;
    latestEp: number;
  };
  findings: AmnesiaQualityPeakBridgeFinding[];
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

export function evaluateAmnesiaQualityPeakBridge(input: unknown): AmnesiaQualityPeakBridgeReport {
  const parsed = AmnesiaQualityPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, amnesias: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, amnesias, peaks, links, minTernaryIntense = 4 } = parsed.data;
  const findings: AmnesiaQualityPeakBridgeFinding[] = [];
  const push = (x: AmnesiaQualityPeakBridgeFinding) => findings.push(x);

  const aReport = evaluateAmnesiaArc({ series, latestEp, entries: amnesias });
  if (aReport.verdict === 'FAIL') {
    const childFails = aReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_AMNESIA_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌失忆账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 amnesia-arc-gate',
    });
  }

  const pReport = evaluatePeakBeforePayoff({ series, latestEp, entries: peaks });
  if (pReport.verdict === 'FAIL') {
    const childFails = pReport.findings.filter((f) => f.severity === 'FAIL');
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

  const byA = new Map(amnesias.map((a) => [a.id, a]));
  const byP = new Map(peaks.map((p) => [p.id, p]));
  const linkedA = new Set<string>();
  const linkedP = new Set<string>();
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
    const amnesia = byA.get(link.amnesiaId);
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
    const peak = byP.get(link.peakId);
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

    const qReport = evaluateQualityLeap(link.qualityLeap);
    if (qReport.verdict === 'FAIL') {
      const childFails = qReport.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_QUALITY_FAIL',
        severity: 'FAIL',
        ids: [link.id, ...(childFails.map((f) => f.shotId).filter(Boolean) as string[])],
        message: `联表 ${link.id} qualityLeap FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 quality-leap-gate',
      });
      continue;
    }

    if (
      amnesia.recoverEp === undefined ||
      peak.peakEp === undefined ||
      link.ep !== amnesia.recoverEp ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, amnesia.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 recover=${amnesia.recoverEp ?? '无'}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = recoverEp = peakEp',
      });
      continue;
    }

    const intense = maxIntensity(link.qualityLeap);
    if (intense < minTernaryIntense) {
      push({
        code: 'LOW_INTENSITY_AT_TERNARY',
        severity: 'WARN',
        ids: [link.id, amnesia.id, peak.id],
        message: `${link.id}: max intensity=${intense} < minTernaryIntense=${minTernaryIntense}`,
        fix: '提高表演 intensity 或下调 minTernaryIntense',
      });
    }

    linkedA.add(amnesia.id);
    linkedP.add(peak.id);
    aligned += 1;
  }

  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedP.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 amnesia×quality×peak 桥`,
        fix: '为峰值集挂 AmnesiaQualityPeakBridge',
      });
    }
  }
  for (const a of amnesias) {
    if (a.recoverEp !== undefined && !linkedA.has(a.id)) {
      push({
        code: 'RECOVER_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [a.id],
        message: `amnesia ${a.id} recoverEp=E${a.recoverEp} 无 amnesia×quality×peak 桥`,
        fix: '在 links[] 挂 amnesiaId + peakId + qualityLeap',
      });
    } else if (!linkedA.has(a.id)) {
      push({
        code: 'PENDING_AMNESIA',
        severity: 'WARN',
        ids: [a.id],
        message: `amnesia ${a.id} 尚未联表到 quality×peak`,
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
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
