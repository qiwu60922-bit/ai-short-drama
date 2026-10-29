/**
 * V12 · Bond × Persona Link Gate (契约升级/解除 × 人设卡 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《逃婚三年》/《机长先生》: 契约真心升级常对齐当事人外形卡.
 *  - bond-contract 管 upgrade|dissolve；persona-card 管外形——本 gate 以 bond 为主键硬联表.
 *  - 与 personaBondLink（人设主键）互补：本 gate 强制「契约终局必须有人设」.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_BOND / UNKNOWN_CARD
 *  CHILD_BOND_FAIL / CHILD_PERSONA_FAIL
 *  PARTY_MISMATCH — card.name 须是 bond.partyA|partyB
 *  TERMINAL_WITHOUT_PERSONA / PENDING_BOND (WARN) / PENDING_CARD (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  BondContractEntrySchema,
  evaluateBondContract,
} from './bond-contract-gate';
import { PersonaCardSchema, evaluatePersonaCard } from './persona-card-gate';

const Ep = z.number().int().positive();

export const BondPersonaLinkEntrySchema = z.object({
  id: z.string().min(1),
  bondId: z.string().min(1),
  cardSlug: z.string().min(1),
  note: z.string().optional(),
});

export const BondPersonaLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  bonds: z.array(BondContractEntrySchema),
  cards: z.array(PersonaCardSchema).min(1),
  links: z.array(BondPersonaLinkEntrySchema),
});

export type BondPersonaLinkLedger = z.infer<typeof BondPersonaLinkLedgerSchema>;

export type BondPersonaLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_BOND'
    | 'UNKNOWN_CARD'
    | 'CHILD_BOND_FAIL'
    | 'CHILD_PERSONA_FAIL'
    | 'PARTY_MISMATCH'
    | 'TERMINAL_WITHOUT_PERSONA'
    | 'PENDING_BOND'
    | 'PENDING_CARD';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface BondPersonaLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    bonds: number;
    cards: number;
    latestEp: number;
  };
  findings: BondPersonaLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

function bondTerminalEp(b: { upgradeEp?: number; dissolveEp?: number }): number | undefined {
  return b.upgradeEp ?? b.dissolveEp;
}

export function evaluateBondPersonaLink(input: unknown): BondPersonaLinkReport {
  const parsed = BondPersonaLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, bonds: 0, cards: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, bonds, cards, links } = parsed.data;
  const findings: BondPersonaLinkFinding[] = [];
  const push = (x: BondPersonaLinkFinding) => findings.push(x);

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

  for (const card of cards) {
    const pReport = evaluatePersonaCard(card);
    if (pReport.verdict === 'FAIL') {
      const childFails = pReport.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_PERSONA_FAIL',
        severity: 'FAIL',
        ids: [card.slug, ...childFails.flatMap((f) => (f.path ? [f.path] : []))],
        message: `内嵌人设卡 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 persona-card-gate',
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

  const byBond = new Map(bonds.map((b) => [b.id, b]));
  const byCard = new Map(cards.map((c) => [c.slug, c]));
  const pairedBonds = new Set<string>();
  const pairedCards = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const bond = byBond.get(link.bondId);
    const card = byCard.get(link.cardSlug);
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
    if (!card) {
      push({
        code: 'UNKNOWN_CARD',
        severity: 'FAIL',
        ids: [link.id, link.cardSlug],
        message: `联表 ${link.id} 引用未知 card ${link.cardSlug}`,
        fix: 'cardSlug 须存在于 cards[]',
      });
      continue;
    }

    if (card.name !== bond.partyA && card.name !== bond.partyB) {
      push({
        code: 'PARTY_MISMATCH',
        severity: 'FAIL',
        ids: [link.id, bond.id, card.slug],
        message: `${link.id}: card.name=${card.name} 非 partyA|partyB (${bond.partyA}/${bond.partyB})`,
        fix: '人设卡须对齐契约当事人',
      });
      continue;
    }

    pairedBonds.add(bond.id);
    pairedCards.add(card.slug);
    aligned += 1;
  }

  for (const bond of bonds) {
    const terminal = bondTerminalEp(bond);
    if (terminal !== undefined && !pairedBonds.has(bond.id)) {
      push({
        code: 'TERMINAL_WITHOUT_PERSONA',
        severity: 'FAIL',
        ids: [bond.id],
        message: `bond ${bond.id} terminal=E${terminal} 无 persona 联表`,
        fix: '为契约终局集挂 BondPersonaLink',
      });
    } else if (!pairedBonds.has(bond.id)) {
      push({
        code: 'PENDING_BOND',
        severity: 'WARN',
        ids: [bond.id],
        message: `bond ${bond.id} 尚未联表到 persona`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const c of cards) {
    if (!pairedCards.has(c.slug)) {
      push({
        code: 'PENDING_CARD',
        severity: 'WARN',
        ids: [c.slug],
        message: `card ${c.slug} 尚未联表到 bond`,
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
      cards: cards.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
