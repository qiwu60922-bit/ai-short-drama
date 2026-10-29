/**
 * V12 · Mask × Amnesia Link Gate (伪装揭穿 × 失忆唤回 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《逃婚三年》: 揭穿 reveal 常与唤回 recover 同集.
 *  - 与 amnesiaMaskLink（amnesia 主键）互补：本 gate 以 mask 为主键.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_MASK / UNKNOWN_AMNESIA
 *  CHILD_MASK_FAIL / CHILD_AMNESIA_FAIL
 *  RECOVER_NOT_AT_REVEAL — recoverEp 须等于 revealEp
 *  REVEAL_WITHOUT_AMNESIA / RECOVER_WITHOUT_MASK
 *  PENDING_MASK (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  PersonaMaskEntrySchema,
  evaluatePersonaMask,
} from './persona-mask-gate';
import {
  AmnesiaArcEntrySchema,
  evaluateAmnesiaArc,
} from './amnesia-arc-gate';

const Ep = z.number().int().positive();

export const MaskAmnesiaLinkEntrySchema = z.object({
  id: z.string().min(1),
  maskId: z.string().min(1),
  amnesiaId: z.string().min(1),
  note: z.string().optional(),
});

export const MaskAmnesiaLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  masks: z.array(PersonaMaskEntrySchema),
  amnesias: z.array(AmnesiaArcEntrySchema),
  links: z.array(MaskAmnesiaLinkEntrySchema),
});

export type MaskAmnesiaLinkLedger = z.infer<typeof MaskAmnesiaLinkLedgerSchema>;

export type MaskAmnesiaLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_MASK'
    | 'UNKNOWN_AMNESIA'
    | 'CHILD_MASK_FAIL'
    | 'CHILD_AMNESIA_FAIL'
    | 'RECOVER_NOT_AT_REVEAL'
    | 'REVEAL_WITHOUT_AMNESIA'
    | 'RECOVER_WITHOUT_MASK'
    | 'PENDING_MASK';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface MaskAmnesiaLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    masks: number;
    amnesias: number;
    latestEp: number;
  };
  findings: MaskAmnesiaLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateMaskAmnesiaLink(input: unknown): MaskAmnesiaLinkReport {
  const parsed = MaskAmnesiaLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, masks: 0, amnesias: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, masks, amnesias, links } = parsed.data;
  const findings: MaskAmnesiaLinkFinding[] = [];
  const push = (x: MaskAmnesiaLinkFinding) => findings.push(x);

  const vReport = evaluatePersonaMask({ series, latestEp, entries: masks });
  if (vReport.verdict === 'FAIL') {
    const childFails = vReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_MASK_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌伪装账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 persona-mask-gate',
    });
  }

  const aReport = evaluateAmnesiaArc({ series, latestEp, entries: amnesias });
  if (aReport.verdict === 'FAIL') {
    const childFails = aReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_AMNESIA_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌失忆账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 amnesia-arc-gate',
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

  const byM = new Map(masks.map((v) => [v.id, v]));
  const byA = new Map(amnesias.map((a) => [a.id, a]));
  const pairedM = new Set<string>();
  const pairedA = new Set<string>();
  let aligned = 0;

  for (const link of links) {
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
    const amnesia = byA.get(link.amnesiaId);
    if (!amnesia) {
      push({
        code: 'UNKNOWN_AMNESIA',
        severity: 'FAIL',
        ids: [link.id, link.amnesiaId],
        message: `联表 ${link.id} 引用未知 amnesia ${link.amnesiaId}`,
        fix: 'amnesiaId 须存在于 amnesias[]',
      });
      continue;
    }

    if (
      amnesia.recoverEp === undefined ||
      mask.revealEp === undefined ||
      amnesia.recoverEp !== mask.revealEp
    ) {
      push({
        code: 'RECOVER_NOT_AT_REVEAL',
        severity: 'FAIL',
        ids: [link.id, mask.id, amnesia.id],
        message: `${link.id}: recover=${amnesia.recoverEp ?? '无'} ≠ reveal=${mask.revealEp ?? '无'}`,
        fix: '唤回 recoverEp 须等于马甲 revealEp',
      });
      continue;
    }

    pairedM.add(mask.id);
    pairedA.add(amnesia.id);
    aligned += 1;
  }

  for (const mask of masks) {
    if (mask.revealEp !== undefined && !pairedM.has(mask.id)) {
      push({
        code: 'REVEAL_WITHOUT_AMNESIA',
        severity: 'FAIL',
        ids: [mask.id],
        message: `mask ${mask.id} revealEp=E${mask.revealEp} 无 mask×amnesia 联表`,
        fix: '为揭穿集挂 MaskAmnesiaLink',
      });
    } else if (!pairedM.has(mask.id)) {
      push({
        code: 'PENDING_MASK',
        severity: 'WARN',
        ids: [mask.id],
        message: `mask ${mask.id} 尚未联表到 mask×amnesia`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const a of amnesias) {
    if (a.recoverEp !== undefined && !pairedA.has(a.id)) {
      push({
        code: 'RECOVER_WITHOUT_MASK',
        severity: 'FAIL',
        ids: [a.id],
        message: `amnesia ${a.id} recoverEp=E${a.recoverEp} 无 mask 联表`,
        fix: '为唤回集挂 MaskAmnesiaLink',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      masks: masks.length,
      amnesias: amnesias.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
