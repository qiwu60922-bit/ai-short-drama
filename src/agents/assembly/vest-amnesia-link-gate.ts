/**
 * V12 · Identity-Vest × Amnesia Link Gate (马甲掉落 × 失忆唤回 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《逃婚三年》: 掉马甲常与唤回 recover 同集，避免空壳身份崩塌.
 *  - 与 amnesiaVestLink（amnesia 主键）互补：本 gate 以 vest 为主键.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_VEST / UNKNOWN_AMNESIA
 *  CHILD_VEST_FAIL / CHILD_AMNESIA_FAIL
 *  RECOVER_NOT_AT_DROP — recoverEp 须等于 dropEp
 *  VEST_WITHOUT_AMNESIA — 已 drop 无联表
 *  PENDING_VEST (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  IdentityVestEntrySchema,
  evaluateIdentityVest,
} from './identity-vest-gate';
import {
  AmnesiaArcEntrySchema,
  evaluateAmnesiaArc,
} from './amnesia-arc-gate';

const Ep = z.number().int().positive();

export const VestAmnesiaLinkEntrySchema = z.object({
  id: z.string().min(1),
  vestId: z.string().min(1),
  amnesiaId: z.string().min(1),
  note: z.string().optional(),
});

export const VestAmnesiaLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  vests: z.array(IdentityVestEntrySchema),
  amnesias: z.array(AmnesiaArcEntrySchema),
  links: z.array(VestAmnesiaLinkEntrySchema),
});

export type VestAmnesiaLinkLedger = z.infer<typeof VestAmnesiaLinkLedgerSchema>;

export type VestAmnesiaLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_VEST'
    | 'UNKNOWN_AMNESIA'
    | 'CHILD_VEST_FAIL'
    | 'CHILD_AMNESIA_FAIL'
    | 'RECOVER_NOT_AT_DROP'
    | 'VEST_WITHOUT_AMNESIA'
    | 'PENDING_VEST';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface VestAmnesiaLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    vests: number;
    amnesias: number;
    latestEp: number;
  };
  findings: VestAmnesiaLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateVestAmnesiaLink(input: unknown): VestAmnesiaLinkReport {
  const parsed = VestAmnesiaLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, vests: 0, amnesias: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, vests, amnesias, links } = parsed.data;
  const findings: VestAmnesiaLinkFinding[] = [];
  const push = (x: VestAmnesiaLinkFinding) => findings.push(x);

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
  const pairedV = new Set<string>();
  let aligned = 0;

  for (const link of links) {
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

    pairedV.add(vest.id);
    aligned += 1;
  }

  for (const vest of vests) {
    if (vest.dropEp !== undefined && !pairedV.has(vest.id)) {
      push({
        code: 'VEST_WITHOUT_AMNESIA',
        severity: 'FAIL',
        ids: [vest.id],
        message: `vest ${vest.id} dropEp=E${vest.dropEp} 无 vest×amnesia 联表`,
        fix: '为掉落集挂 VestAmnesiaLink',
      });
    } else if (!pairedV.has(vest.id)) {
      push({
        code: 'PENDING_VEST',
        severity: 'WARN',
        ids: [vest.id],
        message: `vest ${vest.id} 尚未联表到 vest×amnesia`,
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
      amnesias: amnesias.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
