/**
 * V12 · Quality-Leap × 红宝石节奏 Link Gate (表演门 × 烈焰节奏 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 密爽向: 红宝石节奏达标集须过表演/情绪门.
 *  - 与 qualityDriftLink / qualityCrestLink 互补：本 gate 以 quality×RubyLink 联表.
 *
 * rubies[]: { id, ep, shotSpec }
 *  SCHEMA / DUP_ID / UNKNOWN_RUBY / FUTURE_EP
 *  CHILD_RUBY_FAIL / CHILD_QUALITY_FAIL
 *  EP_NOT_RUBY — link.ep = entry.ep
 *  RUBY_WITHOUT_QUALITY
 *  LOW_INTENSITY_AT_RUBY (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { evaluateStoryRhythm } from './story-rhythm-gate';
import {
  QualityLeapDocSchema,
  evaluateQualityLeap,
} from './quality-leap-gate';

const Ep = z.number().int().positive();

export const QualityRubyEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const QualityRubyLinkEntrySchema = z.object({
  id: z.string().min(1),
  rubyId: z.string().min(1),
  ep: Ep,
  qualityLeap: QualityLeapDocSchema,
  note: z.string().optional(),
});

export const QualityRubyLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  minRubyIntense: z.number().int().min(1).max(5).optional(),
  rubies: z.array(QualityRubyEntrySchema),
  links: z.array(QualityRubyLinkEntrySchema),
});

export type QualityRubyLinkLedger = z.infer<typeof QualityRubyLinkLedgerSchema>;

export type QualityRubyLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'UNKNOWN_RUBY'
    | 'FUTURE_EP'
    | 'CHILD_RUBY_FAIL'
    | 'CHILD_QUALITY_FAIL'
    | 'EP_NOT_RUBY'
    | 'RUBY_WITHOUT_QUALITY'
    | 'LOW_INTENSITY_AT_RUBY';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface QualityRubyLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    rubies: number;
    latestEp: number;
  };
  findings: QualityRubyLinkFinding[];
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

export function evaluateQualityRubyLink(input: unknown): QualityRubyLinkReport {
  const parsed = QualityRubyLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, rubies: 0, latestEp: 0 },
      findings: [{
        code: 'SCHEMA',
        severity: 'FAIL',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
      gates: GATES,
    };
  }

  const { series, latestEp, rubies, links, minRubyIntense = 4 } = parsed.data;
  const findings: QualityRubyLinkFinding[] = [];
  const push = (x: QualityRubyLinkFinding) => findings.push(x);

  for (const ent of rubies) {
    const r = evaluateStoryRhythm(ent.shotSpec);
    if (r.verdict === 'FAIL') {
      const childFails = r.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_RUBY_FAIL',
        severity: 'FAIL',
        ids: [ent.id, ...childFails.flatMap((f) => ('shotIds' in f ? (f.shotIds ?? []) : []))],
        message: `ruby ${ent.id} FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '先修子门',
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

  const byE = new Map(rubies.map((e) => [e.id, e]));
  const linked = new Set<string>();
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
    const ent = byE.get(link.rubyId);
    if (!ent) {
      push({
        code: 'UNKNOWN_RUBY',
        severity: 'FAIL',
        ids: [link.id, link.rubyId],
        message: `联表 ${link.id} 引用未知 ruby ${link.rubyId}`,
        fix: 'rubyId 须存在于 rubies[]',
      });
      continue;
    }
    if (link.ep !== ent.ep) {
      push({
        code: 'EP_NOT_RUBY',
        severity: 'FAIL',
        ids: [link.id, ent.id],
        message: `${link.id}: ep=E${link.ep} 未对齐 ruby.ep=E${ent.ep}`,
        fix: 'link.ep 须等于 entry.ep',
      });
      continue;
    }
    const ql = evaluateQualityLeap(link.qualityLeap);
    if (ql.verdict === 'FAIL') {
      const childFails = ql.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_QUALITY_FAIL',
        severity: 'FAIL',
        ids: [link.id, ent.id, ...childFails.map((f) => f.shotId).filter(Boolean) as string[]],
        message: `${link.id}: 红宝石节奏镜 E${link.ep} quality-leap FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: '红宝石节奏镜须过表演/情绪/口型/镜头门（quality-leap）',
      });
      continue;
    }
    if (maxIntensity(link.qualityLeap) < minRubyIntense) {
      push({
        code: 'LOW_INTENSITY_AT_RUBY',
        severity: 'WARN',
        ids: [link.id, ent.id],
        message: `${link.id}: 红宝石节奏集强度 < ${minRubyIntense}`,
        fix: '抬高 intensity',
      });
    }
    linked.add(ent.id);
    aligned += 1;
  }

  for (const ent of rubies) {
    if (!linked.has(ent.id)) {
      push({
        code: 'RUBY_WITHOUT_QUALITY',
        severity: 'FAIL',
        ids: [ent.id],
        message: `ruby ${ent.id} ep=E${ent.ep} 无 quality 联表`,
        fix: '为红宝石节奏挂 QualityRubyLink',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { links: links.length, aligned, rubies: rubies.length, latestEp },
    findings,
    gates: GATES,
  };
}
