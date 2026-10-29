/**
 * V12 · Vest × Cold-Open Link Gate (马甲掉落 × 冷开钩 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 掉马甲当集常冷开快入抛钩.
 *
 * coldOpens[]: { id, ep, shotSpec }
 *  SCHEMA / DUP_ID / UNKNOWN_VEST / UNKNOWN_COLD_OPEN / FUTURE_EP
 *  CHILD_VEST_FAIL / CHILD_COLD_OPEN_FAIL
 *  EP_NOT_DROP — link.ep = dropEp = coldOpen.ep
 *  DROP_WITHOUT_COLD / COLD_OPEN_WITHOUT_VEST
 *  PENDING_VEST (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { evaluateColdOpenHook } from './cold-open-hook-gate';
import {
  IdentityVestEntrySchema,
  evaluateIdentityVest,
} from './identity-vest-gate';

const Ep = z.number().int().positive();

export const VestColdOpenColdOpenEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const VestColdOpenLinkEntrySchema = z.object({
  id: z.string().min(1),
  vestId: z.string().min(1),
  coldOpenId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const VestColdOpenLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  vests: z.array(IdentityVestEntrySchema),
  coldOpens: z.array(VestColdOpenColdOpenEntrySchema),
  links: z.array(VestColdOpenLinkEntrySchema),
});

export type VestColdOpenLinkLedger = z.infer<typeof VestColdOpenLinkLedgerSchema>;

export type VestColdOpenLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_VEST'
    | 'UNKNOWN_COLD_OPEN'
    | 'FUTURE_EP'
    | 'CHILD_VEST_FAIL'
    | 'CHILD_COLD_OPEN_FAIL'
    | 'EP_NOT_DROP'
    | 'DROP_WITHOUT_COLD'
    | 'COLD_OPEN_WITHOUT_VEST'
    | 'PENDING_VEST';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface VestColdOpenLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    vests: number;
    coldOpens: number;
    latestEp: number;
  };
  findings: VestColdOpenLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateVestColdOpenLink(input: unknown): VestColdOpenLinkReport {
  const parsed = VestColdOpenLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, vests: 0, coldOpens: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, vests, coldOpens, links } = parsed.data;
  const findings: VestColdOpenLinkFinding[] = [];
  const push = (x: VestColdOpenLinkFinding) => findings.push(x);

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

  const byV = new Map(vests.map((v) => [v.id, v]));
  const byC = new Map(coldOpens.map((c) => [c.id, c]));
  const pairedV = new Set<string>();
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

    if (vest.dropEp === undefined || link.ep !== vest.dropEp || link.ep !== co.ep) {
      push({
        code: 'EP_NOT_DROP',
        severity: 'FAIL',
        ids: [link.id, vest.id, co.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 drop=${vest.dropEp ?? '无'}/coldOpen=${co.ep}`,
        fix: '掉马甲与冷开须同集',
      });
      continue;
    }

    pairedV.add(vest.id);
    pairedC.add(co.id);
    aligned += 1;
  }

  for (const vest of vests) {
    if (vest.dropEp !== undefined && !pairedV.has(vest.id)) {
      push({
        code: 'DROP_WITHOUT_COLD',
        severity: 'FAIL',
        ids: [vest.id],
        message: `vest ${vest.id} dropEp=E${vest.dropEp} 无 coldOpen 联表`,
        fix: '为掉马甲挂 VestColdOpenLink',
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
  for (const co of coldOpens) {
    if (!pairedC.has(co.id)) {
      push({
        code: 'COLD_OPEN_WITHOUT_VEST',
        severity: 'FAIL',
        ids: [co.id],
        message: `coldOpen ${co.id} 无 vest 联表`,
        fix: '为冷开挂 VestColdOpenLink',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      vests: vests.length,
      coldOpens: coldOpens.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
