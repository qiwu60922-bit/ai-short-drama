/**
 * V12 · Ability × Alliance Link Gate (金手指 × 同盟 payoff 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《伪人降临》/《反派拿捏》: 同盟护短 payoff 常踩金手指使用窗.
 *  - ability-rule 管 acquired/use；alliance-ledger 管 seed→payoff——本 gate 硬对齐 use@payoff.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_ABILITY / UNKNOWN_ALLIANCE / FUTURE_EP
 *  CHILD_ABILITY_FAIL / CHILD_ALLIANCE_FAIL
 *  EP_NOT_PAYOFF — link.ep = alliance.payoff 且 holder 在该 ep 有 use
 *  PAYOFF_WITHOUT_ABILITY / NO_USE_AT_PAYOFF
 *  PENDING_ABILITY (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  AbilityEntrySchema,
  AbilityUseSchema,
  evaluateAbilityRules,
} from './ability-rule-gate';
import {
  AllianceEntrySchema,
  AllianceEventSchema,
  evaluateAllianceLedger,
} from './alliance-ledger-gate';

const Ep = z.number().int().positive();

export const AbilityAllianceLinkEntrySchema = z.object({
  id: z.string().min(1),
  abilityId: z.string().min(1),
  allianceId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const AbilityAllianceLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  links: z.array(AbilityAllianceLinkEntrySchema),
});

export type AbilityAllianceLinkLedger = z.infer<typeof AbilityAllianceLinkLedgerSchema>;

export type AbilityAllianceLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_ABILITY'
    | 'UNKNOWN_ALLIANCE'
    | 'FUTURE_EP'
    | 'CHILD_ABILITY_FAIL'
    | 'CHILD_ALLIANCE_FAIL'
    | 'EP_NOT_PAYOFF'
    | 'PAYOFF_WITHOUT_ABILITY'
    | 'NO_USE_AT_PAYOFF'
    | 'PENDING_ABILITY';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AbilityAllianceLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    abilities: number;
    alliances: number;
    latestEp: number;
  };
  findings: AbilityAllianceLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAbilityAllianceLink(input: unknown): AbilityAllianceLinkReport {
  const parsed = AbilityAllianceLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, abilities: 0, alliances: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, abilities, uses, alliances, events, links } = parsed.data;
  const findings: AbilityAllianceLinkFinding[] = [];
  const push = (x: AbilityAllianceLinkFinding) => findings.push(x);

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

  const alReport = evaluateAllianceLedger({ series, latestEp, alliances, events });
  if (alReport.verdict === 'FAIL') {
    const childFails = alReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_ALLIANCE_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌同盟账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 alliance-ledger-gate',
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
  const byAl = new Map(alliances.map((a) => [a.id, a]));
  const payoffByAlliance = new Map<string, number>();
  for (const ev of events) {
    if (ev.role === 'payoff') payoffByAlliance.set(ev.allianceId, ev.ep);
  }
  const pairedAbs = new Set<string>();
  const pairedAl = new Set<string>();
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
    const alliance = byAl.get(link.allianceId);
    if (!alliance) {
      push({
        code: 'UNKNOWN_ALLIANCE',
        severity: 'FAIL',
        ids: [link.id, link.allianceId],
        message: `联表 ${link.id} 引用未知 alliance ${link.allianceId}`,
        fix: 'allianceId 须存在于 alliances[]',
      });
      continue;
    }

    const payoffEp = payoffByAlliance.get(alliance.id);
    if (payoffEp === undefined || link.ep !== payoffEp) {
      push({
        code: 'EP_NOT_PAYOFF',
        severity: 'FAIL',
        ids: [link.id, ab.id, alliance.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 payoff=${payoffEp ?? '无'}`,
        fix: '金手指使用须踩同盟 payoff 集',
      });
      continue;
    }

    const used = uses.some((u) => u.abilityId === ab.id && u.by === ab.holder && u.ep === link.ep);
    if (!used) {
      push({
        code: 'NO_USE_AT_PAYOFF',
        severity: 'FAIL',
        ids: [link.id, ab.id],
        message: `${link.id}: ability ${ab.id} 在 payoff E${link.ep} 无 holder 使用`,
        fix: '同盟 payoff 集须有金手指使用',
      });
      continue;
    }

    pairedAbs.add(ab.id);
    pairedAl.add(alliance.id);
    aligned += 1;
  }

  for (const [aid, pep] of payoffByAlliance) {
    if (!pairedAl.has(aid)) {
      push({
        code: 'PAYOFF_WITHOUT_ABILITY',
        severity: 'FAIL',
        ids: [aid],
        message: `alliance ${aid} payoff=E${pep} 无 ability 联表`,
        fix: '为同盟 payoff 集挂 AbilityAllianceLink',
      });
    }
  }
  for (const a of abilities) {
    if (!pairedAbs.has(a.id)) {
      push({
        code: 'PENDING_ABILITY',
        severity: 'WARN',
        ids: [a.id],
        message: `ability ${a.id} 尚未联表到 alliance`,
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
      alliances: alliances.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
