/**
 * V12 · Alliance × Mask Link Gate (同盟 payoff × 伪装揭穿 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《反派拿捏》: 同盟护短 payoff 常与 mask reveal 同集，避免空壳揭穿.
 *  - alliance-ledger 管 seed→echo→payoff；persona-mask 管 reveal——本 gate 硬对齐.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_ALLIANCE / UNKNOWN_MASK / FUTURE_EP
 *  CHILD_ALLIANCE_FAIL / CHILD_MASK_FAIL
 *  EP_NOT_PAYOFF_REVEAL — link.ep = alliance.payoff = revealEp
 *  PAYOFF_WITHOUT_MASK / REVEAL_WITHOUT_ALLIANCE
 *  PENDING_ALLIANCE (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  AllianceEntrySchema,
  AllianceEventSchema,
  evaluateAllianceLedger,
} from './alliance-ledger-gate';
import {
  PersonaMaskEntrySchema,
  evaluatePersonaMask,
} from './persona-mask-gate';

const Ep = z.number().int().positive();

export const AllianceMaskLinkEntrySchema = z.object({
  id: z.string().min(1),
  allianceId: z.string().min(1),
  maskId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const AllianceMaskLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  masks: z.array(PersonaMaskEntrySchema),
  links: z.array(AllianceMaskLinkEntrySchema),
});

export type AllianceMaskLinkLedger = z.infer<typeof AllianceMaskLinkLedgerSchema>;

export type AllianceMaskLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_ALLIANCE'
    | 'UNKNOWN_MASK'
    | 'FUTURE_EP'
    | 'CHILD_ALLIANCE_FAIL'
    | 'CHILD_MASK_FAIL'
    | 'EP_NOT_PAYOFF_REVEAL'
    | 'PAYOFF_WITHOUT_MASK'
    | 'REVEAL_WITHOUT_ALLIANCE'
    | 'PENDING_ALLIANCE';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AllianceMaskLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    alliances: number;
    masks: number;
    latestEp: number;
  };
  findings: AllianceMaskLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAllianceMaskLink(input: unknown): AllianceMaskLinkReport {
  const parsed = AllianceMaskLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, alliances: 0, masks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, alliances, events, masks, links } = parsed.data;
  const findings: AllianceMaskLinkFinding[] = [];
  const push = (x: AllianceMaskLinkFinding) => findings.push(x);

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

  const mReport = evaluatePersonaMask({ series, latestEp, entries: masks });
  if (mReport.verdict === 'FAIL') {
    const childFails = mReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_MASK_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌伪装账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 persona-mask-gate',
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

  const byAl = new Map(alliances.map((a) => [a.id, a]));
  const byM = new Map(masks.map((m) => [m.id, m]));
  const payoffByAlliance = new Map<string, number>();
  for (const ev of events) {
    if (ev.role === 'payoff') payoffByAlliance.set(ev.allianceId, ev.ep);
  }
  const pairedAl = new Set<string>();
  const pairedM = new Set<string>();
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
    const mask = byM.get(link.maskId);
    if (!mask) {
      push({
        code: 'UNKNOWN_MASK',
        severity: 'FAIL',
        ids: [link.id, link.maskId],
        message: `联表 ${link.id} 引用未知 mask ${link.maskId}`,
        fix: 'maskId 须存在于 masks[]',
      });
      continue;
    }

    const payoffEp = payoffByAlliance.get(alliance.id);
    if (payoffEp === undefined || mask.revealEp === undefined || link.ep !== payoffEp || link.ep !== mask.revealEp) {
      push({
        code: 'EP_NOT_PAYOFF_REVEAL',
        severity: 'FAIL',
        ids: [link.id, alliance.id, mask.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 payoff=${payoffEp ?? '无'}/reveal=${mask.revealEp ?? '无'}`,
        fix: '同盟 payoff 须踩 mask.revealEp',
      });
      continue;
    }

    pairedAl.add(alliance.id);
    pairedM.add(mask.id);
    aligned += 1;
  }

  for (const [aid, pep] of payoffByAlliance) {
    if (!pairedAl.has(aid)) {
      push({
        code: 'PAYOFF_WITHOUT_MASK',
        severity: 'FAIL',
        ids: [aid],
        message: `alliance ${aid} payoff=E${pep} 无 mask 联表`,
        fix: '为同盟 payoff 集挂 AllianceMaskLink',
      });
    }
  }
  for (const a of alliances) {
    if (!pairedAl.has(a.id) && !payoffByAlliance.has(a.id)) {
      push({
        code: 'PENDING_ALLIANCE',
        severity: 'WARN',
        ids: [a.id],
        message: `alliance ${a.id} 尚未联表到 mask`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const m of masks) {
    if (m.revealEp !== undefined && !pairedM.has(m.id)) {
      push({
        code: 'REVEAL_WITHOUT_ALLIANCE',
        severity: 'FAIL',
        ids: [m.id],
        message: `mask ${m.id} revealEp=E${m.revealEp} 无 alliance 联表`,
        fix: '在 links[] 挂 allianceId↔maskId',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      alliances: alliances.length,
      masks: masks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
