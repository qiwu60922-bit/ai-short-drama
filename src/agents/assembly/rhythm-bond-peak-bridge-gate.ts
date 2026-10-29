/**
 * V12 · Rhythm × Bond × Peak Ternary Bridge
 * (系列节奏 × 契约升级/解除 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 契约真心升级集须过 story-rhythm 密度门，并踩对峙峰值.
 *  - 与 rhythmBondLink / bondQualityPeakBridge 互补：本 gate 硬对齐同 ep 三元同框.
 *
 * rhythms[]: { id, ep, shotSpec }
 * Per link: rhythmId + bondId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_RHYTHM / UNKNOWN_BOND / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_RHYTHM_FAIL / CHILD_BOND_FAIL / CHILD_PEAK_FAIL
 *  EP_NOT_TERNARY — link.ep = rhythm.ep = upgrade|dissolve = peakEp
 *  RHYTHM_WITHOUT_BRIDGE / TERMINAL_WITHOUT_BRIDGE / PEAK_WITHOUT_BRIDGE
 *  PENDING_BOND (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { evaluateStoryRhythm } from './story-rhythm-gate';
import {
  BondContractEntrySchema,
  evaluateBondContract,
} from './bond-contract-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const RhythmBondPeakRhythmEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const RhythmBondPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  rhythmId: z.string().min(1),
  bondId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const RhythmBondPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  rhythms: z.array(RhythmBondPeakRhythmEntrySchema),
  bonds: z.array(BondContractEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(RhythmBondPeakBridgeLinkSchema),
});

export type RhythmBondPeakBridgeLedger = z.infer<typeof RhythmBondPeakBridgeLedgerSchema>;

export type RhythmBondPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_RHYTHM'
    | 'UNKNOWN_BOND'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_RHYTHM_FAIL'
    | 'CHILD_BOND_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'EP_NOT_TERNARY'
    | 'RHYTHM_WITHOUT_BRIDGE'
    | 'TERMINAL_WITHOUT_BRIDGE'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'PENDING_BOND';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface RhythmBondPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    rhythms: number;
    bonds: number;
    peaks: number;
    latestEp: number;
  };
  findings: RhythmBondPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

function bondTerminalEp(b: { upgradeEp?: number; dissolveEp?: number }): number | undefined {
  return b.upgradeEp ?? b.dissolveEp;
}

export function evaluateRhythmBondPeakBridge(input: unknown): RhythmBondPeakBridgeReport {
  const parsed = RhythmBondPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, rhythms: 0, bonds: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, rhythms, bonds, peaks, links } = parsed.data;
  const findings: RhythmBondPeakBridgeFinding[] = [];
  const push = (x: RhythmBondPeakBridgeFinding) => findings.push(x);

  for (const rh of rhythms) {
    const r = evaluateStoryRhythm(rh.shotSpec);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_RHYTHM_FAIL',
        severity: 'FAIL',
        ids: [rh.id, ...childFails.flatMap((f) => f.shotIds ?? [])],
        message: `rhythm ${rh.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 story-rhythm-gate',
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

  const pReport = evaluatePeakBeforePayoff({ series, latestEp, entries: peaks });
  if (pReport.verdict === 'FAIL') {
    const childFails = pReport.findings.filter((f) => f.severity === 'FAIL');
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

  const byR = new Map(rhythms.map((r) => [r.id, r]));
  const byB = new Map(bonds.map((b) => [b.id, b]));
  const byP = new Map(peaks.map((p) => [p.id, p]));
  const linkedR = new Set<string>();
  const linkedB = new Set<string>();
  const linkedP = new Set<string>();
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
    const rh = byR.get(link.rhythmId);
    if (!rh) {
      push({
        code: 'UNKNOWN_RHYTHM',
        severity: 'FAIL',
        ids: [link.id, link.rhythmId],
        message: `联表 ${link.id} 引用未知 rhythm ${link.rhythmId}`,
        fix: 'rhythmId 须存在于 rhythms[]',
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
    const peak = byP.get(link.peakId);
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

    const terminal = bondTerminalEp(bond);
    if (
      terminal === undefined ||
      peak.peakEp === undefined ||
      link.ep !== terminal ||
      link.ep !== rh.ep ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, rh.id, bond.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 rhythm=${rh.ep}/terminal=${terminal ?? '无'}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = rhythm.ep = upgradeEp|dissolveEp = peakEp',
      });
      continue;
    }

    linkedR.add(rh.id);
    linkedB.add(bond.id);
    linkedP.add(peak.id);
    aligned += 1;
  }

  for (const rh of rhythms) {
    if (!linkedR.has(rh.id)) {
      push({
        code: 'RHYTHM_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [rh.id],
        message: `rhythm ${rh.id} ep=E${rh.ep} 无 rhythm×bond×peak 桥`,
        fix: '为节奏集挂 RhythmBondPeakBridge',
      });
    }
  }
  for (const bond of bonds) {
    const terminal = bondTerminalEp(bond);
    if (terminal !== undefined && !linkedB.has(bond.id)) {
      push({
        code: 'TERMINAL_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [bond.id],
        message: `bond ${bond.id} terminal=E${terminal} 无 rhythm×bond×peak 桥`,
        fix: '为终局集挂 RhythmBondPeakBridge',
      });
    } else if (!linkedB.has(bond.id)) {
      push({
        code: 'PENDING_BOND',
        severity: 'WARN',
        ids: [bond.id],
        message: `bond ${bond.id} 尚未联表`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedP.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 rhythm×bond×peak 桥`,
        fix: '为峰值集挂 RhythmBondPeakBridge',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      rhythms: rhythms.length,
      bonds: bonds.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
