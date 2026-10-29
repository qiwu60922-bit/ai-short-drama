/**
 * V12 · Amnesia × Identity-Vest Link Gate (失忆唤回 × 马甲掉落 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《逃婚三年》: 唤回 recover 常与掉马甲同集，避免空壳身份崩塌.
 *  - amnesia-arc 管 recover；identity-vest 管 drop——本 gate 硬对齐.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_AMNESIA / UNKNOWN_VEST
 *  CHILD_AMNESIA_FAIL / CHILD_VEST_FAIL
 *  RECOVER_NOT_AT_DROP — recoverEp 须等于 dropEp
 *  DROP_WITHOUT_AMNESIA / RECOVER_WITHOUT_VEST
 *  PENDING_AMNESIA (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  AmnesiaArcEntrySchema,
  evaluateAmnesiaArc,
} from './amnesia-arc-gate';
import {
  IdentityVestEntrySchema,
  evaluateIdentityVest,
} from './identity-vest-gate';

const Ep = z.number().int().positive();

export const AmnesiaVestLinkEntrySchema = z.object({
  id: z.string().min(1),
  amnesiaId: z.string().min(1),
  vestId: z.string().min(1),
  note: z.string().optional(),
});

export const AmnesiaVestLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  amnesias: z.array(AmnesiaArcEntrySchema),
  vests: z.array(IdentityVestEntrySchema),
  links: z.array(AmnesiaVestLinkEntrySchema),
});

export type AmnesiaVestLinkLedger = z.infer<typeof AmnesiaVestLinkLedgerSchema>;

export type AmnesiaVestLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_AMNESIA'
    | 'UNKNOWN_VEST'
    | 'CHILD_AMNESIA_FAIL'
    | 'CHILD_VEST_FAIL'
    | 'RECOVER_NOT_AT_DROP'
    | 'DROP_WITHOUT_AMNESIA'
    | 'RECOVER_WITHOUT_VEST'
    | 'PENDING_AMNESIA';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AmnesiaVestLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    amnesias: number;
    vests: number;
    latestEp: number;
  };
  findings: AmnesiaVestLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAmnesiaVestLink(input: unknown): AmnesiaVestLinkReport {
  const parsed = AmnesiaVestLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, amnesias: 0, vests: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, amnesias, vests, links } = parsed.data;
  const findings: AmnesiaVestLinkFinding[] = [];
  const push = (x: AmnesiaVestLinkFinding) => findings.push(x);

  const aReport = evaluateAmnesiaArc({ series, latestEp, entries: amnesias });
  if (aReport.verdict === 'FAIL') {
    const childFails = aReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_AMNESIA_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌失忆账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 amnesia-arc-gate',
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

  const byA = new Map(amnesias.map((a) => [a.id, a]));
  const byV = new Map(vests.map((v) => [v.id, v]));
  const pairedA = new Set<string>();
  const pairedV = new Set<string>();
  let aligned = 0;

  for (const link of links) {
    const amnesia = byA.get(link.amnesiaId);
    if (!amnesia) {
      push({
        code: 'UNKNOWN_AMNESIA',
        severity: 'FAIL',
        ids: [link.id, link.amnesiaId],
        message: `联表 ${link.id} 引用未知 amnesia ${link.amnesiaId}`,
        fix: 'amnesiaId 须存在于 amnesias[]',
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

    if (
      amnesia.recoverEp === undefined ||
      vest.dropEp === undefined ||
      amnesia.recoverEp !== vest.dropEp
    ) {
      push({
        code: 'RECOVER_NOT_AT_DROP',
        severity: 'FAIL',
        ids: [link.id, amnesia.id, vest.id],
        message: `${link.id}: recover=${amnesia.recoverEp ?? '无'} ≠ drop=${vest.dropEp ?? '无'}`,
        fix: '唤回 recoverEp 须等于马甲 dropEp',
      });
      continue;
    }

    pairedA.add(amnesia.id);
    pairedV.add(vest.id);
    aligned += 1;
  }

  for (const vest of vests) {
    if (vest.dropEp !== undefined && !pairedV.has(vest.id)) {
      push({
        code: 'DROP_WITHOUT_AMNESIA',
        severity: 'FAIL',
        ids: [vest.id],
        message: `vest ${vest.id} dropEp=E${vest.dropEp} 无 amnesia 联表`,
        fix: '为掉落集挂 AmnesiaVestLink',
      });
    }
  }
  for (const a of amnesias) {
    if (a.recoverEp !== undefined && !pairedA.has(a.id)) {
      push({
        code: 'RECOVER_WITHOUT_VEST',
        severity: 'FAIL',
        ids: [a.id],
        message: `amnesia ${a.id} recoverEp=E${a.recoverEp} 无 vest 联表`,
        fix: '为唤回集挂 AmnesiaVestLink',
      });
    } else if (!pairedA.has(a.id)) {
      push({
        code: 'PENDING_AMNESIA',
        severity: 'WARN',
        ids: [a.id],
        message: `amnesia ${a.id} 尚未联表到 vest`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      amnesias: amnesias.length,
      vests: vests.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
