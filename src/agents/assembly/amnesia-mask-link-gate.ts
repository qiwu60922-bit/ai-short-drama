/**
 * V12 · Amnesia × Persona-Mask Link Gate (失忆唤回 × 伪装揭穿 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《逃婚三年》: 唤回 recover 常与 mask reveal 同集，避免空壳揭穿.
 *  - amnesia-arc 管 recover；persona-mask 管 reveal——本 gate 硬对齐.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_AMNESIA / UNKNOWN_MASK
 *  CHILD_AMNESIA_FAIL / CHILD_MASK_FAIL
 *  RECOVER_NOT_AT_REVEAL — recoverEp 须等于 revealEp
 *  REVEAL_WITHOUT_AMNESIA / RECOVER_WITHOUT_MASK
 *  PENDING_AMNESIA (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  AmnesiaArcEntrySchema,
  evaluateAmnesiaArc,
} from './amnesia-arc-gate';
import {
  PersonaMaskEntrySchema,
  evaluatePersonaMask,
} from './persona-mask-gate';

const Ep = z.number().int().positive();

export const AmnesiaMaskLinkEntrySchema = z.object({
  id: z.string().min(1),
  amnesiaId: z.string().min(1),
  maskId: z.string().min(1),
  note: z.string().optional(),
});

export const AmnesiaMaskLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  amnesias: z.array(AmnesiaArcEntrySchema),
  masks: z.array(PersonaMaskEntrySchema),
  links: z.array(AmnesiaMaskLinkEntrySchema),
});

export type AmnesiaMaskLinkLedger = z.infer<typeof AmnesiaMaskLinkLedgerSchema>;

export type AmnesiaMaskLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_AMNESIA'
    | 'UNKNOWN_MASK'
    | 'CHILD_AMNESIA_FAIL'
    | 'CHILD_MASK_FAIL'
    | 'RECOVER_NOT_AT_REVEAL'
    | 'REVEAL_WITHOUT_AMNESIA'
    | 'RECOVER_WITHOUT_MASK'
    | 'PENDING_AMNESIA';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AmnesiaMaskLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    amnesias: number;
    masks: number;
    latestEp: number;
  };
  findings: AmnesiaMaskLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAmnesiaMaskLink(input: unknown): AmnesiaMaskLinkReport {
  const parsed = AmnesiaMaskLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, amnesias: 0, masks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, amnesias, masks, links } = parsed.data;
  const findings: AmnesiaMaskLinkFinding[] = [];
  const push = (x: AmnesiaMaskLinkFinding) => findings.push(x);

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

  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const l of links) {
    if (seen.has(l.id)) dups.add(l.id);
    else seen.add(l.id);
  }
  for (const id of dups) {
    push({ code: 'DUP_ID', severity: 'FAIL', ids: [id], message: `联表ID重复：${id}`, fix: '联表 id 须唯一' });
  }

  const byA = new Map(amnesias.map((a) => [a.id, a]));
  const byM = new Map(masks.map((v) => [v.id, v]));
  const pairedA = new Set<string>();
  const pairedM = new Set<string>();
  let aligned = 0;

  for (const link of links) {
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

    if (
      amnesia.recoverEp === undefined ||
      mask.revealEp === undefined ||
      amnesia.recoverEp !== mask.revealEp
    ) {
      push({
        code: 'RECOVER_NOT_AT_REVEAL',
        severity: 'FAIL',
        ids: [link.id, amnesia.id, mask.id],
        message: `${link.id}: recover=${amnesia.recoverEp ?? '无'} ≠ reveal=${mask.revealEp ?? '无'}`,
        fix: '唤回 recoverEp 须等于马甲 revealEp',
      });
      continue;
    }

    pairedA.add(amnesia.id);
    pairedM.add(mask.id);
    aligned += 1;
  }

  for (const mask of masks) {
    if (mask.revealEp !== undefined && !pairedM.has(mask.id)) {
      push({
        code: 'REVEAL_WITHOUT_AMNESIA',
        severity: 'FAIL',
        ids: [mask.id],
        message: `mask ${mask.id} revealEp=E${mask.revealEp} 无 amnesia 联表`,
        fix: '为揭穿集挂 AmnesiaMaskLink',
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
        fix: '为唤回集挂 AmnesiaMaskLink',
      });
    } else if (!pairedA.has(a.id)) {
      push({
        code: 'PENDING_AMNESIA',
        severity: 'WARN',
        ids: [a.id],
        message: `amnesia ${a.id} 尚未联表到 mask`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      amnesias: amnesias.length,
      masks: masks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
