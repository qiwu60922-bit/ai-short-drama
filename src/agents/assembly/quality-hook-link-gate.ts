/**
 * V12 · Quality-Leap × 钩子结构 Link Gate (表演门 × 钩子结构 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 钩子结构达标集须过表演/情绪门.
 *  - 与 qualityRhythmLink / qualityRevealLink 已占用互补：本 gate 以 quality×HookLink 联表.
 *
 * hooks[]: { id, ep, shotSpec }
 *  SCHEMA / DUP_ID / UNKNOWN_HOOK / FUTURE_EP
 *  CHILD_HOOK_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_HOOK — link.ep = entry.ep
 *  HOOK_WITHOUT_QUALITY
 *  LOW_INTENSITY_AT_HOOK (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { evaluateHookStructure } from './hook-structure-gate';
import {
  QualityLeapDocSchema,
  evaluateQualityLeap,
} from './quality-leap-gate';

const Ep = z.number().int().positive();

export const QualityHookEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const QualityHookLinkEntrySchema = z.object({
  id: z.string().min(1),
  hookId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const QualityHookLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minHookIntense: z.number().int().min(1).max(5).optional(),
  hooks: z.array(QualityHookEntrySchema),
  links: z.array(QualityHookLinkEntrySchema),
});

export type QualityHookLinkLedger = z.infer<typeof QualityHookLinkLedgerSchema>;

export type QualityHookLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_HOOK'
    | 'FUTURE_EP'
    | 'CHILD_HOOK_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_HOOK'
    | 'HOOK_WITHOUT_QUALITY'
    | 'LOW_INTENSITY_AT_HOOK';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface QualityHookLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    hooks: number;
    latestEp: number;
  };
  findings: QualityHookLinkFinding[];
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

export function evaluateQualityHookLink(input: unknown): QualityHookLinkReport {
  const parsed = QualityHookLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, hooks: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, hooks, links, minHookIntense = 4 } = parsed.data;
  const findings: QualityHookLinkFinding[] = [];
  const push = (x: QualityHookLinkFinding) => findings.push(x);

  for (const ent of hooks) {
    const r = evaluateHookStructure(ent.shotSpec);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_HOOK_FAIL',
        severity: 'FAIL',
        ids: [ent.id, ...childFails.flatMap((f) => f.shotIds ?? [])],
        message: `hook ${ent.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修子闸',
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

  const byE = new Map(hooks.map((r) => [r.id, r]));
  const paired = new Set<string>();
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
    const ent = byE.get(link.hookId);
    if (!ent) {
      push({
        code: 'UNKNOWN_HOOK',
        severity: 'FAIL',
        ids: [link.id, link.hookId],
        message: `联表 ${link.id} 引用未知 hook ${link.hookId}`,
        fix: 'hookId 须存在于 hooks[]',
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

    if (link.ep !== ent.ep) {
      push({
        code: 'EP_NOT_HOOK',
        severity: 'FAIL',
        ids: [link.id, ent.id],
        message: `${link.id}: ep=E${link.ep} ≠ entry.ep=E${ent.ep}`,
        fix: 'link.ep 须等于 entry.ep',
      });
      continue;
    }

    const intense = maxIntensity(link.qualityLeap);
    if (intense < minHookIntense) {
      push({
        code: 'LOW_INTENSITY_AT_HOOK',
        severity: 'WARN',
        ids: [link.id],
        message: `${link.id}: max intensity=${intense} < ${minHookIntense}`,
        fix: '抬高镜 intensity',
      });
    }

    paired.add(ent.id);
    aligned += 1;
  }

  for (const ent of hooks) {
    if (!paired.has(ent.id)) {
      push({
        code: 'HOOK_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [ent.id],
        message: `hook ${ent.id} ep=E${ent.ep} 无 quality 联表`,
        fix: '挂 QualityHookLink',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      links: links.length,
      aligned,
      hooks: hooks.length,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
