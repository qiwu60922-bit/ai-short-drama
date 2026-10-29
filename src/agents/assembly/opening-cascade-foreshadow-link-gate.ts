/**
 * V12 · Opening-Cascade × Foreshadow Link Gate (开场叠钩 × 伏笔兑现 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽开场叠钩常与 S/A 伏笔 payoff 同集种下或兑现.
 *
 * cascades[]: { id, ep, shotSpec }
 *  SCHEMA / DUP_ID / UNKNOWN_CASCADE / UNKNOWN_FORESHADOW / FUTURE_EP
 *  CHILD_CASCADE_FAIL / CHILD_FORESHADOW_FAIL
 *  EP_NOT_PAYOFF — link.ep = cascade.ep = payoffEp
 *  CASCADE_WITHOUT_FORESHADOW / PAYOFF_WITHOUT_CASCADE
 *  PENDING_FORESHADOW (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { evaluateOpeningCascade } from './opening-cascade-gate';
import {
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
} from './foreshadow-ledger-gate';

const Ep = z.number().int().positive();

export const OpeningCascadeForeshadowCascadeEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const OpeningCascadeForeshadowLinkEntrySchema = z.object({
  id: z.string().min(1),
  cascadeId: z.string().min(1),
  foreshadowId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const OpeningCascadeForeshadowLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  cascades: z.array(OpeningCascadeForeshadowCascadeEntrySchema),
  items: z.array(ForeshadowItemSchema),
  links: z.array(OpeningCascadeForeshadowLinkEntrySchema),
});

export type OpeningCascadeForeshadowLinkLedger = z.infer<typeof OpeningCascadeForeshadowLinkLedgerSchema>;

export type OpeningCascadeForeshadowLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_CASCADE'
    | 'UNKNOWN_FORESHADOW'
    | 'FUTURE_EP'
    | 'CHILD_CASCADE_FAIL'
    | 'CHILD_FORESHADOW_FAIL'
    | 'EP_NOT_PAYOFF'
    | 'CASCADE_WITHOUT_FORESHADOW'
    | 'PAYOFF_WITHOUT_CASCADE'
    | 'PENDING_FORESHADOW';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface OpeningCascadeForeshadowLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    cascades: number;
    items: number;
    latestEp: number;
  };
  findings: OpeningCascadeForeshadowLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateOpeningCascadeForeshadowLink(input: unknown): OpeningCascadeForeshadowLinkReport {
  const parsed = OpeningCascadeForeshadowLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, cascades: 0, items: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, cascades, items, links } = parsed.data;
  const findings: OpeningCascadeForeshadowLinkFinding[] = [];
  const push = (x: OpeningCascadeForeshadowLinkFinding) => findings.push(x);

  for (const c of cascades) {
    const r = evaluateOpeningCascade(c.shotSpec);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_CASCADE_FAIL',
        severity: 'FAIL',
        ids: [c.id, ...childFails.flatMap((f) => f.shotIds ?? [])],
        message: `cascade ${c.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 opening-cascade-gate',
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

  const byC = new Map(cascades.map((c) => [c.id, c]));
  const byItem = new Map(items.map((it) => [it.id, it]));
  const pairedC = new Set<string>();
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
    const cascade = byC.get(link.cascadeId);
    if (!cascade) {
      push({
        code: 'UNKNOWN_CASCADE',
        severity: 'FAIL',
        ids: [link.id, link.cascadeId],
        message: `联表 ${link.id} 引用未知 cascade ${link.cascadeId}`,
        fix: 'cascadeId 须存在于 cascades[]',
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

    if (item.payoffEp === undefined || link.ep !== item.payoffEp || link.ep !== cascade.ep) {
      push({
        code: 'EP_NOT_PAYOFF',
        severity: 'FAIL',
        ids: [link.id, cascade.id, item.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 cascade=${cascade.ep}/fs=${item.payoffEp ?? '无'}`,
        fix: '伏笔 payoff 须踩开场叠钩同集',
      });
      continue;
    }

    pairedC.add(cascade.id);
    pairedItems.add(item.id);
    aligned += 1;
  }

  for (const c of cascades) {
    if (!pairedC.has(c.id)) {
      push({
        code: 'CASCADE_WITHOUT_FORESHADOW',
        severity: 'FAIL',
        ids: [c.id],
        message: `cascade ${c.id} 无 foreshadow 联表`,
        fix: '为开场叠钩挂 OpeningCascadeForeshadowLink',
      });
    }
  }
  for (const it of items) {
    if (it.payoffEp !== undefined && !pairedItems.has(it.id)) {
      push({
        code: 'PAYOFF_WITHOUT_CASCADE',
        severity: 'FAIL',
        ids: [it.id],
        message: `foreshadow ${it.id} payoffEp=E${it.payoffEp} 无 openingCascade 联表`,
        fix: '为伏笔兑现集挂 OpeningCascadeForeshadowLink',
      });
    } else if (!pairedItems.has(it.id)) {
      push({
        code: 'PENDING_FORESHADOW',
        severity: 'WARN',
        ids: [it.id],
        message: `foreshadow ${it.id} 尚未联表到 openingCascade`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      cascades: cascades.length,
      items: items.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
