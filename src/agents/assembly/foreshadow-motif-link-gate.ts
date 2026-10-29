/**
 * V12 · Foreshadow×Motif Link Gate (剧情伏笔 × 视觉母题 跨账本联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text breakdowns (structure only, no footage):
 *  - 《盛夏芬德拉》: 白玫瑰三次回扣 — 伏笔发酵与视觉母题同拍兑现.
 *  - 《首辅娇娘》: 守宫砂→画梅 — 身份伏笔对齐视觉印记 payoff.
 *  - foreshadow-ledger (剧情线) 与 motif-callback (视觉线) 分账本，本 gate 硬联表.
 *
 * Embeds child foreshadow + motif (CHILD_* bubbles).
 * Link rules:
 *  SCHEMA / DUP_ID / UNKNOWN_FORESHADOW / UNKNOWN_MOTIF
 *  CHILD_FORESHADOW_FAIL / CHILD_MOTIF_FAIL
 *  NO_SEED_BEFORE_PLANT — plant 前/当时须有 motif seed
 *  PAYOFF_WITHOUT_MOTIF_PAYOFF — 伏笔已 closed 但母题无 payoff
 *  MOTIF_PAYOFF_WITHOUT_CLOSE — 母题已 payoff 但伏笔仍 active
 *  EP_MISMATCH — payoffEp ≠ motif payoff.ep
 *  PRIORITY_S_REQUIRES_ECHO — S 级已 closed 须在 plant..payoff 间有 motif echo
 *  PENDING_PAIR (WARN) — 双方都未收束
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
} from './foreshadow-ledger-gate';
import {
  MotifEntrySchema,
  MotifAppearanceSchema,
  evaluateMotifCallbacks,
} from './motif-callback-gate';

const Ep = z.number().int().positive();

export const ForeshadowMotifLinkEntrySchema = z.object({
  id: z.string().min(1),
  foreshadowId: z.string().min(1),
  motifId: z.string().min(1),
  note: z.string().optional(),
});

export const ForeshadowMotifLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  foreshadows: z.array(ForeshadowItemSchema),
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  links: z.array(ForeshadowMotifLinkEntrySchema),
});

export type ForeshadowMotifLinkLedger = z.infer<typeof ForeshadowMotifLinkLedgerSchema>;

export type ForeshadowMotifLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_FORESHADOW'
    | 'UNKNOWN_MOTIF'
    | 'CHILD_FORESHADOW_FAIL'
    | 'CHILD_MOTIF_FAIL'
    | 'NO_SEED_BEFORE_PLANT'
    | 'PAYOFF_WITHOUT_MOTIF_PAYOFF'
    | 'MOTIF_PAYOFF_WITHOUT_CLOSE'
    | 'EP_MISMATCH'
    | 'PRIORITY_S_REQUIRES_ECHO'
    | 'PENDING_PAIR';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface ForeshadowMotifLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    pending: number;
    foreshadows: number;
    motifs: number;
    latestEp: number;
  };
  findings: ForeshadowMotifLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateForeshadowMotifLink(input: unknown): ForeshadowMotifLinkReport {
  const parsed = ForeshadowMotifLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, pending: 0, foreshadows: 0, motifs: 0, latestEp: 0 },
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

  const { series, latestEp, foreshadows, motifs, appearances, links } = parsed.data;
  const findings: ForeshadowMotifLinkFinding[] = [];
  const push = (x: ForeshadowMotifLinkFinding) => findings.push(x);

  const fsReport = evaluateForeshadowLedger({ series, latestEp, items: foreshadows });
  if (fsReport.verdict === 'FAIL') {
    const childFails = fsReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_FORESHADOW_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌伏笔账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 foreshadow-ledger-gate 再跑联表（plant/payoff/status）',
    });
  }

  const motifReport = evaluateMotifCallbacks({ series, latestEp, motifs, appearances });
  if (motifReport.verdict === 'FAIL') {
    const childFails = motifReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_MOTIF_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌母题账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 motif-callback-gate 再跑联表（seed→echo→payoff）',
    });
  }

  const fsById = new Map(foreshadows.map((f) => [f.id, f]));
  const motifById = new Map(motifs.map((m) => [m.id, m]));

  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const l of links) {
    if (seen.has(l.id)) dups.add(l.id);
    else seen.add(l.id);
  }
  for (const id of dups) {
    push({
      code: 'DUP_ID',
      severity: 'FAIL',
      ids: [id],
      message: `联表链接 ID 重复：${id}`,
      fix: 'links[].id 是跨账本指针主键，改成唯一 ID',
    });
  }

  let aligned = 0;
  let pending = 0;

  for (const l of links) {
    const fs = fsById.get(l.foreshadowId);
    const motif = motifById.get(l.motifId);

    if (!fs) {
      push({
        code: 'UNKNOWN_FORESHADOW',
        severity: 'FAIL',
        ids: [l.id],
        message: `${l.id} 指向不存在的 foreshadowId=${l.foreshadowId}`,
        fix: 'foreshadowId 须对应 foreshadows[].id',
      });
      continue;
    }
    if (!motif) {
      push({
        code: 'UNKNOWN_MOTIF',
        severity: 'FAIL',
        ids: [l.id],
        message: `${l.id} 指向不存在的 motifId=${l.motifId}`,
        fix: 'motifId 须对应 motifs[].id',
      });
      continue;
    }

    const apps = appearances.filter((a) => a.motifId === l.motifId);
    const seeds = apps.filter((a) => a.role === 'seed');
    const payoffs = apps.filter((a) => a.role === 'payoff');
    const closed = fs.status === 'closed' && fs.payoffEp !== undefined;
    const hasMotifPayoff = payoffs.length > 0;

    if (!seeds.some((s) => s.ep <= fs.plantEp)) {
      push({
        code: 'NO_SEED_BEFORE_PLANT',
        severity: 'FAIL',
        ids: [l.id, l.foreshadowId, l.motifId],
        message: `${l.id} 伏笔 plant@E${fs.plantEp} 前/当时母题 ${l.motifId} 无 seed`,
        fix: '在 plantEp 或更早加 role=seed 的 appearance（伏笔落地即栽种视觉母题）',
      });
      continue;
    }

    if (!closed && !hasMotifPayoff) {
      pending += 1;
      push({
        code: 'PENDING_PAIR',
        severity: 'WARN',
        ids: [l.id],
        message: `${l.id} 伏笔与母题都尚未收束（发酵中）`,
        fix: '回收时同集写 foreshadow.payoffEp(status=closed) 与 motif role=payoff',
      });
      continue;
    }

    if (closed && !hasMotifPayoff) {
      push({
        code: 'PAYOFF_WITHOUT_MOTIF_PAYOFF',
        severity: 'FAIL',
        ids: [l.id, l.foreshadowId, l.motifId],
        message: `${l.id} 伏笔已 closed@E${fs.payoffEp}，但母题 ${l.motifId} 无 payoff`,
        fix: '在 payoffEp 同集写 role=payoff 的 appearance',
      });
      continue;
    }

    if (!closed && hasMotifPayoff) {
      push({
        code: 'MOTIF_PAYOFF_WITHOUT_CLOSE',
        severity: 'FAIL',
        ids: [l.id, l.foreshadowId, l.motifId],
        message: `${l.id} 母题已 payoff，但伏笔 ${l.foreshadowId} 仍未 closed`,
        fix: '把 foreshadow status=closed 并写 payoffEp=母题 payoff 集',
      });
      continue;
    }

    // both closed + motif payoff
    const payoffAt = payoffs.some((p) => p.ep === fs.payoffEp);
    if (!payoffAt) {
      const eps = payoffs.map((p) => p.ep).join(',') || 'none';
      push({
        code: 'EP_MISMATCH',
        severity: 'FAIL',
        ids: [l.id, l.foreshadowId, l.motifId],
        message: `${l.id} foreshadow.payoffEp=E${fs.payoffEp} 无对应 motif payoff（现有@E${eps}）`,
        fix: '伏笔回收与视觉母题 payoff 须同集',
      });
      continue;
    }

    if (fs.priority === 'S') {
      const echoes = apps.filter(
        (a) => a.role === 'echo' && a.ep > fs.plantEp && a.ep < (fs.payoffEp as number),
      );
      if (echoes.length === 0) {
        push({
          code: 'PRIORITY_S_REQUIRES_ECHO',
          severity: 'FAIL',
          ids: [l.id, l.foreshadowId, l.motifId],
          message: `${l.id}: S 级伏笔 closed@E${fs.payoffEp}，但 plant..payoff 间无 motif echo`,
          fix: 'S 线至少一次 echo 回扣，避免 seed 直跳 payoff',
        });
        continue;
      }
    }

    aligned += 1;
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      pending,
      foreshadows: foreshadows.length,
      motifs: motifs.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
