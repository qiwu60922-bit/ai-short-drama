/**
 * V12 · Foreshadow × Countdown Link Gate (伏笔兑现 × 阶段倒计时 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《天幕直播》: S/A 伏笔 payoff 常踩倒计时 deadline 同集.
 *  - 与 countdownForeshadowLink 互补：本 gate 以 foreshadow 为主键命名.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_COUNTDOWN / UNKNOWN_FORESHADOW / FUTURE_EP
 *  CHILD_FORESHADOW_FAIL / BAD_COUNTDOWN_WINDOW
 *  EP_NOT_DEADLINE_PAYOFF — link.ep = deadlineEp = payoffEp
 *  DEADLINE_WITHOUT_FORESHADOW / PAYOFF_WITHOUT_COUNTDOWN
 *  PENDING_COUNTDOWN / PENDING_FORESHADOW (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { StageCountdownSchema } from './stage-goal-gate';
import {
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
} from './foreshadow-ledger-gate';

const Ep = z.number().int().positive();

export const ForeshadowCountdownLinkEntrySchema = z.object({
  id: z.string().min(1),
  foreshadowId: z.string().min(1),
  countdownId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const ForeshadowCountdownLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  items: z.array(ForeshadowItemSchema),
  countdowns: z.array(StageCountdownSchema),
  links: z.array(ForeshadowCountdownLinkEntrySchema),
});

export type ForeshadowCountdownLinkLedger = z.infer<typeof ForeshadowCountdownLinkLedgerSchema>;

export type ForeshadowCountdownLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_COUNTDOWN'
    | 'UNKNOWN_FORESHADOW'
    | 'FUTURE_EP'
    | 'CHILD_FORESHADOW_FAIL'
    | 'BAD_COUNTDOWN_WINDOW'
    | 'EP_NOT_DEADLINE_PAYOFF'
    | 'DEADLINE_WITHOUT_FORESHADOW'
    | 'PAYOFF_WITHOUT_COUNTDOWN'
    | 'PENDING_COUNTDOWN'
    | 'PENDING_FORESHADOW';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface ForeshadowCountdownLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    items: number;
    countdowns: number;
    latestEp: number;
  };
  findings: ForeshadowCountdownLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateForeshadowCountdownLink(input: unknown): ForeshadowCountdownLinkReport {
  const parsed = ForeshadowCountdownLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, items: 0, countdowns: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, items, countdowns, links } = parsed.data;
  const findings: ForeshadowCountdownLinkFinding[] = [];
  const push = (x: ForeshadowCountdownLinkFinding) => findings.push(x);

  const fsReport = evaluateForeshadowLedger({ series, latestEp, items });
  if (fsReport.verdict === 'FAIL') {
    const childFails = fsReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_FORESHADOW_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌伏笔账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 foreshadow-ledger-gate',
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

  const byC = new Map(countdowns.map((c) => [c.id, c]));
  const byItem = new Map(items.map((it) => [it.id, it]));
  const pairedC = new Set<string>();
  const pairedItems = new Set<string>();
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
    const cd = byC.get(link.countdownId);
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
    const item = byItem.get(link.foreshadowId);
    if (!item) {
      push({
        code: 'UNKNOWN_FORESHADOW',
        severity: 'FAIL',
        ids: [link.id, link.foreshadowId],
        message: `联表 ${link.id} 引用未知 foreshadow ${link.foreshadowId}`,
        fix: 'foreshadowId 须存在于 items[]',
      });
      continue;
    }

    if (
      item.payoffEp === undefined ||
      link.ep !== cd.deadlineEp ||
      link.ep !== item.payoffEp
    ) {
      push({
        code: 'EP_NOT_DEADLINE_PAYOFF',
        severity: 'FAIL',
        ids: [link.id, cd.id, item.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 deadline=${cd.deadlineEp}/fs=${item.payoffEp ?? '无'}`,
        fix: 'deadline 须踩伏笔 payoff 同集',
      });
      continue;
    }

    pairedC.add(cd.id);
    pairedItems.add(item.id);
    aligned += 1;
  }

  for (const c of countdowns) {
    if (!pairedC.has(c.id)) {
      push({
        code: 'DEADLINE_WITHOUT_FORESHADOW',
        severity: 'FAIL',
        ids: [c.id],
        message: `countdown ${c.id} deadlineEp=E${c.deadlineEp} 无 foreshadow 联表`,
        fix: '为 deadline 集挂 ForeshadowCountdownLink',
      });
    }
  }
  for (const it of items) {
    if (it.payoffEp !== undefined && !pairedItems.has(it.id)) {
      push({
        code: 'PAYOFF_WITHOUT_COUNTDOWN',
        severity: 'FAIL',
        ids: [it.id],
        message: `foreshadow ${it.id} payoffEp=E${it.payoffEp} 无 countdown 联表`,
        fix: '为伏笔兑现集挂 ForeshadowCountdownLink',
      });
    } else if (!pairedItems.has(it.id)) {
      push({
        code: 'PENDING_FORESHADOW',
        severity: 'WARN',
        ids: [it.id],
        message: `foreshadow ${it.id} 尚未联表到 countdown`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      items: items.length,
      countdowns: countdowns.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
