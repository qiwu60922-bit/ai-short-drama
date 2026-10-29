/**
 * V12 · Ability × Quality-Leap Link Gate (金手指 × 表演门 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《伪人降临》: 金手指关键使用窗须过表演/情绪门，不能空壳放技能.
 *  - ability-rule 管 acquired/use；quality-leap 管表演可见度——本 gate 硬联表 use 镜.
 *
 *  SCHEMA / DUP_ID / UNKNOWN_ABILITY / FUTURE_EP
 *  CHILD_ABILITY_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_USE — link.ep 须有 holder use
 *  USE_WITHOUT_QUALITY — 已 use 无联表 quality
 *  PENDING_ABILITY (WARN)
 *  LOW_INTENSITY_AT_USE (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  AbilityEntrySchema,
  AbilityUseSchema,
  evaluateAbilityRules,
} from './ability-rule-gate';
import {
  QualityLeapDocSchema,
  evaluateQualityLeap,
} from './quality-leap-gate';

const Ep = z.number().int().positive();

export const AbilityQualityLinkEntrySchema = z.object({
  id: z.string().min(1),
  abilityId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const AbilityQualityLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minUseIntense: z.number().int().min(1).max(5).optional(),
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  links: z.array(AbilityQualityLinkEntrySchema),
});

export type AbilityQualityLinkLedger = z.infer<typeof AbilityQualityLinkLedgerSchema>;

export type AbilityQualityLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_ABILITY'
    | 'FUTURE_EP'
    | 'CHILD_ABILITY_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_USE'
    | 'USE_WITHOUT_QUALITY'
    | 'PENDING_ABILITY'
    | 'LOW_INTENSITY_AT_USE';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AbilityQualityLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    abilities: number;
    latestEp: number;
  };
  findings: AbilityQualityLinkFinding[];
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

export function evaluateAbilityQualityLink(input: unknown): AbilityQualityLinkReport {
  const parsed = AbilityQualityLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, abilities: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, abilities, uses, links, minUseIntense = 4 } = parsed.data;
  const findings: AbilityQualityLinkFinding[] = [];
  const push = (x: AbilityQualityLinkFinding) => findings.push(x);

  const abReport = evaluateAbilityRules({ series, latestEp, abilities, uses });
  if (abReport.verdict === 'FAIL') {
    const childFails = abReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_ABILITY_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌金手指账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 ability-rule-gate',
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

  const byAb = new Map(abilities.map((a) => [a.id, a]));
  const pairedAbEp = new Set<string>();
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
    const ab = byAb.get(link.abilityId);
    if (!ab) {
      push({
        code: 'UNKNOWN_ABILITY',
        severity: 'FAIL',
        ids: [link.id, link.abilityId],
        message: `联表 ${link.id} 引用未知 ability ${link.abilityId}`,
        fix: 'abilityId 须存在于 abilities[]',
      });
      continue;
    }

    const ql = evaluateQualityLeap(link.qualityLeap);
    if (ql.verdict === 'FAIL') {
      const childFails = ql.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_QUALITY_FAIL',
        severity: 'FAIL',
        ids: [link.id, ...childFails.flatMap((f) => f.ids ?? [])],
        message: `内嵌表演门 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修 quality-leap-gate',
      });
      continue;
    }

    const hasUse = uses.some((u) => u.abilityId === ab.id && u.ep === link.ep && u.by === ab.holder);
    if (!hasUse) {
      push({
        code: 'EP_NOT_USE',
        severity: 'FAIL',
        ids: [link.id, ab.id],
        message: `${link.id}: ep=E${link.ep} 无 ${ab.holder} 对 ${ab.id} 的 use`,
        fix: 'link.ep 须有 holder use',
      });
      continue;
    }

    const intense = maxIntensity(link.qualityLeap);
    if (intense < minUseIntense) {
      push({
        code: 'LOW_INTENSITY_AT_USE',
        severity: 'WARN',
        ids: [link.id],
        message: `${link.id}: use 镜 max intensity=${intense} < ${minUseIntense}`,
        fix: '抬高 use 镜 intensity',
      });
    }

    pairedAbEp.add(`${ab.id}@${link.ep}`);
    aligned += 1;
  }

  const useKeys = new Set(uses.map((u) => `${u.abilityId}@${u.ep}`));
  for (const key of useKeys) {
    if (!pairedAbEp.has(key)) {
      const [abilityId, ep] = key.split('@');
      push({
        code: 'USE_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [abilityId],
        message: `ability ${abilityId} use@E${ep} 无 ability×quality 联表`,
        fix: '为使用集挂 AbilityQualityLink',
      });
    }
  }
  for (const ab of abilities) {
    const any = [...pairedAbEp].some((k) => k.startsWith(`${ab.id}@`));
    if (!any && !uses.some((u) => u.abilityId === ab.id)) {
      push({
        code: 'PENDING_ABILITY',
        severity: 'WARN',
        ids: [ab.id],
        message: `ability ${ab.id} 尚未联表到 ability×quality`,
        fix: '补 uses[]+links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      abilities: abilities.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
