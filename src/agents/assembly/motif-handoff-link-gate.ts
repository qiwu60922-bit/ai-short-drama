/**
 * V12 · Motif × Cliffhanger-Handoff Link Gate (视觉母题 × 集间悬念承接 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《盛夏芬德拉》: 母题回扣当集尾卡悬念，下集 hook 承接视觉线.
 *  - motif-callback 管 appearance；cliffhanger-handoff 管两 ShotSpec——本 gate 硬对齐 appearance@prevEp.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_MOTIF / UNKNOWN_HANDOFF
 *  CHILD_MOTIF_FAIL / CHILD_HANDOFF_FAIL
 *  NO_MOTIF_AT_HANDOFF — prevEp 须有 appearance
 *  HANDOFF_WITHOUT_MOTIF — handoff 未联表
 *  PENDING_MOTIF (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import {
  MotifEntrySchema,
  MotifAppearanceSchema,
  evaluateMotifCallbacks,
} from './motif-callback-gate';
import { evaluateCliffhangerHandoff } from './cliffhanger-handoff-gate';

const Ep = z.number().int().positive();

export const MotifHandoffEntrySchema = z.object({
  id: z.string().min(1),
  prevEp: Ep,
  nextEp: Ep,
  prev: ShotSpecDocSchema,
  next: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const MotifHandoffLinkEntrySchema = z.object({
  id: z.string().min(1),
  motifId: z.string().min(1),
  handoffId: z.string().min(1),
  note: z.string().optional(),
});

export const MotifHandoffLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  handoffs: z.array(MotifHandoffEntrySchema),
  links: z.array(MotifHandoffLinkEntrySchema),
});

export type MotifHandoffLinkLedger = z.infer<typeof MotifHandoffLinkLedgerSchema>;

export type MotifHandoffLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_MOTIF'
    | 'UNKNOWN_HANDOFF'
    | 'CHILD_MOTIF_FAIL'
    | 'CHILD_HANDOFF_FAIL'
    | 'NO_MOTIF_AT_HANDOFF'
    | 'HANDOFF_WITHOUT_MOTIF'
    | 'PENDING_MOTIF';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface MotifHandoffLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    motifs: number;
    handoffs: number;
    latestEp: number;
  };
  findings: MotifHandoffLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateMotifHandoffLink(input: unknown): MotifHandoffLinkReport {
  const parsed = MotifHandoffLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, motifs: 0, handoffs: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, motifs, appearances, handoffs, links } = parsed.data;
  const findings: MotifHandoffLinkFinding[] = [];
  const push = (x: MotifHandoffLinkFinding) => findings.push(x);

  const motifReport = evaluateMotifCallbacks({ series, latestEp, motifs, appearances });
  if (motifReport.verdict === 'FAIL') {
    const childFails = motifReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_MOTIF_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌母题账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 motif-callback-gate',
    });
  }

  for (const h of handoffs) {
    const r = evaluateCliffhangerHandoff(h.prev, h.next);
    if (r.verdict === 'FAIL') {
      const codes = r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
      push({
        code: 'CHILD_HANDOFF_FAIL',
        severity: 'FAIL',
        ids: [h.id],
        message: `handoff ${h.id} FAIL：${codes.join(',') || 'unknown'}`,
        fix: '先修 cliffhanger-handoff-gate',
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
    push({ code: 'DUP_ID', severity: 'FAIL', ids: [id], message: `联表ID重复：${id}`, fix: '联表 id 须唯一' });
  }

  const byMotif = new Map(motifs.map((m) => [m.id, m]));
  const byH = new Map(handoffs.map((h) => [h.id, h]));
  const pairedH = new Set<string>();
  const pairedMotifs = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const motif = byMotif.get(link.motifId);
    const handoff = byH.get(link.handoffId);
    if (!motif) {
      push({
        code: 'UNKNOWN_MOTIF',
        severity: 'FAIL',
        ids: [link.id, link.motifId],
        message: `联表 ${link.id} 引用未知 motif ${link.motifId}`,
        fix: 'motifId 须存在于 motifs[]',
      });
      continue;
    }
    if (!handoff) {
      push({
        code: 'UNKNOWN_HANDOFF',
        severity: 'FAIL',
        ids: [link.id, link.handoffId],
        message: `联表 ${link.id} 引用未知 handoff ${link.handoffId}`,
        fix: 'handoffId 须存在于 handoffs[]',
      });
      continue;
    }
    pairedH.add(handoff.id);
    pairedMotifs.add(motif.id);

    if (!appearances.some((a) => a.motifId === motif.id && a.ep === handoff.prevEp)) {
      push({
        code: 'NO_MOTIF_AT_HANDOFF',
        severity: 'FAIL',
        ids: [link.id, motif.id, handoff.id],
        message: `${link.id}: motif ${motif.id} 在 handoff.prevEp=E${handoff.prevEp} 无 appearance`,
        fix: '母题回扣须落在悬念上一集',
      });
      continue;
    }

    aligned += 1;
  }

  for (const h of handoffs) {
    if (!pairedH.has(h.id)) {
      push({
        code: 'HANDOFF_WITHOUT_MOTIF',
        severity: 'FAIL',
        ids: [h.id],
        message: `handoff ${h.id} 未挂 motif 联表`,
        fix: '在 links[] 挂 motifId↔handoffId',
      });
    }
  }
  for (const m of motifs) {
    if (!pairedMotifs.has(m.id)) {
      push({
        code: 'PENDING_MOTIF',
        severity: 'WARN',
        ids: [m.id],
        message: `motif ${m.id} 尚未联表到 handoff`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      motifs: motifs.length,
      handoffs: handoffs.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
