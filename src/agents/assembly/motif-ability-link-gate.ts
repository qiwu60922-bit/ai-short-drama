/**
 * V12 · Motif × Ability Link Gate (视觉母题 × 金手指 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《伪人降临》/《盛夏芬德拉》: 母题回扣常与金手指使用同框.
 *  - 与 abilityMotifLink（ability 主键）互补：本 gate 以 motif 为主键强制「有 payoff 须对齐 ability」。
 *
 *  SCHEMA / DUP_ID / UNKNOWN_ABILITY / UNKNOWN_MOTIF / FUTURE_EP
 *  CHILD_ABILITY_FAIL / CHILD_MOTIF_FAIL
 *  EP_NOT_APPEARANCE / NO_USE_AT_APPEARANCE
 *  MOTIF_WITHOUT_ABILITY — motif payoff 无联表（motif 主键）
 *  PENDING_ABILITY (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  AbilityEntrySchema,
  AbilityUseSchema,
  evaluateAbilityRules,
} from './ability-rule-gate';
import {
  MotifEntrySchema,
  MotifAppearanceSchema,
  evaluateMotifCallbacks,
} from './motif-callback-gate';

const Ep = z.number().int().positive();

export const MotifAbilityLinkEntrySchema = z.object({
  id: z.string().min(1),
  motifId: z.string().min(1),
  abilityId: z.string().min(1),
  ep: Ep,
  note: z.string().optional(),
});

export const MotifAbilityLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  links: z.array(MotifAbilityLinkEntrySchema),
});

export type MotifAbilityLinkLedger = z.infer<typeof MotifAbilityLinkLedgerSchema>;

export type MotifAbilityLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_ABILITY'
    | 'UNKNOWN_MOTIF'
    | 'FUTURE_EP'
    | 'CHILD_ABILITY_FAIL'
    | 'CHILD_MOTIF_FAIL'
    | 'EP_NOT_APPEARANCE'
    | 'NO_USE_AT_APPEARANCE'
    | 'MOTIF_WITHOUT_ABILITY'
    | 'PENDING_ABILITY';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface MotifAbilityLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    motifs: number;
    abilities: number;
    latestEp: number;
  };
  findings: MotifAbilityLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateMotifAbilityLink(input: unknown): MotifAbilityLinkReport {
  const parsed = MotifAbilityLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, motifs: 0, abilities: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, motifs, appearances, abilities, uses, links } = parsed.data;
  const findings: MotifAbilityLinkFinding[] = [];
  const push = (x: MotifAbilityLinkFinding) => findings.push(x);

  const motifReport = evaluateMotifCallbacks({ series, latestEp, motifs, appearances });
  if (motifReport.verdict === 'FAIL') {
    const childFails = motifReport.findings.filter((f) => f.severity === 'FAIL');
    push({
      code: 'CHILD_MOTIF_FAIL',
      severity: 'FAIL',
      ids: childFails.flatMap((f) => f.ids ?? []),
      message: `内嵌母题账本 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
      fix: '先修 motif-callback-gate',
    });
  }

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
  const byMotif = new Map(motifs.map((m) => [m.id, m]));
  const pairedMotifs = new Set<string>();
  const pairedAbs = new Set<string>();
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

    const hasAppearance = appearances.some((a) => a.motifId === motif.id && a.ep === link.ep);
    if (!hasAppearance) {
      push({
        code: 'EP_NOT_APPEARANCE',
        severity: 'FAIL',
        ids: [link.id, motif.id],
        message: `${link.id}: ep=E${link.ep} 无 motif ${motif.id} appearance`,
        fix: 'link.ep 须有母题出场',
      });
      continue;
    }

    if (ab.acquiredEp > link.ep) {
      push({
        code: 'EP_NOT_APPEARANCE',
        severity: 'FAIL',
        ids: [link.id, ab.id],
        message: `${link.id}: ability ${ab.id} acquiredEp=E${ab.acquiredEp} > appearance E${link.ep}`,
        fix: '能力须在出场前或当集已拿到',
      });
      continue;
    }

    const used = uses.some((u) => u.abilityId === ab.id && u.by === ab.holder && u.ep === link.ep);
    if (!used) {
      push({
        code: 'NO_USE_AT_APPEARANCE',
        severity: 'FAIL',
        ids: [link.id, ab.id],
        message: `${link.id}: ability ${ab.id} 在 E${link.ep} 无 holder 使用`,
        fix: '母题×能力同框须有使用',
      });
      continue;
    }

    pairedMotifs.add(motif.id);
    pairedAbs.add(ab.id);
    aligned += 1;
  }

  for (const motif of motifs) {
    const hasPayoff = appearances.some((a) => a.motifId === motif.id && a.role === 'payoff');
    if (hasPayoff && !pairedMotifs.has(motif.id)) {
      push({
        code: 'MOTIF_WITHOUT_ABILITY',
        severity: 'FAIL',
        ids: [motif.id],
        message: `motif ${motif.id} 有 payoff appearance 无 ability 联表`,
        fix: '为母题回扣集挂 MotifAbilityLink',
      });
    }
  }
  for (const a of abilities) {
    if (!pairedAbs.has(a.id)) {
      push({
        code: 'PENDING_ABILITY',
        severity: 'WARN',
        ids: [a.id],
        message: `ability ${a.id} 尚未联表到 motif（motif 主键）`,
        fix: '补 links[] 或确认旁路',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      motifs: motifs.length,
      abilities: abilities.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
