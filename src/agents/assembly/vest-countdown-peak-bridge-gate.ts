/**
 * V12 · Vest × Countdown × Peak Ternary Bridge
 * (马甲掉落 × 阶段倒计时 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - deadline 当集常与掉马甲、对峙峰值同拍.
 *  - 与 maskCountdownPeakBridge 互补：本 gate 以 vest 为主键硬对齐同 ep 三元同框.
 *
 * Per link: countdownId + vestId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_COUNTDOWN / UNKNOWN_VEST / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_VEST_FAIL / CHILD_PEAK_FAIL / BAD_COUNTDOWN_WINDOW
 *  EP_NOT_TERNARY — link.ep = deadlineEp = dropEp = peakEp
 *  DEADLINE_WITHOUT_BRIDGE / DROP_WITHOUT_BRIDGE / PEAK_WITHOUT_BRIDGE
 *  PENDING_COUNTDOWN / PENDING_VEST (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { StageCountdownSchema } from './stage-goal-gate';
import {
  IdentityVestEntrySchema,
  evaluateIdentityVest,
} from './identity-vest-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const VestCountdownPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  countdownId: z.string().min(1),
  vestId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const VestCountdownPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  countdowns: z.array(StageCountdownSchema),
  vests: z.array(IdentityVestEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(VestCountdownPeakBridgeLinkSchema),
});

export type VestCountdownPeakBridgeLedger = z.infer<typeof VestCountdownPeakBridgeLedgerSchema>;

export type VestCountdownPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_COUNTDOWN'
    | 'UNKNOWN_VEST'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_VEST_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'BAD_COUNTDOWN_WINDOW'
    | 'EP_NOT_TERNARY'
    | 'DEADLINE_WITHOUT_BRIDGE'
    | 'DROP_WITHOUT_BRIDGE'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'PENDING_COUNTDOWN'
    | 'PENDING_VEST';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface VestCountdownPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    countdowns: number;
    vests: number;
    peaks: number;
    latestEp: number;
  };
  findings: VestCountdownPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateVestCountdownPeakBridge(input: unknown): VestCountdownPeakBridgeReport {
  const parsed = VestCountdownPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, countdowns: 0, vests: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, countdowns, vests, peaks, links } = parsed.data;
  const findings: VestCountdownPeakBridgeFinding[] = [];
  const push = (x: VestCountdownPeakBridgeFinding) => findings.push(x);

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

  const byCd = new Map(countdowns.map((c) => [c.id, c]));
  const byV = new Map(vests.map((v) => [v.id, v]));
  const byP = new Map(peaks.map((p) => [p.id, p]));
  const linkedCd = new Set<string>();
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

    if (
      vest.dropEp === undefined ||
      peak.peakEp === undefined ||
      link.ep !== cd.deadlineEp ||
      link.ep !== vest.dropEp ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, cd.id, vest.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 deadline=${cd.deadlineEp}/drop=${vest.dropEp ?? '无'}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = deadlineEp = dropEp = peakEp',
      });
      continue;
    }

    linkedCd.add(cd.id);
    linkedV.add(vest.id);
    linkedP.add(peak.id);
    aligned += 1;
  }

  for (const cd of countdowns) {
    if (!linkedCd.has(cd.id)) {
      if (cd.deadlineEp <= latestEp) {
        push({
          code: 'DEADLINE_WITHOUT_BRIDGE',
          severity: 'FAIL',
          ids: [cd.id],
          message: `countdown ${cd.id} deadlineEp=E${cd.deadlineEp} 无 countdown×vest×peak 桥`,
          fix: '为 deadline 挂 VestCountdownPeakBridge',
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
  for (const vest of vests) {
    if (vest.dropEp !== undefined && !linkedV.has(vest.id)) {
      push({
        code: 'DROP_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [vest.id],
        message: `vest ${vest.id} dropEp=E${vest.dropEp} 无 countdown×vest×peak 桥`,
        fix: '为掉落集挂 VestCountdownPeakBridge',
      });
    } else if (!linkedV.has(vest.id)) {
      push({
        code: 'PENDING_VEST',
        severity: 'WARN',
        ids: [vest.id],
        message: `vest ${vest.id} 尚未联表`,
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
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 countdown×vest×peak 桥`,
        fix: '为峰值集挂 VestCountdownPeakBridge',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      countdowns: countdowns.length,
      vests: vests.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
