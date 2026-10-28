/**
 * V12 · Bond-Contract Gate (契约关系→真情升级/解除账本), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text breakdowns of 2026-10-28 hits (structure only, no footage):
 *  - 《邱秘书的婚事》(钐川文和): 秘书职场能打 + 旧爱纠缠 + 家族联姻压力 → 契约女友提案 →
 *    暗中帮扶/陪伴 → 受伤后真情升级/求婚 — contract → companion → upgrade(+label).
 *  - 《后妈只想苟，老公非要凑第二季》(昨日候选对照): 协议婚姻 → 真情 tipping — 同构落地.
 *  - 《十八岁太奶奶驾到，重整家族荣耀3》: 家庭群像差异化 — ensemble 候选，本 gate 不绑.
 *  - 《在八月盛夏》: 误读关系 / 水杉纹身 motif — motif-callback 已有，本 gate 不绑.
 *
 * Distinct from amnesia-arc (记忆断裂唤回), identity-vest (马甲延迟掉落), frequency-tipping
 * (第N次/第N天计数): this gate audits a *contractual relationship state* that must either
 * upgrade to genuine affection or dissolve — mutually exclusive terminals.
 *
 * contractEp(+contractLabel) → companionEps[] → upgradeEp|dissolveEp(+label).
 * Same-ep contract+upgrade allowed when upgradeAtSec ≥ contractAtSec.
 *
 *  SCHEMA (FAIL)                       ledger fails BondContractLedgerSchema
 *  DUP_ID (FAIL)                       entry id duplicated
 *  FUTURE_EP (FAIL)                    contract/upgrade/dissolve/companion beyond latestEp
 *  UPGRADE_BEFORE_CONTRACT (FAIL)      upgrade earlier than contract (ep or same-ep sec)
 *  DISSOLVE_BEFORE_CONTRACT (FAIL)     dissolve earlier than contract (ep or same-ep sec)
 *  UPGRADE_WITHOUT_LABEL (FAIL)        upgradeEp set but upgradeLabel empty
 *  DISSOLVE_WITHOUT_LABEL (FAIL)       dissolveEp set but dissolveLabel empty
 *  BOTH_TERMINALS (FAIL)               both upgradeEp and dissolveEp set
 *  COMPANION_BEFORE_CONTRACT (FAIL)    a companionEp < contractEp
 *  COMPANION_AFTER_TERMINAL (FAIL)     a companionEp > upgrade/dissolve (when terminated)
 *  PENDING (WARN)                      contracted, no upgrade/dissolve yet
 *  NO_COMPANION (WARN)                 upgraded with empty companionEps
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';

const Ep = z.number().int().positive();
const Sec = z.number().nonnegative().optional();

export const BondContractEntrySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).optional(),
  partyA: z.string().min(1),
  partyB: z.string().min(1),
  contractEp: Ep,
  contractAtSec: Sec,
  /** Human-readable contract marker, e.g. 「一年契约女友」. */
  contractLabel: z.string().min(1),
  /** Optional terms summary, e.g. 「对外伪装情侣，到期解除」. */
  terms: z.string().min(1).optional(),
  upgradeEp: Ep.optional(),
  upgradeAtSec: Sec,
  /** Required when upgradeEp set, e.g. 「受伤后真情求婚」. */
  upgradeLabel: z.string().min(1).optional(),
  dissolveEp: Ep.optional(),
  dissolveAtSec: Sec,
  /** Required when dissolveEp set, e.g. 「契约到期体面分手」. */
  dissolveLabel: z.string().min(1).optional(),
  /** Episodes of companion care / covert help while under contract. */
  companionEps: z.array(Ep).optional(),
  note: z.string().optional(),
});

export const BondContractLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  entries: z.array(BondContractEntrySchema),
});

export type BondContractLedger = z.infer<typeof BondContractLedgerSchema>;

export type BondContractFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'FUTURE_EP'
    | 'UPGRADE_BEFORE_CONTRACT'
    | 'DISSOLVE_BEFORE_CONTRACT'
    | 'UPGRADE_WITHOUT_LABEL'
    | 'DISSOLVE_WITHOUT_LABEL'
    | 'BOTH_TERMINALS'
    | 'COMPANION_BEFORE_CONTRACT'
    | 'COMPANION_AFTER_TERMINAL'
    | 'PENDING'
    | 'NO_COMPANION';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface BondContractReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    total: number;
    upgraded: number;
    dissolved: number;
    pending: number;
    withCompanion: number;
    latestEp: number;
  };
  findings: BondContractFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

function beforeByEpSec(
  epA: number,
  secA: number | undefined,
  epB: number,
  secB: number | undefined,
): boolean {
  if (epA < epB) return true;
  if (epA > epB) return false;
  if (secA !== undefined && secB !== undefined) return secA < secB;
  return false;
}

export function evaluateBondContract(input: unknown): BondContractReport {
  const parsed = BondContractLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: {
        total: 0,
        upgraded: 0,
        dissolved: 0,
        pending: 0,
        withCompanion: 0,
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
  const findings: BondContractFinding[] = [];
  const push = (x: BondContractFinding) => findings.push(x);

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
      message: `契约账本ID重复：${id}`,
      fix: '契约条目 ID 是 contract/companion/upgrade|dissolve 指针主键，改成唯一 ID',
    });
  }

  let upgraded = 0;
  let dissolved = 0;
  let pending = 0;
  let withCompanion = 0;

  for (const e of entries) {
    const companions = e.companionEps ?? [];
    if (companions.length > 0) withCompanion += 1;

    const futureBits: string[] = [];
    if (e.contractEp > latestEp) futureBits.push(`contractEp=E${e.contractEp}`);
    if (e.upgradeEp !== undefined && e.upgradeEp > latestEp) {
      futureBits.push(`upgradeEp=E${e.upgradeEp}`);
    }
    if (e.dissolveEp !== undefined && e.dissolveEp > latestEp) {
      futureBits.push(`dissolveEp=E${e.dissolveEp}`);
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
        fix: '改 contractEp/upgradeEp/dissolveEp/companionEps，或上调 latestEp',
      });
    }

    for (const ep of companions) {
      if (ep < e.contractEp) {
        push({
          code: 'COMPANION_BEFORE_CONTRACT',
          severity: 'FAIL',
          ids: [e.id],
          message: `${e.id} 帮扶拍 E${ep} 早于签约 E${e.contractEp}`,
          fix: 'companion 须发生在契约成立之后（帮扶的是契约期内的关系）',
        });
      }
    }

    const hasUpgrade = e.upgradeEp !== undefined;
    const hasDissolve = e.dissolveEp !== undefined;

    if (hasUpgrade && hasDissolve) {
      push({
        code: 'BOTH_TERMINALS',
        severity: 'FAIL',
        ids: [e.id],
        message: `${e.id} 同时设了 upgradeEp=E${e.upgradeEp} 与 dissolveEp=E${e.dissolveEp}`,
        fix: '升级与解除互斥：真情升级用 upgrade*，契约解除用 dissolve*，另开条目记第二轮',
      });
    }

    if (!hasUpgrade && !hasDissolve) {
      pending += 1;
      push({
        code: 'PENDING',
        severity: 'WARN',
        ids: [e.id],
        message: `${e.id}（${e.partyA}↔${e.partyB}·${e.contractLabel}）签约于 E${e.contractEp}，尚未升级/解除`,
        fix: '规划 upgradeEp+upgradeLabel（真情 tipping）或 dissolveEp+dissolveLabel（契约解除）',
      });
      continue;
    }

    if (hasUpgrade) {
      upgraded += 1;

      if (!e.upgradeLabel || !e.upgradeLabel.trim()) {
        push({
          code: 'UPGRADE_WITHOUT_LABEL',
          severity: 'FAIL',
          ids: [e.id],
          message: `${e.id} 有 upgradeEp=E${e.upgradeEp} 但缺少 upgradeLabel（真情升级标签）`,
          fix: '补 upgradeLabel，如「受伤后真情求婚」「协议期满告白转正」',
        });
      }

      if (
        beforeByEpSec(e.upgradeEp!, e.upgradeAtSec, e.contractEp, e.contractAtSec)
      ) {
        const sameEp =
          e.upgradeEp === e.contractEp &&
          e.contractAtSec !== undefined &&
          e.upgradeAtSec !== undefined;
        push({
          code: 'UPGRADE_BEFORE_CONTRACT',
          severity: 'FAIL',
          ids: [e.id],
          message: sameEp
            ? `${e.id} 同集内升级 ${e.upgradeAtSec}s 早于签约 ${e.contractAtSec}s`
            : `${e.id} 升级 E${e.upgradeEp} 早于签约 E${e.contractEp}`,
          fix: sameEp
            ? '同集内 upgradeAtSec ≥ contractAtSec'
            : '真情升级不能早于契约成立',
        });
      }

      if (!hasDissolve) {
        for (const ep of companions) {
          if (ep > e.upgradeEp!) {
            push({
              code: 'COMPANION_AFTER_TERMINAL',
              severity: 'FAIL',
              ids: [e.id],
              message: `${e.id} 帮扶拍 E${ep} 晚于升级终结 E${e.upgradeEp}`,
              fix: '升级后不应再记同条契约 companion；若是新一轮契约，另开一条目',
            });
          }
        }

        if (companions.length === 0) {
          push({
            code: 'NO_COMPANION',
            severity: 'WARN',
            ids: [e.id],
            message: `${e.id} 升级于 E${e.upgradeEp}，缺少 companionEps 帮扶蓄势（直达真情）`,
            fix: '补中间 companionEps（暗中帮扶/陪伴）；若同集短线契约，可忽略此 WARN',
          });
        }
      }
    }

    if (hasDissolve) {
      dissolved += 1;

      if (!e.dissolveLabel || !e.dissolveLabel.trim()) {
        push({
          code: 'DISSOLVE_WITHOUT_LABEL',
          severity: 'FAIL',
          ids: [e.id],
          message: `${e.id} 有 dissolveEp=E${e.dissolveEp} 但缺少 dissolveLabel（解除标签）`,
          fix: '补 dissolveLabel，如「契约到期体面分手」「被揭穿后撕毁协议」',
        });
      }

      if (
        beforeByEpSec(e.dissolveEp!, e.dissolveAtSec, e.contractEp, e.contractAtSec)
      ) {
        const sameEp =
          e.dissolveEp === e.contractEp &&
          e.contractAtSec !== undefined &&
          e.dissolveAtSec !== undefined;
        push({
          code: 'DISSOLVE_BEFORE_CONTRACT',
          severity: 'FAIL',
          ids: [e.id],
          message: sameEp
            ? `${e.id} 同集内解除 ${e.dissolveAtSec}s 早于签约 ${e.contractAtSec}s`
            : `${e.id} 解除 E${e.dissolveEp} 早于签约 E${e.contractEp}`,
          fix: sameEp
            ? '同集内 dissolveAtSec ≥ contractAtSec'
            : '契约解除不能早于契约成立',
        });
      }

      if (!hasUpgrade) {
        for (const ep of companions) {
          if (ep > e.dissolveEp!) {
            push({
              code: 'COMPANION_AFTER_TERMINAL',
              severity: 'FAIL',
              ids: [e.id],
              message: `${e.id} 帮扶拍 E${ep} 晚于解除终结 E${e.dissolveEp}`,
              fix: '解除后不应再记同条契约 companion；若是新一轮契约，另开一条目',
            });
          }
        }
      }
    }
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      total: entries.length,
      upgraded,
      dissolved,
      pending,
      withCompanion,
      latestEp,
    },
    findings,
    gates: GATES,
  };
}
