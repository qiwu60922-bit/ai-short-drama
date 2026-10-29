/**
 * V12 · Identity-Vest × Cliff-Cascade Link Gate (马甲掉落 × 跨集悬念叠钩 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《机长先生》: 掉马甲常踩在下集 hook 承接窗，避免软重置.
 *  - identity-vest 管 plant→drop；cliff-cascade 管 prev→next——本 gate 硬联表 drop@nextEp.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_VEST / UNKNOWN_CLIFF / FUTURE_EP
 *  CHILD_VEST_FAIL / CHILD_CASCADE_FAIL
 *  EP_NOT_DROP_NEXT — link.ep = dropEp = cliff.nextEp
 *  DROP_WITHOUT_CLIFF / CLIFF_WITHOUT_VEST
 *  PENDING_VEST (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  IdentityVestEntrySchema,
  evaluateIdentityVest,
} from './identity-vest-gate';
import {
  CliffCascadeLinkEntrySchema,
  evaluateCliffCascadeLink,
} from './cliff-cascade-link-gate';

const Ep = z.number().int().positive();

export const VestCliffLinkEntrySchema = z.object({
  id: z.string().min(1),
  vestId: z.string().min(1),
  cliffLinkId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const VestCliffLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  vests: z.array(IdentityVestEntrySchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  links: z.array(VestCliffLinkEntrySchema),
});

export type VestCliffLinkLedger = z.infer<typeof VestCliffLinkLedgerSchema>;

export type VestCliffLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_VEST'
    | 'UNKNOWN_CLIFF'
    | 'FUTURE_EP'
    | 'CHILD_VEST_FAIL'
    | 'CHILD_CASCADE_FAIL'
    | 'EP_NOT_DROP_NEXT'
    | 'DROP_WITHOUT_CLIFF'
    | 'CLIFF_WITHOUT_VEST'
    | 'PENDING_VEST';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface VestCliffLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    vests: number;
    cliffLinks: number;
    latestEp: number;
  };
  findings: VestCliffLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateVestCliffLink(input: unknown): VestCliffLinkReport {
  const parsed = VestCliffLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, vests: 0, cliffLinks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, vests, cliffLinks, links } = parsed.data;
  const findings: VestCliffLinkFinding[] = [];
  const push = (x: VestCliffLinkFinding) => findings.push(x);

  const vestReport = evaluateIdentityVest({ series, latestEp, entries: vests });
  if (vestReport.verdict === 'FAIL') {
    const childFails = vestReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_VEST_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌马甲账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 identity-vest-gate',
    });
  }

  if (cliffLinks.length) {
    const cascade = evaluateCliffCascadeLink({ series, latestEp, links: cliffLinks });
    if (cascade.verdict === 'FAIL') {
      const childFails = cascade.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_CASCADE_FAIL',
        severity: 'FAIL',
        ids: childFails.flatMap((f) => f.ids ?? []),
        message: `内嵌 cliffCascade FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 cliff-cascade-link-gate',
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

  const byVest = new Map(vests.map((v) => [v.id, v]));
  const byCliff = new Map(cliffLinks.map((c) => [c.id, c]));
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
    const vest = byVest.get(link.vestId);
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
    const cliff = byCliff.get(link.cliffLinkId);
    if (!cliff) {
      push({
        code: 'UNKNOWN_CLIFF',
        severity: 'FAIL',
        ids: [link.id, link.cliffLinkId],
        message: `联表 ${link.id} 引用未知 cliffLink ${link.cliffLinkId}`,
        fix: 'cliffLinkId 须存在于 cliffLinks[]',
      });
      continue;
    }

    if (
      vest.dropEp === undefined ||
      link.ep !== vest.dropEp ||
      link.ep !== cliff.nextEp
    ) {
      push({
        code: 'EP_NOT_DROP_NEXT',
        severity: 'FAIL',
        ids: [link.id, vest.id, cliff.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 drop=${vest.dropEp ?? '无'}/next=E${cliff.nextEp}`,
        fix: '掉马甲须踩 cliff.nextEp',
      });
      continue;
    }

    pairedV.add(vest.id);
    pairedC.add(cliff.id);
    aligned += 1;
  }

  for (const v of vests) {
    if (v.dropEp !== undefined && !pairedV.has(v.id)) {
      push({
        code: 'DROP_WITHOUT_CLIFF',
        severity: 'FAIL',
        ids: [v.id],
        message: `vest ${v.id} dropEp=E${v.dropEp} 无 cliff 联表`,
        fix: '为掉落集挂 VestCliffLink',
      });
    } else if (!pairedV.has(v.id)) {
      push({
        code: 'PENDING_VEST',
        severity: 'WARN',
        ids: [v.id],
        message: `vest ${v.id} 尚未联表到 cliff`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const c of cliffLinks) {
    if (!pairedC.has(c.id)) {
      push({
        code: 'CLIFF_WITHOUT_VEST',
        severity: 'FAIL',
        ids: [c.id],
        message: `cliffLink ${c.id} 无 vest 联表`,
        fix: '在 links[] 挂 vestId↔cliffLinkId',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      vests: vests.length,
      cliffLinks: cliffLinks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
