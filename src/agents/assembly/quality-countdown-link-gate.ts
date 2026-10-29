/**
 * V12 · Quality × Countdown Link Gate (表演门 × 阶段倒计时 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - deadline 当集须过表演/情绪门，不能空壳倒计时兑现.
 *  - 与 qualityEnsembleLink / motifCountdownLink 互补：本 gate 以 quality 联 countdown.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_COUNTDOWN / FUTURE_EP
 *  BAD_COUNTDOWN_WINDOW / CHILD_QUALITY_FAIL
 *  EP_NOT_DEADLINE — link.ep 须等于 deadlineEp
 *  DEADLINE_WITHOUT_QUALITY
 *  LOW_INTENSITY_AT_DEADLINE (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { StageCountdownSchema } from './stage-goal-gate';
import {
  QualityLeapDocSchema,
  evaluateQualityLeap,
} from './quality-leap-gate';

const Ep = z.number().int().positive();

export const QualityCountdownLinkEntrySchema = z.object({
  id: z.string().min(1),
  countdownId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const QualityCountdownLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minDeadlineIntense: z.number().int().min(1).max(5).optional(),
  countdowns: z.array(StageCountdownSchema),
  links: z.array(QualityCountdownLinkEntrySchema),
});

export type QualityCountdownLinkLedger = z.infer<typeof QualityCountdownLinkLedgerSchema>;

export type QualityCountdownLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_COUNTDOWN'
    | 'FUTURE_EP'
    | 'BAD_COUNTDOWN_WINDOW'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_DEADLINE'
    | 'DEADLINE_WITHOUT_QUALITY'
    | 'LOW_INTENSITY_AT_DEADLINE';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface QualityCountdownLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    countdowns: number;
    latestEp: number;
  };
  findings: QualityCountdownLinkFinding[];
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

export function evaluateQualityCountdownLink(input: unknown): QualityCountdownLinkReport {
  const parsed = QualityCountdownLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, countdowns: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series: _series, latestEp, countdowns, links, minDeadlineIntense = 4 } = parsed.data;
  const findings: QualityCountdownLinkFinding[] = [];
  const push = (x: QualityCountdownLinkFinding) => findings.push(x);

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

  const byCd = new Map(countdowns.map((c) => [c.id, c]));
  const paired = new Set<string>();
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

    if (link.ep !== cd.deadlineEp) {
      push({
        code: 'EP_NOT_DEADLINE',
        severity: 'FAIL',
        ids: [link.id, cd.id],
        message: `${link.id}: ep=E${link.ep} ≠ deadline=${cd.deadlineEp}`,
        fix: 'link.ep 须等于 deadlineEp',
      });
      continue;
    }

    const intense = maxIntensity(link.qualityLeap);
    if (intense < minDeadlineIntense) {
      push({
        code: 'LOW_INTENSITY_AT_DEADLINE',
        severity: 'WARN',
        ids: [link.id],
        message: `${link.id}: deadline 镜 max intensity=${intense} < ${minDeadlineIntense}`,
        fix: '抬高 deadline 镜 intensity',
      });
    }

    paired.add(cd.id);
    aligned += 1;
  }

  for (const cd of countdowns) {
    if (cd.deadlineEp <= latestEp && !paired.has(cd.id)) {
      push({
        code: 'DEADLINE_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [cd.id],
        message: `countdown ${cd.id} 无 quality 联表`,
        fix: '为 deadline 挂 QualityCountdownLink',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      countdowns: countdowns.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
