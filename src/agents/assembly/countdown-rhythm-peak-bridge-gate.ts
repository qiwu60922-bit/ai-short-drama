/**
 * V12 · Countdown × Rhythm × Peak Ternary Bridge
 * (阶段倒计时 × 系列节奏 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - deadline 当集常踩对峙峰值，且节奏须过 story-rhythm 密度门.
 *  - 与 rhythmCountdownPeakBridge 互补：本 gate 以 countdown 为主键联 rhythm×peak.
 *
 * rhythms[]: { id, ep, shotSpec }
 * Per link: countdownId + rhythmId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_RHYTHM / UNKNOWN_COUNTDOWN / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_RHYTHM_FAIL / CHILD_PEAK_FAIL / BAD_COUNTDOWN_WINDOW
 *  EP_NOT_TERNARY — link.ep = rhythm.ep = deadlineEp = peakEp
 *  RHYTHM_WITHOUT_BRIDGE / DEADLINE_WITHOUT_BRIDGE / PEAK_WITHOUT_BRIDGE
 *  PENDING_COUNTDOWN (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { evaluateStoryRhythm } from './story-rhythm-gate';
import { StageCountdownSchema } from './stage-goal-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const CountdownRhythmPeakRhythmEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const CountdownRhythmPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  countdownId: z.string().min(1),
  rhythmId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const CountdownRhythmPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  countdowns: z.array(StageCountdownSchema),
  rhythms: z.array(CountdownRhythmPeakRhythmEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(CountdownRhythmPeakBridgeLinkSchema),
});

export type CountdownRhythmPeakBridgeLedger = z.infer<typeof CountdownRhythmPeakBridgeLedgerSchema>;

export type CountdownRhythmPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_RHYTHM'
    | 'UNKNOWN_COUNTDOWN'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_RHYTHM_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'BAD_COUNTDOWN_WINDOW'
    | 'EP_NOT_TERNARY'
    | 'RHYTHM_WITHOUT_BRIDGE'
    | 'DEADLINE_WITHOUT_BRIDGE'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'PENDING_COUNTDOWN';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface CountdownRhythmPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    countdowns: number;
    rhythms: number;
    peaks: number;
    latestEp: number;
  };
  findings: CountdownRhythmPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateCountdownRhythmPeakBridge(input: unknown): CountdownRhythmPeakBridgeReport {
  const parsed = CountdownRhythmPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, countdowns: 0, rhythms: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, countdowns, rhythms, peaks, links } = parsed.data;
  const findings: CountdownRhythmPeakBridgeFinding[] = [];
  const push = (x: CountdownRhythmPeakBridgeFinding) => findings.push(x);

  for (const ry of rhythms) {
    const r = evaluateStoryRhythm(ry.shotSpec);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_RHYTHM_FAIL',
        severity: 'FAIL',
        ids: [ry.id, ...childFails.flatMap((f) => f.shotIds ?? [])],
        message: `rhythm ${ry.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 story-rhythm-gate',
      });
    }
  }

  for (const cd of countdowns) {
    if (cd.deadlineEp < cd.startEp) {
      push({
        code: 'BAD_COUNTDOWN_WINDOW',
        severity: 'FAIL',
        ids: [cd.id],
        message: `countdown ${cd.id} deadlineEp=E${cd.deadlineEp} < startEp=E${cd.startEp}`,
        fix: 'deadlineEp 须 ≥ startEp',
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

  const byRy = new Map(rhythms.map((r) => [r.id, r]));
  const byCd = new Map(countdowns.map((c) => [c.id, c]));
  const byP = new Map(peaks.map((p) => [p.id, p]));
  const linkedRy = new Set<string>();
  const linkedCd = new Set<string>();
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
    const ry = byRy.get(link.rhythmId);
    if (!ry) {
      push({
        code: 'UNKNOWN_RHYTHM',
        severity: 'FAIL',
        ids: [link.id, link.rhythmId],
        message: `联表 ${link.id} 引用未知 rhythm ${link.rhythmId}`,
        fix: 'rhythmId 须存在于 rhythms[]',
      });
      continue;
    }
    const cd = byCd.get(link.countdownId);
    if (!cd) {
      push({
        code: 'UNKNOWN_COUNTDOWN',
        severity: 'FAIL',
        ids: [link.id, link.countdownId],
        message: `联表 ${link.id} 引用未知 countdown ${link.countdownId}`,
        fix: 'countdownId 须存在于 countdowns[]',
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

    if (
      peak.peakEp === undefined ||
      link.ep !== ry.ep ||
      link.ep !== cd.deadlineEp ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, ry.id, cd.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 rhythm=${ry.ep}/deadline=${cd.deadlineEp}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = rhythm.ep = deadlineEp = peakEp',
      });
      continue;
    }

    linkedRy.add(ry.id);
    linkedCd.add(cd.id);
    linkedP.add(peak.id);
    aligned += 1;
  }

  for (const ry of rhythms) {
    if (!linkedRy.has(ry.id)) {
      push({
        code: 'RHYTHM_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [ry.id],
        message: `rhythm ${ry.id} 无 rhythm×countdown×peak 桥`,
        fix: '为节奏档挂 CountdownRhythmPeakBridge',
      });
    }
  }
  for (const cd of countdowns) {
    if (!linkedCd.has(cd.id)) {
      if (cd.deadlineEp <= latestEp) {
        push({
          code: 'DEADLINE_WITHOUT_BRIDGE',
          severity: 'FAIL',
          ids: [cd.id],
          message: `countdown ${cd.id} deadlineEp=E${cd.deadlineEp} 无 rhythm×countdown×peak 桥`,
          fix: '为 deadline 挂 CountdownRhythmPeakBridge',
        });
      } else {
        push({
          code: 'PENDING_COUNTDOWN',
          severity: 'WARN',
          ids: [cd.id],
          message: `countdown ${cd.id} 尚未联表`,
          fix: '补 links[] 或确认旁路',
        });
      }
    }
  }
  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedP.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 rhythm×countdown×peak 桥`,
        fix: '为峰值集挂 CountdownRhythmPeakBridge',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      countdowns: countdowns.length,
      rhythms: rhythms.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
