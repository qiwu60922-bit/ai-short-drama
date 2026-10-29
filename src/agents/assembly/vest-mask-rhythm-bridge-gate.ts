/**
 * V12 · Vest/Mask × Series-Rhythm Ternary Bridge (马甲|伪装 × 系列节奏 三元桥),
 * pre-generation, offline, deterministic.
 *
 * Cross-suite: story identity-vest / persona-mask ↔ shot-spec series-rhythm.
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《飞上枝头难成凤凰》: 马甲掉落镜须落在 dense/intrigue 节奏档，勿用慢热长镜稀释.
 *  - 《逃婚三年》: 假人设揭穿镜同理——terminal@ep + rhythm profile.
 *
 * Per link: sourceKind=vest|mask + sourceId + ep + shotSpec(+profile).
 * Embed evaluateIdentityVest / evaluatePersonaMask + evaluateSeriesRhythm.
 *  SCHEMA / DUP_ID / UNKNOWN_SOURCE / FUTURE_EP
 *  CHILD_VEST_FAIL / CHILD_MASK_FAIL / CHILD_RHYTHM_FAIL
 *  NO_TERMINAL_AT_EP — dropEp|revealEp 须等于 link.ep
 *  PROFILE_MISMATCH (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import {
  IdentityVestEntrySchema,
  evaluateIdentityVest,
} from './identity-vest-gate';
import {
  PersonaMaskEntrySchema,
  evaluatePersonaMask,
} from './persona-mask-gate';
import {
  evaluateSeriesRhythm,
  SERIES_RHYTHM_PROFILE_NAMES,
  type SeriesRhythmProfileName,
} from './series-rhythm-profile';

const Ep = z.number().int().positive();

export const VestMaskRhythmBridgeLinkSchema = z.object({
  id: z.string().min(1),
  sourceKind: z.enum(['vest', 'mask']),
  sourceId: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  profile: z.enum(['dense', 'default', 'intrigue', 'slow_burn']).optional(),
  note: z.string().optional(),
});

export const VestMaskRhythmBridgeLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  profile: z.enum(['dense', 'default', 'intrigue', 'slow_burn']).optional(),
  vests: z.array(IdentityVestEntrySchema),
  masks: z.array(PersonaMaskEntrySchema),
  links: z.array(VestMaskRhythmBridgeLinkSchema),
});

export type VestMaskRhythmBridgeLedger = z.infer<typeof VestMaskRhythmBridgeLedgerSchema>;

export type VestMaskRhythmBridgeFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_SOURCE'
    | 'FUTURE_EP'
    | 'CHILD_VEST_FAIL'
    | 'CHILD_MASK_FAIL'
    | 'CHILD_RHYTHM_FAIL'
    | 'NO_TERMINAL_AT_EP'
    | 'PROFILE_MISMATCH';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface VestMaskRhythmBridgeReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    vests: number;
    masks: number;
    latestEp: number;
    profile: string;
  };
  findings: VestMaskRhythmBridgeFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateVestMaskRhythmBridge(
  input: unknown,
): VestMaskRhythmBridgeReport {
  const parsed = VestMaskRhythmBridgeLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, vests: 0, masks: 0, latestEp: 0, profile: 'default' },
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

  const {
    series,
    latestEp,
    vests,
    masks,
    links,
    profile: defaultProfile = 'default',
  } = parsed.data;
  const findings: VestMaskRhythmBridgeFinding[] = [];
  const push = (x: VestMaskRhythmBridgeFinding) => findings.push(x);

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

  const maskReport = evaluatePersonaMask({ series, latestEp, entries: masks });
  if (maskReport.verdict === 'FAIL') {
    const childFails = maskReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_MASK_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌伪装账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 persona-mask-gate',
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
  const byMask = new Map(masks.map((m) => [m.id, m]));
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

    const source =
      link.sourceKind === 'vest' ? byVest.get(link.sourceId) : byMask.get(link.sourceId);
    if (!source) {
      push({
        code: 'UNKNOWN_SOURCE',
        severity: 'FAIL',
        ids: [link.id, link.sourceId],
        message: `联表 ${link.id} 引用未知 ${link.sourceKind} ${link.sourceId}`,
        fix: `${link.sourceKind}Id 须存在于对应数组`,
      });
      continue;
    }

    const terminal =
      link.sourceKind === 'vest'
        ? (source as { dropEp?: number }).dropEp
        : (source as { revealEp?: number }).revealEp;
    if (terminal === undefined || terminal !== link.ep) {
      push({
        code: 'NO_TERMINAL_AT_EP',
        severity: 'FAIL',
        ids: [link.id, link.sourceId],
        message: `${link.id}: ${link.sourceKind} terminal=${terminal ?? '无'} ≠ link.ep=E${link.ep}`,
        fix: 'link.ep 对准 dropEp|revealEp',
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
        ids: [link.id, link.sourceId, ...(childFails.flatMap((f) => f.shotIds ?? []))],
        message: `${link.id}: seriesRhythm(${profile}) FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '掉落/揭穿镜须落入系列节奏档阈值',
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
      vests: vests.length,
      masks: masks.length,
      latestEp,
      profile: defaultProfile,
    },
    findings,
    gates: GATES,
  };
}
