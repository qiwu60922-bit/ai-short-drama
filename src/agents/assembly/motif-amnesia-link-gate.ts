/**
 * V12 · Motif × Amnesia Link Gate (视觉母题 × 失忆唤回 跨账本联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text breakdowns (structure only, no footage):
 *  - 《反派拿捏！第三季》: 爆炸失忆 → 陪伴 → 圣诞摩天轮唤回 —
 *    recoverTrigger 须对应已栽种母题 label，且 recoverEp = motif payoff.ep.
 *  - 《盛夏芬德拉》白玫瑰三次回扣：motif 侧 seed→echo→payoff 对照.
 *  - 《后妈只想苟…》关系知识重建对照（本 gate 不绑）.
 *
 * 与 amnesiaMotifLink（amnesia 主键）互补：本 gate 以 motif 为主键强制「有 payoff 须对齐失忆唤回」。
 *
 * Embeds child amnesia + motif ledgers (CHILD_* bubbles).
 * Link rules:
 *  SCHEMA / DUP_ID / UNKNOWN_AMNESIA / UNKNOWN_MOTIF
 *  CHILD_AMNESIA_FAIL / CHILD_MOTIF_FAIL
 *  TRIGGER_MISSING / TRIGGER_LABEL_MISMATCH
 *  NO_SEED_BEFORE_RECOVER / EP_MISMATCH / PAYOFF_WITHOUT_RECOVER
 *  COMPANION_WITHOUT_ECHO (WARN) — companionEp 建议有 motif echo
 *  ECHO_AFTER_RECOVER (FAIL) — recover 后不应再 echo（应已 payoff）
 *  PENDING_PAIR (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  AmnesiaArcEntrySchema,
  evaluateAmnesiaArc,
} from './amnesia-arc-gate';
import {
  MotifEntrySchema,
  MotifAppearanceSchema,
  evaluateMotifCallbacks,
} from './motif-callback-gate';

const Ep = z.number().int().positive();

export const MotifAmnesiaLinkEntrySchema = z.object({
  id: z.string().min(1),
  amnesiaId: z.string().min(1),
  motifId: z.string().min(1),
  note: z.string().optional(),
});

export const MotifAmnesiaLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  amnesias: z.array(AmnesiaArcEntrySchema),
  links: z.array(MotifAmnesiaLinkEntrySchema),
});

export type MotifAmnesiaLinkLedger = z.infer<typeof MotifAmnesiaLinkLedgerSchema>;

export type MotifAmnesiaLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_AMNESIA'
    | 'UNKNOWN_MOTIF'
    | 'CHILD_AMNESIA_FAIL'
    | 'CHILD_MOTIF_FAIL'
    | 'TRIGGER_MISSING'
    | 'TRIGGER_LABEL_MISMATCH'
    | 'NO_SEED_BEFORE_RECOVER'
    | 'EP_MISMATCH'
    | 'PAYOFF_WITHOUT_RECOVER'
    | 'COMPANION_WITHOUT_ECHO'
    | 'ECHO_AFTER_RECOVER'
    | 'PENDING_PAIR'
    | 'MOTIF_WITHOUT_AMNESIA';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface MotifAmnesiaLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    pending: number;
    amnesias: number;
    motifs: number;
    latestEp: number;
  };
  findings: MotifAmnesiaLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateMotifAmnesiaLink(input: unknown): MotifAmnesiaLinkReport {
  const parsed = MotifAmnesiaLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, pending: 0, amnesias: 0, motifs: 0, latestEp: 0 },
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

  const { series, latestEp, amnesias, motifs, appearances, links } = parsed.data;
  const findings: MotifAmnesiaLinkFinding[] = [];
  const push = (x: MotifAmnesiaLinkFinding) => findings.push(x);

  const amnesiaReport = evaluateAmnesiaArc({ series, latestEp, entries: amnesias });
  if (amnesiaReport.verdict === 'FAIL') {
    const childFails = amnesiaReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_AMNESIA_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌失忆账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 amnesia-arc-gate 再跑联表（plant/companion/recover）',
    });
  }

  const motifReport = evaluateMotifCallbacks({
    series,
    latestEp,
    motifs,
    appearances,
  });
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

  const amnesiaById = new Map(amnesias.map((a) => [a.id, a]));
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
    const arc = amnesiaById.get(l.amnesiaId);
    const motif = motifById.get(l.motifId);

    if (!arc) {
      push({
        code: 'UNKNOWN_AMNESIA',
        severity: 'FAIL',
        ids: [l.id],
        message: `${l.id} 指向不存在的 amnesiaId=${l.amnesiaId}`,
        fix: 'amnesiaId 须对应 amnesias[].id',
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

    const recovered = arc.recoverEp !== undefined;
    const motifApps = appearances.filter((a) => a.motifId === l.motifId);
    const seeds = motifApps.filter((a) => a.role === 'seed');
    const payoffs = motifApps.filter((a) => a.role === 'payoff');
    const hasPayoff = payoffs.length > 0;

    if (!recovered && !hasPayoff) {
      pending += 1;
      push({
        code: 'PENDING_PAIR',
        severity: 'WARN',
        ids: [l.id],
        message: `${l.id} 失忆弧与母题 payoff 都尚未落地（蓄势中）`,
        fix: '先栽种母题 seed/echo，唤回集写 recoverEp+recoverTrigger=motif.label，并加 payoff',
      });
      continue;
    }

    if (!recovered && hasPayoff) {
      push({
        code: 'PAYOFF_WITHOUT_RECOVER',
        severity: 'FAIL',
        ids: [l.id, l.amnesiaId, l.motifId],
        message: `${l.id} 母题 ${l.motifId} 已有 payoff，但失忆弧 ${l.amnesiaId} 尚未 recover`,
        fix: '在母题 payoff 同集写 recoverEp + recoverLabel + recoverTrigger',
      });
      continue;
    }

    // recovered
    if (!arc.recoverTrigger) {
      push({
        code: 'TRIGGER_MISSING',
        severity: 'FAIL',
        ids: [l.id, l.amnesiaId],
        message: `${l.id} 已 recover@E${arc.recoverEp}，但缺 recoverTrigger（须点名视觉母题）`,
        fix: `写 recoverTrigger='${motif.label}'（与 motifs[].label 一致）`,
      });
      continue;
    }

    if (arc.recoverTrigger !== motif.label) {
      push({
        code: 'TRIGGER_LABEL_MISMATCH',
        severity: 'FAIL',
        ids: [l.id, l.amnesiaId, l.motifId],
        message: `${l.id} recoverTrigger='${arc.recoverTrigger}' ≠ motif.label='${motif.label}'`,
        fix: '把 recoverTrigger 改成与联表母题 label 完全一致',
      });
      continue;
    }

    const seedBefore = seeds.some((s) => s.ep <= (arc.recoverEp as number));
    if (!seedBefore) {
      push({
        code: 'NO_SEED_BEFORE_RECOVER',
        severity: 'FAIL',
        ids: [l.id, l.amnesiaId, l.motifId],
        message: `${l.id} 唤回@E${arc.recoverEp} 前母题 ${l.motifId} 无 seed（须先栽种再唤回）`,
        fix: '在 recoverEp 之前加 role=seed 的 appearance',
      });
      continue;
    }

    const payoffAtRecover = payoffs.some((p) => p.ep === arc.recoverEp);
    if (!payoffAtRecover) {
      const payoffEps = payoffs.map((p) => p.ep).join(',') || 'none';
      push({
        code: 'EP_MISMATCH',
        severity: 'FAIL',
        ids: [l.id, l.amnesiaId, l.motifId],
        message: `${l.id} recoverEp=E${arc.recoverEp} 无对应 motif payoff（现有 payoff@E${payoffEps}）`,
        fix: '在 recoverEp 同集写 role=payoff 的 appearance（唤回即母题回扣）',
      });
      continue;
    }

    const echoes = motifApps.filter((a) => a.role === 'echo');
    const echoAfter = echoes.filter((e) => e.ep > (arc.recoverEp as number));
    if (echoAfter.length > 0) {
      push({
        code: 'ECHO_AFTER_RECOVER',
        severity: 'FAIL',
        ids: [l.id, l.amnesiaId, l.motifId],
        message: `${l.id} recover@E${arc.recoverEp} 后仍有 motif echo@E${echoAfter.map((e) => e.ep).join(',')}（唤回后应 payoff 收束，勿再 echo）`,
        fix: '删掉 recoverEp 之后的 echo，或改成 payoff 以外的新母题弧',
      });
      continue;
    }

    const companions = arc.companionEps ?? [];
    const missingEchoCompanions = companions.filter(
      (ep) => ep < (arc.recoverEp as number) && !echoes.some((e) => e.ep === ep),
    );
    if (missingEchoCompanions.length > 0) {
      push({
        code: 'COMPANION_WITHOUT_ECHO',
        severity: 'WARN',
        ids: [l.id, l.amnesiaId, l.motifId],
        message: `${l.id} companionEps E${missingEchoCompanions.join(',')} 无对应 motif echo（陪伴集建议回扣视觉母题）`,
        fix: '在 companion 同集加 role=echo 的 appearance，加深失忆×母题纠缠',
      });
    }

    aligned += 1;
  }

  const linkedMotifs = new Set(links.map((l) => l.motifId).filter((id) => motifById.has(id)));
  for (const motif of motifs) {
    const hasPayoff = appearances.some((a) => a.motifId === motif.id && a.role === 'payoff');
    if (hasPayoff && !linkedMotifs.has(motif.id)) {
      push({
        code: 'MOTIF_WITHOUT_AMNESIA',
        severity: 'FAIL',
        ids: [motif.id],
        message: `motif ${motif.id} 有 payoff appearance 无 amnesia 联表`,
        fix: '为母题回扣集挂 MotifAmnesiaLink',
      });
    }
  }

  const hasFail = findings.some((f) => f.severity === 'FAIL');
  return {
    verdict: hasFail ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      pending,
      amnesias: amnesias.length,
      motifs: motifs.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
