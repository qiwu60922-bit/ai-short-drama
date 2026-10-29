/**
 * V12 · Alliance × Quality-Leap Link Gate (同盟 payoff × 表演门 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《反派拿捏》: 同盟护短 payoff 当集镜须过表演/情绪门，不能空壳甩护短.
 *  - alliance-ledger 管 seed→payoff；quality-leap 管 payoff 镜可见表演——本 gate 硬联表.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_ALLIANCE / FUTURE_EP
 *  CHILD_ALLIANCE_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_PAYOFF — link.ep 须等于 alliance.payoff
 *  PAYOFF_WITHOUT_QUALITY — 已 payoff 无联表 quality
 *  PENDING_ALLIANCE (WARN)
 *  LOW_INTENSITY_AT_PAYOFF (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  AllianceEntrySchema,
  AllianceEventSchema,
  evaluateAllianceLedger,
} from './alliance-ledger-gate';
import {
  QualityLeapDocSchema,
  evaluateQualityLeap,
} from './quality-leap-gate';

const Ep = z.number().int().positive();

export const AllianceQualityLinkEntrySchema = z.object({
  id: z.string().min(1),
  allianceId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const AllianceQualityLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minPayoffIntense: z.number().int().min(1).max(5).optional(),
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  links: z.array(AllianceQualityLinkEntrySchema),
});

export type AllianceQualityLinkLedger = z.infer<typeof AllianceQualityLinkLedgerSchema>;

export type AllianceQualityLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_ALLIANCE'
    | 'FUTURE_EP'
    | 'CHILD_ALLIANCE_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_PAYOFF'
    | 'PAYOFF_WITHOUT_QUALITY'
    | 'PENDING_ALLIANCE'
    | 'LOW_INTENSITY_AT_PAYOFF';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AllianceQualityLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    alliances: number;
    latestEp: number;
  };
  findings: AllianceQualityLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

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

export function evaluateAllianceQualityLink(input: unknown): AllianceQualityLinkReport {
  const parsed = AllianceQualityLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, alliances: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, alliances, events, links, minPayoffIntense = 4 } = parsed.data;
  const findings: AllianceQualityLinkFinding[] = [];
  const push = (x: AllianceQualityLinkFinding) => findings.push(x);

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

  const byAl = new Map(alliances.map((a) => [a.id, a]));
  const payoffByAlliance = new Map<string, number>();
  for (const ev of events) {
    if (ev.role === 'payoff') payoffByAlliance.set(ev.allianceId, ev.ep);
  }
  const pairedPayoffs = new Set<string>();
  const pairedAlliances = new Set<string>();
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
    pairedAlliances.add(alliance.id);

    const payoffEp = payoffByAlliance.get(alliance.id);
    if (payoffEp === undefined || link.ep !== payoffEp) {
      push({
        code: 'EP_NOT_PAYOFF',
        severity: 'FAIL',
        ids: [link.id, alliance.id],
        message: `${link.id}: ep=E${link.ep} ≠ payoffEp=${payoffEp ?? '无'}`,
        fix: 'link.ep 须对准同盟 payoff 集',
      });
      continue;
    }
    pairedPayoffs.add(alliance.id);

    const ql = evaluateQualityLeap(link.qualityLeap);
    if (ql.verdict === 'FAIL') {
      const childFails = ql.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_QUALITY_FAIL',
        severity: 'FAIL',
        ids: [link.id, alliance.id, ...childFails.flatMap((f) => f.ids ?? [])],
        message: `${link.id}: qualityLeap FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '同盟 payoff 镜须过表演/情绪/口型门',
      });
      continue;
    }

    const intense = maxIntensity(link.qualityLeap);
    if (intense < minPayoffIntense) {
      push({
        code: 'LOW_INTENSITY_AT_PAYOFF',
        severity: 'WARN',
        ids: [link.id, alliance.id],
        message: `${link.id}: payoff 强度 ${intense} < minPayoffIntense=${minPayoffIntense}`,
        fix: '抬高 payoff 镜 intensity',
      });
    }

    aligned += 1;
  }

  for (const [aid, pep] of payoffByAlliance) {
    if (!pairedPayoffs.has(aid)) {
      push({
        code: 'PAYOFF_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [aid],
        message: `alliance ${aid} payoff=E${pep} 无 quality 联表`,
        fix: '在 links[] 挂 allianceId + qualityLeap@payoffEp',
      });
    }
  }
  for (const a of alliances) {
    if (!pairedAlliances.has(a.id)) {
      push({
        code: 'PENDING_ALLIANCE',
        severity: 'WARN',
        ids: [a.id],
        message: `alliance ${a.id} 尚未联表到 quality`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      alliances: alliances.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
