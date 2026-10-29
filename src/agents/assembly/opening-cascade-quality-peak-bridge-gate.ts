/**
 * V12 · Opening-Cascade × Quality × Peak Ternary Bridge
 * (开场叠钩 × 表演门 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向开场叠钩当集须过表演门并踩对峙峰值.
 *
 * Per link: cascadeId + peakId + ep + qualityLeap.
 * cascades[]: { id, ep, shotSpec }
 *  SCHEMA / DUP_ID / UNKNOWN_CASCADE / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_CASCADE_FAIL / CHILD_PEAK_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_TERNARY — link.ep = cascade.ep = peakEp
 *  CASCADE_WITHOUT_BRIDGE / PEAK_WITHOUT_BRIDGE
 *  LOW_INTENSITY_AT_TERNARY (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { evaluateOpeningCascade } from './opening-cascade-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';
import {
  QualityLeapDocSchema,
  evaluateQualityLeap,
} from './quality-leap-gate';

const Ep = z.number().int().positive();

export const OpeningCascadeQualityPeakCascadeEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const OpeningCascadeQualityPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  cascadeId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const OpeningCascadeQualityPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minTernaryIntense: z.number().int().min(1).max(5).optional(),
  cascades: z.array(OpeningCascadeQualityPeakCascadeEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(OpeningCascadeQualityPeakBridgeLinkSchema),
});

export type OpeningCascadeQualityPeakBridgeLedger = z.infer<typeof OpeningCascadeQualityPeakBridgeLedgerSchema>;

export type OpeningCascadeQualityPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_CASCADE'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_CASCADE_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_TERNARY'
    | 'CASCADE_WITHOUT_BRIDGE'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'LOW_INTENSITY_AT_TERNARY';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface OpeningCascadeQualityPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    cascades: number;
    peaks: number;
    latestEp: number;
  };
  findings: OpeningCascadeQualityPeakBridgeFinding[];
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

export function evaluateOpeningCascadeQualityPeakBridge(input: unknown): OpeningCascadeQualityPeakBridgeReport {
  const parsed = OpeningCascadeQualityPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, cascades: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, cascades, peaks, links, minTernaryIntense = 4 } = parsed.data;
  const findings: OpeningCascadeQualityPeakBridgeFinding[] = [];
  const push = (x: OpeningCascadeQualityPeakBridgeFinding) => findings.push(x);

  for (const c of cascades) {
    const r = evaluateOpeningCascade(c.shotSpec);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_CASCADE_FAIL',
        severity: 'FAIL',
        ids: [c.id, ...childFails.flatMap((f) => f.shotIds ?? [])],
        message: `cascade ${c.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 opening-cascade-gate',
      });
    }
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

  const byC = new Map(cascades.map((c) => [c.id, c]));
  const byP = new Map(peaks.map((p) => [p.id, p]));
  const linkedC = new Set<string>();
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
    const cascade = byC.get(link.cascadeId);
    if (!cascade) {
      push({
        code: 'UNKNOWN_CASCADE',
        severity: 'FAIL',
        ids: [link.id, link.cascadeId],
        message: `联表 ${link.id} 引用未知 cascade ${link.cascadeId}`,
        fix: 'cascadeId 须存在于 cascades[]',
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
      peak.peakEp === undefined ||
      link.ep !== cascade.ep ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, cascade.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 cascade=${cascade.ep}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = cascade.ep = peakEp',
      });
      continue;
    }

    const intense = maxIntensity(link.qualityLeap);
    if (intense < minTernaryIntense) {
      push({
        code: 'LOW_INTENSITY_AT_TERNARY',
        severity: 'WARN',
        ids: [link.id, cascade.id, peak.id],
        message: `${link.id}: max intensity=${intense} < minTernaryIntense=${minTernaryIntense}`,
        fix: '提高表演 intensity 或下调 minTernaryIntense',
      });
    }

    linkedC.add(cascade.id);
    linkedP.add(peak.id);
    aligned += 1;
  }

  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedP.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 openingCascade×quality×peak 桥`,
        fix: '为峰值集挂 OpeningCascadeQualityPeakBridge',
      });
    }
  }
  for (const c of cascades) {
    if (!linkedC.has(c.id)) {
      push({
        code: 'CASCADE_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [c.id],
        message: `cascade ${c.id} 未挂 openingCascade×quality×peak 桥`,
        fix: '在 links[] 挂 cascadeId + peakId + qualityLeap',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      cascades: cascades.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
