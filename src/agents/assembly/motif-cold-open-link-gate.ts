/**
 * V12 · Motif × Cold-Open Link Gate (视觉母题 × 冷开钩 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 母题回扣当集常冷开快入抛钩.
 *  - 与 motifVestLink / vestColdOpenLink 互补：本 gate 以 motif 联 coldOpen.
 *
 * coldOpens[]: { id, ep, shotSpec }
 *  SCHEMA / DUP_ID / UNKNOWN_MOTIF / UNKNOWN_COLD_OPEN / FUTURE_EP
 *  CHILD_MOTIF_FAIL / CHILD_COLD_OPEN_FAIL
 *  EP_NOT_MOTIF — link.ep = coldOpen.ep 且 motif appearance@ep
 *  MOTIF_WITHOUT_COLD / COLD_OPEN_WITHOUT_MOTIF
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { evaluateColdOpenHook } from './cold-open-hook-gate';
import {
  MotifEntrySchema,
  MotifAppearanceSchema,
  evaluateMotifCallbacks,
} from './motif-callback-gate';

const Ep = z.number().int().positive();

export const MotifColdOpenColdOpenEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const MotifColdOpenLinkEntrySchema = z.object({
  id: z.string().min(1),
  motifId: z.string().min(1),
  coldOpenId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const MotifColdOpenLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  coldOpens: z.array(MotifColdOpenColdOpenEntrySchema),
  links: z.array(MotifColdOpenLinkEntrySchema),
});

export type MotifColdOpenLinkLedger = z.infer<typeof MotifColdOpenLinkLedgerSchema>;

export type MotifColdOpenLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_MOTIF'
    | 'UNKNOWN_COLD_OPEN'
    | 'FUTURE_EP'
    | 'CHILD_MOTIF_FAIL'
    | 'CHILD_COLD_OPEN_FAIL'
    | 'EP_NOT_MOTIF'
    | 'MOTIF_WITHOUT_COLD'
    | 'COLD_OPEN_WITHOUT_MOTIF';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface MotifColdOpenLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    motifs: number;
    coldOpens: number;
    latestEp: number;
  };
  findings: MotifColdOpenLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateMotifColdOpenLink(input: unknown): MotifColdOpenLinkReport {
  const parsed = MotifColdOpenLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, motifs: 0, coldOpens: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, motifs, appearances, coldOpens, links } = parsed.data;
  const findings: MotifColdOpenLinkFinding[] = [];
  const push = (x: MotifColdOpenLinkFinding) => findings.push(x);

  const mReport = evaluateMotifCallbacks({ series, latestEp, motifs, appearances });
  if (mReport.verdict === 'FAIL') {
    const childFails = mReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_MOTIF_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌母题账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 motif-callback-gate',
    });
  }

  for (const co of coldOpens) {
    const r = evaluateColdOpenHook(co.shotSpec);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_COLD_OPEN_FAIL',
        severity: 'FAIL',
        ids: [co.id, ...childFails.flatMap((f) => f.shotIds ?? [])],
        message: `coldOpen ${co.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 cold-open-hook-gate',
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
  const byC = new Map(coldOpens.map((c) => [c.id, c]));
  const pairedM = new Set<string>();
  const pairedC = new Set<string>();
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
    const motif = byMotif.get(link.motifId);
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
    const co = byC.get(link.coldOpenId);
    if (!co) {
      push({
        code: 'UNKNOWN_COLD_OPEN',
        severity: 'FAIL',
        ids: [link.id, link.coldOpenId],
        message: `联表 ${link.id} 引用未知 coldOpen ${link.coldOpenId}`,
        fix: 'coldOpenId 须存在于 coldOpens[]',
      });
      continue;
    }

    const hasMotif = appearances.some((a) => a.motifId === motif.id && a.ep === link.ep);
    if (link.ep !== co.ep || !hasMotif) {
      push({
        code: 'EP_NOT_MOTIF',
        severity: 'FAIL',
        ids: [link.id, motif.id, co.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 coldOpen=${co.ep}/motif@ep=${hasMotif}`,
        fix: '母题出场与冷开须同集',
      });
      continue;
    }

    pairedM.add(motif.id);
    pairedC.add(co.id);
    aligned += 1;
  }

  for (const motif of motifs) {
    if (!pairedM.has(motif.id)) {
      push({
        code: 'MOTIF_WITHOUT_COLD',
        severity: 'FAIL',
        ids: [motif.id],
        message: `motif ${motif.id} 无 coldOpen 联表`,
        fix: '为母题挂 MotifColdOpenLink',
      });
    }
  }
  for (const co of coldOpens) {
    if (!pairedC.has(co.id)) {
      push({
        code: 'COLD_OPEN_WITHOUT_MOTIF',
        severity: 'FAIL',
        ids: [co.id],
        message: `coldOpen ${co.id} 无 motif 联表`,
        fix: '为冷开挂 MotifColdOpenLink',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      motifs: motifs.length,
      coldOpens: coldOpens.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
