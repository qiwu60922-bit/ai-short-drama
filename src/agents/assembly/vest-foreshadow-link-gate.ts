/**
 * V12 · Vest × Foreshadow Link Gate (马甲掉落 × 伏笔兑现 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《反派拿捏》/《帐中香》: 掉马甲常与 S/A 伏笔 payoff 同集.
 *  - 与 foreshadowVestLink（foreshadow 主键）互补：本 gate 以 vest 为主键硬对齐.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_FORESHADOW / UNKNOWN_VEST / FUTURE_EP
 *  CHILD_FORESHADOW_FAIL / CHILD_VEST_FAIL
 *  EP_NOT_PAYOFF_DROP — link.ep = item.payoffEp = dropEp
 *  DROP_WITHOUT_FORESHADOW / FORESHADOW_WITHOUT_VEST
 *  PENDING_VEST / PENDING_FORESHADOW (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
} from './foreshadow-ledger-gate';
import {
  IdentityVestEntrySchema,
  evaluateIdentityVest,
} from './identity-vest-gate';

const Ep = z.number().int().positive();

export const VestForeshadowLinkEntrySchema = z.object({
  id: z.string().min(1),
  vestId: z.string().min(1),
  foreshadowId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const VestForeshadowLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  vests: z.array(IdentityVestEntrySchema),
  items: z.array(ForeshadowItemSchema),
  links: z.array(VestForeshadowLinkEntrySchema),
});

export type VestForeshadowLinkLedger = z.infer<typeof VestForeshadowLinkLedgerSchema>;

export type VestForeshadowLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_FORESHADOW'
    | 'UNKNOWN_VEST'
    | 'FUTURE_EP'
    | 'CHILD_FORESHADOW_FAIL'
    | 'CHILD_VEST_FAIL'
    | 'EP_NOT_PAYOFF_DROP'
    | 'FORESHADOW_WITHOUT_VEST'
    | 'DROP_WITHOUT_FORESHADOW'
    | 'PENDING_FORESHADOW'
    | 'PENDING_VEST';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface VestForeshadowLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    vests: number;
    items: number;
    latestEp: number;
  };
  findings: VestForeshadowLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateVestForeshadowLink(input: unknown): VestForeshadowLinkReport {
  const parsed = VestForeshadowLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, vests: 0, items: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, vests, items, links } = parsed.data;
  const findings: VestForeshadowLinkFinding[] = [];
  const push = (x: VestForeshadowLinkFinding) => findings.push(x);

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

  const amReport = evaluateIdentityVest({ series, latestEp, entries: vests });
  if (amReport.verdict === 'FAIL') {
    const childFails = amReport.findings.filter((f) => f.severity === 'FAIL');
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

  const byItem = new Map(items.map((it) => [it.id, it]));
  const byAm = new Map(vests.map((a) => [a.id, a]));
  const pairedItems = new Set<string>();
  const pairedAm = new Set<string>();
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
    const vest = byAm.get(link.vestId);
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

    if (
      item.payoffEp === undefined ||
      vest.dropEp === undefined ||
      link.ep !== item.payoffEp ||
      link.ep !== vest.dropEp
    ) {
      push({
        code: 'EP_NOT_PAYOFF_DROP',
        severity: 'FAIL',
        ids: [link.id, item.id, vest.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 fs=${item.payoffEp ?? '无'}/drop=${vest.dropEp ?? '无'}`,
        fix: '伏笔 payoff 须踩马甲 dropEp',
      });
      continue;
    }

    pairedItems.add(item.id);
    pairedAm.add(vest.id);
    aligned += 1;
  }

  for (const it of items) {
    if (it.payoffEp !== undefined && !pairedItems.has(it.id)) {
      push({
        code: 'FORESHADOW_WITHOUT_VEST',
        severity: 'FAIL',
        ids: [it.id],
        message: `foreshadow ${it.id} payoffEp=E${it.payoffEp} 无 vest 联表`,
        fix: '为伏笔兑现集挂 VestForeshadowLink',
      });
    } else if (!pairedItems.has(it.id)) {
      push({
        code: 'PENDING_FORESHADOW',
        severity: 'WARN',
        ids: [it.id],
        message: `foreshadow ${it.id} 尚未联表到 vest`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const am of vests) {
    if (am.dropEp !== undefined && !pairedAm.has(am.id)) {
      push({
        code: 'DROP_WITHOUT_FORESHADOW',
        severity: 'FAIL',
        ids: [am.id],
        message: `vest ${am.id} dropEp=E${am.dropEp} 无 foreshadow 联表`,
        fix: '为掉落集挂 VestForeshadowLink',
      });
    } else if (!pairedAm.has(am.id)) {
      push({
        code: 'PENDING_VEST',
        severity: 'WARN',
        ids: [am.id],
        message: `vest ${am.id} 尚未联表到 foreshadow`,
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
      items: items.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
