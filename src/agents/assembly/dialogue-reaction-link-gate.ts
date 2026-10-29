/**
 * V12 · Dialogue-Exposition × Reaction-Beat Link Gate (台词带过剧情 × 反应镜 联表),
 * pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text (structure only, no footage):
 *  - 《不候，过期离婚》反例: 几句台词带过时空穿梭 — 本 gate 要求 plot 镜头有可见动作.
 *  - 《天幕直播》: 反转/增量后必须反应镜；联表强制 requireReaction.
 *  - 两者同挂一份 ShotSpec：既不许台词代替情节，也须给情绪落地的脸.
 *
 * Per link: evaluateDialogueExposition(shotSpec) + evaluateReactionBeats(requireReaction).
 * Link rules:
 *  SCHEMA / DUP_ID / FUTURE_EP
 *  CHILD_DIALOGUE_FAIL / CHILD_REACTION_FAIL
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import { evaluateDialogueExposition } from './dialogue-exposition-gate';
import { evaluateReactionBeats } from './reaction-beat-gate';

const Ep = z.number().int().positive();

export const DialogueReactionLinkEntrySchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  shotSpec: ShotSpecDocSchema,
  note: z.string().optional(),
});

export const DialogueReactionLinkLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  links: z.array(DialogueReactionLinkEntrySchema),
});

export type DialogueReactionLinkLedger = z.infer<typeof DialogueReactionLinkLedgerSchema>;

export type DialogueReactionLinkFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'FUTURE_EP'
    | 'CHILD_DIALOGUE_FAIL'
    | 'CHILD_REACTION_FAIL';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface DialogueReactionLinkReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    links: number;
    aligned: number;
    latestEp: number;
  };
  findings: DialogueReactionLinkFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateDialogueReactionLink(input: unknown): DialogueReactionLinkReport {
  const parsed = DialogueReactionLinkLedgerSchema.safeParse(input);
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

  const { latestEp, links } = parsed.data;
  const findings: DialogueReactionLinkFinding[] = [];
  const push = (x: DialogueReactionLinkFinding) => findings.push(x);

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

    const dlg = evaluateDialogueExposition(link.shotSpec);
    if (dlg.verdict === 'FAIL') {
      const childFails = dlg.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_DIALOGUE_FAIL',
        severity: 'FAIL',
        ids: [link.id, ...(childFails.flatMap((f) => f.shotIds ?? []))],
        message: `${link.id}: 台词带过剧情闸 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: 'plot 镜头补可见动作 action，禁止只靠台词推进',
      });
      continue;
    }

    const rx = evaluateReactionBeats(link.shotSpec, { requireReaction: true });
    if (rx.verdict === 'FAIL') {
      const childFails = rx.findings.filter((f) => f.severity === 'FAIL');
      push({
        code: 'CHILD_REACTION_FAIL',
        severity: 'FAIL',
        ids: [link.id, ...(childFails.flatMap((f) => f.shotIds ?? []))],
        message: `${link.id}: 反应镜闸 FAIL：${childFails.map((f) => f.code).join(',') || 'unknown'}`,
        fix: 'reversal/increment/cliffhanger 后补 reaction',
      });
      continue;
    }

    aligned += 1;
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { links: links.length, aligned, latestEp },
    findings,
    gates: GATES,
  };
}
