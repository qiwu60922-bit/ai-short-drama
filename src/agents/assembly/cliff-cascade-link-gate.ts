/**
 * V12 · Cliffhanger×Opening-Cascade Link Gate (跨集悬念承接 × 开场叠钩 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text breakdowns (structure only, no footage):
 *  - 《持械入宋》: 季末 cliffhanger → 下季开篇 hook 立即承接，且开场叠钩 ≥2.
 *  - 《满院亲戚全是上古大妖》S4: 危机开场携带前季赌注.
 *  - 《聚宝仙盆》 leftover: 季间悬念 → 下季开篇立即承接.
 *
 * Per link: embed evaluateCliffhangerHandoff(prev,next) + evaluateOpeningCascade(next).
 * Extra link rules:
 *  SCHEMA / DUP_ID / FUTURE_EP / EP_NOT_SEQUENTIAL (nextEp !== prevEp+1)
 *  CHILD_CLIFF_FAIL / CHILD_CASCADE_FAIL
 *  CASCADE_MISS_HOOK — next 开场叠钩无 hook（仅 reversal/increment 不够承接悬念）
 *  HANDOFF_TOKEN_GAP — cliff/hook action 零共享 token（升级 HANDOFF_WEAK）
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import {
  evaluateCliffhangerHandoff,
  type CliffhangerHandoffOptions,
} from './cliffhanger-handoff-gate';
import {
  evaluateOpeningCascade,
  type OpeningCascadeOptions,
} from './opening-cascade-gate';

const Ep = z.number().int().positive();

export const CliffCascadeLinkEntrySchema = z.object({
  id: z.string().min(1),
  prevEp: Ep,
  nextEp: Ep,
  prev: ShotSpecDocSchema,
  next: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const CliffCascadeLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  links: z.array(CliffCascadeLinkEntrySchema),
  cliffOpts: z
    .object({
      hookWindowSec: z.number().positive().optional(),
      tailToleranceSec: z.number().positive().optional(),
    })
    .optional(),
  cascadeOpts: z
    .object({
      cascadeWindowSec: z.number().positive().optional(),
      minCascadeBeats: z.number().int().positive().optional(),
    })
    .optional(),
});

export type CliffCascadeLinkLedger = z.infer<typeof CliffCascadeLinkLedgerSchema>;

export type CliffCascadeLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'FUTURE_EP'
    | 'EP_NOT_SEQUENTIAL'
    | 'CHILD_CLIFF_FAIL'
    | 'CHILD_CASCADE_FAIL'
    | 'CASCADE_MISS_HOOK'
    | 'HANDOFF_TOKEN_GAP';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface CliffCascadeLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    latestEp: number;
  };
  findings: CliffCascadeLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateCliffCascadeLink(input: unknown): CliffCascadeLinkReport {
  const parsed = CliffCascadeLinkLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { links: 0, aligned: 0, latestEp: 0 },
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

  const { latestEp, links, cliffOpts, cascadeOpts } = parsed.data;
  const findings: CliffCascadeLinkFinding[] = [];
  const push = (x: CliffCascadeLinkFinding) => findings.push(x);

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
      message: `联表链接 ID 重复：${id}`,
      fix: 'links[].id 须唯一',
    });
  }

  let aligned = 0;
  for (const l of links) {
    if (l.prevEp > latestEp || l.nextEp > latestEp) {
      push({
        code: 'FUTURE_EP',
        severity: 'FAIL',
        ids: [l.id],
        message: `${l.id} prevEp/nextEp 超过 latestEp=${latestEp}`,
        fix: '把集号压进已写范围，或抬高 latestEp',
      });
      continue;
    }
    if (l.nextEp !== l.prevEp + 1) {
      push({
        code: 'EP_NOT_SEQUENTIAL',
        severity: 'FAIL',
        ids: [l.id],
        message: `${l.id} nextEp=E${l.nextEp} 不是 prevEp=E${l.prevEp}+1（跨集承接须相邻）`,
        fix: '跨集联表只允许 N → N+1',
      });
      continue;
    }

    const cliff = evaluateCliffhangerHandoff(
      l.prev,
      l.next,
      cliffOpts as CliffhangerHandoffOptions | undefined,
    );
    if (cliff.verdict === 'FAIL') {
      const codes = cliff.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
      push({
        code: 'CHILD_CLIFF_FAIL',
        severity: 'FAIL',
        ids: [l.id],
        message: `${l.id} cliffhanger-handoff FAIL：${codes.join(',') || 'unknown'}`,
        fix: '先修 prev cliff / next hook（见 cliffhanger-handoff-gate）',
      });
    }

    const cascade = evaluateOpeningCascade(
      l.next,
      cascadeOpts as OpeningCascadeOptions | undefined,
    );
    if (cascade.verdict === 'FAIL') {
      const codes = cascade.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
      push({
        code: 'CHILD_CASCADE_FAIL',
        severity: 'FAIL',
        ids: [l.id],
        message: `${l.id} opening-cascade FAIL：${codes.join(',') || 'unknown'}`,
        fix: '先修 next 开场叠钩（hook/reversal/increment ≥ min）',
      });
    }

    if (cascade.verdict === 'PASS' && !cascade.metrics.cascadeRoles.includes('hook')) {
      push({
        code: 'CASCADE_MISS_HOOK',
        severity: 'FAIL',
        ids: [l.id],
        message: `${l.id} 开场叠钩无 hook（roles=${cascade.metrics.cascadeRoles.join('|')}）— 悬念承接须以 hook 起拍`,
        fix: 'next 开场窗口内加入 beatRole=hook',
      });
    }

    if (
      cliff.verdict === 'PASS' &&
      cliff.metrics.sharedTokenCount === 0 &&
      cliff.findings.some((f) => f.code === 'HANDOFF_WEAK')
    ) {
      push({
        code: 'HANDOFF_TOKEN_GAP',
        severity: 'FAIL',
        ids: [l.id],
        message: `${l.id} cliff/hook action 零共享 token（联表层升级 HANDOFF_WEAK）`,
        fix: '让 next hook 的 action 复用 prev cliffhanger 的关键赌注词',
      });
    }

    const linkFailed = findings.some(
      (f) => f.severity === 'FAIL' && f.ids?.includes(l.id) && f.code !== 'DUP_ID',
    );
    if (!linkFailed) aligned += 1;
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { links: links.length, aligned, latestEp },
    findings,
    gates: GATES,
  };
}
