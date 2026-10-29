/**
 * V12 · Reaction-Beat × Peak-Before-Payoff Link Gate (反应镜 × 巅峰后再兑现 跨账本联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text breakdowns (structure only, no footage):
 *  - 《天幕直播》: 揭晓/反转后立刻给反应镜 — 巅峰集 ShotSpec 须 requireReaction.
 *  - 《卖掉养老房那天…》: 订婚宴嫌弃峰值 → 清算前/后反应镜放大羞辱量级.
 *  - 《婆婆装瘫七年…》: 升副院长峰值集须有 reversal/increment + reaction 拍.
 *
 * Embeds child peak-before-payoff + per-link reaction-beat (requireReaction=true).
 * Link rules:
 *  SCHEMA / DUP_ID / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_PEAK_FAIL / CHILD_REACTION_FAIL
 *  EP_MISMATCH — link.ep 须等于 peak.peakEp（巅峰集才挂反应镜）
 *  PEAK_WITHOUT_REACTION_LINK — peakEp 已标但无联表挂 ShotSpec（WARN if open-only）
 *  PENDING_PAIR (WARN) — 蓄仇尚无 peakEp
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';
import { evaluateReactionBeats } from './reaction-beat-gate';

const Ep = z.number().int().positive();

export const ReactionPeakLinkEntrySchema = z.object({
  id: z.string().min(1),
  peakId: z.string().min(1),
  /** Episode whose ShotSpec is audited for reaction (must equal peak.peakEp when set). */
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const ReactionPeakLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(ReactionPeakLinkEntrySchema),
});

export type ReactionPeakLinkLedger = z.infer<typeof ReactionPeakLinkLedgerSchema>;

export type ReactionPeakLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_PEAK_FAIL'
    | 'CHILD_REACTION_FAIL'
    | 'EP_MISMATCH'
    | 'PEAK_WITHOUT_REACTION_LINK'
    | 'PENDING_PAIR';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface ReactionPeakLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    pending: number;
    peaks: number;
    latestEp: number;
  };
  findings: ReactionPeakLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateReactionPeakLink(input: unknown): ReactionPeakLinkReport {
  const parsed = ReactionPeakLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, pending: 0, peaks: 0, latestEp: 0 },
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

  const { series, latestEp, peaks, links } = parsed.data;
  const findings: ReactionPeakLinkFinding[] = [];
  const push = (x: ReactionPeakLinkFinding) => findings.push(x);

  const peakReport = evaluatePeakBeforePayoff({ series, latestEp, entries: peaks });
  if (peakReport.verdict === 'FAIL') {
    const childFails = peakReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_PEAK_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌巅峰账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 peak-before-payoff-gate（peakEp≤payoffEp + peakLabel）再跑联表',
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

  const byPeak = new Map(peaks.map((p) => [p.id, p]));
  const linkedPeakIds = new Set<string>();
  let aligned = 0;
  let pending = 0;

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
    linkedPeakIds.add(peak.id);

    if (peak.peakEp === undefined) {
      pending += 1;
      push({
        code: 'PENDING_PAIR',
        severity: 'WARN',
        ids: [link.id, peak.id],
        message: `${link.id}: 蓄仇 ${peak.id} 尚无 peakEp，反应镜联表待巅峰落地`,
        fix: '规划 peakEp + peakLabel 后再挂巅峰集 ShotSpec',
      });
      continue;
    }

    if (link.ep !== peak.peakEp) {
      push({
        code: 'EP_MISMATCH',
        severity: 'FAIL',
        ids: [link.id, peak.id],
        message: `${link.id}: link.ep=E${link.ep} ≠ peak.peakEp=E${peak.peakEp}（${peak.peakLabel ?? '?'}）`,
        fix: '反应镜须挂在巅峰集：link.ep === peak.peakEp',
      });
      continue;
    }

    const rx = evaluateReactionBeats(link.shotSpec, { requireReaction: true });
    if (rx.verdict === 'FAIL') {
      const childFails = rx.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_REACTION_FAIL',
        severity: 'FAIL',
        ids: [link.id, peak.id, ...(childFails.flatMap((f) => f.shotIds ?? []))],
        message: `${link.id}: 巅峰集 E${link.ep} 反应镜闸 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '巅峰集 ShotSpec 在 reversal/increment/cliffhanger 后补 reaction（requireReaction）',
      });
      continue;
    }

    aligned += 1;
  }

  // Peaks with peakEp set must have at least one reaction link (hard when paid or peaked)
  for (const peak of peaks) {
    if (peak.peakEp === undefined) {
      if (![...linkedPeakIds].includes(peak.id)) {
        // unlinked + no peak plan — soft
        push({
          code: 'PENDING_PAIR',
          severity: 'WARN',
          ids: [peak.id],
          message: `蓄仇 ${peak.id} 尚无 peakEp 且无反应镜联表`,
          fix: '规划巅峰点并挂 ShotSpec',
        });
        pending += 1;
      }
      continue;
    }
    if (!linkedPeakIds.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_REACTION_LINK',
        severity: 'FAIL',
        ids: [peak.id],
        message: `巅峰 ${peak.id} 已标 peakEp=E${peak.peakEp}（${peak.peakLabel ?? '?'}）但无反应镜联表`,
        fix: '为巅峰集补 links[]：peakId + ep=peakEp + shotSpec（含 reaction）',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      pending,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
