/**
 * V12 · Motif × Countdown Link Gate (视觉母题 × 阶段倒计时 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - deadline 当集常回扣视觉母题 payoff.
 *  - 与 countdownForeshadowLink / motifBondLink 互补：本 gate 以 motif 联 countdown.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_MOTIF / UNKNOWN_COUNTDOWN
 *  CHILD_MOTIF_FAIL / BAD_COUNTDOWN_WINDOW
 *  NO_MOTIF_AT_DEADLINE — deadline 须有 appearance
 *  MOTIF_WITHOUT_DEADLINE / DEADLINE_WITHOUT_MOTIF
 *  PENDING_COUNTDOWN (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { StageCountdownSchema } from './stage-goal-gate';
import {
  MotifEntrySchema,
  MotifAppearanceSchema,
  evaluateMotifCallbacks,
} from './motif-callback-gate';

const Ep = z.number().int().positive();

export const MotifCountdownLinkEntrySchema = z.object({
  id: z.string().min(1),
  motifId: z.string().min(1),
  countdownId: z.string().min(1),
  note: z.string().optional(),
});

export const MotifCountdownLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  countdowns: z.array(StageCountdownSchema),
  links: z.array(MotifCountdownLinkEntrySchema),
});

export type MotifCountdownLinkLedger = z.infer<typeof MotifCountdownLinkLedgerSchema>;

export type MotifCountdownLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_MOTIF'
    | 'UNKNOWN_COUNTDOWN'
    | 'CHILD_MOTIF_FAIL'
    | 'BAD_COUNTDOWN_WINDOW'
    | 'NO_MOTIF_AT_DEADLINE'
    | 'MOTIF_WITHOUT_DEADLINE'
    | 'DEADLINE_WITHOUT_MOTIF'
    | 'PENDING_COUNTDOWN';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface MotifCountdownLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    motifs: number;
    countdowns: number;
    latestEp: number;
  };
  findings: MotifCountdownLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateMotifCountdownLink(input: unknown): MotifCountdownLinkReport {
  const parsed = MotifCountdownLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, motifs: 0, countdowns: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, motifs, appearances, countdowns, links } = parsed.data;
  const findings: MotifCountdownLinkFinding[] = [];
  const push = (x: MotifCountdownLinkFinding) => findings.push(x);

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

  for (const c of countdowns) {
    if (c.deadlineEp < c.startEp) {
      push({
        code: 'BAD_COUNTDOWN_WINDOW',
        severity: 'FAIL',
        ids: [c.id],
        message: `countdown ${c.id} deadlineEp=E${c.deadlineEp} < startEp=E${c.startEp}`,
        fix: 'deadlineEp 须 ≥ startEp',
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

  const byMotif = new Map(motifs.map((m) => [m.id, m]));
  const byCd = new Map(countdowns.map((c) => [c.id, c]));
  const pairedMotifs = new Set<string>();
  const pairedCds = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const motif = byMotif.get(link.motifId);
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

    const hasAppearance = appearances.some((a) => a.motifId === motif.id && a.ep === cd.deadlineEp);
    if (!hasAppearance) {
      push({
        code: 'NO_MOTIF_AT_DEADLINE',
        severity: 'FAIL',
        ids: [link.id, motif.id, cd.id],
        message: `${link.id}: deadline E${cd.deadlineEp} 无 motif ${motif.id} appearance`,
        fix: 'deadline 集须有母题出场',
      });
      continue;
    }

    pairedMotifs.add(motif.id);
    pairedCds.add(cd.id);
    aligned += 1;
  }

  for (const motif of motifs) {
    const hasPayoff = appearances.some((a) => a.motifId === motif.id && a.role === 'payoff');
    if (hasPayoff && !pairedMotifs.has(motif.id)) {
      push({
        code: 'MOTIF_WITHOUT_DEADLINE',
        severity: 'FAIL',
        ids: [motif.id],
        message: `motif ${motif.id} 有 payoff appearance 无 countdown deadline 联表`,
        fix: '为母题回扣集挂 MotifCountdownLink',
      });
    }
  }
  for (const cd of countdowns) {
    if (cd.deadlineEp <= latestEp && !pairedCds.has(cd.id)) {
      push({
        code: 'DEADLINE_WITHOUT_MOTIF',
        severity: 'FAIL',
        ids: [cd.id],
        message: `countdown ${cd.id} deadlineEp=E${cd.deadlineEp} 无 motif 联表`,
        fix: '为 deadline 集挂 MotifCountdownLink',
      });
    } else if (!pairedCds.has(cd.id)) {
      push({
        code: 'PENDING_COUNTDOWN',
        severity: 'WARN',
        ids: [cd.id],
        message: `countdown ${cd.id} 尚未联表到 motif`,
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
      countdowns: countdowns.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
