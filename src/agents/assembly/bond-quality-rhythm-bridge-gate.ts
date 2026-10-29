/**
 * V12 · Bond × Quality × Series-Rhythm Ternary Bridge
 * (契约升级/解除 × 表演门 × 系列节奏 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《逃婚三年》: 契约真心升级镜须过表演门，且落入 dense/intrigue 节奏档.
 *  - bondPeakLink / motifQualityRhythm 已各自联表——本 gate 硬对齐同 ep 三元同框.
 *
 * Per link: bondId + ep + qualityLeap + shotSpec(+profile).
 *  SCHEMA / DUP_ID / UNKNOWN_BOND / FUTURE_EP
 *  CHILD_BOND_FAIL / CHILD_QUALITY_FAIL / CHILD_RHYTHM_FAIL
 *  EP_NOT_TERMINAL — link.ep 须踩 upgrade|dissolve
 *  TERMINAL_WITHOUT_BRIDGE
 *  PENDING_BOND (WARN)
 *  PROFILE_MISMATCH (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import {
  BondContractEntrySchema,
  evaluateBondContract,
} from './bond-contract-gate';
import {
  QualityLeapDocSchema,
  evaluateQualityLeap,
} from './quality-leap-gate';
import {
  evaluateSeriesRhythm,
  SERIES_RHYTHM_PROFILE_NAMES,
  type SeriesRhythmProfileName,
} from './series-rhythm-profile';

const Ep = z.number().int().positive();

export const BondQualityRhythmBridgeLinkSchema = z.object({
  id: z.string().min(1),
  bondId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  shotSpec: ShotSpecDocSchema,
  profile: z.enum(['dense', 'default', 'intrigue', 'slow_burn']).optional(),
  note: z.string().optional(),
});

export const BondQualityRhythmBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  profile: z.enum(['dense', 'default', 'intrigue', 'slow_burn']).optional(),
  bonds: z.array(BondContractEntrySchema),
  links: z.array(BondQualityRhythmBridgeLinkSchema),
});

export type BondQualityRhythmBridgeLedger = z.infer<typeof BondQualityRhythmBridgeLedgerSchema>;

export type BondQualityRhythmBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_BOND'
    | 'FUTURE_EP'
    | 'CHILD_BOND_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'CHILD_RHYTHM_FAIL'
    | 'EP_NOT_TERMINAL'
    | 'TERMINAL_WITHOUT_BRIDGE'
    | 'PENDING_BOND'
    | 'PROFILE_MISMATCH';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface BondQualityRhythmBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    bonds: number;
    latestEp: number;
    profile: string;
  };
  findings: BondQualityRhythmBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateBondQualityRhythmBridge(input: unknown): BondQualityRhythmBridgeReport {
  const parsed = BondQualityRhythmBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, bonds: 0, latestEp: 0, profile: 'default' },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, bonds, links, profile: defaultProfile = 'default' } = parsed.data;
  const findings: BondQualityRhythmBridgeFinding[] = [];
  const push = (x: BondQualityRhythmBridgeFinding) => findings.push(x);

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

  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const l of links) {
    if (seen.has(l.id)) dups.add(l.id);
    else seen.add(l.id);
  }
  for (const id of dups) {
    push({ code: 'DUP_ID', severity: 'FAIL', ids: [id], message: `联表ID重复：${id}`, fix: '联表 id 须唯一' });
  }

  const byBond = new Map(bonds.map((b) => [b.id, b]));
  const linkedBonds = new Set<string>();
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
    const bond = byBond.get(link.bondId);
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
    const terminals = [bond.upgradeEp, bond.dissolveEp].filter(
      (e): e is number => typeof e === 'number',
    );
    if (!terminals.includes(link.ep)) {
      push({
        code: 'EP_NOT_TERMINAL',
        severity: 'FAIL',
        ids: [link.id, bond.id],
        message: `${link.id}: ep=E${link.ep} 未踩 upgrade|dissolve (${terminals.join('/') || '无'})`,
        fix: '契约升级/解除集须挂表演×节奏桥',
      });
      continue;
    }

    const ql = evaluateQualityLeap(link.qualityLeap);
    if (ql.verdict === 'FAIL') {
      const childFails = ql.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_QUALITY_FAIL',
        severity: 'FAIL',
        ids: [link.id, bond.id, ...(childFails.flatMap((f) => f.ids ?? []))],
        message: `${link.id}: qualityLeap FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '契约终端镜须过表演/情绪/口型门',
      });
      continue;
    }

    const profile = (link.profile ?? defaultProfile) as SeriesRhythmProfileName;
    if (link.profile && link.profile !== defaultProfile) {
      push({
        code: 'PROFILE_MISMATCH',
        severity: 'WARN',
        ids: [link.id],
        message: `${link.id}: link.profile=${link.profile} ≠ bridge profile=${defaultProfile}`,
        fix: `统一档位，或确认故意用 ${link.profile}（${SERIES_RHYTHM_PROFILE_NAMES.join('|')}）`,
      });
    }

    const rhythm = evaluateSeriesRhythm(link.shotSpec, { profile });
    if (rhythm.verdict === 'FAIL') {
      const childFails = rhythm.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_RHYTHM_FAIL',
        severity: 'FAIL',
        ids: [link.id, bond.id, ...(childFails.flatMap((f) => f.shotIds ?? []))],
        message: `${link.id}: seriesRhythm(${profile}) FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '契约×表演同框镜须落入系列节奏档阈值',
      });
      continue;
    }

    linkedBonds.add(bond.id);
    aligned += 1;
  }

  for (const b of bonds) {
    const terminals = [b.upgradeEp, b.dissolveEp].filter(
      (e): e is number => typeof e === 'number',
    );
    if (terminals.length > 0 && !linkedBonds.has(b.id)) {
      push({
        code: 'TERMINAL_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [b.id],
        message: `bond ${b.id} 已有 terminal 无 bond×quality×rhythm 桥`,
        fix: '为升级/解除集挂 BondQualityRhythmBridge',
      });
    } else if (!linkedBonds.has(b.id)) {
      push({
        code: 'PENDING_BOND',
        severity: 'WARN',
        ids: [b.id],
        message: `bond ${b.id} 尚未联表到 bond×quality×rhythm 桥`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { links: links.length, aligned, bonds: bonds.length, latestEp, profile: defaultProfile },
    findings,
    gates: GATES,
  };
}
