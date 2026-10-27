/**
 * V12 · Amnesia-Arc Gate (失忆/记忆断裂弧账本), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text breakdowns of 2026-10-27 hits (structure only, no footage):
 *  - 《反派拿捏！第三季》(潮汐剧场): 叶凡绑架→爆炸失忆(约E268) → 陪伴重新相爱 →
 *    圣诞摩天轮对视唤回(约E398)告白深吻 — plant → companion → recover(+label/+trigger).
 *  - 《后妈只想苟，老公非要凑第二季》: 协议搭伙「假装过日子」→真情沦陷 — report-side
 *    对照（契约态≠失忆，但「关系知识重置后再建立」同构；本 gate 只管失忆弧）.
 *  - 《退役归来，这个保镖不好惹》: 保镖马甲/父母隐秘 — identity-vest / foreshadow 对照；
 *    本 gate 不绑身份揭秘.
 *
 * Distinct from identity-vest (真身份马甲延迟掉落) and persona-mask (假人设抓包崩塌):
 * this gate audits a *memory break* so the arc actually closes with a labeled recovery beat.
 *
 * plantEp → companionEps[] → recoverEp(+recoverLabel). Same-ep plant+recover allowed.
 * Optional recoverTrigger (摩天轮/圣诞/旧物) names the cue that restores memory.
 *
 *  SCHEMA (FAIL)                    ledger fails AmnesiaArcLedgerSchema
 *  DUP_ID (FAIL)                    entry id duplicated
 *  FUTURE_EP (FAIL)                 plant/recover/companion beyond latestEp
 *  RECOVER_BEFORE_PLANT (FAIL)      recover earlier than plant (ep or same-ep sec)
 *  RECOVER_WITHOUT_LABEL (FAIL)     recoverEp set but recoverLabel empty
 *  COMPANION_BEFORE_PLANT (FAIL)    a companionEp < plantEp
 *  COMPANION_AFTER_RECOVER (FAIL)   a companionEp > recoverEp (when recovered)
 *  RECOVER_PENDING (WARN)           planted, not yet recovered
 *  NO_COMPANION (WARN)              recovered with empty companionEps (直达唤回，缺陪伴蓄势)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';

const Ep = z.number().int().positive();
const Sec = z.number().nonnegative().optional();

export const AmnesiaArcEntrySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).optional(),
  /** Character who loses / regains memory. */
  actor: z.string().min(1),
  plantEp: Ep,
  plantAtSec: Sec,
  /** Optional cause marker, e.g. 「爆炸」「绑架后撞击」. */
  plantCause: z.string().min(1).optional(),
  recoverEp: Ep.optional(),
  recoverAtSec: Sec,
  /** Human-readable recover marker, e.g. 「摩天轮告白深吻唤回」. Required when recoverEp set. */
  recoverLabel: z.string().min(1).optional(),
  /** Optional cue that restores memory, e.g. 「圣诞摩天轮」「旧物」. */
  recoverTrigger: z.string().min(1).optional(),
  /** Episodes of companion care / re-falling-in-love while amnesiac. */
  companionEps: z.array(Ep).optional(),
  note: z.string().optional(),
});

export const AmnesiaArcLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  entries: z.array(AmnesiaArcEntrySchema),
});

export type AmnesiaArcLedger = z.infer<typeof AmnesiaArcLedgerSchema>;

export type AmnesiaArcFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'FUTURE_EP'
    | 'RECOVER_BEFORE_PLANT'
    | 'RECOVER_WITHOUT_LABEL'
    | 'COMPANION_BEFORE_PLANT'
    | 'COMPANION_AFTER_RECOVER'
    | 'RECOVER_PENDING'
    | 'NO_COMPANION';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface AmnesiaArcReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    total: number;
    recovered: number;
    pending: number;
    withCompanion: number;
    latestEp: number;
  };
  findings: AmnesiaArcFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateAmnesiaArc(input: unknown): AmnesiaArcReport {
  const parsed = AmnesiaArcLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { total: 0, recovered: 0, pending: 0, withCompanion: 0, latestEp: 0 },
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

  const { latestEp, entries } = parsed.data;
  const findings: AmnesiaArcFinding[] = [];
  const push = (x: AmnesiaArcFinding) => findings.push(x);

  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const e of entries) {
    if (seen.has(e.id)) dups.add(e.id);
    else seen.add(e.id);
  }
  for (const id of dups) {
    push({
      code: 'DUP_ID',
      severity: 'FAIL',
      ids: [id],
      message: `失忆弧账本ID重复：${id}`,
      fix: '失忆条目 ID 是 plant/companion/recover 指针主键，改成唯一 ID',
    });
  }

  let recovered = 0;
  let pending = 0;
  let withCompanion = 0;

  for (const e of entries) {
    const companions = e.companionEps ?? [];
    if (companions.length > 0) withCompanion += 1;

    const futureBits: string[] = [];
    if (e.plantEp > latestEp) futureBits.push(`plantEp=E${e.plantEp}`);
    if (e.recoverEp !== undefined && e.recoverEp > latestEp) {
      futureBits.push(`recoverEp=E${e.recoverEp}`);
    }
    for (const ep of companions) {
      if (ep > latestEp) futureBits.push(`companionEp=E${ep}`);
    }
    if (futureBits.length) {
      push({
        code: 'FUTURE_EP',
        severity: 'FAIL',
        ids: [e.id],
        message: `${e.id} ${futureBits.join('/')} 超出 latestEp=E${latestEp}`,
        fix: '改 plantEp/recoverEp/companionEps，或上调 latestEp',
      });
    }

    for (const ep of companions) {
      if (ep < e.plantEp) {
        push({
          code: 'COMPANION_BEFORE_PLANT',
          severity: 'FAIL',
          ids: [e.id],
          message: `${e.id} 陪伴拍 E${ep} 早于失忆栽种 E${e.plantEp}`,
          fix: 'companion 须发生在失忆之后（陪伴的是失忆后的人）',
        });
      }
    }

    if (e.recoverEp === undefined) {
      pending += 1;
      push({
        code: 'RECOVER_PENDING',
        severity: 'WARN',
        ids: [e.id],
        message: `${e.id}（${e.actor}${e.plantCause ? '·' + e.plantCause : ''}）失忆于 E${e.plantEp}，尚未唤回`,
        fix: '规划 recoverEp + recoverLabel（如「圣诞摩天轮告白深吻唤回」）',
      });
      continue;
    }

    recovered += 1;

    if (!e.recoverLabel || !e.recoverLabel.trim()) {
      push({
        code: 'RECOVER_WITHOUT_LABEL',
        severity: 'FAIL',
        ids: [e.id],
        message: `${e.id} 有 recoverEp=E${e.recoverEp} 但缺少 recoverLabel（唤回标签）`,
        fix: '补 recoverLabel，如「摩天轮对视唤回往昔」「旧物触景告白」',
      });
    }

    if (e.recoverEp < e.plantEp) {
      push({
        code: 'RECOVER_BEFORE_PLANT',
        severity: 'FAIL',
        ids: [e.id],
        message: `${e.id} 唤回 E${e.recoverEp} 早于失忆栽种 E${e.plantEp}`,
        fix: '唤回不能早于失忆发生',
      });
    } else if (
      e.recoverEp === e.plantEp &&
      e.plantAtSec !== undefined &&
      e.recoverAtSec !== undefined &&
      e.recoverAtSec < e.plantAtSec
    ) {
      push({
        code: 'RECOVER_BEFORE_PLANT',
        severity: 'FAIL',
        ids: [e.id],
        message: `${e.id} 同集内唤回 ${e.recoverAtSec}s 早于失忆 ${e.plantAtSec}s`,
        fix: '同集内 recoverAtSec ≥ plantAtSec',
      });
    }

    for (const ep of companions) {
      if (ep > e.recoverEp) {
        push({
          code: 'COMPANION_AFTER_RECOVER',
          severity: 'FAIL',
          ids: [e.id],
          message: `${e.id} 陪伴拍 E${ep} 晚于唤回 E${e.recoverEp}`,
          fix: '唤回后不应再记同条失忆弧 companion；若是新一轮失忆，另开一条目',
        });
      }
    }

    if (companions.length === 0) {
      push({
        code: 'NO_COMPANION',
        severity: 'WARN',
        ids: [e.id],
        message: `${e.id} 唤回于 E${e.recoverEp}，缺少 companionEps 陪伴蓄势（直达唤回）`,
        fix: '补中间 companionEps（不离不弃/重新相爱）；若同集短线失忆，可忽略此 WARN',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      total: entries.length,
      recovered,
      pending,
      withCompanion,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
