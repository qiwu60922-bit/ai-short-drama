/**
 * V12 · Fake-Ledger Reconcile Gate (假账本条目级对账 · 糊涂账物证联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text breakdowns (structure only, no footage):
 *  - 《算不平的糊涂账》: 表面糊涂账 vs 真实账本；甩账本/流水/回单揭穿 —
 *    条目级 surface↔true 联表，claim 必须形成反差，true 侧须有 evidenceLabel.
 *  - persona-mask「假叙事」对照：本 gate 专管账本条目，不绑人设 maintain.
 *
 * Closes 2026-10-24/29 candidate: 假账本条目级对账.
 *
 *  SCHEMA / DUP_ID / FUTURE_EP
 *  UNKNOWN_SURFACE / UNKNOWN_TRUE
 *  NO_CONTRAST / EVIDENCE_MISSING
 *  RECONCILE_TOO_EARLY / RECONCILE_WITHOUT_LABEL
 *  SURFACE_UNRECONCILED (WARN) / PENDING_PAIR (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';

const Ep = z.number().int().positive();
const Sec = z.number().nonnegative().optional();

export const FakeLedgerEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  atSec: Sec,
  /** What the book claims, e.g. 「家用全交公婆」. */
  claim: z.string().min(1),
  amount: z.number().finite().optional(),
  party: z.string().min(1).optional(),
  /** Required on trueEntries when linked+reconciled. */
  evidenceLabel: z.string().min(1).optional(),
  note: z.string().optional(),
});

export const FakeLedgerLinkSchema = z.object({
  id: z.string().min(1),
  surfaceId: z.string().min(1),
  trueId: z.string().min(1),
  reconcileEp: Ep.optional(),
  reconcileAtSec: Sec,
  reconcileLabel: z.string().min(1).optional(),
  note: z.string().optional(),
});

export const FakeLedgerReconcileLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  surfaceEntries: z.array(FakeLedgerEntrySchema),
  trueEntries: z.array(FakeLedgerEntrySchema),
  links: z.array(FakeLedgerLinkSchema),
});

export type FakeLedgerReconcileLedger = z.infer<typeof FakeLedgerReconcileLedgerSchema>;

export type FakeLedgerReconcileFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'FUTURE_EP'
    | 'UNKNOWN_SURFACE'
    | 'UNKNOWN_TRUE'
    | 'NO_CONTRAST'
    | 'EVIDENCE_MISSING'
    | 'RECONCILE_TOO_EARLY'
    | 'RECONCILE_WITHOUT_LABEL'
    | 'SURFACE_UNRECONCILED'
    | 'PENDING_PAIR';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface FakeLedgerReconcileReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    surface: number;
    truth: number;
    links: number;
    reconciled: number;
    pending: number;
    latestEp: number;
  };
  findings: FakeLedgerReconcileFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

function collectDups(ids: string[]): string[] {
  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) dups.add(id);
    else seen.add(id);
  }
  return [...dups];
}

export function evaluateFakeLedgerReconcile(input: unknown): FakeLedgerReconcileReport {
  const parsed = FakeLedgerReconcileLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { surface: 0, truth: 0, links: 0, reconciled: 0, pending: 0, latestEp: 0 },
      findings: [
        {
          code: 'SCHEMA',
          severity: 'FAIL',
          message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        },
      ],
      gates: GATES,
    };
  }

  const { latestEp, surfaceEntries, trueEntries, links } = parsed.data;
  const findings: FakeLedgerReconcileFinding[] = [];
  const push = (x: FakeLedgerReconcileFinding) => findings.push(x);

  for (const id of collectDups([
    ...surfaceEntries.map((e) => e.id),
    ...trueEntries.map((e) => e.id),
    ...links.map((l) => l.id),
  ])) {
    push({
      code: 'DUP_ID',
      severity: 'FAIL',
      ids: [id],
      message: `账本/联表 ID 重复：${id}`,
      fix: 'surface/true/links 的 id 全局唯一',
    });
  }

  for (const e of [...surfaceEntries, ...trueEntries]) {
    if (e.ep > latestEp) {
      push({
        code: 'FUTURE_EP',
        severity: 'FAIL',
        ids: [e.id],
        message: `条目 ${e.id} ep=E${e.ep} > latestEp=${latestEp}`,
        fix: '条目集号不得超最新集',
      });
    }
  }

  const surfById = new Map(surfaceEntries.map((e) => [e.id, e]));
  const trueById = new Map(trueEntries.map((e) => [e.id, e]));
  const reconciledSurface = new Set<string>();
  let reconciled = 0;
  let pending = 0;

  for (const l of links) {
    const s = surfById.get(l.surfaceId);
    const t = trueById.get(l.trueId);

    if (!s) {
      push({
        code: 'UNKNOWN_SURFACE',
        severity: 'FAIL',
        ids: [l.id],
        message: `${l.id} 指向不存在的 surfaceId=${l.surfaceId}`,
        fix: 'surfaceId 须对应 surfaceEntries[].id',
      });
      continue;
    }
    if (!t) {
      push({
        code: 'UNKNOWN_TRUE',
        severity: 'FAIL',
        ids: [l.id],
        message: `${l.id} 指向不存在的 trueId=${l.trueId}`,
        fix: 'trueId 须对应 trueEntries[].id',
      });
      continue;
    }

    if (l.reconcileEp === undefined) {
      pending += 1;
      push({
        code: 'PENDING_PAIR',
        severity: 'WARN',
        ids: [l.id],
        message: `${l.id} 已联表但尚未甩账揭穿（蓄势中）`,
        fix: '写 reconcileEp + reconcileLabel（甩流水/回单等可感知物证拍）',
      });
      continue;
    }

    if (l.reconcileEp > latestEp) {
      push({
        code: 'FUTURE_EP',
        severity: 'FAIL',
        ids: [l.id],
        message: `${l.id} reconcileEp=E${l.reconcileEp} > latestEp=${latestEp}`,
        fix: '揭穿集不得超最新集',
      });
      continue;
    }

    if (!l.reconcileLabel) {
      push({
        code: 'RECONCILE_WITHOUT_LABEL',
        severity: 'FAIL',
        ids: [l.id],
        message: `${l.id} 已标 reconcileEp=E${l.reconcileEp} 但缺 reconcileLabel`,
        fix: '写清揭穿动作，如「甩银行流水揭穿截留」',
      });
      continue;
    }

    const minEp = Math.max(s.ep, t.ep);
    if (l.reconcileEp < minEp) {
      push({
        code: 'RECONCILE_TOO_EARLY',
        severity: 'FAIL',
        ids: [l.id, s.id, t.id],
        message: `${l.id} reconcileEp=E${l.reconcileEp} 早于条目 max(E${s.ep},E${t.ep})`,
        fix: '揭穿不得早于表面账/真实账的入账集',
      });
      continue;
    }

    if (s.claim === t.claim) {
      push({
        code: 'NO_CONTRAST',
        severity: 'FAIL',
        ids: [l.id, s.id, t.id],
        message: `${l.id} 表面与真实 claim 相同「${s.claim}」（无反差则不像糊涂账）`,
        fix: '真实账本须写出与表面账不同的事实表述',
      });
      continue;
    }

    if (!t.evidenceLabel) {
      push({
        code: 'EVIDENCE_MISSING',
        severity: 'FAIL',
        ids: [l.id, t.id],
        message: `${l.id} 真实条目 ${t.id} 缺 evidenceLabel（揭穿须有物证）`,
        fix: '写 evidenceLabel，如「银行流水截图」「转账回单」',
      });
      continue;
    }

    reconciledSurface.add(s.id);
    reconciled += 1;
  }

  for (const s of surfaceEntries) {
    if (!reconciledSurface.has(s.id) && !links.some((l) => l.surfaceId === s.id && l.reconcileEp === undefined)) {
      // not reconciled; if there's a pending link to it, PENDING covers it; else WARN
      const hasPending = links.some((l) => l.surfaceId === s.id && l.reconcileEp === undefined);
      if (!hasPending) {
        push({
          code: 'SURFACE_UNRECONCILED',
          severity: 'WARN',
          ids: [s.id],
          message: `表面条目 ${s.id} 尚未对账揭穿`,
          fix: '补 links 指向 trueEntries，并在适当时机写 reconcileEp',
        });
      }
    }
  }

  const hasFail = findings.some((f) => f.severity === 'FAIL');
  return {
    verdict: hasFail ? 'FAIL' : 'PASS',
    metrics: {
      surface: surfaceEntries.length,
      truth: trueEntries.length,
      links: links.length,
      reconciled,
      pending,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
