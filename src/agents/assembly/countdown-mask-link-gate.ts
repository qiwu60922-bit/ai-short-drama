/**
 * V12 · Countdown × Persona-Mask Link Gate (阶段倒计时 × 伪装揭穿 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《天幕直播》: 时限 deadline 当集揭穿伪装 / 身份崩塌.
 *  - countdown 管 start→deadline；persona-mask 管 plant→reveal——本 gate 硬对齐 revealEp=deadlineEp.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_COUNTDOWN / UNKNOWN_MASK
 *  CHILD_MASK_FAIL / BAD_COUNTDOWN_WINDOW
 *  REVEAL_NOT_AT_DEADLINE — revealEp 须等于 deadlineEp
 *  DEADLINE_WITHOUT_MASK — deadline 已到无联表
 *  PENDING_MASK (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { StageCountdownSchema } from './stage-goal-gate';
import {
  PersonaMaskEntrySchema,
  evaluatePersonaMask,
} from './persona-mask-gate';

const Ep = z.number().int().positive();

export const CountdownMaskLinkEntrySchema = z.object({
  id: z.string().min(1),
  countdownId: z.string().min(1),
  maskId: z.string().min(1),
  note: z.string().optional(),
});

export const CountdownMaskLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  countdowns: z.array(StageCountdownSchema),
  masks: z.array(PersonaMaskEntrySchema),
  links: z.array(CountdownMaskLinkEntrySchema),
});

export type CountdownMaskLinkLedger = z.infer<typeof CountdownMaskLinkLedgerSchema>;

export type CountdownMaskLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_COUNTDOWN'
    | 'UNKNOWN_MASK'
    | 'CHILD_MASK_FAIL'
    | 'BAD_COUNTDOWN_WINDOW'
    | 'REVEAL_NOT_AT_DEADLINE'
    | 'DEADLINE_WITHOUT_MASK'
    | 'PENDING_MASK';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface CountdownMaskLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    countdowns: number;
    masks: number;
    latestEp: number;
  };
  findings: CountdownMaskLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateCountdownMaskLink(input: unknown): CountdownMaskLinkReport {
  const parsed = CountdownMaskLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, countdowns: 0, masks: 0, latestEp: 0 },
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

  const { series, latestEp, countdowns, masks, links } = parsed.data;
  const findings: CountdownMaskLinkFinding[] = [];
  const push = (x: CountdownMaskLinkFinding) => findings.push(x);

  const maskReport = evaluatePersonaMask({ series, latestEp, entries: masks });
  if (maskReport.verdict === 'FAIL') {
    const childFails = maskReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_MASK_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌伪装账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 persona-mask-gate',
    });
  }

  for (const cd of countdowns) {
    if (cd.deadlineEp < cd.startEp) {
      push({
        code: 'BAD_COUNTDOWN_WINDOW',
        severity: 'FAIL',
        ids: [cd.id],
        message: `countdown ${cd.id}: deadlineEp=E${cd.deadlineEp} < startEp=E${cd.startEp}`,
        fix: 'deadline 须 ≥ start',
      });
    }
    if (cd.deadlineEp > latestEp || cd.startEp > latestEp) {
      push({
        code: 'BAD_COUNTDOWN_WINDOW',
        severity: 'FAIL',
        ids: [cd.id],
        message: `countdown ${cd.id} 超出 latestEp=E${latestEp}`,
        fix: '下调 deadline/start 或上调 latestEp',
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
    push({
      code: 'DUP_ID',
      severity: 'FAIL',
      ids: [id],
      message: `联表ID重复：${id}`,
      fix: '联表 id 须唯一',
    });
  }

  const byCd = new Map(countdowns.map((c) => [c.id, c]));
  const byMask = new Map(masks.map((m) => [m.id, m]));
  const pairedCd = new Set<string>();
  const pairedMask = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const cd = byCd.get(link.countdownId);
    const mask = byMask.get(link.maskId);
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
    if (!mask) {
      push({
        code: 'UNKNOWN_MASK',
        severity: 'FAIL',
        ids: [link.id, link.maskId],
        message: `联表 ${link.id} 引用未知 mask ${link.maskId}`,
        fix: 'maskId 须存在于 masks[]',
      });
      continue;
    }
    pairedCd.add(cd.id);
    pairedMask.add(mask.id);

    if (mask.revealEp === undefined || mask.revealEp !== cd.deadlineEp) {
      push({
        code: 'REVEAL_NOT_AT_DEADLINE',
        severity: 'FAIL',
        ids: [link.id, mask.id, cd.id],
        message: `${link.id}: revealEp=${mask.revealEp ?? '未揭穿'} ≠ deadlineEp=E${cd.deadlineEp}`,
        fix: '伪装揭穿须落在 countdown deadline 当集',
      });
      continue;
    }

    aligned += 1;
  }

  for (const cd of countdowns) {
    const reached =
      latestEp >= cd.deadlineEp || cd.status === 'met' || cd.status === 'expired';
    if (reached && !pairedCd.has(cd.id)) {
      push({
        code: 'DEADLINE_WITHOUT_MASK',
        severity: 'FAIL',
        ids: [cd.id],
        message: `countdown ${cd.id} deadline 已到无 mask 联表`,
        fix: '在 links[] 挂 countdownId↔maskId',
      });
    }
  }

  for (const m of masks) {
    if (!pairedMask.has(m.id)) {
      push({
        code: 'PENDING_MASK',
        severity: 'WARN',
        ids: [m.id],
        message: `mask ${m.id} 尚未联表到 countdown`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      countdowns: countdowns.length,
      masks: masks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
