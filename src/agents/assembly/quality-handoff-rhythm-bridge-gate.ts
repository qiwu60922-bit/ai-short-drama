/**
 * V12 · Quality × Cliffhanger-Handoff × Series-Rhythm Ternary Bridge
 * (表演门 × 集间承接 × 系列节奏 三元桥), pre-generation, offline, deterministic.
 *
 * Cross-suite: quality-leap + cliffhanger-handoff ↔ shot-spec series-rhythm.
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《持械入宋》: 下集 hook 承接须过表演门，且落入 dense/intrigue 节奏档.
 *  - qualityHandoffLink / foreshadowHandoffRhythmBridge 已各自联表——本 gate 硬对齐同 ep 三元同框.
 *
 * Per link: handoffId + ep + qualityLeap + shotSpec(+profile).
 *  SCHEMA / DUP_ID / UNKNOWN_HANDOFF / FUTURE_EP
 *  CHILD_HANDOFF_FAIL / CHILD_QUALITY_FAIL / CHILD_RHYTHM_FAIL
 *  HANDOFF_NOT_AT_EP
 *  PROFILE_MISMATCH (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { evaluateCliffhangerHandoff } from './cliffhanger-handoff-gate';
import {
  QualityLeapDocSchema,
  evaluateQualityLeap,
} from './quality-leap-gate';
import {
  evaluateSeriesRhythm,
  SERIES_RHYTHM_PROFILE_NAMES,
  type SeriesRhythmProfileName,
} from './series-rhythm-profile';

const Ep = z.number().int().positive();

export const QualityHandoffRhythmHandoffEntrySchema = z.object({
  id: z.string().min(1),
  prevEp: Ep,
  nextEp: Ep,
  prev: ShotSpecDocSchema,
  next: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const QualityHandoffRhythmBridgeLinkSchema = z.object({
  id: z.string().min(1),
  handoffId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  shotSpec: ShotSpecDocSchema,
  profile: z.enum(['dense', 'default', 'intrigue', 'slow_burn']).optional(),
  note: z.string().optional(),
});

export const QualityHandoffRhythmBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  profile: z.enum(['dense', 'default', 'intrigue', 'slow_burn']).optional(),
  handoffs: z.array(QualityHandoffRhythmHandoffEntrySchema),
  links: z.array(QualityHandoffRhythmBridgeLinkSchema),
});

export type QualityHandoffRhythmBridgeLedger = z.infer<typeof QualityHandoffRhythmBridgeLedgerSchema>;

export type QualityHandoffRhythmBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_HANDOFF'
    | 'FUTURE_EP'
    | 'CHILD_HANDOFF_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'CHILD_RHYTHM_FAIL'
    | 'HANDOFF_NOT_AT_EP'
    | 'PROFILE_MISMATCH';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface QualityHandoffRhythmBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    handoffs: number;
    latestEp: number;
    profile: string;
  };
  findings: QualityHandoffRhythmBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateQualityHandoffRhythmBridge(input: unknown): QualityHandoffRhythmBridgeReport {
  const parsed = QualityHandoffRhythmBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, handoffs: 0, latestEp: 0, profile: 'default' },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series: _series, latestEp, handoffs, links, profile: defaultProfile = 'default' } = parsed.data;
  const findings: QualityHandoffRhythmBridgeFinding[] = [];
  const push = (x: QualityHandoffRhythmBridgeFinding) => findings.push(x);

  for (const h of handoffs) {
    const r = evaluateCliffhangerHandoff(h.prev, h.next);
    if (r.verdict === 'FAIL') {
      const codes = r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
      push({
        code: 'CHILD_HANDOFF_FAIL',
        severity: 'FAIL',
        ids: [h.id],
        message: `handoff ${h.id} FAIL：${codes.join(',') || 'unknown'}`,
        fix: '先修 cliffhanger-handoff-gate',
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

  const byH = new Map(handoffs.map((h) => [h.id, h]));
  const linkedH = new Set<string>();
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
    const h = byH.get(link.handoffId);
    if (!h) {
      push({
        code: 'UNKNOWN_HANDOFF',
        severity: 'FAIL',
        ids: [link.id, link.handoffId],
        message: `联表 ${link.id} 引用未知 handoff ${link.handoffId}`,
        fix: 'handoffId 须存在于 handoffs[]',
      });
      continue;
    }
    if (link.ep !== h.nextEp) {
      push({
        code: 'HANDOFF_NOT_AT_EP',
        severity: 'FAIL',
        ids: [link.id, h.id],
        message: `${link.id}: ep=E${link.ep} ≠ handoff.nextEp=E${h.nextEp}`,
        fix: '表演×承接×节奏桥须踩 nextEp',
      });
      continue;
    }

    const ql = evaluateQualityLeap(link.qualityLeap);
    if (ql.verdict === 'FAIL') {
      const childFails = ql.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_QUALITY_FAIL',
        severity: 'FAIL',
        ids: [link.id, h.id, ...(childFails.flatMap((f) => f.ids ?? []))],
        message: `${link.id}: qualityLeap FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '承接镜须过表演/情绪/口型门',
      });
      continue;
    }

    const profile = (link.profile ?? defaultProfile) as SeriesRhythmProfileName;
    if (link.profile && link.profile !== defaultProfile) {
      push({
        code: 'PROFILE_MISMATCH',
        severity: 'WARN',
        ids: [link.id],
        message: `${link.id}: link.profile=${link.profile} ≠ bridge profile=${defaultProfile}`,
        fix: `统一档位，或确认故意用 ${link.profile}（${SERIES_RHYTHM_PROFILE_NAMES.join('|')}）`,
      });
    }

    const rhythm = evaluateSeriesRhythm(link.shotSpec, { profile });
    if (rhythm.verdict === 'FAIL') {
      const childFails = rhythm.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_RHYTHM_FAIL',
        severity: 'FAIL',
        ids: [link.id, h.id, ...(childFails.flatMap((f) => f.shotIds ?? []))],
        message: `${link.id}: seriesRhythm(${profile}) FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '表演×承接同框镜须落入系列节奏档阈值',
      });
      continue;
    }

    linkedH.add(h.id);
    aligned += 1;
  }

  for (const h of handoffs) {
    if (!linkedH.has(h.id)) {
      push({
        code: 'HANDOFF_NOT_AT_EP',
        severity: 'FAIL',
        ids: [h.id],
        message: `handoff ${h.id} 无 quality×handoff×rhythm 桥`,
        fix: '为 nextEp 挂 QualityHandoffRhythmBridge',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      handoffs: handoffs.length,
      latestEp,
      profile: defaultProfile,
    },
    findings,
    gates: GATES,
  };
}
