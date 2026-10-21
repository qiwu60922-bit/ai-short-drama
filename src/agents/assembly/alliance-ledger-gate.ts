/**
 * V12 · Alliance Ledger Gate (人物同盟账本闸门), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (synopses / chart pages, no footage) of 2026-10-20~21 hits:
 *  - 《觉醒伪神：神明弃我我自为神7》(化境文化): 恶鬼之牙公会收留神弃少年 → 护短兜底 →
 *    赠稀有神印解锁双形态 — 同盟 seed→echo→payoff，成员 ≥2。
 *  - 《七块五养全家，丈夫归来后替我撑腰》(快创): 夫妻同盟被截留津贴压垮 → 电话惊悉 →
 *    丈夫推开祠堂门拿「领条」撑腰 — 同盟 payoff 必须落地成可感知动作/物证。
 *  - 《天降福星：沈家小渔》: 退婚羞辱后绑定福星系统 / 航海世家认干孙女 —
 *    新同盟立刻 seed，不能只宣告「我开挂了」而不落人物关系。
 *
 * Distinct from motif-callback (视觉/道具回扣) and foreshadow-ledger (剧情伏笔发酵):
 * this gate audits *character alliances* so a planted bond actually echoes and pays off.
 *
 *  SCHEMA (FAIL)               ledger fails AllianceLedgerSchema
 *  DUP_ID (FAIL)               alliance id duplicated
 *  THIN_MEMBERSHIP (FAIL)      alliance.members.length < 2
 *  UNKNOWN_ALLIANCE (FAIL)     event references an undeclared alliance
 *  FUTURE_EP (FAIL)            formedEp / event.ep beyond latestEp
 *  NO_SEED (FAIL)              events exist but none with role=seed
 *  ECHO_BEFORE_SEED (FAIL)     an echo ep is earlier than the first seed
 *  PAYOFF_BEFORE_SEED (FAIL)   a payoff ep is earlier than the first seed
 *  UNDER_EVENTS (FAIL)         event count < minEvents (default 3)
 *  MISSING_PAYOFF (WARN)       has seed+echo, still no payoff, idle past maxIdleEps/2
 *  ALLIANCE_IDLE (WARN)        last event → latestEp gap > maxIdleEps (default 30)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';

const Ep = z.number().int().positive();

export const ALLIANCE_EVENT_ROLES = ['seed', 'echo', 'payoff'] as const;
export type AllianceEventRole = (typeof ALLIANCE_EVENT_ROLES)[number];

export const AllianceEntrySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  members: z.array(z.string().min(1)),
  formedEp: Ep.optional(),
  note: z.string().optional(),
});

export const AllianceEventSchema = z.object({
  allianceId: z.string().min(1),
  ep: Ep,
  role: z.enum(ALLIANCE_EVENT_ROLES),
  by: z.string().min(1).optional(),
  evidence: z.string().min(1).optional(),
  note: z.string().optional(),
});

export const AllianceLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
});

export type AllianceLedger = z.infer<typeof AllianceLedgerSchema>;
type AllianceEvent = z.infer<typeof AllianceEventSchema>;

export interface AllianceLedgerOptions {
  minEvents?: number;
  maxIdleEps?: number;
}

export const ALLIANCE_LEDGER_DEFAULTS: Required<AllianceLedgerOptions> = {
  minEvents: 3,
  maxIdleEps: 30,
};

export type AllianceLedgerFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'THIN_MEMBERSHIP'
    | 'UNKNOWN_ALLIANCE'
    | 'FUTURE_EP'
    | 'NO_SEED'
    | 'ECHO_BEFORE_SEED'
    | 'PAYOFF_BEFORE_SEED'
    | 'UNDER_EVENTS'
    | 'MISSING_PAYOFF'
    | 'ALLIANCE_IDLE';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AllianceLedgerReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    alliances: number;
    events: number;
    underEvents: number;
    idle: number;
    latestEp: number;
  };
  findings: AllianceLedgerFinding[];
  thresholds: Required<AllianceLedgerOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAllianceLedger(
  input: unknown,
  opts: AllianceLedgerOptions = {},
): AllianceLedgerReport {
  const t: Required<AllianceLedgerOptions> = { ...ALLIANCE_LEDGER_DEFAULTS, ...opts };
  const empty = {
    alliances: 0,
    events: 0,
    underEvents: 0,
    idle: 0,
    latestEp: 0,
  };

  const parsed = AllianceLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      thresholds: t,
      gates: GATES,
      metrics: empty,
      findings: [
        {
          code: 'SCHEMA',
          severity: 'FAIL',
          message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        },
      ],
    };
  }

  const ledger = parsed.data;
  const findings: AllianceLedgerFinding[] = [];
  let underEvents = 0;
  let idle = 0;

  const idCounts = new Map<string, number>();
  for (const a of ledger.alliances) {
    idCounts.set(a.id, (idCounts.get(a.id) ?? 0) + 1);
    if (a.members.length < 2) {
      findings.push({
        code: 'THIN_MEMBERSHIP',
        severity: 'FAIL',
        message: `alliance ${a.id} has ${a.members.length} member(s); need ≥2`,
        ids: [a.id],
        fix: '同盟至少两人（公会/夫妻/认亲）',
      });
    }
    if (a.formedEp !== undefined && a.formedEp > ledger.latestEp) {
      findings.push({
        code: 'FUTURE_EP',
        severity: 'FAIL',
        message: `alliance ${a.id} formedEp E${a.formedEp} is beyond latestEp ${ledger.latestEp}`,
        ids: [a.id],
      });
    }
  }
  const dups = [...idCounts.entries()].filter(([, n]) => n > 1).map(([id]) => id);
  if (dups.length) {
    findings.push({
      code: 'DUP_ID',
      severity: 'FAIL',
      message: `duplicate alliance id(s): ${dups.join(', ')}`,
      ids: dups,
      fix: 'Keep one AllianceEntry per id',
    });
  }

  const allianceIds = new Set(ledger.alliances.map((a) => a.id));
  const byAlliance = new Map<string, AllianceEvent[]>();

  for (const e of ledger.events) {
    if (!allianceIds.has(e.allianceId)) {
      findings.push({
        code: 'UNKNOWN_ALLIANCE',
        severity: 'FAIL',
        message: `event references undeclared alliance ${e.allianceId}`,
        ids: [e.allianceId],
      });
      continue;
    }
    if (e.ep > ledger.latestEp) {
      findings.push({
        code: 'FUTURE_EP',
        severity: 'FAIL',
        message: `${e.allianceId}@E${e.ep} is beyond latestEp ${ledger.latestEp}`,
        ids: [e.allianceId],
      });
    }
    const list = byAlliance.get(e.allianceId) ?? [];
    list.push(e);
    byAlliance.set(e.allianceId, list);
  }

  for (const a of ledger.alliances) {
    const evs = (byAlliance.get(a.id) ?? [])
      .slice()
      .sort((x, y) => x.ep - y.ep || x.role.localeCompare(y.role));
    const seeds = evs.filter((e) => e.role === 'seed');
    const echoes = evs.filter((e) => e.role === 'echo');
    const payoffs = evs.filter((e) => e.role === 'payoff');

    if (evs.length > 0 && seeds.length === 0) {
      findings.push({
        code: 'NO_SEED',
        severity: 'FAIL',
        message: `alliance ${a.id} has events but no seed`,
        ids: [a.id],
        fix: 'Plant a seed event (收留/结盟/认亲) before echo/payoff',
      });
    }

    const firstSeedEp = seeds.length ? Math.min(...seeds.map((s) => s.ep)) : undefined;

    if (firstSeedEp !== undefined) {
      for (const e of echoes) {
        if (e.ep < firstSeedEp) {
          findings.push({
            code: 'ECHO_BEFORE_SEED',
            severity: 'FAIL',
            message: `alliance ${a.id} echo@E${e.ep} before seed@E${firstSeedEp}`,
            ids: [a.id],
          });
        }
      }
      for (const p of payoffs) {
        if (p.ep < firstSeedEp) {
          findings.push({
            code: 'PAYOFF_BEFORE_SEED',
            severity: 'FAIL',
            message: `alliance ${a.id} payoff@E${p.ep} before seed@E${firstSeedEp}`,
            ids: [a.id],
          });
        }
      }
    }

    if (evs.length < t.minEvents) {
      underEvents += 1;
      findings.push({
        code: 'UNDER_EVENTS',
        severity: 'FAIL',
        message: `alliance ${a.id} has ${evs.length} event(s) < minEvents ${t.minEvents}`,
        ids: [a.id],
        fix: `Add seed→echo→payoff until ≥ ${t.minEvents} (恶鬼之牙护短式三拍)`,
      });
    }

    if (seeds.length && echoes.length && payoffs.length === 0) {
      const lastEp = Math.max(...evs.map((e) => e.ep));
      const idleGap = ledger.latestEp - lastEp;
      if (idleGap > Math.floor(t.maxIdleEps / 2)) {
        findings.push({
          code: 'MISSING_PAYOFF',
          severity: 'WARN',
          message: `alliance ${a.id} has seed+echo but no payoff; idle ${idleGap} eps since E${lastEp}`,
          ids: [a.id],
          fix: 'Close with a payoff action/evidence (赠神印/祠堂领条/当众认亲)',
        });
      }
    }

    if (evs.length > 0) {
      const lastEp = Math.max(...evs.map((e) => e.ep));
      const idleGap = ledger.latestEp - lastEp;
      if (idleGap > t.maxIdleEps) {
        idle += 1;
        findings.push({
          code: 'ALLIANCE_IDLE',
          severity: 'WARN',
          message: `alliance ${a.id} idle ${idleGap} eps since last event E${lastEp} (maxIdleEps=${t.maxIdleEps})`,
          ids: [a.id],
        });
      }
    }
  }

  const hasFail = findings.some((f) => f.severity === 'FAIL');
  return {
    verdict: hasFail ? 'FAIL' : 'PASS',
    thresholds: t,
    gates: GATES,
    metrics: {
      alliances: ledger.alliances.length,
      events: ledger.events.length,
      underEvents,
      idle,
      latestEp: ledger.latestEp,
    },
    findings,
  };
}
