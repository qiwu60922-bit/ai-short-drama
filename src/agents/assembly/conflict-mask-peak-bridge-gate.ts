/**
 * V12 · Conflict × Mask × Peak Ternary Bridge
 * (冲突欠账兑现 × 伪装揭穿 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《叶楚出狱》/《帐中香》: 冲突当场兑现常与 mask reveal、对峙峰值同拍.
 *  - conflict-payoff / persona-mask / peak-before-payoff 已各自记账——本 gate 硬对齐同 ep 三元同框.
 *
 * Per link: conflictId + maskId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_CONFLICT / UNKNOWN_MASK / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_CONFLICT_FAIL / CHILD_MASK_FAIL / CHILD_PEAK_FAIL
 *  EP_NOT_TERNARY — link.ep = payoffEp = revealEp = peakEp
 *  PEAK_WITHOUT_BRIDGE / REVEAL_WITHOUT_BRIDGE / PAYOFF_WITHOUT_BRIDGE
 *  PENDING_MASK (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  ConflictEntrySchema,
  evaluateConflictPayoffGap,
} from './conflict-payoff-gap-gate';
import {
  PersonaMaskEntrySchema,
  evaluatePersonaMask,
} from './persona-mask-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const ConflictMaskPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  conflictId: z.string().min(1),
  maskId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const ConflictMaskPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  conflicts: z.array(ConflictEntrySchema),
  masks: z.array(PersonaMaskEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(ConflictMaskPeakBridgeLinkSchema),
});

export type ConflictMaskPeakBridgeLedger = z.infer<typeof ConflictMaskPeakBridgeLedgerSchema>;

export type ConflictMaskPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_CONFLICT'
    | 'UNKNOWN_MASK'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_CONFLICT_FAIL'
    | 'CHILD_MASK_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'EP_NOT_TERNARY'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'REVEAL_WITHOUT_BRIDGE'
    | 'PAYOFF_WITHOUT_BRIDGE'
    | 'PENDING_MASK';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface ConflictMaskPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    conflicts: number;
    masks: number;
    peaks: number;
    latestEp: number;
  };
  findings: ConflictMaskPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateConflictMaskPeakBridge(input: unknown): ConflictMaskPeakBridgeReport {
  const parsed = ConflictMaskPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, conflicts: 0, masks: 0, peaks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, conflicts, masks, peaks, links } = parsed.data;
  const findings: ConflictMaskPeakBridgeFinding[] = [];
  const push = (x: ConflictMaskPeakBridgeFinding) => findings.push(x);

  const cReport = evaluateConflictPayoffGap({ series, latestEp, conflicts });
  if (cReport.verdict === 'FAIL') {
    const childFails = cReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_CONFLICT_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌冲突账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 conflict-payoff-gap-gate',
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

  const pReport = evaluatePeakBeforePayoff({ series, latestEp, entries: peaks });
  if (pReport.verdict === 'FAIL') {
    const childFails = pReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_PEAK_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌峰值账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 peak-before-payoff-gate',
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

  const byC = new Map(conflicts.map((c) => [c.id, c]));
  const byM = new Map(masks.map((m) => [m.id, m]));
  const byP = new Map(peaks.map((p) => [p.id, p]));
  const linkedP = new Set<string>();
  const linkedM = new Set<string>();
  const linkedC = new Set<string>();
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
    const conflict = byC.get(link.conflictId);
    if (!conflict) {
      push({
        code: 'UNKNOWN_CONFLICT',
        severity: 'FAIL',
        ids: [link.id, link.conflictId],
        message: `联表 ${link.id} 引用未知 conflict ${link.conflictId}`,
        fix: 'conflictId 须存在于 conflicts[]',
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
    const peak = byP.get(link.peakId);
    if (!peak) {
      push({
        code: 'UNKNOWN_PEAK',
        severity: 'FAIL',
        ids: [link.id, link.peakId],
        message: `联表 ${link.id} 引用未知 peak ${link.peakId}`,
        fix: 'peakId 须存在于 peaks[]',
      });
      continue;
    }

    if (
      conflict.payoffEp === undefined ||
      mask.revealEp === undefined ||
      peak.peakEp === undefined ||
      link.ep !== conflict.payoffEp ||
      link.ep !== mask.revealEp ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, conflict.id, mask.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 payoff=${conflict.payoffEp ?? '无'}/reveal=${mask.revealEp ?? '无'}/peak=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = payoffEp = revealEp = peakEp',
      });
      continue;
    }

    linkedP.add(peak.id);
    linkedM.add(mask.id);
    linkedC.add(conflict.id);
    aligned += 1;
  }

  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedP.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 conflict×mask×peak 桥`,
        fix: '为峰值集挂 ConflictMaskPeakBridge',
      });
    }
  }
  for (const mask of masks) {
    if (mask.revealEp !== undefined && !linkedM.has(mask.id)) {
      push({
        code: 'REVEAL_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [mask.id],
        message: `mask ${mask.id} revealEp=E${mask.revealEp} 无 conflict×mask×peak 桥`,
        fix: '为揭穿集挂 ConflictMaskPeakBridge',
      });
    } else if (!linkedM.has(mask.id)) {
      push({
        code: 'PENDING_MASK',
        severity: 'WARN',
        ids: [mask.id],
        message: `mask ${mask.id} 尚未联表到 conflict×mask×peak 桥`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const c of conflicts) {
    if (c.payoffEp !== undefined && !linkedC.has(c.id)) {
      push({
        code: 'PAYOFF_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [c.id],
        message: `conflict ${c.id} payoffEp=E${c.payoffEp} 无 conflict×mask×peak 桥`,
        fix: '为兑现集挂 ConflictMaskPeakBridge',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      conflicts: conflicts.length,
      masks: masks.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
