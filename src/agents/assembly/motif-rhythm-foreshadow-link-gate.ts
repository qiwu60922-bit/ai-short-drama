/**
 * V12 · Motif × Rhythm × Foreshadow Link Gate
 * (视觉母题 × 系列节奏 × 伏笔兑现 联表), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 母题 payoff 常与伏笔兑现同集，且节奏须过 story-rhythm 密度门.
 *
 * rhythms[]: { id, ep, shotSpec }
 *  SCHEMA / DUP_ID / UNKNOWN_MOTIF / UNKNOWN_RHYTHM / UNKNOWN_FORESHADOW / FUTURE_EP
 *  CHILD_MOTIF_FAIL / CHILD_RHYTHM_FAIL / CHILD_FORESHADOW_FAIL
 *  EP_NOT_PAYOFF — link.ep = rhythm.ep = payoffEp 且 motif appearance@ep
 *  MOTIF_WITHOUT_LINK / RHYTHM_WITHOUT_LINK / PAYOFF_WITHOUT_LINK
 *  PENDING_FORESHADOW (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { evaluateStoryRhythm } from './story-rhythm-gate';
import {
  MotifEntrySchema,
  MotifAppearanceSchema,
  evaluateMotifCallbacks,
} from './motif-callback-gate';
import {
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
} from './foreshadow-ledger-gate';

const Ep = z.number().int().positive();

export const MotifRhythmForeshadowRhythmEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const MotifRhythmForeshadowLinkEntrySchema = z.object({
  id: z.string().min(1),
  motifId: z.string().min(1),
  rhythmId: z.string().min(1),
  foreshadowId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const MotifRhythmForeshadowLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  rhythms: z.array(MotifRhythmForeshadowRhythmEntrySchema),
  items: z.array(ForeshadowItemSchema),
  links: z.array(MotifRhythmForeshadowLinkEntrySchema),
});

export type MotifRhythmForeshadowLinkLedger = z.infer<typeof MotifRhythmForeshadowLinkLedgerSchema>;

export type MotifRhythmForeshadowLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_MOTIF'
    | 'UNKNOWN_RHYTHM'
    | 'UNKNOWN_FORESHADOW'
    | 'FUTURE_EP'
    | 'CHILD_MOTIF_FAIL'
    | 'CHILD_RHYTHM_FAIL'
    | 'CHILD_FORESHADOW_FAIL'
    | 'EP_NOT_PAYOFF'
    | 'MOTIF_WITHOUT_LINK'
    | 'RHYTHM_WITHOUT_LINK'
    | 'PAYOFF_WITHOUT_LINK'
    | 'PENDING_FORESHADOW';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface MotifRhythmForeshadowLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    motifs: number;
    rhythms: number;
    items: number;
    latestEp: number;
  };
  findings: MotifRhythmForeshadowLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateMotifRhythmForeshadowLink(input: unknown): MotifRhythmForeshadowLinkReport {
  const parsed = MotifRhythmForeshadowLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, motifs: 0, rhythms: 0, items: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, motifs, appearances, rhythms, items, links } = parsed.data;
  const findings: MotifRhythmForeshadowLinkFinding[] = [];
  const push = (x: MotifRhythmForeshadowLinkFinding) => findings.push(x);

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

  for (const ry of rhythms) {
    const r = evaluateStoryRhythm(ry.shotSpec);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_RHYTHM_FAIL',
        severity: 'FAIL',
        ids: [ry.id, ...childFails.flatMap((f) => f.shotIds ?? [])],
        message: `rhythm ${ry.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 story-rhythm-gate',
      });
    }
  }

  const fsReport = evaluateForeshadowLedger({ series, latestEp, items });
  if (fsReport.verdict === 'FAIL') {
    const childFails = fsReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_FORESHADOW_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌伏笔账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 foreshadow-ledger-gate',
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

  const byM = new Map(motifs.map((m) => [m.id, m]));
  const byR = new Map(rhythms.map((r) => [r.id, r]));
  const byItem = new Map(items.map((it) => [it.id, it]));
  const pairedM = new Set<string>();
  const pairedR = new Set<string>();
  const pairedItems = new Set<string>();
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
    const motif = byM.get(link.motifId);
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
    const ry = byR.get(link.rhythmId);
    if (!ry) {
      push({
        code: 'UNKNOWN_RHYTHM',
        severity: 'FAIL',
        ids: [link.id, link.rhythmId],
        message: `联表 ${link.id} 引用未知 rhythm ${link.rhythmId}`,
        fix: 'rhythmId 须存在于 rhythms[]',
      });
      continue;
    }
    const item = byItem.get(link.foreshadowId);
    if (!item) {
      push({
        code: 'UNKNOWN_FORESHADOW',
        severity: 'FAIL',
        ids: [link.id, link.foreshadowId],
        message: `联表 ${link.id} 引用未知 foreshadow ${link.foreshadowId}`,
        fix: 'foreshadowId 须存在于 items[]',
      });
      continue;
    }

    const hasAppearance = appearances.some((a) => a.motifId === motif.id && a.ep === link.ep);
    if (
      !hasAppearance ||
      item.payoffEp === undefined ||
      link.ep !== item.payoffEp ||
      link.ep !== ry.ep
    ) {
      push({
        code: 'EP_NOT_PAYOFF',
        severity: 'FAIL',
        ids: [link.id, motif.id, ry.id, item.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 motifAppear=${hasAppearance}/rhythm=${ry.ep}/fs=${item.payoffEp ?? '无'}`,
        fix: '母题 appearance + 节奏档 + 伏笔 payoff 须同集',
      });
      continue;
    }

    pairedM.add(motif.id);
    pairedR.add(ry.id);
    pairedItems.add(item.id);
    aligned += 1;
  }

  for (const motif of motifs) {
    if (!pairedM.has(motif.id)) {
      push({
        code: 'MOTIF_WITHOUT_LINK',
        severity: 'FAIL',
        ids: [motif.id],
        message: `motif ${motif.id} 无 motif×rhythm×foreshadow 联表`,
        fix: '为母题挂 MotifRhythmForeshadowLink',
      });
    }
  }
  for (const ry of rhythms) {
    if (!pairedR.has(ry.id)) {
      push({
        code: 'RHYTHM_WITHOUT_LINK',
        severity: 'FAIL',
        ids: [ry.id],
        message: `rhythm ${ry.id} 无 motif×rhythm×foreshadow 联表`,
        fix: '为节奏档挂 MotifRhythmForeshadowLink',
      });
    }
  }
  for (const it of items) {
    if (it.payoffEp !== undefined && !pairedItems.has(it.id)) {
      push({
        code: 'PAYOFF_WITHOUT_LINK',
        severity: 'FAIL',
        ids: [it.id],
        message: `foreshadow ${it.id} payoffEp=E${it.payoffEp} 无 motif×rhythm 联表`,
        fix: '为伏笔兑现集挂 MotifRhythmForeshadowLink',
      });
    } else if (!pairedItems.has(it.id)) {
      push({
        code: 'PENDING_FORESHADOW',
        severity: 'WARN',
        ids: [it.id],
        message: `foreshadow ${it.id} 尚未联表`,
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
      rhythms: rhythms.length,
      items: items.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
