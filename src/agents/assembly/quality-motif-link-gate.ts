/**
 * V12 · Quality-Leap × Motif-Callback Link Gate (表演/情绪门 × 视觉母题回扣 跨账本联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《盛夏芬德拉》: 白玫瑰 seed→echo→payoff 每拍须过表演/情绪/口型门（quality-leap）.
 *  - 《首辅娇娘》: 守宫砂视觉印记回扣镜不可空壳台词脸.
 *  - 与 qualityMotifLink 互补：本 gate 以 quality 为主键命名；母题出场集挂 QualityLeapDoc.
 *
 * Embeds child motif-callback + per-link quality-leap.
 * Link rules:
 *  SCHEMA / DUP_ID / UNKNOWN_MOTIF / FUTURE_EP
 *  CHILD_MOTIF_FAIL / CHILD_QUALITY_FAIL
 *  NO_APPEARANCE_AT_EP — link.ep 无该 motif 的 appearance
 *  APPEARANCE_WITHOUT_QUALITY (WARN for unlinked appearances? FAIL for payoff?)
 *  PENDING none — appearances without links WARN APPEARANCE_UNLINKED
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  MotifEntrySchema,
  MotifAppearanceSchema,
  evaluateMotifCallbacks,
} from './motif-callback-gate';
import {
  QualityLeapDocSchema,
  evaluateQualityLeap,
} from './quality-leap-gate';

const Ep = z.number().int().positive();

export const QualityMotifLinkEntrySchema = z.object({
  id: z.string().min(1),
  motifId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const QualityMotifLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  links: z.array(QualityMotifLinkEntrySchema),
});

export type QualityMotifLinkLedger = z.infer<typeof QualityMotifLinkLedgerSchema>;

export type QualityMotifLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_MOTIF'
    | 'FUTURE_EP'
    | 'CHILD_MOTIF_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'NO_APPEARANCE_AT_EP'
    | 'APPEARANCE_UNLINKED';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface QualityMotifLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    motifs: number;
    appearances: number;
    latestEp: number;
  };
  findings: QualityMotifLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateQualityMotifLink(input: unknown): QualityMotifLinkReport {
  const parsed = QualityMotifLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, motifs: 0, appearances: 0, latestEp: 0 },
      findings: [
        {
          code: 'SCHEMA',
          severity: 'FAIL',
          message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        },
      ],
      gates: GATES,
    };
  }

  const { series, latestEp, motifs, appearances, links } = parsed.data;
  const findings: QualityMotifLinkFinding[] = [];
  const push = (x: QualityMotifLinkFinding) => findings.push(x);

  const motifReport = evaluateMotifCallbacks({ series, latestEp, motifs, appearances });
  if (motifReport.verdict === 'FAIL') {
    const childFails = motifReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_MOTIF_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌母题账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 motif-callback-gate（seed→echo→payoff）再跑联表',
    });
  }

  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const l of links) {
    if (seen.has(l.id)) dups.add(l.id);
    else seen.add(l.id);
  }
  for (const id of dups) {
    push({
      code: 'DUP_ID',
      severity: 'FAIL',
      ids: [id],
      message: `联表ID重复：${id}`,
      fix: '联表 id 须唯一',
    });
  }

  const byMotif = new Map(motifs.map((m) => [m.id, m]));
  const linkedKeys = new Set<string>();
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

    const motif = byMotif.get(link.motifId);
    if (!motif) {
      push({
        code: 'UNKNOWN_MOTIF',
        severity: 'FAIL',
        ids: [link.id, link.motifId],
        message: `联表 ${link.id} 引用未知 motif ${link.motifId}`,
        fix: 'motifId 须存在于 motifs[]',
      });
      continue;
    }

    const hit = appearances.some((a) => a.motifId === motif.id && a.ep === link.ep);
    if (!hit) {
      push({
        code: 'NO_APPEARANCE_AT_EP',
        severity: 'FAIL',
        ids: [link.id, motif.id],
        message: `${link.id}: motif ${motif.id} 在 E${link.ep} 无 appearance`,
        fix: '为该集补 appearances[]，或改 link.ep',
      });
      continue;
    }
    linkedKeys.add(`${motif.id}@${link.ep}`);

    const ql = evaluateQualityLeap(link.qualityLeap);
    if (ql.verdict === 'FAIL') {
      const childFails = ql.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_QUALITY_FAIL',
        severity: 'FAIL',
        ids: [link.id, motif.id, ...childFails.map((f) => f.shotId).filter(Boolean) as string[]],
        message: `${link.id}: 母题镜 E${link.ep} quality-leap FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '母题出场镜须过表演/情绪/口型/镜头门（quality-leap）',
      });
      continue;
    }

    aligned += 1;
  }

  for (const a of appearances) {
    const key = `${a.motifId}@${a.ep}`;
    if (!linkedKeys.has(key)) {
      push({
        code: 'APPEARANCE_UNLINKED',
        severity: a.role === 'payoff' ? 'FAIL' : 'WARN',
        ids: [a.motifId],
        message: `motif ${a.motifId} @E${a.ep}（${a.role}）未挂 quality-leap 联表`,
        fix: '为母题出场补 links[]：motifId+ep+qualityLeap；payoff 强制',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      motifs: motifs.length,
      appearances: appearances.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
