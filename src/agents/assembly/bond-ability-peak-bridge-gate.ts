/**
 * V12 · Bond × Ability × Peak Ternary Bridge
 * (契约升级/解除 × 金手指 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《逃婚三年》/《伪人降临》: 契约真心升级常与对峙峰值同拍，且须兑现金手指.
 *  - bondAbilityLink / bondPeakLink 已各自联表——本 gate 硬对齐同 ep 三元同框.
 *
 * Per link: bondId + abilityId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_ABILITY / UNKNOWN_BOND / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_ABILITY_FAIL / CHILD_BOND_FAIL / CHILD_PEAK_FAIL
 *  EP_NOT_TERNARY — link.ep = peakEp，且 upgrade|dissolve 踩该 ep
 *  ACQUIRED_AFTER_TERNARY / NO_USE_AT_TERNARY
 *  PEAK_WITHOUT_BRIDGE / TERMINAL_WITHOUT_BRIDGE
 *  PENDING_BOND (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  AbilityEntrySchema,
  AbilityUseSchema,
  evaluateAbilityRules,
} from './ability-rule-gate';
import {
  BondContractEntrySchema,
  evaluateBondContract,
} from './bond-contract-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const BondAbilityPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  abilityId: z.string().min(1),
  bondId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const BondAbilityPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  bonds: z.array(BondContractEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(BondAbilityPeakBridgeLinkSchema),
});

export type BondAbilityPeakBridgeLedger = z.infer<typeof BondAbilityPeakBridgeLedgerSchema>;

export type BondAbilityPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_ABILITY'
    | 'UNKNOWN_BOND'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_ABILITY_FAIL'
    | 'CHILD_BOND_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'EP_NOT_TERNARY'
    | 'ACQUIRED_AFTER_TERNARY'
    | 'NO_USE_AT_TERNARY'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'TERMINAL_WITHOUT_BRIDGE'
    | 'PENDING_BOND';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface BondAbilityPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    abilities: number;
    bonds: number;
    peaks: number;
    latestEp: number;
  };
  findings: BondAbilityPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateBondAbilityPeakBridge(input: unknown): BondAbilityPeakBridgeReport {
  const parsed = BondAbilityPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, abilities: 0, bonds: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, abilities, uses, bonds, peaks, links } = parsed.data;
  const findings: BondAbilityPeakBridgeFinding[] = [];
  const push = (x: BondAbilityPeakBridgeFinding) => findings.push(x);

  const abReport = evaluateAbilityRules({ series, latestEp, abilities, uses });
  if (abReport.verdict === 'FAIL') {
    const childFails = abReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_ABILITY_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌金手指账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 ability-rule-gate',
    });
  }

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

  const byAb = new Map(abilities.map((a) => [a.id, a]));
  const byBond = new Map(bonds.map((b) => [b.id, b]));
  const byPeak = new Map(peaks.map((p) => [p.id, p]));
  const linkedPeaks = new Set<string>();
  const linkedBonds = new Set<string>();
  const linkedAbs = new Set<string>();
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
    const ab = byAb.get(link.abilityId);
    if (!ab) {
      push({
        code: 'UNKNOWN_ABILITY',
        severity: 'FAIL',
        ids: [link.id, link.abilityId],
        message: `联表 ${link.id} 引用未知 ability ${link.abilityId}`,
        fix: 'abilityId 须存在于 abilities[]',
      });
      continue;
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

    const terminals = [bond.upgradeEp, bond.dissolveEp].filter(
      (e): e is number => typeof e === 'number',
    );
    if (
      peak.peakEp === undefined ||
      link.ep !== peak.peakEp ||
      !terminals.includes(link.ep)
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, ab.id, bond.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 peak=${peak.peakEp ?? '无'}/terminal=${terminals.join('/') || '无'}`,
        fix: '三元同框：link.ep = peakEp，且 upgrade|dissolve 踩该 ep',
      });
      continue;
    }

    if (ab.acquiredEp > link.ep) {
      push({
        code: 'ACQUIRED_AFTER_TERNARY',
        severity: 'FAIL',
        ids: [link.id, ab.id],
        message: `${link.id}: ability ${ab.id} acquiredEp=E${ab.acquiredEp} > ternary E${link.ep}`,
        fix: '能力须在三元集前或当集已拿到',
      });
      continue;
    }

    const used = uses.some((u) => u.abilityId === ab.id && u.by === ab.holder && u.ep === link.ep);
    if (!used) {
      push({
        code: 'NO_USE_AT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, ab.id],
        message: `${link.id}: ability ${ab.id} 在 E${link.ep} 无 holder 使用`,
        fix: '能力×契约×峰值同框须有使用',
      });
      continue;
    }

    linkedPeaks.add(peak.id);
    linkedBonds.add(bond.id);
    linkedAbs.add(ab.id);
    aligned += 1;
  }

  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedPeaks.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 bond×ability×peak 桥`,
        fix: '为峰值集挂 BondAbilityPeakBridge',
      });
    }
  }
  for (const bond of bonds) {
    const terminals = [bond.upgradeEp, bond.dissolveEp].filter(
      (e): e is number => typeof e === 'number',
    );
    if (terminals.length > 0 && !linkedBonds.has(bond.id)) {
      push({
        code: 'TERMINAL_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [bond.id],
        message: `bond ${bond.id} terminal=${terminals.join('/')} 无 bond×ability×peak 桥`,
        fix: '为升级/解除集挂 BondAbilityPeakBridge',
      });
    } else if (!linkedBonds.has(bond.id)) {
      push({
        code: 'PENDING_BOND',
        severity: 'WARN',
        ids: [bond.id],
        message: `bond ${bond.id} 尚未联表到 bond×ability×peak 桥`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      abilities: abilities.length,
      bonds: bonds.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
