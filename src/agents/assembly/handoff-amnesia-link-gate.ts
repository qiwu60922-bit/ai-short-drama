/**
 * V12 · Cliffhanger-Handoff × Amnesia Link Gate (集间悬念承接 × 失忆唤回 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《反派拿捏！第三季》: 悬念尾卡常踩唤回，下集 hook 承接真心线.
 *  - 与 amnesiaHandoffLink（amnesia 主键）互补：本 gate 以 handoff 为主键强制「有 handoff 须对齐 recover」。
 *
 *  SCHEMA / DUP_ID / UNKNOWN_AMNESIA / UNKNOWN_HANDOFF
 *  CHILD_AMNESIA_FAIL / CHILD_HANDOFF_FAIL
 *  HANDOFF_NOT_AT_RECOVER — handoff.prevEp 须等于 amnesia.recoverEp
 *  HANDOFF_WITHOUT_AMNESIA — handoff 无联表
 *  PENDING_AMNESIA (WARN)
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

export const HandoffAmnesiaEntrySchema = z.object({
  id: z.string().min(1),
  prevEp: Ep,
  nextEp: Ep,
  prev: ShotSpecDocSchema,
  next: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const HandoffAmnesiaLinkEntrySchema = z.object({
  id: z.string().min(1),
  handoffId: z.string().min(1),
  amnesiaId: z.string().min(1),
  note: z.string().optional(),
});

export const HandoffAmnesiaLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  handoffs: z.array(HandoffAmnesiaEntrySchema),
  amnesias: z.array(AmnesiaArcEntrySchema),
  links: z.array(HandoffAmnesiaLinkEntrySchema),
});

export type HandoffAmnesiaLinkLedger = z.infer<typeof HandoffAmnesiaLinkLedgerSchema>;

export type HandoffAmnesiaLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_AMNESIA'
    | 'UNKNOWN_HANDOFF'
    | 'CHILD_AMNESIA_FAIL'
    | 'CHILD_HANDOFF_FAIL'
    | 'HANDOFF_NOT_AT_RECOVER'
    | 'HANDOFF_WITHOUT_AMNESIA'
    | 'PENDING_AMNESIA';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface HandoffAmnesiaLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    handoffs: number;
    amnesias: number;
    latestEp: number;
  };
  findings: HandoffAmnesiaLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateHandoffAmnesiaLink(input: unknown): HandoffAmnesiaLinkReport {
  const parsed = HandoffAmnesiaLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, handoffs: 0, amnesias: 0, latestEp: 0 },
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

  const { series, latestEp, handoffs, amnesias, links } = parsed.data;
  const findings: HandoffAmnesiaLinkFinding[] = [];
  const push = (x: HandoffAmnesiaLinkFinding) => findings.push(x);

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

  for (const h of handoffs) {
    if (!pairedH.has(h.id)) {
      push({
        code: 'HANDOFF_WITHOUT_AMNESIA',
        severity: 'FAIL',
        ids: [h.id],
        message: `handoff ${h.id} 无 amnesia 联表`,
        fix: '在 links[] 挂 handoffId↔amnesiaId',
      });
    }
  }

  for (const a of amnesias) {
    if (!pairedAm.has(a.id)) {
      push({
        code: 'PENDING_AMNESIA',
        severity: 'WARN',
        ids: [a.id],
        message: `amnesia ${a.id} 尚未联表到 handoff`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      handoffs: handoffs.length,
      amnesias: amnesias.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
