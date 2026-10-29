/**
 * V12 · Quality-Leap × Identity-Vest Link Gate (表演门 × 马甲掉落 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《机长马甲》类: 身份掉落当集镜须过表演/情绪门，不能空壳甩身份.
 *  - 与 qualityVestLink 互补：本 gate 以 quality 为主键命名；掉落镜挂 QualityLeapDoc.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_VEST / FUTURE_EP
 *  CHILD_VEST_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_DROP — link.ep 须等于 dropEp
 *  DROP_WITHOUT_QUALITY — 已 drop 无联表 quality
 *  PENDING_VEST (WARN)
 *  LOW_INTENSITY_AT_DROP (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  IdentityVestEntrySchema,
  evaluateIdentityVest,
} from './identity-vest-gate';
import {
  QualityLeapDocSchema,
  evaluateQualityLeap,
} from './quality-leap-gate';

const Ep = z.number().int().positive();

export const QualityVestLinkEntrySchema = z.object({
  id: z.string().min(1),
  vestId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const QualityVestLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  /** Intensity floor for LOW_INTENSITY_AT_DROP WARN. Default 4. */
  minDropIntense: z.number().int().min(1).max(5).optional(),
  vests: z.array(IdentityVestEntrySchema),
  links: z.array(QualityVestLinkEntrySchema),
});

export type QualityVestLinkLedger = z.infer<typeof QualityVestLinkLedgerSchema>;

export type QualityVestLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_VEST'
    | 'FUTURE_EP'
    | 'CHILD_VEST_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_DROP'
    | 'DROP_WITHOUT_QUALITY'
    | 'PENDING_VEST'
    | 'LOW_INTENSITY_AT_DROP';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface QualityVestLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    vests: number;
    latestEp: number;
  };
  findings: QualityVestLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

function maxIntensity(ql: {
  shots?: Array<{ performance?: { intensity?: number } | null }>;
}): number {
  let m = 0;
  for (const s of ql.shots ?? []) {
    const i = s.performance?.intensity;
    if (typeof i === 'number' && i > m) m = i;
  }
  return m;
}

export function evaluateQualityVestLink(input: unknown): QualityVestLinkReport {
  const parsed = QualityVestLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, vests: 0, latestEp: 0 },
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

  const { series, latestEp, vests, links, minDropIntense = 4 } = parsed.data;
  const findings: QualityVestLinkFinding[] = [];
  const push = (x: QualityVestLinkFinding) => findings.push(x);

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

  const byVest = new Map(vests.map((v) => [v.id, v]));
  const pairedDrops = new Set<string>();
  const pairedVests = new Set<string>();
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
    pairedVests.add(vest.id);

    if (vest.dropEp === undefined || link.ep !== vest.dropEp) {
      push({
        code: 'EP_NOT_DROP',
        severity: 'FAIL',
        ids: [link.id, vest.id],
        message: `${link.id}: ep=E${link.ep} ≠ dropEp=${vest.dropEp ?? '未掉落'}`,
        fix: 'link.ep 须对准马甲掉落集',
      });
      continue;
    }
    pairedDrops.add(vest.id);

    const ql = evaluateQualityLeap(link.qualityLeap);
    if (ql.verdict === 'FAIL') {
      const childFails = ql.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_QUALITY_FAIL',
        severity: 'FAIL',
        ids: [link.id, vest.id, ...(childFails.flatMap((f) => f.ids ?? []))],
        message: `${link.id}: qualityLeap FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '马甲掉落镜须过表演/情绪/口型门',
      });
      continue;
    }

    const intense = maxIntensity(link.qualityLeap);
    if (intense < minDropIntense) {
      push({
        code: 'LOW_INTENSITY_AT_DROP',
        severity: 'WARN',
        ids: [link.id, vest.id],
        message: `${link.id}: drop 强度 ${intense} < minDropIntense=${minDropIntense}`,
        fix: '抬高掉落镜 intensity',
      });
    }

    aligned += 1;
  }

  for (const v of vests) {
    if (v.dropEp !== undefined && !pairedDrops.has(v.id)) {
      push({
        code: 'DROP_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [v.id],
        message: `vest ${v.id} dropEp=E${v.dropEp} 无 quality 联表`,
        fix: '在 links[] 挂 vestId + qualityLeap@dropEp',
      });
    }
  }

  for (const v of vests) {
    if (!pairedVests.has(v.id)) {
      push({
        code: 'PENDING_VEST',
        severity: 'WARN',
        ids: [v.id],
        message: `vest ${v.id} 尚未联表到 quality`,
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
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
