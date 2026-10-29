/**
 * V12 · Countdown × Bond Link Gate (阶段倒计时 × 契约升级/解除 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - deadline 当集常与契约真心升级硬对齐.
 *  - 与 countdownBondPeakBridge / qualityBondLink 互补：本 gate 以 countdown 联 bond.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_COUNTDOWN / UNKNOWN_BOND / FUTURE_EP
 *  CHILD_BOND_FAIL / BAD_COUNTDOWN_WINDOW
 *  EP_NOT_TERMINAL — link.ep = deadlineEp = upgradeEp|dissolveEp
 *  DEADLINE_WITHOUT_BOND / TERMINAL_WITHOUT_COUNTDOWN
 *  PENDING_COUNTDOWN / PENDING_BOND (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { StageCountdownSchema } from './stage-goal-gate';
import {
  BondContractEntrySchema,
  evaluateBondContract,
} from './bond-contract-gate';

const Ep = z.number().int().positive();

export const CountdownBondLinkEntrySchema = z.object({
  id: z.string().min(1),
  countdownId: z.string().min(1),
  bondId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const CountdownBondLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  countdowns: z.array(StageCountdownSchema),
  bonds: z.array(BondContractEntrySchema),
  links: z.array(CountdownBondLinkEntrySchema),
});

export type CountdownBondLinkLedger = z.infer<typeof CountdownBondLinkLedgerSchema>;

export type CountdownBondLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_COUNTDOWN'
    | 'UNKNOWN_BOND'
    | 'FUTURE_EP'
    | 'CHILD_BOND_FAIL'
    | 'BAD_COUNTDOWN_WINDOW'
    | 'EP_NOT_TERMINAL'
    | 'DEADLINE_WITHOUT_BOND'
    | 'TERMINAL_WITHOUT_COUNTDOWN'
    | 'PENDING_COUNTDOWN'
    | 'PENDING_BOND';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface CountdownBondLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    countdowns: number;
    bonds: number;
    latestEp: number;
  };
  findings: CountdownBondLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

function bondTerminalEp(b: { upgradeEp?: number; dissolveEp?: number }): number | undefined {
  return b.upgradeEp ?? b.dissolveEp;
}

export function evaluateCountdownBondLink(input: unknown): CountdownBondLinkReport {
  const parsed = CountdownBondLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, countdowns: 0, bonds: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, countdowns, bonds, links } = parsed.data;
  const findings: CountdownBondLinkFinding[] = [];
  const push = (x: CountdownBondLinkFinding) => findings.push(x);

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

  const bReport = evaluateBondContract({ series, latestEp, entries: bonds });
  if (bReport.verdict === 'FAIL') {
    const childFails = bReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_BOND_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌契约账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 bond-contract-gate',
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
  const byB = new Map(bonds.map((b) => [b.id, b]));
  const pairedCd = new Set<string>();
  const pairedB = new Set<string>();
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
    const bond = byB.get(link.bondId);
    if (!bond) {
      push({
        code: 'UNKNOWN_BOND',
        severity: 'FAIL',
        ids: [link.id, link.bondId],
        message: `联表 ${link.id} 引用未知 bond ${link.bondId}`,
        fix: 'bondId 须存在于 bonds[]',
      });
      continue;
    }

    const terminal = bondTerminalEp(bond);
    if (terminal === undefined || link.ep !== cd.deadlineEp || link.ep !== terminal) {
      push({
        code: 'EP_NOT_TERMINAL',
        severity: 'FAIL',
        ids: [link.id, cd.id, bond.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 deadline=${cd.deadlineEp}/terminal=${terminal ?? '无'}`,
        fix: 'deadline 与契约终局须同集',
      });
      continue;
    }

    pairedCd.add(cd.id);
    pairedB.add(bond.id);
    aligned += 1;
  }

  for (const cd of countdowns) {
    if (!pairedCd.has(cd.id)) {
      if (cd.deadlineEp <= latestEp) {
        push({
          code: 'DEADLINE_WITHOUT_BOND',
          severity: 'FAIL',
          ids: [cd.id],
          message: `countdown ${cd.id} deadlineEp=E${cd.deadlineEp} 无 bond 联表`,
          fix: '为 deadline 挂 CountdownBondLink',
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
  for (const bond of bonds) {
    const terminal = bondTerminalEp(bond);
    if (terminal !== undefined && !pairedB.has(bond.id)) {
      push({
        code: 'TERMINAL_WITHOUT_COUNTDOWN',
        severity: 'FAIL',
        ids: [bond.id],
        message: `bond ${bond.id} terminal=E${terminal} 无 countdown 联表`,
        fix: '为终局挂 CountdownBondLink',
      });
    } else if (!pairedB.has(bond.id)) {
      push({
        code: 'PENDING_BOND',
        severity: 'WARN',
        ids: [bond.id],
        message: `bond ${bond.id} 尚未联表`,
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
      bonds: bonds.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
