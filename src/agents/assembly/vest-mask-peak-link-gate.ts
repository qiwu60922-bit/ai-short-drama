/**
 * V12 · Vest/Mask×Peak Link Gate (马甲/假人设掉落 × 羞辱峰值 跨账本联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text breakdowns of 2026-10-29 hits (structure only, no footage):
 *  - 《飞上枝头难成凤凰》(九州·微短剧热力榜 TOP3): 机舱拜金羞辱峰值 →
 *    被辱者实为「未来婆婆」身份掉落 — vest.drop ↔ peak.peak 同集.
 *  - 《警报！叶楚出狱》(河马·TOP1): 真龙血脉/狱中医术马甲长线，对峙峰值再掉 —
 *    vest 内嵌 peak 须与联表 peak 条目一致.
 *  - 《云海不相逢》(TOP2 对照): bond×frequency 已由另一 gate 覆盖，本 gate 不绑.
 *
 * Closes 2026-10-29 candidate: mask/vest × peak-before-payoff 跨文件硬联表
 * （身份掉落/人设崩塌须落在羞辱/对峙峰值集）.
 *
 * Embeds child vest + mask + peak ledgers and reuses their evaluators (CHILD_* bubbles).
 * Link rules (per link.sourceKind = vest|mask):
 *  SCHEMA / DUP_ID / UNKNOWN_SOURCE / UNKNOWN_PEAK
 *  CHILD_VEST_FAIL / CHILD_MASK_FAIL / CHILD_PEAK_FAIL
 *  TERMINAL_WITHOUT_PEAK — 已掉落/崩塌但峰值账本无 peakEp
 *  PEAK_WITHOUT_TERMINAL — 峰值已标但马甲/面具未终端
 *  EP_MISMATCH — dropEp|revealEp ≠ peakEp
 *  EMBED_PEAK_MISMATCH — vest 内嵌 peakEp 与联表 peak.peakEp 不一致
 *  PENDING_PAIR (WARN) — 双方都还没落地
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  IdentityVestEntrySchema,
  evaluateIdentityVest,
} from './identity-vest-gate';
import {
  PersonaMaskEntrySchema,
  evaluatePersonaMask,
} from './persona-mask-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const VestMaskPeakLinkEntrySchema = z.object({
  id: z.string().min(1),
  sourceKind: z.enum(['vest', 'mask']),
  sourceId: z.string().min(1),
  peakId: z.string().min(1),
  note: z.string().optional(),
});

export const VestMaskPeakLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  vests: z.array(IdentityVestEntrySchema),
  masks: z.array(PersonaMaskEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(VestMaskPeakLinkEntrySchema),
});

export type VestMaskPeakLinkLedger = z.infer<typeof VestMaskPeakLinkLedgerSchema>;

export type VestMaskPeakLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_SOURCE'
    | 'UNKNOWN_PEAK'
    | 'CHILD_VEST_FAIL'
    | 'CHILD_MASK_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'TERMINAL_WITHOUT_PEAK'
    | 'PEAK_WITHOUT_TERMINAL'
    | 'EP_MISMATCH'
    | 'EMBED_PEAK_MISMATCH'
    | 'PENDING_PAIR';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface VestMaskPeakLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    pending: number;
    vests: number;
    masks: number;
    peaks: number;
    latestEp: number;
  };
  findings: VestMaskPeakLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateVestMaskPeakLink(input: unknown): VestMaskPeakLinkReport {
  const parsed = VestMaskPeakLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: {
        links: 0,
        aligned: 0,
        pending: 0,
        vests: 0,
        masks: 0,
        peaks: 0,
        latestEp: 0,
      },
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

  const { series, latestEp, vests, masks, peaks, links } = parsed.data;
  const findings: VestMaskPeakLinkFinding[] = [];
  const push = (x: VestMaskPeakLinkFinding) => findings.push(x);

  const vestReport = evaluateIdentityVest({ series, latestEp, entries: vests });
  if (vestReport.verdict === 'FAIL') {
    const childFails = vestReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_VEST_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌马甲账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 identity-vest-gate 再跑联表（plant/tease/drop/peak 时序）',
    });
  }

  const maskReport = evaluatePersonaMask({ series, latestEp, entries: masks });
  if (maskReport.verdict === 'FAIL') {
    const childFails = maskReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_MASK_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌面具账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 persona-mask-gate 再跑联表（plant/maintain/reveal 时序）',
    });
  }

  const peakReport = evaluatePeakBeforePayoff({ series, latestEp, entries: peaks });
  if (peakReport.verdict === 'FAIL') {
    const childFails = peakReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_PEAK_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌峰值账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 peak-before-payoff-gate 再跑联表（open/peak/payoff 时序与标签）',
    });
  }

  const vestById = new Map(vests.map((v) => [v.id, v]));
  const maskById = new Map(masks.map((m) => [m.id, m]));
  const peakById = new Map(peaks.map((p) => [p.id, p]));

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
    const peak = peakById.get(l.peakId);
    if (!peak) {
      push({
        code: 'UNKNOWN_PEAK',
        severity: 'FAIL',
        ids: [l.id],
        message: `${l.id} 指向不存在的 peakId=${l.peakId}`,
        fix: 'peakId 须对应 peaks[].id',
      });
      continue;
    }

    if (l.sourceKind === 'vest') {
      const vest = vestById.get(l.sourceId);
      if (!vest) {
        push({
          code: 'UNKNOWN_SOURCE',
          severity: 'FAIL',
          ids: [l.id],
          message: `${l.id} 指向不存在的 vest sourceId=${l.sourceId}`,
          fix: 'sourceId 须对应 vests[].id',
        });
        continue;
      }

      const terminalEp = vest.dropEp;
      const hasTerminal = terminalEp !== undefined;
      const hasPeak = peak.peakEp !== undefined;

      if (vest.peakEp !== undefined && hasPeak && vest.peakEp !== peak.peakEp) {
        push({
          code: 'EMBED_PEAK_MISMATCH',
          severity: 'FAIL',
          ids: [l.id, l.sourceId, l.peakId],
          message: `${l.id} vest 内嵌 peakEp=E${vest.peakEp} ≠ 联表 peak.peakEp=E${peak.peakEp}`,
          fix: '把 identity-vest.peakEp 改成与 peaks[].peakEp 同一集，或改联表 peakId',
        });
        continue;
      }

      if (!hasTerminal && !hasPeak) {
        pending += 1;
        push({
          code: 'PENDING_PAIR',
          severity: 'WARN',
          ids: [l.id],
          message: `${l.id} 马甲与峰值都尚未落地（蓄势中）`,
          fix: '对峙/羞辱峰值标 peakEp 后，同一集写 dropEp/dropLabel',
        });
        continue;
      }

      if (hasTerminal && !hasPeak) {
        push({
          code: 'TERMINAL_WITHOUT_PEAK',
          severity: 'FAIL',
          ids: [l.id, l.sourceId, l.peakId],
          message: `${l.id} 马甲已 drop@E${terminalEp}，但峰值 ${l.peakId} 尚未标 peakEp`,
          fix: '身份掉落前须先（或同集）在 peak 账本写 peakEp/peakLabel',
        });
        continue;
      }

      if (hasPeak && !hasTerminal) {
        push({
          code: 'PEAK_WITHOUT_TERMINAL',
          severity: 'FAIL',
          ids: [l.id, l.sourceId, l.peakId],
          message: `${l.id} 峰值已标@E${peak.peakEp}，但马甲 ${l.sourceId} 尚未 drop`,
          fix: '在峰值集写 dropEp + dropLabel（羞辱峰值同集掉马甲）',
        });
        continue;
      }

      if (terminalEp !== peak.peakEp) {
        push({
          code: 'EP_MISMATCH',
          severity: 'FAIL',
          ids: [l.id, l.sourceId, l.peakId],
          message: `${l.id} dropEp=E${terminalEp} ≠ peakEp=E${peak.peakEp}（马甲掉落须与羞辱峰值同集）`,
          fix: '把 dropEp 与 peakEp 改成同一集（同拍兑现）',
        });
        continue;
      }

      aligned += 1;
      continue;
    }

    // sourceKind === 'mask'
    const mask = maskById.get(l.sourceId);
    if (!mask) {
      push({
        code: 'UNKNOWN_SOURCE',
        severity: 'FAIL',
        ids: [l.id],
        message: `${l.id} 指向不存在的 mask sourceId=${l.sourceId}`,
        fix: 'sourceId 须对应 masks[].id',
      });
      continue;
    }

    const terminalEp = mask.revealEp;
    const hasTerminal = terminalEp !== undefined;
    const hasPeak = peak.peakEp !== undefined;

    if (!hasTerminal && !hasPeak) {
      pending += 1;
      push({
        code: 'PENDING_PAIR',
        severity: 'WARN',
        ids: [l.id],
        message: `${l.id} 面具与峰值都尚未落地（蓄势中）`,
        fix: '对峙峰值标 peakEp 后，同一集写 revealEp/revealLabel',
      });
      continue;
    }

    if (hasTerminal && !hasPeak) {
      push({
        code: 'TERMINAL_WITHOUT_PEAK',
        severity: 'FAIL',
        ids: [l.id, l.sourceId, l.peakId],
        message: `${l.id} 面具已 reveal@E${terminalEp}，但峰值 ${l.peakId} 尚未标 peakEp`,
        fix: '人设崩塌前须先（或同集）在 peak 账本写 peakEp/peakLabel',
      });
      continue;
    }

    if (hasPeak && !hasTerminal) {
      push({
        code: 'PEAK_WITHOUT_TERMINAL',
        severity: 'FAIL',
        ids: [l.id, l.sourceId, l.peakId],
        message: `${l.id} 峰值已标@E${peak.peakEp}，但面具 ${l.sourceId} 尚未 reveal`,
        fix: '在峰值集写 revealEp + revealLabel（对峙峰值同集崩塌）',
      });
      continue;
    }

    if (terminalEp !== peak.peakEp) {
      push({
        code: 'EP_MISMATCH',
        severity: 'FAIL',
        ids: [l.id, l.sourceId, l.peakId],
        message: `${l.id} revealEp=E${terminalEp} ≠ peakEp=E${peak.peakEp}（人设崩塌须与对峙峰值同集）`,
        fix: '把 revealEp 与 peakEp 改成同一集（同拍兑现）',
      });
      continue;
    }

    aligned += 1;
  }

  const hasFail = findings.some((f) => f.severity === 'FAIL');
  return {
    verdict: hasFail ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      pending,
      vests: vests.length,
      masks: masks.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
