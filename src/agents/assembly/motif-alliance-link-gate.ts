/**
 * V12 · Motif × Alliance Link Gate (视觉母题 × 同盟 payoff 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《反派拿捏》/《盛夏芬德拉》: 母题回扣常踩同盟护短 payoff 集.
 *  - 与 allianceMotifLink（alliance 主键）互补：本 gate 以 motif 为主键.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_MOTIF / UNKNOWN_ALLIANCE / FUTURE_EP
 *  CHILD_MOTIF_FAIL / CHILD_ALLIANCE_FAIL
 *  EP_NOT_PAYOFF_APPEARANCE — link.ep = alliance.payoff 且 motif appearance@ep
 *  MOTIF_WITHOUT_ALLIANCE / PAYOFF_WITHOUT_MOTIF
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
  MotifEntrySchema,
  MotifAppearanceSchema,
  evaluateMotifCallbacks,
} from './motif-callback-gate';

const Ep = z.number().int().positive();

export const MotifAllianceLinkEntrySchema = z.object({
  id: z.string().min(1),
  motifId: z.string().min(1),
  allianceId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const MotifAllianceLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  links: z.array(MotifAllianceLinkEntrySchema),
});

export type MotifAllianceLinkLedger = z.infer<typeof MotifAllianceLinkLedgerSchema>;

export type MotifAllianceLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_MOTIF'
    | 'UNKNOWN_ALLIANCE'
    | 'FUTURE_EP'
    | 'CHILD_MOTIF_FAIL'
    | 'CHILD_ALLIANCE_FAIL'
    | 'EP_NOT_PAYOFF_APPEARANCE'
    | 'MOTIF_WITHOUT_ALLIANCE'
    | 'PAYOFF_WITHOUT_MOTIF'
    | 'PENDING_ALLIANCE';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface MotifAllianceLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    motifs: number;
    alliances: number;
    latestEp: number;
  };
  findings: MotifAllianceLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateMotifAllianceLink(input: unknown): MotifAllianceLinkReport {
  const parsed = MotifAllianceLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, motifs: 0, alliances: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, motifs, appearances, alliances, events, links } = parsed.data;
  const findings: MotifAllianceLinkFinding[] = [];
  const push = (x: MotifAllianceLinkFinding) => findings.push(x);

  const motifReport = evaluateMotifCallbacks({ series, latestEp, motifs, appearances });
  if (motifReport.verdict === 'FAIL') {
    const childFails = motifReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_MOTIF_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌母题账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 motif-callback-gate',
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

  const byMotif = new Map(motifs.map((m) => [m.id, m]));
  const byAl = new Map(alliances.map((a) => [a.id, a]));
  const payoffByAlliance = new Map<string, number>();
  for (const ev of events) {
    if (ev.role === 'payoff') payoffByAlliance.set(ev.allianceId, ev.ep);
  }
  const pairedMotifs = new Set<string>();
  const pairedAls = new Set<string>();
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
    const motif = byMotif.get(link.motifId);
    if (!motif) {
      push({
        code: 'UNKNOWN_MOTIF',
        severity: 'FAIL',
        ids: [link.id, link.motifId],
        message: `联表 ${link.id} 引用未知 motif ${link.motifId}`,
        fix: 'motifId 须存在于 motifs[]',
      });
      continue;
    }
    const al = byAl.get(link.allianceId);
    if (!al) {
      push({
        code: 'UNKNOWN_ALLIANCE',
        severity: 'FAIL',
        ids: [link.id, link.allianceId],
        message: `联表 ${link.id} 引用未知 alliance ${link.allianceId}`,
        fix: 'allianceId 须存在于 alliances[]',
      });
      continue;
    }

    const payoffEp = payoffByAlliance.get(al.id);
    const hasAppearance = appearances.some((a) => a.motifId === motif.id && a.ep === link.ep);
    if (payoffEp === undefined || link.ep !== payoffEp || !hasAppearance) {
      push({
        code: 'EP_NOT_PAYOFF_APPEARANCE',
        severity: 'FAIL',
        ids: [link.id, motif.id, al.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 payoff=${payoffEp ?? '无'}/appearance=${hasAppearance ? '有' : '无'}`,
        fix: 'link.ep = alliance payoff 且 motif appearance@ep',
      });
      continue;
    }

    pairedMotifs.add(motif.id);
    pairedAls.add(al.id);
    aligned += 1;
  }

  for (const motif of motifs) {
    const hasPayoff = appearances.some((a) => a.motifId === motif.id && a.role === 'payoff');
    if (hasPayoff && !pairedMotifs.has(motif.id)) {
      push({
        code: 'MOTIF_WITHOUT_ALLIANCE',
        severity: 'FAIL',
        ids: [motif.id],
        message: `motif ${motif.id} 有 payoff appearance 无 alliance 联表`,
        fix: '为母题回扣集挂 MotifAllianceLink',
      });
    }
  }
  for (const [aid, pep] of payoffByAlliance) {
    if (!pairedAls.has(aid)) {
      push({
        code: 'PAYOFF_WITHOUT_MOTIF',
        severity: 'FAIL',
        ids: [aid],
        message: `alliance ${aid} payoff=E${pep} 无 motif 联表`,
        fix: '为同盟 payoff 集挂 MotifAllianceLink',
      });
    }
  }
  for (const a of alliances) {
    if (!pairedAls.has(a.id) && !payoffByAlliance.has(a.id)) {
      push({
        code: 'PENDING_ALLIANCE',
        severity: 'WARN',
        ids: [a.id],
        message: `alliance ${a.id} 尚未联表到 motif（motif 主键）`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      motifs: motifs.length,
      alliances: alliances.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
