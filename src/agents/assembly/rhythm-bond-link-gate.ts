/**
 * V12 · Rhythm × Bond Link Gate (系列节奏 × 契约升级/解除 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 契约 upgrade/dissolve 集节奏须过 story-rhythm 密度门.
 *  - 与 rhythmForeshadowLink / frequencyBondLink 互补：本 gate 以 rhythm 联 bond.
 *
 * rhythms[]: { id, ep, shotSpec }
 *  SCHEMA / DUP_ID / UNKNOWN_RHYTHM / UNKNOWN_BOND / FUTURE_EP
 *  CHILD_RHYTHM_FAIL / CHILD_BOND_FAIL
 *  EP_NOT_TERMINAL — link.ep = rhythm.ep = upgradeEp|dissolveEp
 *  RHYTHM_WITHOUT_BOND / TERMINAL_WITHOUT_RHYTHM
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

const Ep = z.number().int().positive();

export const RhythmBondRhythmEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const RhythmBondLinkEntrySchema = z.object({
  id: z.string().min(1),
  rhythmId: z.string().min(1),
  bondId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const RhythmBondLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  rhythms: z.array(RhythmBondRhythmEntrySchema),
  bonds: z.array(BondContractEntrySchema),
  links: z.array(RhythmBondLinkEntrySchema),
});

export type RhythmBondLinkLedger = z.infer<typeof RhythmBondLinkLedgerSchema>;

export type RhythmBondLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_RHYTHM'
    | 'UNKNOWN_BOND'
    | 'FUTURE_EP'
    | 'CHILD_RHYTHM_FAIL'
    | 'CHILD_BOND_FAIL'
    | 'EP_NOT_TERMINAL'
    | 'RHYTHM_WITHOUT_BOND'
    | 'TERMINAL_WITHOUT_RHYTHM'
    | 'PENDING_BOND';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface RhythmBondLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    rhythms: number;
    bonds: number;
    latestEp: number;
  };
  findings: RhythmBondLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

function bondTerminalEp(b: { upgradeEp?: number; dissolveEp?: number }): number | undefined {
  return b.upgradeEp ?? b.dissolveEp;
}

export function evaluateRhythmBondLink(input: unknown): RhythmBondLinkReport {
  const parsed = RhythmBondLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, rhythms: 0, bonds: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, rhythms, bonds, links } = parsed.data;
  const findings: RhythmBondLinkFinding[] = [];
  const push = (x: RhythmBondLinkFinding) => findings.push(x);

  for (const ry of rhythms) {
    const r = evaluateStoryRhythm(ry.shotSpec);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_RHYTHM_FAIL',
        severity: 'FAIL',
        ids: [ry.id, ...childFails.flatMap((f) => f.shotIds ?? [])],
        message: `rhythm ${ry.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
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

  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const l of links) {
    if (seen.has(l.id)) dups.add(l.id);
    else seen.add(l.id);
  }
  for (const id of dups) {
    push({ code: 'DUP_ID', severity: 'FAIL', ids: [id], message: `联表ID重复：${id}`, fix: '联表 id 须唯一' });
  }

  const byRy = new Map(rhythms.map((r) => [r.id, r]));
  const byB = new Map(bonds.map((b) => [b.id, b]));
  const pairedRy = new Set<string>();
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
    const ry = byRy.get(link.rhythmId);
    if (!ry) {
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

    const term = bondTerminalEp(bond);
    if (term === undefined || link.ep !== term || link.ep !== ry.ep) {
      push({
        code: 'EP_NOT_TERMINAL',
        severity: 'FAIL',
        ids: [link.id, ry.id, bond.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 rhythm=${ry.ep}/terminal=${term ?? '无'}`,
        fix: '契约终局须踩节奏档同集',
      });
      continue;
    }

    pairedRy.add(ry.id);
    pairedB.add(bond.id);
    aligned += 1;
  }

  for (const ry of rhythms) {
    if (!pairedRy.has(ry.id)) {
      push({
        code: 'RHYTHM_WITHOUT_BOND',
        severity: 'FAIL',
        ids: [ry.id],
        message: `rhythm ${ry.id} 无 bond 联表`,
        fix: '为节奏档挂 RhythmBondLink',
      });
    }
  }
  for (const bond of bonds) {
    const term = bondTerminalEp(bond);
    if (term !== undefined && !pairedB.has(bond.id)) {
      push({
        code: 'TERMINAL_WITHOUT_RHYTHM',
        severity: 'FAIL',
        ids: [bond.id],
        message: `bond ${bond.id} terminal=E${term} 无 rhythm 联表`,
        fix: '为契约终局集挂 RhythmBondLink',
      });
    } else if (!pairedB.has(bond.id)) {
      push({
        code: 'PENDING_BOND',
        severity: 'WARN',
        ids: [bond.id],
        message: `bond ${bond.id} 尚未联表到 rhythm`,
        fix: '补 links[] 或确认旁路',
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
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
