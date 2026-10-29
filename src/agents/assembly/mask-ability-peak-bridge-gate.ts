/**
 * V12 · Mask × Ability × Peak Ternary Bridge
 * (伪装揭穿 × 金手指 × 羞辱峰值 三元桥), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《伪人降临！我是全场唯一预言家》: 揭穿/对峙峰值同集须兑现金手指，持有者=穿戴者.
 *  - 《逃婚三年，江少的花心人设崩了》: mask reveal 与 peak 同框时能力规则不得空挂.
 *  - maskAbilityLink / maskPeakLink 已各自联表——本 gate 硬对齐同 ep 三元同框.
 *
 * Per link: maskId + abilityId + peakId + ep.
 *  SCHEMA / DUP_ID / UNKNOWN_ABILITY / UNKNOWN_MASK / UNKNOWN_PEAK / FUTURE_EP
 *  CHILD_ABILITY_FAIL / CHILD_MASK_FAIL / CHILD_PEAK_FAIL
 *  HOLDER_WEARER_MISMATCH
 *  EP_NOT_TERNARY — link.ep 须等于 mask.revealEp 且等于 peak.peakEp
 *  ACQUIRED_AFTER_TERNARY / NO_USE_AT_TERNARY
 *  REVEAL_WITHOUT_BRIDGE / PEAK_WITHOUT_BRIDGE
 *  PENDING_MASK (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  AbilityEntrySchema,
  AbilityUseSchema,
  evaluateAbilityRules,
} from './ability-rule-gate';
import {
  PersonaMaskEntrySchema,
  evaluatePersonaMask,
} from './persona-mask-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
} from './peak-before-payoff-gate';

const Ep = z.number().int().positive();

export const MaskAbilityPeakBridgeLinkSchema = z.object({
  id: z.string().min(1),
  abilityId: z.string().min(1),
  maskId: z.string().min(1),
  peakId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const MaskAbilityPeakBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  masks: z.array(PersonaMaskEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(MaskAbilityPeakBridgeLinkSchema),
});

export type MaskAbilityPeakBridgeLedger = z.infer<typeof MaskAbilityPeakBridgeLedgerSchema>;

export type MaskAbilityPeakBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_ABILITY'
    | 'UNKNOWN_MASK'
    | 'UNKNOWN_PEAK'
    | 'FUTURE_EP'
    | 'CHILD_ABILITY_FAIL'
    | 'CHILD_MASK_FAIL'
    | 'CHILD_PEAK_FAIL'
    | 'HOLDER_WEARER_MISMATCH'
    | 'EP_NOT_TERNARY'
    | 'ACQUIRED_AFTER_TERNARY'
    | 'NO_USE_AT_TERNARY'
    | 'REVEAL_WITHOUT_BRIDGE'
    | 'PEAK_WITHOUT_BRIDGE'
    | 'PENDING_MASK';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface MaskAbilityPeakBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    abilities: number;
    masks: number;
    peaks: number;
    latestEp: number;
  };
  findings: MaskAbilityPeakBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateMaskAbilityPeakBridge(input: unknown): MaskAbilityPeakBridgeReport {
  const parsed = MaskAbilityPeakBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, abilities: 0, masks: 0, peaks: 0, latestEp: 0 },
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

  const { series, latestEp, abilities, uses, masks, peaks, links } = parsed.data;
  const findings: MaskAbilityPeakBridgeFinding[] = [];
  const push = (x: MaskAbilityPeakBridgeFinding) => findings.push(x);

  const abReport = evaluateAbilityRules({ series, latestEp, abilities, uses });
  if (abReport.verdict === 'FAIL') {
    const childFails = abReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_ABILITY_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌金手指账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 ability-rule-gate（次数/持有/拿到就用）',
    });
  }

  const maskReport = evaluatePersonaMask({ series, latestEp, entries: masks });
  if (maskReport.verdict === 'FAIL') {
    const childFails = maskReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_MASK_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌伪装账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 persona-mask-gate（plant→maintain→reveal）',
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
      fix: '先修 peak-before-payoff-gate（peak≤payoff + peakLabel）',
    });
  }

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
      message: `联表ID重复：${id}`,
      fix: '联表 id 须唯一',
    });
  }

  const byAb = new Map(abilities.map((a) => [a.id, a]));
  const byMask = new Map(masks.map((m) => [m.id, m]));
  const byPeak = new Map(peaks.map((p) => [p.id, p]));
  const linkedMasks = new Set<string>();
  const linkedPeaks = new Set<string>();
  const linkedAbs = new Set<string>();
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

    const ab = byAb.get(link.abilityId);
    if (!ab) {
      push({
        code: 'UNKNOWN_ABILITY',
        severity: 'FAIL',
        ids: [link.id, link.abilityId],
        message: `联表 ${link.id} 引用未知 ability ${link.abilityId}`,
        fix: 'abilityId 须存在于 abilities[]',
      });
      continue;
    }
    const mask = byMask.get(link.maskId);
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
    const peak = byPeak.get(link.peakId);
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

    if (ab.holder !== mask.wearer) {
      push({
        code: 'HOLDER_WEARER_MISMATCH',
        severity: 'FAIL',
        ids: [link.id, ab.id, mask.id],
        message: `${link.id}: ability.holder=${ab.holder} ≠ mask.wearer=${mask.wearer}`,
        fix: '金手指持有者须与伪装穿戴者同一角色',
      });
      continue;
    }

    if (
      mask.revealEp === undefined ||
      peak.peakEp === undefined ||
      link.ep !== mask.revealEp ||
      link.ep !== peak.peakEp
    ) {
      push({
        code: 'EP_NOT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, ab.id, mask.id, peak.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 revealEp=${mask.revealEp ?? '无'}/peakEp=${peak.peakEp ?? '无'}`,
        fix: '三元同框：link.ep = mask.revealEp = peak.peakEp',
      });
      continue;
    }
    linkedMasks.add(mask.id);
    linkedPeaks.add(peak.id);
    linkedAbs.add(ab.id);

    if (ab.acquiredEp > link.ep) {
      push({
        code: 'ACQUIRED_AFTER_TERNARY',
        severity: 'FAIL',
        ids: [link.id, ab.id, mask.id, peak.id],
        message: `${link.id}: ability acquired@E${ab.acquiredEp} 晚于三元 ep=E${link.ep}`,
        fix: '先觉醒金手指，再揭穿×冲巅峰；或下调 acquiredEp',
      });
      continue;
    }

    const used = uses.some(
      (u) => u.abilityId === ab.id && u.by === ab.holder && u.ep === link.ep,
    );
    if (!used) {
      push({
        code: 'NO_USE_AT_TERNARY',
        severity: 'FAIL',
        ids: [link.id, ab.id, mask.id, peak.id],
        message: `${link.id}: 三元同框 E${link.ep} 无 holder 使用 ability`,
        fix: '揭穿×峰值当集用一次金手指兑现规则',
      });
      continue;
    }

    aligned += 1;
  }

  for (const mask of masks) {
    if (mask.revealEp !== undefined && !linkedMasks.has(mask.id)) {
      push({
        code: 'REVEAL_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [mask.id],
        message: `mask ${mask.id} revealEp=E${mask.revealEp} 无 mask×ability×peak 桥`,
        fix: '为揭穿集挂 MaskAbilityPeakBridge（对齐 peak.peakEp + ability use）',
      });
    }
  }
  for (const peak of peaks) {
    if (peak.peakEp !== undefined && !linkedPeaks.has(peak.id)) {
      push({
        code: 'PEAK_WITHOUT_BRIDGE',
        severity: 'FAIL',
        ids: [peak.id],
        message: `peak ${peak.id} peakEp=E${peak.peakEp} 无 mask×ability×peak 桥`,
        fix: '为峰值集挂 MaskAbilityPeakBridge（对齐 mask.revealEp + ability use）',
      });
    }
  }
  for (const mask of masks) {
    if (mask.revealEp === undefined && !linkedMasks.has(mask.id)) {
      push({
        code: 'PENDING_MASK',
        severity: 'WARN',
        ids: [mask.id],
        message: `mask ${mask.id} 尚未联表到 mask×ability×peak 桥`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      abilities: abilities.length,
      masks: masks.length,
      peaks: peaks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
