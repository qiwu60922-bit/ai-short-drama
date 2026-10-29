/**
 * V12 · Reveal × Cold-Open Link Gate (伪装揭穿 × 冷开钩 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 揭穿主线当集常冷开快入抛钩.
 *  - 与 vestColdOpenLink / coldOpenMaskLink 互补：本 gate 以 reveal 为主键命名.
 *
 * coldOpens[]: { id, ep, shotSpec }
 *  SCHEMA / DUP_ID / UNKNOWN_REVEAL / UNKNOWN_COLD_OPEN / FUTURE_EP
 *  CHILD_REVEAL_FAIL / CHILD_COLD_OPEN_FAIL
 *  EP_NOT_REVEAL — link.ep = revealEp = coldOpen.ep
 *  REVEAL_WITHOUT_COLD / COLD_OPEN_WITHOUT_REVEAL
 *  PENDING_REVEAL (WARN)
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

export const RevealColdOpenColdOpenEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const RevealColdOpenLinkEntrySchema = z.object({
  id: z.string().min(1),
  revealId: z.string().min(1),
  coldOpenId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const RevealColdOpenLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  reveals: z.array(PersonaMaskEntrySchema),
  coldOpens: z.array(RevealColdOpenColdOpenEntrySchema),
  links: z.array(RevealColdOpenLinkEntrySchema),
});

export type RevealColdOpenLinkLedger = z.infer<typeof RevealColdOpenLinkLedgerSchema>;

export type RevealColdOpenLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_REVEAL'
    | 'UNKNOWN_COLD_OPEN'
    | 'FUTURE_EP'
    | 'CHILD_REVEAL_FAIL'
    | 'CHILD_COLD_OPEN_FAIL'
    | 'EP_NOT_REVEAL'
    | 'REVEAL_WITHOUT_COLD'
    | 'COLD_OPEN_WITHOUT_REVEAL'
    | 'PENDING_REVEAL';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface RevealColdOpenLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    reveals: number;
    coldOpens: number;
    latestEp: number;
  };
  findings: RevealColdOpenLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateRevealColdOpenLink(input: unknown): RevealColdOpenLinkReport {
  const parsed = RevealColdOpenLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, reveals: 0, coldOpens: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, reveals, coldOpens, links } = parsed.data;
  const findings: RevealColdOpenLinkFinding[] = [];
  const push = (x: RevealColdOpenLinkFinding) => findings.push(x);

  const rReport = evaluatePersonaMask({ series, latestEp, entries: reveals });
  if (rReport.verdict === 'FAIL') {
    const childFails = rReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_REVEAL_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌揭穿账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 persona-mask-gate (reveals)',
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

  const byR = new Map(reveals.map((r) => [r.id, r]));
  const byC = new Map(coldOpens.map((c) => [c.id, c]));
  const pairedR = new Set<string>();
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
    const reveal = byR.get(link.revealId);
    if (!reveal) {
      push({
        code: 'UNKNOWN_REVEAL',
        severity: 'FAIL',
        ids: [link.id, link.revealId],
        message: `联表 ${link.id} 引用未知 reveal ${link.revealId}`,
        fix: 'revealId 须存在于 reveals[]',
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

    if (reveal.revealEp === undefined || link.ep !== reveal.revealEp || link.ep !== co.ep) {
      push({
        code: 'EP_NOT_REVEAL',
        severity: 'FAIL',
        ids: [link.id, reveal.id, co.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 reveal=${reveal.revealEp ?? '无'}/coldOpen=${co.ep}`,
        fix: '揭穿与冷开须同集',
      });
      continue;
    }

    pairedR.add(reveal.id);
    pairedC.add(co.id);
    aligned += 1;
  }

  for (const reveal of reveals) {
    if (reveal.revealEp !== undefined && !pairedR.has(reveal.id)) {
      push({
        code: 'REVEAL_WITHOUT_COLD',
        severity: 'FAIL',
        ids: [reveal.id],
        message: `reveal ${reveal.id} revealEp=E${reveal.revealEp} 无 coldOpen 联表`,
        fix: '为揭穿集挂 RevealColdOpenLink',
      });
    } else if (!pairedR.has(reveal.id)) {
      push({
        code: 'PENDING_REVEAL',
        severity: 'WARN',
        ids: [reveal.id],
        message: `reveal ${reveal.id} 尚未联表`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const co of coldOpens) {
    if (!pairedC.has(co.id)) {
      push({
        code: 'COLD_OPEN_WITHOUT_REVEAL',
        severity: 'FAIL',
        ids: [co.id],
        message: `coldOpen ${co.id} 无 reveal 联表`,
        fix: '为冷开挂 RevealColdOpenLink',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      reveals: reveals.length,
      coldOpens: coldOpens.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
