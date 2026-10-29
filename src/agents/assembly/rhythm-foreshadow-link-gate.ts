/**
 * V12 · Rhythm × Foreshadow Link Gate (系列节奏 × 伏笔兑现 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 伏笔 payoff 集节奏须过 story-rhythm 密度门.
 *
 * rhythms[]: { id, ep, shotSpec }
 *  SCHEMA / DUP_ID / UNKNOWN_RHYTHM / UNKNOWN_FORESHADOW / FUTURE_EP
 *  CHILD_RHYTHM_FAIL / CHILD_FORESHADOW_FAIL
 *  EP_NOT_PAYOFF — link.ep = rhythm.ep = payoffEp
 *  RHYTHM_WITHOUT_FORESHADOW / PAYOFF_WITHOUT_RHYTHM
 *  PENDING_FORESHADOW (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { evaluateStoryRhythm } from './story-rhythm-gate';
import {
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
} from './foreshadow-ledger-gate';

const Ep = z.number().int().positive();

export const RhythmForeshadowRhythmEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const RhythmForeshadowLinkEntrySchema = z.object({
  id: z.string().min(1),
  rhythmId: z.string().min(1),
  foreshadowId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const RhythmForeshadowLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  rhythms: z.array(RhythmForeshadowRhythmEntrySchema),
  items: z.array(ForeshadowItemSchema),
  links: z.array(RhythmForeshadowLinkEntrySchema),
});

export type RhythmForeshadowLinkLedger = z.infer<typeof RhythmForeshadowLinkLedgerSchema>;

export type RhythmForeshadowLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_RHYTHM'
    | 'UNKNOWN_FORESHADOW'
    | 'FUTURE_EP'
    | 'CHILD_RHYTHM_FAIL'
    | 'CHILD_FORESHADOW_FAIL'
    | 'EP_NOT_PAYOFF'
    | 'RHYTHM_WITHOUT_FORESHADOW'
    | 'PAYOFF_WITHOUT_RHYTHM'
    | 'PENDING_FORESHADOW';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface RhythmForeshadowLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    rhythms: number;
    items: number;
    latestEp: number;
  };
  findings: RhythmForeshadowLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateRhythmForeshadowLink(input: unknown): RhythmForeshadowLinkReport {
  const parsed = RhythmForeshadowLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, rhythms: 0, items: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, rhythms, items, links } = parsed.data;
  const findings: RhythmForeshadowLinkFinding[] = [];
  const push = (x: RhythmForeshadowLinkFinding) => findings.push(x);

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

  const byR = new Map(rhythms.map((r) => [r.id, r]));
  const byItem = new Map(items.map((it) => [it.id, it]));
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

    if (item.payoffEp === undefined || link.ep !== item.payoffEp || link.ep !== ry.ep) {
      push({
        code: 'EP_NOT_PAYOFF',
        severity: 'FAIL',
        ids: [link.id, ry.id, item.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 rhythm=${ry.ep}/fs=${item.payoffEp ?? '无'}`,
        fix: '伏笔 payoff 须踩节奏档同集',
      });
      continue;
    }

    pairedR.add(ry.id);
    pairedItems.add(item.id);
    aligned += 1;
  }

  for (const ry of rhythms) {
    if (!pairedR.has(ry.id)) {
      push({
        code: 'RHYTHM_WITHOUT_FORESHADOW',
        severity: 'FAIL',
        ids: [ry.id],
        message: `rhythm ${ry.id} 无 foreshadow 联表`,
        fix: '为节奏档挂 RhythmForeshadowLink',
      });
    }
  }
  for (const it of items) {
    if (it.payoffEp !== undefined && !pairedItems.has(it.id)) {
      push({
        code: 'PAYOFF_WITHOUT_RHYTHM',
        severity: 'FAIL',
        ids: [it.id],
        message: `foreshadow ${it.id} payoffEp=E${it.payoffEp} 无 rhythm 联表`,
        fix: '为伏笔兑现集挂 RhythmForeshadowLink',
      });
    } else if (!pairedItems.has(it.id)) {
      push({
        code: 'PENDING_FORESHADOW',
        severity: 'WARN',
        ids: [it.id],
        message: `foreshadow ${it.id} 尚未联表到 rhythm`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      rhythms: rhythms.length,
      items: items.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
