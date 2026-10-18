/**
 * V12 · Motif Callback Gate (视觉母题/道具回扣账本闸门), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (synopses / reviews / chart pages, no footage) of 2026-10-17~18 hits:
 *  - 《盛夏芬德拉》(马厩制片厂): 白玫瑰空镜三次——含苞(初遇)→半开(退婚)→盛放(互诉)；局部细节先于正脸特写。
 *  - 《首辅娇娘》: 守宫砂 → 画梅遮掩，身份视觉印记跨集反复回扣，不是一次性符号。
 *  - 《小奶团回裴家,全家抢着宠!》: 回裴家开局 → 偏见 → 真诚收哥哥们宠爱，亲情重建是结构性回扣。
 *
 * Distinct from foreshadow-ledger (剧情伏笔发酵) and stage-goal (季级终点/倒计时):
 * this gate audits recurring *visual/prop* motifs so a planted image actually comes back.
 *
 *  SCHEMA (FAIL)               ledger fails MotifCallbackLedgerSchema
 *  DUP_ID (FAIL)               motif id duplicated
 *  UNKNOWN_MOTIF (FAIL)        appearance references an undeclared motif
 *  FUTURE_EP (FAIL)            appearance.ep beyond latestEp
 *  NO_SEED (FAIL)              appearances exist but none with role=seed
 *  ECHO_BEFORE_SEED (FAIL)     an echo ep is earlier than the first seed
 *  PAYOFF_BEFORE_SEED (FAIL)   a payoff ep is earlier than the first seed
 *  UNDER_CALLBACKS (FAIL)      appearance count < minAppearances (default 3)
 *  MISSING_PAYOFF (WARN)       has seed+echo, still no payoff, and idle past maxIdleEps/2
 *  MOTIF_IDLE (WARN)           last appearance → latestEp gap > maxIdleEps (default 40)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';

const Ep = z.number().int().positive();

export const MOTIF_ROLES = ['seed', 'echo', 'payoff'] as const;
export type MotifRole = (typeof MOTIF_ROLES)[number];

export const MotifEntrySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  kind: z.enum(['prop', 'visual_mark', 'gesture', 'location', 'other']),
  note: z.string().optional(),
});

export const MotifAppearanceSchema = z.object({
  motifId: z.string().min(1),
  ep: Ep,
  role: z.enum(MOTIF_ROLES),
  visualState: z.string().min(1).optional(),
  shotId: z.string().min(1).optional(),
  note: z.string().optional(),
});

export const MotifCallbackLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
});

export type MotifCallbackLedger = z.infer<typeof MotifCallbackLedgerSchema>;
type MotifAppearance = z.infer<typeof MotifAppearanceSchema>;

export interface MotifCallbackOptions {
  minAppearances?: number;
  maxIdleEps?: number;
}

export const MOTIF_CALLBACK_DEFAULTS: Required<MotifCallbackOptions> = {
  minAppearances: 3,
  maxIdleEps: 40,
};

export type MotifCallbackFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_MOTIF'
    | 'FUTURE_EP'
    | 'NO_SEED'
    | 'ECHO_BEFORE_SEED'
    | 'PAYOFF_BEFORE_SEED'
    | 'UNDER_CALLBACKS'
    | 'MISSING_PAYOFF'
    | 'MOTIF_IDLE';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface MotifCallbackReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    motifs: number;
    appearances: number;
    underCallbacks: number;
    idle: number;
    latestEp: number;
  };
  findings: MotifCallbackFinding[];
  thresholds: Required<MotifCallbackOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateMotifCallbacks(
  input: unknown,
  opts: MotifCallbackOptions = {},
): MotifCallbackReport {
  const t: Required<MotifCallbackOptions> = { ...MOTIF_CALLBACK_DEFAULTS, ...opts };
  const empty = {
    motifs: 0,
    appearances: 0,
    underCallbacks: 0,
    idle: 0,
    latestEp: 0,
  };

  const parsed = MotifCallbackLedgerSchema.safeParse(input);
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
  const findings: MotifCallbackFinding[] = [];
  let underCallbacks = 0;
  let idle = 0;

  const idCounts = new Map<string, number>();
  for (const m of ledger.motifs) {
    idCounts.set(m.id, (idCounts.get(m.id) ?? 0) + 1);
  }
  const dups = [...idCounts.entries()].filter(([, n]) => n > 1).map(([id]) => id);
  if (dups.length) {
    findings.push({
      code: 'DUP_ID',
      severity: 'FAIL',
      message: `duplicate motif id(s): ${dups.join(', ')}`,
      ids: dups,
      fix: 'Keep one MotifEntry per id',
    });
  }

  const motifIds = new Set(ledger.motifs.map((m) => m.id));
  const byMotif = new Map<string, MotifAppearance[]>();

  for (const a of ledger.appearances) {
    if (!motifIds.has(a.motifId)) {
      findings.push({
        code: 'UNKNOWN_MOTIF',
        severity: 'FAIL',
        message: `appearance references undeclared motif ${a.motifId}`,
        ids: [a.motifId],
      });
      continue;
    }
    if (a.ep > ledger.latestEp) {
      findings.push({
        code: 'FUTURE_EP',
        severity: 'FAIL',
        message: `${a.motifId}@E${a.ep} is beyond latestEp ${ledger.latestEp}`,
        ids: [a.motifId],
      });
    }
    const list = byMotif.get(a.motifId) ?? [];
    list.push(a);
    byMotif.set(a.motifId, list);
  }

  for (const m of ledger.motifs) {
    const apps = (byMotif.get(m.id) ?? []).slice().sort((x, y) => x.ep - y.ep || x.role.localeCompare(y.role));
    const seeds = apps.filter((a) => a.role === 'seed');
    const echoes = apps.filter((a) => a.role === 'echo');
    const payoffs = apps.filter((a) => a.role === 'payoff');

    if (apps.length > 0 && seeds.length === 0) {
      findings.push({
        code: 'NO_SEED',
        severity: 'FAIL',
        message: `motif ${m.id} has appearances but no seed`,
        ids: [m.id],
        fix: 'Plant a seed appearance before echo/payoff',
      });
    }

    const firstSeedEp = seeds.length ? Math.min(...seeds.map((s) => s.ep)) : undefined;

    if (firstSeedEp !== undefined) {
      for (const e of echoes) {
        if (e.ep < firstSeedEp) {
          findings.push({
            code: 'ECHO_BEFORE_SEED',
            severity: 'FAIL',
            message: `motif ${m.id} echo@E${e.ep} before seed@E${firstSeedEp}`,
            ids: [m.id],
          });
        }
      }
      for (const p of payoffs) {
        if (p.ep < firstSeedEp) {
          findings.push({
            code: 'PAYOFF_BEFORE_SEED',
            severity: 'FAIL',
            message: `motif ${m.id} payoff@E${p.ep} before seed@E${firstSeedEp}`,
            ids: [m.id],
          });
        }
      }
    }

    if (apps.length < t.minAppearances) {
      underCallbacks += 1;
      findings.push({
        code: 'UNDER_CALLBACKS',
        severity: 'FAIL',
        message: `motif ${m.id} appears ${apps.length}× < minAppearances ${t.minAppearances}`,
        ids: [m.id],
        fix: `Add seed→echo→payoff callbacks until ≥ ${t.minAppearances} appearances (盛夏白玫瑰式三次回扣)`,
      });
    }

    if (seeds.length && echoes.length && payoffs.length === 0) {
      const lastEp = Math.max(...apps.map((a) => a.ep));
      const idleGap = ledger.latestEp - lastEp;
      if (idleGap > Math.floor(t.maxIdleEps / 2)) {
        findings.push({
          code: 'MISSING_PAYOFF',
          severity: 'WARN',
          message: `motif ${m.id} has seed+echo but no payoff; idle ${idleGap} eps since E${lastEp}`,
          ids: [m.id],
          fix: 'Close the visual arc with a payoff appearance (盛放/和解/印记落点)',
        });
      }
    }

    if (apps.length > 0) {
      const lastEp = Math.max(...apps.map((a) => a.ep));
      const idleGap = ledger.latestEp - lastEp;
      if (idleGap > t.maxIdleEps) {
        idle += 1;
        findings.push({
          code: 'MOTIF_IDLE',
          severity: 'WARN',
          message: `motif ${m.id} idle ${idleGap} eps since last appearance E${lastEp} (maxIdleEps=${t.maxIdleEps})`,
          ids: [m.id],
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
      motifs: ledger.motifs.length,
      appearances: ledger.appearances.length,
      underCallbacks,
      idle,
      latestEp: ledger.latestEp,
    },
    findings,
  };
}
