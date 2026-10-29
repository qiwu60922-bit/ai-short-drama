/**
 * V12 · Vest × Rhythm × Foreshadow Link Gate
 * (马甲掉落 × 系列节奏 × 伏笔兑现 联表), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 掉马甲常与伏笔兑现同集，且节奏须过 story-rhythm 密度门.
 *
 * rhythms[]: { id, ep, shotSpec }
 *  SCHEMA / DUP_ID / UNKNOWN_VEST / UNKNOWN_RHYTHM / UNKNOWN_FORESHADOW / FUTURE_EP
 *  CHILD_VEST_FAIL / CHILD_RHYTHM_FAIL / CHILD_FORESHADOW_FAIL
 *  EP_NOT_PAYOFF — link.ep = dropEp = rhythm.ep = payoffEp
 *  DROP_WITHOUT_LINK / RHYTHM_WITHOUT_LINK / PAYOFF_WITHOUT_LINK
 *  PENDING_VEST / PENDING_FORESHADOW (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { evaluateStoryRhythm } from './story-rhythm-gate';
import {
  IdentityVestEntrySchema,
  evaluateIdentityVest,
} from './identity-vest-gate';
import {
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
} from './foreshadow-ledger-gate';

const Ep = z.number().int().positive();

export const VestRhythmForeshadowRhythmEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const VestRhythmForeshadowLinkEntrySchema = z.object({
  id: z.string().min(1),
  vestId: z.string().min(1),
  rhythmId: z.string().min(1),
  foreshadowId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const VestRhythmForeshadowLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  vests: z.array(IdentityVestEntrySchema),
  rhythms: z.array(VestRhythmForeshadowRhythmEntrySchema),
  items: z.array(ForeshadowItemSchema),
  links: z.array(VestRhythmForeshadowLinkEntrySchema),
});

export type VestRhythmForeshadowLinkLedger = z.infer<typeof VestRhythmForeshadowLinkLedgerSchema>;

export type VestRhythmForeshadowLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_VEST'
    | 'UNKNOWN_RHYTHM'
    | 'UNKNOWN_FORESHADOW'
    | 'FUTURE_EP'
    | 'CHILD_VEST_FAIL'
    | 'CHILD_RHYTHM_FAIL'
    | 'CHILD_FORESHADOW_FAIL'
    | 'EP_NOT_PAYOFF'
    | 'DROP_WITHOUT_LINK'
    | 'RHYTHM_WITHOUT_LINK'
    | 'PAYOFF_WITHOUT_LINK'
    | 'PENDING_VEST'
    | 'PENDING_FORESHADOW';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface VestRhythmForeshadowLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    vests: number;
    rhythms: number;
    items: number;
    latestEp: number;
  };
  findings: VestRhythmForeshadowLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateVestRhythmForeshadowLink(input: unknown): VestRhythmForeshadowLinkReport {
  const parsed = VestRhythmForeshadowLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, vests: 0, rhythms: 0, items: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, vests, rhythms, items, links } = parsed.data;
  const findings: VestRhythmForeshadowLinkFinding[] = [];
  const push = (x: VestRhythmForeshadowLinkFinding) => findings.push(x);

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

  const byV = new Map(vests.map((v) => [v.id, v]));
  const byR = new Map(rhythms.map((r) => [r.id, r]));
  const byItem = new Map(items.map((it) => [it.id, it]));
  const pairedV = new Set<string>();
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

    if (
      vest.dropEp === undefined ||
      item.payoffEp === undefined ||
      link.ep !== vest.dropEp ||
      link.ep !== item.payoffEp ||
      link.ep !== ry.ep
    ) {
      push({
        code: 'EP_NOT_PAYOFF',
        severity: 'FAIL',
        ids: [link.id, vest.id, ry.id, item.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 drop=${vest.dropEp ?? '无'}/rhythm=${ry.ep}/fs=${item.payoffEp ?? '无'}`,
        fix: '掉马甲 + 节奏档 + 伏笔 payoff 须同集',
      });
      continue;
    }

    pairedV.add(vest.id);
    pairedR.add(ry.id);
    pairedItems.add(item.id);
    aligned += 1;
  }

  for (const vest of vests) {
    if (vest.dropEp !== undefined && !pairedV.has(vest.id)) {
      push({
        code: 'DROP_WITHOUT_LINK',
        severity: 'FAIL',
        ids: [vest.id],
        message: `vest ${vest.id} dropEp=E${vest.dropEp} 无 vest×rhythm×foreshadow 联表`,
        fix: '为掉马甲挂 VestRhythmForeshadowLink',
      });
    } else if (!pairedV.has(vest.id)) {
      push({
        code: 'PENDING_VEST',
        severity: 'WARN',
        ids: [vest.id],
        message: `vest ${vest.id} 尚未联表`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const ry of rhythms) {
    if (!pairedR.has(ry.id)) {
      push({
        code: 'RHYTHM_WITHOUT_LINK',
        severity: 'FAIL',
        ids: [ry.id],
        message: `rhythm ${ry.id} 无 vest×rhythm×foreshadow 联表`,
        fix: '为节奏档挂 VestRhythmForeshadowLink',
      });
    }
  }
  for (const it of items) {
    if (it.payoffEp !== undefined && !pairedItems.has(it.id)) {
      push({
        code: 'PAYOFF_WITHOUT_LINK',
        severity: 'FAIL',
        ids: [it.id],
        message: `foreshadow ${it.id} payoffEp=E${it.payoffEp} 无 vest×rhythm 联表`,
        fix: '为伏笔兑现集挂 VestRhythmForeshadowLink',
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
      vests: vests.length,
      rhythms: rhythms.length,
      items: items.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
