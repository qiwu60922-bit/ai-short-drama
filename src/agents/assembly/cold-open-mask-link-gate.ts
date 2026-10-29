/**
 * V12 · Cold-Open × Mask Link Gate (冷开钩 × 伪装揭穿 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 冷开快入常与 mask reveal 同集.
 *
 * coldOpens[]: { id, ep, shotSpec }
 *  SCHEMA / DUP_ID / UNKNOWN_COLD_OPEN / UNKNOWN_MASK / FUTURE_EP
 *  CHILD_COLD_OPEN_FAIL / CHILD_MASK_FAIL
 *  EP_NOT_REVEAL — link.ep = coldOpen.ep = revealEp
 *  COLD_OPEN_WITHOUT_MASK / REVEAL_WITHOUT_COLD
 *  PENDING_MASK (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { evaluateColdOpenHook } from './cold-open-hook-gate';
import {
  PersonaMaskEntrySchema,
  evaluatePersonaMask,
} from './persona-mask-gate';

const Ep = z.number().int().positive();

export const ColdOpenMaskColdOpenEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const ColdOpenMaskLinkEntrySchema = z.object({
  id: z.string().min(1),
  coldOpenId: z.string().min(1),
  maskId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const ColdOpenMaskLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  coldOpens: z.array(ColdOpenMaskColdOpenEntrySchema),
  masks: z.array(PersonaMaskEntrySchema),
  links: z.array(ColdOpenMaskLinkEntrySchema),
});

export type ColdOpenMaskLinkLedger = z.infer<typeof ColdOpenMaskLinkLedgerSchema>;

export type ColdOpenMaskLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_COLD_OPEN'
    | 'UNKNOWN_MASK'
    | 'FUTURE_EP'
    | 'CHILD_COLD_OPEN_FAIL'
    | 'CHILD_MASK_FAIL'
    | 'EP_NOT_REVEAL'
    | 'COLD_OPEN_WITHOUT_MASK'
    | 'REVEAL_WITHOUT_COLD'
    | 'PENDING_MASK';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface ColdOpenMaskLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    coldOpens: number;
    masks: number;
    latestEp: number;
  };
  findings: ColdOpenMaskLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateColdOpenMaskLink(input: unknown): ColdOpenMaskLinkReport {
  const parsed = ColdOpenMaskLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, coldOpens: 0, masks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, coldOpens, masks, links } = parsed.data;
  const findings: ColdOpenMaskLinkFinding[] = [];
  const push = (x: ColdOpenMaskLinkFinding) => findings.push(x);

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

  const mReport = evaluatePersonaMask({ series, latestEp, entries: masks });
  if (mReport.verdict === 'FAIL') {
    const childFails = mReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_MASK_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌伪装账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 persona-mask-gate',
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

  const byC = new Map(coldOpens.map((c) => [c.id, c]));
  const byM = new Map(masks.map((m) => [m.id, m]));
  const pairedC = new Set<string>();
  const pairedM = new Set<string>();
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
    const mask = byM.get(link.maskId);
    if (!mask) {
      push({
        code: 'UNKNOWN_MASK',
        severity: 'FAIL',
        ids: [link.id, link.maskId],
        message: `联表 ${link.id} 引用未知 mask ${link.maskId}`,
        fix: 'maskId 须存在于 masks[]',
      });
      continue;
    }

    if (mask.revealEp === undefined || link.ep !== co.ep || link.ep !== mask.revealEp) {
      push({
        code: 'EP_NOT_REVEAL',
        severity: 'FAIL',
        ids: [link.id, co.id, mask.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 coldOpen=${co.ep}/reveal=${mask.revealEp ?? '无'}`,
        fix: '冷开与揭穿须同集',
      });
      continue;
    }

    pairedC.add(co.id);
    pairedM.add(mask.id);
    aligned += 1;
  }

  for (const co of coldOpens) {
    if (!pairedC.has(co.id)) {
      push({
        code: 'COLD_OPEN_WITHOUT_MASK',
        severity: 'FAIL',
        ids: [co.id],
        message: `coldOpen ${co.id} 无 coldOpen×mask 联表`,
        fix: '为冷开挂 ColdOpenMaskLink',
      });
    }
  }
  for (const mask of masks) {
    if (mask.revealEp !== undefined && !pairedM.has(mask.id)) {
      push({
        code: 'REVEAL_WITHOUT_COLD',
        severity: 'FAIL',
        ids: [mask.id],
        message: `mask ${mask.id} revealEp=E${mask.revealEp} 无 coldOpen 联表`,
        fix: '为揭穿集挂 ColdOpenMaskLink',
      });
    } else if (!pairedM.has(mask.id)) {
      push({
        code: 'PENDING_MASK',
        severity: 'WARN',
        ids: [mask.id],
        message: `mask ${mask.id} 尚未联表`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      coldOpens: coldOpens.length,
      masks: masks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
