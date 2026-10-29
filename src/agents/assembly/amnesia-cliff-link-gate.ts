/**
 * V12 · Amnesia × Cliff-Cascade Link Gate (失忆唤回 × 跨集悬念叠钩 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《反派拿捏》: 唤回 recover 常踩下集 hook 承接窗，避免软重置.
 *  - amnesia-arc 管 plant→recover；cliff-cascade 管 prev→next——本 gate 硬联表 recover@nextEp.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_AMNESIA / UNKNOWN_CLIFF / FUTURE_EP
 *  CHILD_AMNESIA_FAIL / CHILD_CASCADE_FAIL
 *  EP_NOT_RECOVER_NEXT — link.ep = recoverEp = cliff.nextEp
 *  RECOVER_WITHOUT_CLIFF / CLIFF_WITHOUT_AMNESIA
 *  PENDING_AMNESIA (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  AmnesiaArcEntrySchema,
  evaluateAmnesiaArc,
} from './amnesia-arc-gate';
import {
  CliffCascadeLinkEntrySchema,
  evaluateCliffCascadeLink,
} from './cliff-cascade-link-gate';

const Ep = z.number().int().positive();

export const AmnesiaCliffLinkEntrySchema = z.object({
  id: z.string().min(1),
  amnesiaId: z.string().min(1),
  cliffLinkId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const AmnesiaCliffLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  amnesias: z.array(AmnesiaArcEntrySchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  links: z.array(AmnesiaCliffLinkEntrySchema),
});

export type AmnesiaCliffLinkLedger = z.infer<typeof AmnesiaCliffLinkLedgerSchema>;

export type AmnesiaCliffLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_AMNESIA'
    | 'UNKNOWN_CLIFF'
    | 'FUTURE_EP'
    | 'CHILD_AMNESIA_FAIL'
    | 'CHILD_CASCADE_FAIL'
    | 'EP_NOT_RECOVER_NEXT'
    | 'RECOVER_WITHOUT_CLIFF'
    | 'CLIFF_WITHOUT_AMNESIA'
    | 'PENDING_AMNESIA';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AmnesiaCliffLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    amnesias: number;
    cliffLinks: number;
    latestEp: number;
  };
  findings: AmnesiaCliffLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAmnesiaCliffLink(input: unknown): AmnesiaCliffLinkReport {
  const parsed = AmnesiaCliffLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, amnesias: 0, cliffLinks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, amnesias, cliffLinks, links } = parsed.data;
  const findings: AmnesiaCliffLinkFinding[] = [];
  const push = (x: AmnesiaCliffLinkFinding) => findings.push(x);

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

  const byA = new Map(amnesias.map((a) => [a.id, a]));
  const byCliff = new Map(cliffLinks.map((c) => [c.id, c]));
  const pairedA = new Set<string>();
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

    if (
      amnesia.recoverEp === undefined ||
      link.ep !== amnesia.recoverEp ||
      link.ep !== cliff.nextEp
    ) {
      push({
        code: 'EP_NOT_RECOVER_NEXT',
        severity: 'FAIL',
        ids: [link.id, amnesia.id, cliff.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 recover=${amnesia.recoverEp ?? '无'}/nextEp=${cliff.nextEp}`,
        fix: '唤回须踩 cliff.nextEp',
      });
      continue;
    }

    pairedA.add(amnesia.id);
    pairedC.add(cliff.id);
    aligned += 1;
  }

  for (const a of amnesias) {
    if (a.recoverEp !== undefined && !pairedA.has(a.id)) {
      push({
        code: 'RECOVER_WITHOUT_CLIFF',
        severity: 'FAIL',
        ids: [a.id],
        message: `amnesia ${a.id} recoverEp=E${a.recoverEp} 无 cliff 联表`,
        fix: '为唤回集挂 AmnesiaCliffLink',
      });
    } else if (!pairedA.has(a.id)) {
      push({
        code: 'PENDING_AMNESIA',
        severity: 'WARN',
        ids: [a.id],
        message: `amnesia ${a.id} 尚未联表到 cliff`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }
  for (const cliff of cliffLinks) {
    if (!pairedC.has(cliff.id)) {
      push({
        code: 'CLIFF_WITHOUT_AMNESIA',
        severity: 'FAIL',
        ids: [cliff.id],
        message: `cliff ${cliff.id} nextEp=E${cliff.nextEp} 无 amnesia 联表`,
        fix: '在 links[] 挂 amnesiaId↔cliffLinkId',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      amnesias: amnesias.length,
      cliffLinks: cliffLinks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
