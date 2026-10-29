/**
 * V12 · Foreshadow × Series-Rhythm Bridge (伏笔 × 系列节奏档 跨 suite 桥),
 * pre-generation, offline, deterministic.
 *
 * Cross-suite: story foreshadow-ledger ↔ shot-spec series-rhythm profile.
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《伪人降临》身份伏笔 payoff 镜须落入 dense/intrigue 节奏档，勿用慢热长镜稀释.
 *  - 《盛夏芬德拉》伏笔兑现镜与母题回扣同理——本 gate 对齐 plant/advance/payoff@ep + rhythm.
 *
 * Per link: foreshadowId + ep + shotSpec(+profile). Embed evaluateForeshadowLedger + evaluateSeriesRhythm.
 *  SCHEMA / DUP_ID / UNKNOWN_FORESHADOW / FUTURE_EP
 *  CHILD_FORESHADOW_FAIL / CHILD_RHYTHM_FAIL
 *  NO_EVENT_AT_EP — foreshadow 在 link.ep 无 plant/advance/payoff
 *  PROFILE_MISMATCH (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import {
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
} from './foreshadow-ledger-gate';
import {
  evaluateSeriesRhythm,
  SERIES_RHYTHM_PROFILE_NAMES,
  type SeriesRhythmProfileName,
} from './series-rhythm-profile';

const Ep = z.number().int().positive();

export const ForeshadowRhythmBridgeLinkSchema = z.object({
  id: z.string().min(1),
  foreshadowId: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  profile: z.enum(['dense', 'default', 'intrigue', 'slow_burn']).optional(),
  note: z.string().optional(),
});

export const ForeshadowRhythmBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  profile: z.enum(['dense', 'default', 'intrigue', 'slow_burn']).optional(),
  items: z.array(ForeshadowItemSchema),
  links: z.array(ForeshadowRhythmBridgeLinkSchema),
});

export type ForeshadowRhythmBridgeLedger = z.infer<typeof ForeshadowRhythmBridgeLedgerSchema>;

export type ForeshadowRhythmBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_FORESHADOW'
    | 'FUTURE_EP'
    | 'CHILD_FORESHADOW_FAIL'
    | 'CHILD_RHYTHM_FAIL'
    | 'NO_EVENT_AT_EP'
    | 'PROFILE_MISMATCH';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface ForeshadowRhythmBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    items: number;
    latestEp: number;
    profile: string;
  };
  findings: ForeshadowRhythmBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateForeshadowRhythmBridge(
  input: unknown,
): ForeshadowRhythmBridgeReport {
  const parsed = ForeshadowRhythmBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, items: 0, latestEp: 0, profile: 'default' },
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

  const { series, latestEp, items, links, profile: defaultProfile = 'default' } = parsed.data;
  const findings: ForeshadowRhythmBridgeFinding[] = [];
  const push = (x: ForeshadowRhythmBridgeFinding) => findings.push(x);

  const foreshadowReport = evaluateForeshadowLedger({ series, latestEp, items });
  if (foreshadowReport.verdict === 'FAIL') {
    const childFails = foreshadowReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_FORESHADOW_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌伏笔账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 foreshadow-ledger-gate',
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

  const byId = new Map(items.map((it) => [it.id, it]));
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

    const item = byId.get(link.foreshadowId);
    if (!item) {
      push({
        code: 'UNKNOWN_FORESHADOW',
        severity: 'FAIL',
        ids: [link.id, link.foreshadowId],
        message: `联表 ${link.id} 引用未知 foreshadow ${link.foreshadowId}`,
        fix: 'foreshadowId 须存在于 items[]',
      });
      continue;
    }

    const events = [item.plantEp, item.payoffEp, item.lastAdvancedEp, item.plannedPayoffEp].filter(
      (e): e is number => typeof e === 'number',
    );
    if (!events.includes(link.ep)) {
      push({
        code: 'NO_EVENT_AT_EP',
        severity: 'FAIL',
        ids: [link.id, item.id],
        message: `${link.id}: foreshadow ${item.id} 在 E${link.ep} 无 plant/advance/payoff`,
        fix: 'link.ep 对准 plantEp / lastAdvancedEp / payoffEp',
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
        ids: [link.id, item.id, ...(childFails.flatMap((f) => f.shotIds ?? []))],
        message: `${link.id}: seriesRhythm(${profile}) FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '伏笔兑现镜须落入系列节奏档阈值',
      });
      continue;
    }

    aligned += 1;
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      items: items.length,
      latestEp,
      profile: defaultProfile,
    },
    findings,
    gates: GATES,
  };
}
