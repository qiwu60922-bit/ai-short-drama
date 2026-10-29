/**
 * V12 · Vest × Quality × Peak Ternary Bridge
 * (马甲掉落 × 表演门 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《机长先生》: 掉马甲镜须过表演/情绪门，并踩对峙峰值.
 *  - vestQualityLink / vestPeakLink 已各自联表——本 gate 硬对齐同 ep 三元同框.
 *
 * Per link: vestId + peakId + ep + qualityLeap.
 *  SCHEMA / DUP_ID / UNKNOWN_VEST / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_VEST_FAIL / CHILD_PEAK_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_TERNARY — link.ep = dropEp = peakEp
 *  DROP_WITHOUT_BRIDGE / PEAK_WITHOUT_BRIDGE
 *  PENDING_VEST (WARN) / LOW_INTENSITY_AT_TERNARY (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  IdentityVestEntrySchema,
  evaluateIdentityVest,
} from './identity-vest-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';
import {
  QualityLeapDocSchema,
  evaluateQualityLeap,
} from './quality-leap-gate';

const Ep = z.number().int().positive();

export const VestQualityPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  vestId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const VestQualityPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minTernaryIntense: z.number().int().min(1).max(5).optional(),
  vests: z.array(IdentityVestEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(VestQualityPeakBridgeLinkSchema),
});

export type VestQualityPeakBridgeLedger = z.infer<typeof VestQualityPeakBridgeLedgerSchema>;

export type VestQualityPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_VEST'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_VEST_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_TERNARY'
    | 'DROP_WITHOUT_BRIDGE'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'PENDING_VEST'
    | 'LOW_INTENSITY_AT_TERNARY';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface VestQualityPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    vests: number;
    peaks: number;
    latestEp: number;
  };
  findings: VestQualityPeakBridgeFinding[];
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

export function evaluateVestQualityPeakBridge(input: unknown): VestQualityPeakBridgeReport {
  const parsed = VestQualityPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, vests: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, vests, peaks, links, minTernaryIntense = 4 } = parsed.data;
  const findings: VestQualityPeakBridgeFinding[] = [];
  const push = (x: VestQualityPeakBridgeFinding) => findings.push(x);

  const vReport = evaluateIdentityVest({ series, latestEp, entries: vests });
  if (vReport.verdict === 'FAIL') {
    const childFails = vReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_VEST_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌马甲账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 identity-vest-gate',
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

  const byV = new Map(vests.map((v) => [v.id, v]));
  const byP = new Map(peaks.map((p) => [p.id, p]));
  const linkedV = new Set<string>();
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
    const vest = byV.get(link.vestId);
    if (!vest) {
      push({
        code: 'UNKNOWN_VEST',
        severity: 'FAIL',
        ids: [link.id, link.vestId],
        message: `联表 ${link.id} 引用未知 vest ${link.vestId}`,
        fix: 'vestId 须存在于 vests[]',
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

    const ql = evaluateQualityLeap(link.qualityLeap);
    if (ql.verdict === 'FAIL') {
      const childFails = ql.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_QUALITY_FAIL',
        severity: 'FAIL',
        ids: [link.id, ...childFails.flatMap((f) => f.ids ?? [])],
        message: `内嵌表演门 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 quality-leap-gate',
      });
      continue;
    }

    if (
      vest.dropEp === undefined ||
      peak.peakEp === undefined ||
      link.ep !== vest.dropEp ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, vest.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 drop=${vest.dropEp ?? '无'}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = dropEp = peakEp',
      });
      continue;
    }

    const intense = maxIntensity(link.qualityLeap);
    if (intense < minTernaryIntense) {
      push({
        code: 'LOW_INTENSITY_AT_TERNARY',
        severity: 'WARN',
        ids: [link.id],
        message: `${link.id}: ternary 镜 max intensity=${intense} < ${minTernaryIntense}`,
        fix: '抬高 drop/peak 镜 intensity',
      });
    }

    linkedV.add(vest.id);
    linkedP.add(peak.id);
    aligned += 1;
  }

  for (const v of vests) {
    if (v.dropEp !== undefined && !linkedV.has(v.id)) {
      push({
        code: 'DROP_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [v.id],
        message: `vest ${v.id} dropEp=E${v.dropEp} 无 vest×quality×peak 桥`,
        fix: '为掉马甲集挂 VestQualityPeakBridge',
      });
    } else if (!linkedV.has(v.id)) {
      push({
        code: 'PENDING_VEST',
        severity: 'WARN',
        ids: [v.id],
        message: `vest ${v.id} 尚未联表到 vest×quality×peak 桥`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedP.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 vest×quality×peak 桥`,
        fix: '为峰值集挂 VestQualityPeakBridge',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      vests: vests.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
