/**
 * V12 · Cliff × Amnesia Link Gate (跨集悬念叠钩 × 失忆唤回 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《反派拿捏》: cliff.nextEp 常踩唤回 recover，避免软重置.
 *  - 与 amnesiaCliffLink（amnesia 主键）互补：本 gate 以 cliff 为主键.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_CLIFF / UNKNOWN_AMNESIA / FUTURE_EP
 *  CHILD_CASCADE_FAIL / CHILD_AMNESIA_FAIL
 *  EP_NOT_RECOVER_NEXT — link.ep = recoverEp = cliff.nextEp
 *  CLIFF_WITHOUT_AMNESIA / RECOVER_WITHOUT_CLIFF
 *  PENDING_CLIFF (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  CliffCascadeLinkEntrySchema,
  evaluateCliffCascadeLink,
} from './cliff-cascade-link-gate';
import {
  AmnesiaArcEntrySchema,
  evaluateAmnesiaArc,
} from './amnesia-arc-gate';

const Ep = z.number().int().positive();

export const CliffAmnesiaLinkEntrySchema = z.object({
  id: z.string().min(1),
  cliffLinkId: z.string().min(1),
  amnesiaId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const CliffAmnesiaLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  amnesias: z.array(AmnesiaArcEntrySchema),
  links: z.array(CliffAmnesiaLinkEntrySchema),
});

export type CliffAmnesiaLinkLedger = z.infer<typeof CliffAmnesiaLinkLedgerSchema>;

export type CliffAmnesiaLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_CLIFF'
    | 'UNKNOWN_AMNESIA'
    | 'FUTURE_EP'
    | 'CHILD_CASCADE_FAIL'
    | 'CHILD_AMNESIA_FAIL'
    | 'EP_NOT_RECOVER_NEXT'
    | 'CLIFF_WITHOUT_AMNESIA'
    | 'RECOVER_WITHOUT_CLIFF'
    | 'PENDING_CLIFF';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface CliffAmnesiaLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    cliffLinks: number;
    amnesias: number;
    latestEp: number;
  };
  findings: CliffAmnesiaLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateCliffAmnesiaLink(input: unknown): CliffAmnesiaLinkReport {
  const parsed = CliffAmnesiaLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, cliffLinks: 0, amnesias: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, cliffLinks, amnesias, links } = parsed.data;
  const findings: CliffAmnesiaLinkFinding[] = [];
  const push = (x: CliffAmnesiaLinkFinding) => findings.push(x);

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

  const byCliff = new Map(cliffLinks.map((c) => [c.id, c]));
  const byA = new Map(amnesias.map((a) => [a.id, a]));
  const pairedC = new Set<string>();
  const pairedA = new Set<string>();
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
    const cliff = byCliff.get(link.cliffLinkId);
    if (!cliff) {
      push({
        code: 'UNKNOWN_CLIFF',
        severity: 'FAIL',
        ids: [link.id, link.cliffLinkId],
        message: `联表 ${link.id} 引用未知 cliff ${link.cliffLinkId}`,
        fix: 'cliffLinkId 须存在于 cliffLinks[]',
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
      link.ep !== amnesia.recoverEp ||
      link.ep !== cliff.nextEp
    ) {
      push({
        code: 'EP_NOT_RECOVER_NEXT',
        severity: 'FAIL',
        ids: [link.id, cliff.id, amnesia.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 recover=${amnesia.recoverEp ?? '无'}/nextEp=${cliff.nextEp}`,
        fix: '唤回须踩 cliff.nextEp',
      });
      continue;
    }

    pairedC.add(cliff.id);
    pairedA.add(amnesia.id);
    aligned += 1;
  }

  for (const cliff of cliffLinks) {
    if (!pairedC.has(cliff.id)) {
      push({
        code: 'CLIFF_WITHOUT_AMNESIA',
        severity: 'FAIL',
        ids: [cliff.id],
        message: `cliff ${cliff.id} nextEp=E${cliff.nextEp} 无 cliff×amnesia 联表`,
        fix: '为 cliff 窗挂 CliffAmnesiaLink',
      });
    }
  }
  for (const a of amnesias) {
    if (a.recoverEp !== undefined && !pairedA.has(a.id)) {
      push({
        code: 'RECOVER_WITHOUT_CLIFF',
        severity: 'FAIL',
        ids: [a.id],
        message: `amnesia ${a.id} recoverEp=E${a.recoverEp} 无 cliff 联表`,
        fix: '为唤回集挂 CliffAmnesiaLink',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      cliffLinks: cliffLinks.length,
      amnesias: amnesias.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
