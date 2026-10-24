/**
 * V12 · Persona-Mask Gate (伪装人设/假身份账本 · 抓包与崩塌), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text breakdowns of 2026-10-22～10-24 hits (structure only, no footage):
 *  - 《枝头春意闹》: 造谣假人设（病弱国公心尖宠）→ 造谣现场被本人当场抓包 (same-ep plant+reveal).
 *  - 《逃婚三年，江少的花心人设崩了》: 花心纨绔 mask → 绯闻/派对 maintain → 重逢后真心 reveal.
 *  - 《算不平的糊涂账》: 表面糊涂账 vs 真实账本 — report-side对照 (ledger mirror).
 *
 * plantEp → maintainEps[] → revealEp(+revealLabel). Same-ep plant+reveal allowed.
 *
 *  SCHEMA (FAIL)                 ledger fails PersonaMaskLedgerSchema
 *  DUP_ID (FAIL)                 entry id duplicated
 *  FUTURE_EP (FAIL)              plant/reveal/maintain beyond latestEp
 *  REVEAL_BEFORE_PLANT (FAIL)    reveal earlier than plant (ep or same-ep sec)
 *  REVEAL_WITHOUT_LABEL (FAIL)   revealEp set but revealLabel empty
 *  MAINTAIN_BEFORE_PLANT (FAIL)  a maintainEp < plantEp
 *  MAINTAIN_AFTER_REVEAL (FAIL)  a maintainEp > revealEp (when revealed)
 *  MASK_PENDING (WARN)           planted, not yet revealed
 *  NO_MAINTAIN (WARN)            no maintainEps between plant and reveal
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';

const Ep = z.number().int().positive();
const Sec = z.number().nonnegative().optional();

export const PersonaMaskEntrySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).optional(),
  /** Character who wears / performs the mask. */
  wearer: z.string().min(1),
  plantEp: Ep,
  plantAtSec: Sec,
  revealEp: Ep.optional(),
  revealAtSec: Sec,
  /** Human-readable reveal marker, e.g. 「当场抓包」「真心崩塌」. Required when revealEp set. */
  revealLabel: z.string().min(1).optional(),
  /** Episodes where the mask is actively maintained (rumors, parties, fake ledgers). */
  maintainEps: z.array(Ep).optional(),
  note: z.string().optional(),
});

export const PersonaMaskLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  entries: z.array(PersonaMaskEntrySchema),
});

export type PersonaMaskLedger = z.infer<typeof PersonaMaskLedgerSchema>;

export type PersonaMaskFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'FUTURE_EP'
    | 'REVEAL_BEFORE_PLANT'
    | 'REVEAL_WITHOUT_LABEL'
    | 'MAINTAIN_BEFORE_PLANT'
    | 'MAINTAIN_AFTER_REVEAL'
    | 'MASK_PENDING'
    | 'NO_MAINTAIN';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface PersonaMaskReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    total: number;
    revealed: number;
    pending: number;
    withMaintain: number;
    latestEp: number;
  };
  findings: PersonaMaskFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluatePersonaMask(input: unknown): PersonaMaskReport {
  const parsed = PersonaMaskLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { total: 0, revealed: 0, pending: 0, withMaintain: 0, latestEp: 0 },
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
  const findings: PersonaMaskFinding[] = [];
  const push = (x: PersonaMaskFinding) => findings.push(x);

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
      message: `伪装账本ID重复：${id}`,
      fix: '伪装条目 ID 是 plant/maintain/reveal 指针主键，改成唯一 ID',
    });
  }

  let revealed = 0;
  let pending = 0;
  let withMaintain = 0;

  for (const e of entries) {
    const maintains = e.maintainEps ?? [];
    if (maintains.length > 0) withMaintain += 1;

    const futureBits: string[] = [];
    if (e.plantEp > latestEp) futureBits.push(`plantEp=E${e.plantEp}`);
    if (e.revealEp !== undefined && e.revealEp > latestEp) {
      futureBits.push(`revealEp=E${e.revealEp}`);
    }
    for (const m of maintains) {
      if (m > latestEp) futureBits.push(`maintainEp=E${m}`);
    }
    if (futureBits.length) {
      push({
        code: 'FUTURE_EP',
        severity: 'FAIL',
        ids: [e.id],
        message: `${e.id} ${futureBits.join('/')} 超出 latestEp=E${latestEp}`,
        fix: '改 plantEp/revealEp/maintainEps，或上调 latestEp',
      });
    }

    for (const m of maintains) {
      if (m < e.plantEp) {
        push({
          code: 'MAINTAIN_BEFORE_PLANT',
          severity: 'FAIL',
          ids: [e.id],
          message: `${e.id} 维持集 E${m} 早于栽种 E${e.plantEp}`,
          fix: '维持须发生在假人设栽种之后（或同集栽种之后）',
        });
      }
    }

    if (maintains.length === 0) {
      push({
        code: 'NO_MAINTAIN',
        severity: 'WARN',
        ids: [e.id],
        message: `${e.id} 栽于 E${e.plantEp}，缺少 maintainEps（绯闻/派对/假账本等维持拍）`,
        fix: '补 maintainEps；若是当场抓包短线，可忽略此 WARN',
      });
    }

    if (e.revealEp === undefined) {
      pending += 1;
      push({
        code: 'MASK_PENDING',
        severity: 'WARN',
        ids: [e.id],
        message: `${e.id}（${e.wearer}）栽于 E${e.plantEp}，尚未揭穿`,
        fix: '规划 revealEp + revealLabel（当场抓包 / 真心崩塌 / 甩真实账本）',
      });
      continue;
    }

    revealed += 1;

    if (!e.revealLabel || !e.revealLabel.trim()) {
      push({
        code: 'REVEAL_WITHOUT_LABEL',
        severity: 'FAIL',
        ids: [e.id],
        message: `${e.id} 有 revealEp=E${e.revealEp} 但缺少 revealLabel（揭穿标签）`,
        fix: '补 revealLabel，如「当场抓包」「真心崩塌」「甩真实账本」',
      });
    }

    if (e.revealEp < e.plantEp) {
      push({
        code: 'REVEAL_BEFORE_PLANT',
        severity: 'FAIL',
        ids: [e.id],
        message: `${e.id} 揭穿 E${e.revealEp} 早于栽种 E${e.plantEp}`,
        fix: '揭穿不能早于假人设栽种',
      });
    } else if (
      e.revealEp === e.plantEp &&
      e.plantAtSec !== undefined &&
      e.revealAtSec !== undefined &&
      e.revealAtSec < e.plantAtSec
    ) {
      push({
        code: 'REVEAL_BEFORE_PLANT',
        severity: 'FAIL',
        ids: [e.id],
        message: `${e.id} 同集内揭穿 ${e.revealAtSec}s 早于栽种 ${e.plantAtSec}s`,
        fix: '同集内 revealAtSec ≥ plantAtSec（允许当场抓包）',
      });
    }

    for (const m of maintains) {
      if (m > e.revealEp) {
        push({
          code: 'MAINTAIN_AFTER_REVEAL',
          severity: 'FAIL',
          ids: [e.id],
          message: `${e.id} 维持集 E${m} 晚于揭穿 E${e.revealEp}`,
          fix: '人设崩塌后不应再记 maintain；若是新 mask，另开一条目',
        });
      }
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { total: entries.length, revealed, pending, withMaintain, latestEp },
    findings,
    gates: GATES,
  };
}
