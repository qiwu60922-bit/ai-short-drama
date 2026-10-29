/**
 * V12 · Amnesia × Cliffhanger-Handoff Link Gate (失忆唤回 × 集间悬念承接 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《反派拿捏！第三季》: recover 当集尾卡悬念，下集 hook 承接真心线.
 *  - amnesia-arc 管 plant→companion→recover；cliffhanger-handoff 管两 ShotSpec——本 gate 硬对齐 recoverEp=prevEp.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_AMNESIA / UNKNOWN_HANDOFF
 *  CHILD_AMNESIA_FAIL / CHILD_HANDOFF_FAIL
 *  HANDOFF_NOT_AT_RECOVER — handoff.prevEp 须等于 amnesia.recoverEp
 *  RECOVER_WITHOUT_HANDOFF — 已 recover 无联表
 *  PENDING_HANDOFF (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import {
  AmnesiaArcEntrySchema,
  evaluateAmnesiaArc,
} from './amnesia-arc-gate';
import { evaluateCliffhangerHandoff } from './cliffhanger-handoff-gate';

const Ep = z.number().int().positive();

export const AmnesiaHandoffEntrySchema = z.object({
  id: z.string().min(1),
  prevEp: Ep,
  nextEp: Ep,
  prev: ShotSpecDocSchema,
  next: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const AmnesiaHandoffLinkEntrySchema = z.object({
  id: z.string().min(1),
  amnesiaId: z.string().min(1),
  handoffId: z.string().min(1),
  note: z.string().optional(),
});

export const AmnesiaHandoffLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  amnesias: z.array(AmnesiaArcEntrySchema),
  handoffs: z.array(AmnesiaHandoffEntrySchema),
  links: z.array(AmnesiaHandoffLinkEntrySchema),
});

export type AmnesiaHandoffLinkLedger = z.infer<typeof AmnesiaHandoffLinkLedgerSchema>;

export type AmnesiaHandoffLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_AMNESIA'
    | 'UNKNOWN_HANDOFF'
    | 'CHILD_AMNESIA_FAIL'
    | 'CHILD_HANDOFF_FAIL'
    | 'HANDOFF_NOT_AT_RECOVER'
    | 'RECOVER_WITHOUT_HANDOFF'
    | 'PENDING_HANDOFF';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AmnesiaHandoffLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    amnesias: number;
    handoffs: number;
    latestEp: number;
  };
  findings: AmnesiaHandoffLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAmnesiaHandoffLink(input: unknown): AmnesiaHandoffLinkReport {
  const parsed = AmnesiaHandoffLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, amnesias: 0, handoffs: 0, latestEp: 0 },
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

  const { series, latestEp, amnesias, handoffs, links } = parsed.data;
  const findings: AmnesiaHandoffLinkFinding[] = [];
  const push = (x: AmnesiaHandoffLinkFinding) => findings.push(x);

  const amReport = evaluateAmnesiaArc({ series, latestEp, entries: amnesias });
  if (amReport.verdict === 'FAIL') {
    const childFails = amReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_AMNESIA_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌失忆账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 amnesia-arc-gate',
    });
  }

  for (const h of handoffs) {
    const r = evaluateCliffhangerHandoff(h.prev, h.next);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_HANDOFF_FAIL',
        severity: 'FAIL',
        ids: [h.id, ...childFails.flatMap((f) => f.shotIds ?? [])],
        message: `handoff ${h.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 cliffhanger-handoff-gate（prev cliff → next hook）',
      });
    }
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

  const byAm = new Map(amnesias.map((a) => [a.id, a]));
  const byH = new Map(handoffs.map((h) => [h.id, h]));
  const pairedAm = new Set<string>();
  const pairedH = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const am = byAm.get(link.amnesiaId);
    const h = byH.get(link.handoffId);
    if (!am) {
      push({
        code: 'UNKNOWN_AMNESIA',
        severity: 'FAIL',
        ids: [link.id, link.amnesiaId],
        message: `联表 ${link.id} 引用未知 amnesia ${link.amnesiaId}`,
        fix: 'amnesiaId 须存在于 amnesias[]',
      });
      continue;
    }
    if (!h) {
      push({
        code: 'UNKNOWN_HANDOFF',
        severity: 'FAIL',
        ids: [link.id, link.handoffId],
        message: `联表 ${link.id} 引用未知 handoff ${link.handoffId}`,
        fix: 'handoffId 须存在于 handoffs[]',
      });
      continue;
    }
    pairedAm.add(am.id);
    pairedH.add(h.id);

    if (am.recoverEp === undefined || am.recoverEp !== h.prevEp) {
      push({
        code: 'HANDOFF_NOT_AT_RECOVER',
        severity: 'FAIL',
        ids: [link.id, am.id, h.id],
        message: `${link.id}: recoverEp=${am.recoverEp ?? '未唤回'} ≠ handoff.prevEp=E${h.prevEp}`,
        fix: '唤回集须等于 handoff.prevEp（当集尾卡）',
      });
      continue;
    }

    aligned += 1;
  }

  for (const a of amnesias) {
    if (a.recoverEp !== undefined && !pairedAm.has(a.id)) {
      push({
        code: 'RECOVER_WITHOUT_HANDOFF',
        severity: 'FAIL',
        ids: [a.id],
        message: `amnesia ${a.id} 已 recover@E${a.recoverEp} 但未挂 handoff 联表`,
        fix: '在 links[] 挂 amnesiaId↔handoffId',
      });
    }
  }

  for (const h of handoffs) {
    if (!pairedH.has(h.id)) {
      push({
        code: 'PENDING_HANDOFF',
        severity: 'WARN',
        ids: [h.id],
        message: `handoff ${h.id} 尚未联表到 amnesia`,
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
      handoffs: handoffs.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
