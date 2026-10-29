/**
 * V12 · Bond × Peak-Before-Payoff Link Gate (契约升级/解除 × 巅峰兑现 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《云海不相逢》: 契约升级/真情须踩在对峙巅峰集.
 *  - bond-contract 管 contract→upgrade/dissolve；peak-before-payoff 管巅峰——本 gate 硬对齐.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_BOND / UNKNOWN_PEAK
 *  CHILD_BOND_FAIL / CHILD_PEAK_FAIL
 *  TERMINAL_NOT_AT_PEAK — upgradeEp|dissolveEp 须等于 peakEp|payoffEp
 *  PEAK_WITHOUT_BOND — peak/payoff 无联表
 *  PENDING_BOND (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  BondContractEntrySchema,
  evaluateBondContract,
} from './bond-contract-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const BondPeakLinkEntrySchema = z.object({
  id: z.string().min(1),
  bondId: z.string().min(1),
  peakId: z.string().min(1),
  note: z.string().optional(),
});

export const BondPeakLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  bonds: z.array(BondContractEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(BondPeakLinkEntrySchema),
});

export type BondPeakLinkLedger = z.infer<typeof BondPeakLinkLedgerSchema>;

export type BondPeakLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_BOND'
    | 'UNKNOWN_PEAK'
    | 'CHILD_BOND_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'TERMINAL_NOT_AT_PEAK'
    | 'PEAK_WITHOUT_BOND'
    | 'PENDING_BOND';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface BondPeakLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    bonds: number;
    peaks: number;
    latestEp: number;
  };
  findings: BondPeakLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateBondPeakLink(input: unknown): BondPeakLinkReport {
  const parsed = BondPeakLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, bonds: 0, peaks: 0, latestEp: 0 },
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

  const { series, latestEp, bonds, peaks, links } = parsed.data;
  const findings: BondPeakLinkFinding[] = [];
  const push = (x: BondPeakLinkFinding) => findings.push(x);

  const bondReport = evaluateBondContract({ series, latestEp, entries: bonds });
  if (bondReport.verdict === 'FAIL') {
    const childFails = bondReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_BOND_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌契约账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 bond-contract-gate',
    });
  }

  const peakReport = evaluatePeakBeforePayoff({ series, latestEp, entries: peaks });
  if (peakReport.verdict === 'FAIL') {
    const childFails = peakReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_PEAK_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌巅峰账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
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
    push({
      code: 'DUP_ID',
      severity: 'FAIL',
      ids: [id],
      message: `联表ID重复：${id}`,
      fix: '联表 id 须唯一',
    });
  }

  const byBond = new Map(bonds.map((b) => [b.id, b]));
  const byPeak = new Map(peaks.map((p) => [p.id, p]));
  const pairedPeaks = new Set<string>();
  const pairedBonds = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const bond = byBond.get(link.bondId);
    const peak = byPeak.get(link.peakId);
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
    pairedBonds.add(bond.id);

    const terminals = [bond.upgradeEp, bond.dissolveEp].filter(
      (e): e is number => typeof e === 'number',
    );
    const targets = [peak.peakEp, peak.payoffEp].filter(
      (e): e is number => typeof e === 'number',
    );
    const hit = terminals.some((e) => targets.includes(e));
    if (!hit) {
      push({
        code: 'TERMINAL_NOT_AT_PEAK',
        severity: 'FAIL',
        ids: [link.id, bond.id, peak.id],
        message: `${link.id}: upgrade/dissolve（${terminals.join('/') || '无'}）不在 peak/payoff（${targets.join('/') || '无'}）`,
        fix: '契约升级或解除须踩巅峰/回收集',
      });
      continue;
    }

    aligned += 1;
  }

  for (const p of peaks) {
    if ((p.peakEp !== undefined || p.payoffEp !== undefined) && !pairedPeaks.has(p.id)) {
      push({
        code: 'PEAK_WITHOUT_BOND',
        severity: 'FAIL',
        ids: [p.id],
        message: `peak ${p.id} 未挂 bond 联表`,
        fix: '在 links[] 挂 bondId↔peakId',
      });
    }
  }

  for (const b of bonds) {
    if (!pairedBonds.has(b.id)) {
      push({
        code: 'PENDING_BOND',
        severity: 'WARN',
        ids: [b.id],
        message: `bond ${b.id} 尚未联表到 peak`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      bonds: bonds.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
