/**
 * V12 · Cliff-Cascade × Motif Link Gate (跨集悬念叠钩 × 视觉母题 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《盛夏芬德拉》: 跨集 cascade 须挂母题回扣，避免软重置.
 *  - 与 motifCliffLink（motif 主键）互补：本 gate 以 cliff 为主键强制「有 cascade 须对齐 motif」。
 *
 *  SCHEMA / DUP_ID / UNKNOWN_MOTIF / UNKNOWN_CLIFF
 *  CHILD_MOTIF_FAIL / CHILD_CASCADE_FAIL
 *  NO_MOTIF_AT_NEXT — cliff.nextEp 须有 appearance
 *  CLIFF_WITHOUT_MOTIF — cliff 无联表（cliff 主键）
 *  PENDING_CLIFF (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  MotifEntrySchema,
  MotifAppearanceSchema,
  evaluateMotifCallbacks,
} from './motif-callback-gate';
import {
  CliffCascadeLinkEntrySchema,
  evaluateCliffCascadeLink,
} from './cliff-cascade-link-gate';

const Ep = z.number().int().positive();

export const CliffMotifLinkEntrySchema = z.object({
  id: z.string().min(1),
  cliffLinkId: z.string().min(1),
  motifId: z.string().min(1),
  note: z.string().optional(),
});

export const CliffMotifLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  links: z.array(CliffMotifLinkEntrySchema),
});

export type CliffMotifLinkLedger = z.infer<typeof CliffMotifLinkLedgerSchema>;

export type CliffMotifLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_MOTIF'
    | 'UNKNOWN_CLIFF'
    | 'CHILD_MOTIF_FAIL'
    | 'CHILD_CASCADE_FAIL'
    | 'NO_MOTIF_AT_NEXT'
    | 'CLIFF_WITHOUT_MOTIF'
    | 'PENDING_MOTIF';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface CliffMotifLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    cliffLinks: number;
    motifs: number;
    latestEp: number;
  };
  findings: CliffMotifLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateCliffMotifLink(input: unknown): CliffMotifLinkReport {
  const parsed = CliffMotifLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, cliffLinks: 0, motifs: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, cliffLinks, motifs, appearances, links } = parsed.data;
  const findings: CliffMotifLinkFinding[] = [];
  const push = (x: CliffMotifLinkFinding) => findings.push(x);

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

  if (cliffLinks.length) {
    const cascade = evaluateCliffCascadeLink({ series, latestEp, links: cliffLinks });
    if (cascade.verdict === 'FAIL') {
      const childFails = cascade.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_CASCADE_FAIL',
        severity: 'FAIL',
        ids: childFails.flatMap((f) => f.ids ?? []),
        message: `内嵌 cliffCascade FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 cliff-cascade-link-gate',
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
  const byCliff = new Map(cliffLinks.map((c) => [c.id, c]));
  const pairedCliffs = new Set<string>();
  const pairedMotifs = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const motif = byMotif.get(link.motifId);
    const cliff = byCliff.get(link.cliffLinkId);
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
    if (!cliff) {
      push({
        code: 'UNKNOWN_CLIFF',
        severity: 'FAIL',
        ids: [link.id, link.cliffLinkId],
        message: `联表 ${link.id} 引用未知 cliffLink ${link.cliffLinkId}`,
        fix: 'cliffLinkId 须存在于 cliffLinks[]',
      });
      continue;
    }
    pairedCliffs.add(cliff.id);
    pairedMotifs.add(motif.id);

    if (!appearances.some((a) => a.motifId === motif.id && a.ep === cliff.nextEp)) {
      push({
        code: 'NO_MOTIF_AT_NEXT',
        severity: 'FAIL',
        ids: [link.id, motif.id, cliff.id],
        message: `${link.id}: motif ${motif.id} 在 cliff.nextEp=E${cliff.nextEp} 无 appearance`,
        fix: '下集承接窗须有母题回扣镜',
      });
      continue;
    }

    aligned += 1;
  }

  for (const c of cliffLinks) {
    if (!pairedCliffs.has(c.id)) {
      push({
        code: 'CLIFF_WITHOUT_MOTIF',
        severity: 'FAIL',
        ids: [c.id],
        message: `cliffLink ${c.id} 无 motif 联表`,
        fix: '在 links[] 挂 motifId↔cliffLinkId',
      });
    }
  }
  for (const m of motifs) {
    if (!pairedMotifs.has(m.id)) {
      push({
        code: 'PENDING_MOTIF',
        severity: 'WARN',
        ids: [m.id],
        message: `motif ${m.id} 尚未联表到 cliff`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      cliffLinks: cliffLinks.length,
      motifs: motifs.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
