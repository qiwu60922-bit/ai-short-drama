/**
 * V12 · Identity-Vest × Motif Link Gate (马甲掉落 × 视觉母题 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《盛夏芬德拉》/《机长先生》: 掉马甲常与母题 payoff 同集.
 *  - 与 motifVestLink（motif 主键）互补：本 gate 以 vest 为主键强制「有 drop 须对齐 motif」。
 *
 *  SCHEMA / DUP_ID / UNKNOWN_MOTIF / UNKNOWN_VEST / FUTURE_EP
 *  CHILD_MOTIF_FAIL / CHILD_VEST_FAIL
 *  EP_NOT_DROP — link.ep = dropEp 且有 appearance
 *  DROP_WITHOUT_MOTIF / NO_APPEARANCE_AT_DROP
 *  PENDING_VEST (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  MotifEntrySchema,
  MotifAppearanceSchema,
  evaluateMotifCallbacks,
} from './motif-callback-gate';
import {
  IdentityVestEntrySchema,
  evaluateIdentityVest,
} from './identity-vest-gate';

const Ep = z.number().int().positive();

export const VestMotifLinkEntrySchema = z.object({
  id: z.string().min(1),
  vestId: z.string().min(1),
  motifId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const VestMotifLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  vests: z.array(IdentityVestEntrySchema),
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  links: z.array(VestMotifLinkEntrySchema),
});

export type VestMotifLinkLedger = z.infer<typeof VestMotifLinkLedgerSchema>;

export type VestMotifLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_MOTIF'
    | 'UNKNOWN_VEST'
    | 'FUTURE_EP'
    | 'CHILD_MOTIF_FAIL'
    | 'CHILD_VEST_FAIL'
    | 'EP_NOT_DROP'
    | 'DROP_WITHOUT_MOTIF'
    | 'NO_APPEARANCE_AT_DROP'
    | 'PENDING_VEST';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface VestMotifLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    vests: number;
    motifs: number;
    latestEp: number;
  };
  findings: VestMotifLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateVestMotifLink(input: unknown): VestMotifLinkReport {
  const parsed = VestMotifLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, vests: 0, motifs: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, vests, motifs, appearances, links } = parsed.data;
  const findings: VestMotifLinkFinding[] = [];
  const push = (x: VestMotifLinkFinding) => findings.push(x);

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

  const vReport = evaluateIdentityVest({ series, latestEp, entries: vests });
  if (vReport.verdict === 'FAIL') {
    const childFails = vReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_VEST_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌马甲账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 identity-vest-gate',
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
  const byV = new Map(vests.map((v) => [v.id, v]));
  const pairedM = new Set<string>();
  const pairedV = new Set<string>();
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
    const vest = byV.get(link.vestId);
    if (!vest) {
      push({
        code: 'UNKNOWN_VEST',
        severity: 'FAIL',
        ids: [link.id, link.vestId],
        message: `联表 ${link.id} 引用未知 vest ${link.vestId}`,
        fix: 'vestId 须存在于 vests[]',
      });
      continue;
    }

    if (vest.dropEp === undefined || link.ep !== vest.dropEp) {
      push({
        code: 'EP_NOT_DROP',
        severity: 'FAIL',
        ids: [link.id, motif.id, vest.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 drop=${vest.dropEp ?? '无'}`,
        fix: '母题出场须踩马甲 dropEp',
      });
      continue;
    }

    const hasApp = appearances.some((a) => a.motifId === motif.id && a.ep === link.ep);
    if (!hasApp) {
      push({
        code: 'NO_APPEARANCE_AT_DROP',
        severity: 'FAIL',
        ids: [link.id, motif.id],
        message: `${link.id}: motif ${motif.id} 在 drop E${link.ep} 无 appearance`,
        fix: '补 appearances[] 于 drop 集',
      });
      continue;
    }

    pairedM.add(motif.id);
    pairedV.add(vest.id);
    aligned += 1;
  }

  for (const vest of vests) {
    if (vest.dropEp !== undefined && !pairedV.has(vest.id)) {
      push({
        code: 'DROP_WITHOUT_MOTIF',
        severity: 'FAIL',
        ids: [vest.id],
        message: `vest ${vest.id} dropEp=E${vest.dropEp} 无 motif 联表`,
        fix: '为掉落集挂 VestMotifLink',
      });
    } else if (!pairedV.has(vest.id)) {
      push({
        code: 'PENDING_VEST',
        severity: 'WARN',
        ids: [vest.id],
        message: `vest ${vest.id} 尚未联表到 motif`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      vests: vests.length,
      motifs: motifs.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
