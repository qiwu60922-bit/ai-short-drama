/**
 * V12 · Bond × Quality-Leap Link Gate (契约升级/解除 × 表演门 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《逃婚三年》: 契约真心升级镜须过表演/情绪门，不能空壳求婚.
 *  - bond-contract 管 upgrade/dissolve；quality-leap 管表演——本 gate 硬联表终局镜.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_BOND / FUTURE_EP
 *  CHILD_BOND_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_TERMINAL — link.ep 须等于 upgradeEp|dissolveEp
 *  TERMINAL_WITHOUT_QUALITY — 已终局无联表 quality
 *  PENDING_BOND (WARN)
 *  LOW_INTENSITY_AT_TERMINAL (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  BondContractEntrySchema,
  evaluateBondContract,
} from './bond-contract-gate';
import {
  QualityLeapDocSchema,
  evaluateQualityLeap,
} from './quality-leap-gate';

const Ep = z.number().int().positive();

export const BondQualityLinkEntrySchema = z.object({
  id: z.string().min(1),
  bondId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const BondQualityLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minTerminalIntense: z.number().int().min(1).max(5).optional(),
  bonds: z.array(BondContractEntrySchema),
  links: z.array(BondQualityLinkEntrySchema),
});

export type BondQualityLinkLedger = z.infer<typeof BondQualityLinkLedgerSchema>;

export type BondQualityLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_BOND'
    | 'FUTURE_EP'
    | 'CHILD_BOND_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_TERMINAL'
    | 'TERMINAL_WITHOUT_QUALITY'
    | 'PENDING_BOND'
    | 'LOW_INTENSITY_AT_TERMINAL';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface BondQualityLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    bonds: number;
    latestEp: number;
  };
  findings: BondQualityLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

function bondTerminalEp(b: { upgradeEp?: number; dissolveEp?: number }): number | undefined {
  return b.upgradeEp ?? b.dissolveEp;
}

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

export function evaluateBondQualityLink(input: unknown): BondQualityLinkReport {
  const parsed = BondQualityLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, bonds: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, bonds, links, minTerminalIntense = 4 } = parsed.data;
  const findings: BondQualityLinkFinding[] = [];
  const push = (x: BondQualityLinkFinding) => findings.push(x);

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

  const byB = new Map(bonds.map((b) => [b.id, b]));
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

    const terminal = bondTerminalEp(bond);
    if (terminal === undefined || link.ep !== terminal) {
      push({
        code: 'EP_NOT_TERMINAL',
        severity: 'FAIL',
        ids: [link.id, bond.id],
        message: `${link.id}: ep=E${link.ep} ≠ terminal=${terminal ?? '无'}`,
        fix: 'link.ep 须等于 upgradeEp|dissolveEp',
      });
      continue;
    }

    const intense = maxIntensity(link.qualityLeap);
    if (intense < minTerminalIntense) {
      push({
        code: 'LOW_INTENSITY_AT_TERMINAL',
        severity: 'WARN',
        ids: [link.id],
        message: `${link.id}: terminal 镜 max intensity=${intense} < ${minTerminalIntense}`,
        fix: '抬高终局镜 intensity',
      });
    }

    paired.add(bond.id);
    aligned += 1;
  }

  for (const bond of bonds) {
    const terminal = bondTerminalEp(bond);
    if (terminal !== undefined && !paired.has(bond.id)) {
      push({
        code: 'TERMINAL_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [bond.id],
        message: `bond ${bond.id} terminal=E${terminal} 无 bond×quality 联表`,
        fix: '为终局集挂 BondQualityLink',
      });
    } else if (!paired.has(bond.id)) {
      push({
        code: 'PENDING_BOND',
        severity: 'WARN',
        ids: [bond.id],
        message: `bond ${bond.id} 尚未联表到 bond×quality`,
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
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
