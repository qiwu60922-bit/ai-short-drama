/**
 * V12 · Motif × Peak-Before-Payoff Link Gate (视觉母题 × 巅峰兑现 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《盛夏芬德拉》: 白玫瑰 payoff 镜须踩对峙/关系巅峰窗.
 *  - motif-callback 管 appearance；peak-before-payoff 管巅峰——本 gate 硬对齐.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_MOTIF / UNKNOWN_PEAK
 *  CHILD_MOTIF_FAIL / CHILD_PEAK_FAIL
 *  NO_MOTIF_AT_PEAK — peakEp 须有 appearance
 *  PEAK_WITHOUT_MOTIF — peak 无联表
 *  PENDING_MOTIF (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  MotifEntrySchema,
  MotifAppearanceSchema,
  evaluateMotifCallbacks,
} from './motif-callback-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const MotifPeakLinkEntrySchema = z.object({
  id: z.string().min(1),
  motifId: z.string().min(1),
  peakId: z.string().min(1),
  note: z.string().optional(),
});

export const MotifPeakLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(MotifPeakLinkEntrySchema),
});

export type MotifPeakLinkLedger = z.infer<typeof MotifPeakLinkLedgerSchema>;

export type MotifPeakLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_MOTIF'
    | 'UNKNOWN_PEAK'
    | 'CHILD_MOTIF_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'NO_MOTIF_AT_PEAK'
    | 'PEAK_WITHOUT_MOTIF'
    | 'PENDING_MOTIF';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface MotifPeakLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    motifs: number;
    peaks: number;
    latestEp: number;
  };
  findings: MotifPeakLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateMotifPeakLink(input: unknown): MotifPeakLinkReport {
  const parsed = MotifPeakLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, motifs: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, motifs, appearances, peaks, links } = parsed.data;
  const findings: MotifPeakLinkFinding[] = [];
  const push = (x: MotifPeakLinkFinding) => findings.push(x);

  const motifReport = evaluateMotifCallbacks({ series, latestEp, motifs, appearances });
  if (motifReport.verdict === 'FAIL') {
    const childFails = motifReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_MOTIF_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌母题账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 motif-callback-gate',
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

  const byMotif = new Map(motifs.map((m) => [m.id, m]));
  const byPeak = new Map(peaks.map((p) => [p.id, p]));
  const pairedPeaks = new Set<string>();
  const pairedMotifs = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const motif = byMotif.get(link.motifId);
    const peak = byPeak.get(link.peakId);
    if (!motif) {
      push({
        code: 'UNKNOWN_MOTIF',
        severity: 'FAIL',
        ids: [link.id, link.motifId],
        message: `联表 ${link.id} 引用未知 motif ${link.motifId}`,
        fix: 'motifId 须存在于 motifs[]',
      });
      continue;
    }
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
    pairedPeaks.add(peak.id);
    pairedMotifs.add(motif.id);

    if (peak.peakEp === undefined || !appearances.some((a) => a.motifId === motif.id && a.ep === peak.peakEp)) {
      push({
        code: 'NO_MOTIF_AT_PEAK',
        severity: 'FAIL',
        ids: [link.id, motif.id, peak.id],
        message: `${link.id}: motif ${motif.id} 在 peakEp=${peak.peakEp ?? '无'} 无 appearance`,
        fix: '巅峰集须有母题回扣镜',
      });
      continue;
    }

    aligned += 1;
  }

  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !pairedPeaks.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_MOTIF',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 motif 联表`,
        fix: '在 links[] 挂 motifId↔peakId',
      });
    }
  }
  for (const m of motifs) {
    if (!pairedMotifs.has(m.id)) {
      push({
        code: 'PENDING_MOTIF',
        severity: 'WARN',
        ids: [m.id],
        message: `motif ${m.id} 尚未联表到 peak`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      motifs: motifs.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
