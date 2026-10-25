/**
 * V12 · Identity-Vest Gate (马甲/隐藏真身份账本 · 延迟掉落), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text breakdowns of 2026-10-24～10-25 hits (structure only, no footage):
 *  - 《机长先生，你的未婚妻嫁人了》: 机长马甲全程不掉吊胃口；危机/对峙峰值后再公开掉马甲反击.
 *  - 《无敌贾二虎》: 出狱隐忍开场立目标；股东会当众揭阴谋 = 身份/证据底牌在峰值掉落.
 *  - 《轻烟染日暮》: 第99次离婚 tipping（报告侧对照；本 gate 不绑计数器）.
 *
 * Distinct from persona-mask-gate（假人设给别人看 → 抓包/崩塌）:
 * this gate audits a *true* hidden status/ability identity kept off-screen until drop.
 * Optional peakEp/peakLabel binds drop to a humiliation/confrontation peak
 * (partial 联表 with peak-before-payoff semantics; no cross-file import).
 *
 * plantEp → teaseEps[] → (optional peakEp) → dropEp(+dropLabel). Same-ep plant+drop allowed.
 *
 *  SCHEMA (FAIL)                 ledger fails IdentityVestLedgerSchema
 *  DUP_ID (FAIL)                 entry id duplicated
 *  FUTURE_EP (FAIL)              plant/drop/tease/peak beyond latestEp
 *  DROP_BEFORE_PLANT (FAIL)      drop earlier than plant (ep or same-ep sec)
 *  DROP_WITHOUT_LABEL (FAIL)     dropEp set but dropLabel empty
 *  TEASE_BEFORE_PLANT (FAIL)     a teaseEp < plantEp
 *  TEASE_AFTER_DROP (FAIL)       a teaseEp > dropEp (when dropped)
 *  PEAK_AFTER_DROP (FAIL)        peakEp > dropEp (马甲应在峰值或峰值后立刻掉，不得峰值晚于掉落)
 *  PEAK_LABEL_MISSING (FAIL)     peakEp set but peakLabel empty
 *  VEST_PENDING (WARN)           planted, not yet dropped
 *  NO_TEASE (WARN)               no teaseEps between plant and drop
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';

const Ep = z.number().int().positive();
const Sec = z.number().nonnegative().optional();

export const IdentityVestEntrySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).optional(),
  /** Character who wears / hides the true status. */
  wearer: z.string().min(1),
  /** Human-readable vest name, e.g. 「机长」「血债清算者」. */
  vestLabel: z.string().min(1),
  plantEp: Ep,
  plantAtSec: Sec,
  dropEp: Ep.optional(),
  dropAtSec: Sec,
  /** Human-readable drop marker, e.g. 「公开机长身份反击」. Required when dropEp set. */
  dropLabel: z.string().min(1).optional(),
  /** Episodes that hint at the vest without full public drop (空难戏/制服边角/旁人暗示). */
  teaseEps: z.array(Ep).optional(),
  /** Optional peak the drop should land on/after (羞辱/对峙/股东会). */
  peakEp: Ep.optional(),
  peakAtSec: Sec,
  peakLabel: z.string().min(1).optional(),
  note: z.string().optional(),
});

export const IdentityVestLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  entries: z.array(IdentityVestEntrySchema),
});

export type IdentityVestLedger = z.infer<typeof IdentityVestLedgerSchema>;

export type IdentityVestFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'FUTURE_EP'
    | 'DROP_BEFORE_PLANT'
    | 'DROP_WITHOUT_LABEL'
    | 'TEASE_BEFORE_PLANT'
    | 'TEASE_AFTER_DROP'
    | 'PEAK_AFTER_DROP'
    | 'PEAK_LABEL_MISSING'
    | 'VEST_PENDING'
    | 'NO_TEASE';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface IdentityVestReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    total: number;
    dropped: number;
    pending: number;
    withTease: number;
    withPeak: number;
    latestEp: number;
  };
  findings: IdentityVestFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export function evaluateIdentityVest(input: unknown): IdentityVestReport {
  const parsed = IdentityVestLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: {
        total: 0,
        dropped: 0,
        pending: 0,
        withTease: 0,
        withPeak: 0,
        latestEp: 0,
      },
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
  const findings: IdentityVestFinding[] = [];
  const push = (x: IdentityVestFinding) => findings.push(x);

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
      message: `马甲账本ID重复：${id}`,
      fix: '马甲条目 ID 是 plant/tease/drop 指针主键，改成唯一 ID',
    });
  }

  let dropped = 0;
  let pending = 0;
  let withTease = 0;
  let withPeak = 0;

  for (const e of entries) {
    const teases = e.teaseEps ?? [];
    if (teases.length > 0) withTease += 1;
    if (e.peakEp !== undefined) withPeak += 1;

    const futureBits: string[] = [];
    if (e.plantEp > latestEp) futureBits.push(`plantEp=E${e.plantEp}`);
    if (e.dropEp !== undefined && e.dropEp > latestEp) {
      futureBits.push(`dropEp=E${e.dropEp}`);
    }
    if (e.peakEp !== undefined && e.peakEp > latestEp) {
      futureBits.push(`peakEp=E${e.peakEp}`);
    }
    for (const t of teases) {
      if (t > latestEp) futureBits.push(`teaseEp=E${t}`);
    }
    if (futureBits.length) {
      push({
        code: 'FUTURE_EP',
        severity: 'FAIL',
        ids: [e.id],
        message: `${e.id} ${futureBits.join('/')} 超出 latestEp=E${latestEp}`,
        fix: '改 plantEp/dropEp/teaseEps/peakEp，或上调 latestEp',
      });
    }

    for (const t of teases) {
      if (t < e.plantEp) {
        push({
          code: 'TEASE_BEFORE_PLANT',
          severity: 'FAIL',
          ids: [e.id],
          message: `${e.id} 吊胃口集 E${t} 早于栽种 E${e.plantEp}`,
          fix: '吊胃口须发生在马甲栽种之后（或同集栽种之后）',
        });
      }
    }

    if (teases.length === 0) {
      push({
        code: 'NO_TEASE',
        severity: 'WARN',
        ids: [e.id],
        message: `${e.id}（${e.vestLabel}）栽于 E${e.plantEp}，缺少 teaseEps（空难边角/制服暗示/旁人提起等）`,
        fix: '补 teaseEps；若是开场立刻立目标短线，可忽略此 WARN',
      });
    }

    if (e.peakEp !== undefined) {
      if (!e.peakLabel || !e.peakLabel.trim()) {
        push({
          code: 'PEAK_LABEL_MISSING',
          severity: 'FAIL',
          ids: [e.id],
          message: `${e.id} 有 peakEp=E${e.peakEp} 但缺少 peakLabel（峰值标签）`,
          fix: '补 peakLabel，如「前任纠缠羞辱」「股东会当众对峙」',
        });
      }
    }

    if (e.dropEp === undefined) {
      pending += 1;
      push({
        code: 'VEST_PENDING',
        severity: 'WARN',
        ids: [e.id],
        message: `${e.id}（${e.wearer}·${e.vestLabel}）栽于 E${e.plantEp}，尚未掉落`,
        fix: '规划 dropEp + dropLabel（公开机长身份 / 股东会揭穿）；可绑 peakEp',
      });
      continue;
    }

    dropped += 1;

    if (!e.dropLabel || !e.dropLabel.trim()) {
      push({
        code: 'DROP_WITHOUT_LABEL',
        severity: 'FAIL',
        ids: [e.id],
        message: `${e.id} 有 dropEp=E${e.dropEp} 但缺少 dropLabel（掉马甲标签）`,
        fix: '补 dropLabel，如「公开机长身份反击」「股东会揭阴谋」',
      });
    }

    if (e.dropEp < e.plantEp) {
      push({
        code: 'DROP_BEFORE_PLANT',
        severity: 'FAIL',
        ids: [e.id],
        message: `${e.id} 掉落 E${e.dropEp} 早于栽种 E${e.plantEp}`,
        fix: '掉马甲不能早于隐藏身份栽种',
      });
    } else if (
      e.dropEp === e.plantEp &&
      e.plantAtSec !== undefined &&
      e.dropAtSec !== undefined &&
      e.dropAtSec < e.plantAtSec
    ) {
      push({
        code: 'DROP_BEFORE_PLANT',
        severity: 'FAIL',
        ids: [e.id],
        message: `${e.id} 同集内掉落 ${e.dropAtSec}s 早于栽种 ${e.plantAtSec}s`,
        fix: '同集内 dropAtSec ≥ plantAtSec（允许开场立目标短线）',
      });
    }

    for (const t of teases) {
      if (t > e.dropEp) {
        push({
          code: 'TEASE_AFTER_DROP',
          severity: 'FAIL',
          ids: [e.id],
          message: `${e.id} 吊胃口集 E${t} 晚于掉落 E${e.dropEp}`,
          fix: '马甲掉落后不应再记 tease；若是新马甲，另开一条目',
        });
      }
    }

    if (e.peakEp !== undefined && e.peakEp > e.dropEp) {
      push({
        code: 'PEAK_AFTER_DROP',
        severity: 'FAIL',
        ids: [e.id],
        message: `${e.id} 峰值 E${e.peakEp} 晚于掉落 E${e.dropEp}（掉马甲应落在峰值或紧随峰值）`,
        fix: '调 peakEp ≤ dropEp，或把掉落挪到峰值之后的下一拍',
      });
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      total: entries.length,
      dropped,
      pending,
      withTease,
      withPeak,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
