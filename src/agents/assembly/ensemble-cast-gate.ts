/**
 * V12 · Ensemble-Cast Gate (家庭群像差异化分工), pre-generation, offline, deterministic.
 *
 * Reverse-engineered from public text breakdowns (structure only, no footage):
 *  - 《十八岁太奶奶驾到，重整家族荣耀3》: 穿越太奶奶 + 70岁儿子 + 重孙单元
 *    （失智恢复/黄昏恋/听证）——每人职能/外形/声线可辨，单元 lead 落在 spotlight.
 *  - 《小奶团回裴家》: 多哥哥群像可辨识（报告侧对照 Character ID + 分工）.
 *  - 《满院亲戚全是上古大妖》: 亲戚群像职能差异对照.
 *
 * Closes 2026-10-28/29 candidate: ensemble 家庭群像差异化（改动大）.
 *
 *  SCHEMA / DUP_ID / FUTURE_EP / THIN_ENSEMBLE
 *  DUP_FUNCTION_TAG / DUP_LOOK_TAG / DUP_VOICE_TAG / MISSING_DIFF_TAGS
 *  UNKNOWN_MEMBER / UNIT_NO_LEAD / LEAD_NOT_SPOTLIGHTED
 *  NO_SPOTLIGHT (WARN) / ORPHAN_MEMBER (WARN) / LEAD_MONOPOLY (WARN)
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';

const Ep = z.number().int().positive();

export const ENSEMBLE_ROLE_SLOTS = [
  'matriarch',
  'patriarch',
  'heir',
  'spouse',
  'grandchild',
  'outsider',
  'servant',
  'other',
] as const;

export const EnsembleMemberSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  /** Optional V12 Character ID, e.g. qi-ye — not validated against registry here. */
  characterId: z.string().min(1).optional(),
  roleSlot: z.enum(ENSEMBLE_ROLE_SLOTS),
  /** Unique narrative function inside the family, e.g. 「创伤后失智恢复单元」. */
  functionTag: z.string().min(1),
  lookTag: z.string().min(1).optional(),
  voiceTag: z.string().min(1).optional(),
  /** Episodes where this member owns / co-owns the A-plot. */
  spotlightEps: z.array(Ep).default([]),
  note: z.string().optional(),
});

export const EnsembleUnitSchema = z.object({
  id: z.string().min(1),
  ep: Ep,
  title: z.string().min(1).optional(),
  leadIds: z.array(z.string().min(1)),
  supportIds: z.array(z.string().min(1)).optional(),
  /** Anti-爽点温情单元标记（太奶奶类日常陪伴）. */
  warmth: z.boolean().optional(),
  note: z.string().optional(),
});

export const EnsembleCastLedgerSchema = z.object({
  series: z.string().min(1),
  latestEp: Ep,
  members: z.array(EnsembleMemberSchema),
  units: z.array(EnsembleUnitSchema),
});

export type EnsembleCastLedger = z.infer<typeof EnsembleCastLedgerSchema>;

export interface EnsembleCastOptions {
  minMembers?: number;
  /** Max fraction of unit-leads one member may hold before WARN. */
  maxLeadShare?: number;
}

export const ENSEMBLE_CAST_DEFAULTS: Required<EnsembleCastOptions> = {
  minMembers: 3,
  maxLeadShare: 0.6,
};

export type EnsembleCastFinding = {
  code:
    | 'SCHEMA'
    | 'DUP_ID'
    | 'FUTURE_EP'
    | 'THIN_ENSEMBLE'
    | 'DUP_FUNCTION_TAG'
    | 'DUP_LOOK_TAG'
    | 'DUP_VOICE_TAG'
    | 'MISSING_DIFF_TAGS'
    | 'UNKNOWN_MEMBER'
    | 'UNIT_NO_LEAD'
    | 'LEAD_NOT_SPOTLIGHTED'
    | 'NO_SPOTLIGHT'
    | 'ORPHAN_MEMBER'
    | 'LEAD_MONOPOLY';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface EnsembleCastReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    members: number;
    units: number;
    warmthUnits: number;
    latestEp: number;
  };
  findings: EnsembleCastFinding[];
  thresholds: Required<EnsembleCastOptions>;
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

function dupKeys(values: Array<string | undefined>, ids: string[]): Map<string, string[]> {
  const m = new Map<string, string[]>();
  values.forEach((v, i) => {
    if (!v) return;
    const arr = m.get(v) ?? [];
    arr.push(ids[i]!);
    m.set(v, arr);
  });
  return m;
}

export function evaluateEnsembleCast(
  input: unknown,
  opts: EnsembleCastOptions = {},
): EnsembleCastReport {
  const thresholds = { ...ENSEMBLE_CAST_DEFAULTS, ...opts };
  const parsed = EnsembleCastLedgerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { members: 0, units: 0, warmthUnits: 0, latestEp: 0 },
      findings: [
        {
          code: 'SCHEMA',
          severity: 'FAIL',
          message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        },
      ],
      thresholds,
      gates: GATES,
    };
  }

  const { latestEp, members, units } = parsed.data;
  const findings: EnsembleCastFinding[] = [];
  const push = (x: EnsembleCastFinding) => findings.push(x);

  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const m of members) {
    if (seen.has(m.id)) dups.add(m.id);
    else seen.add(m.id);
  }
  for (const id of dups) {
    push({
      code: 'DUP_ID',
      severity: 'FAIL',
      ids: [id],
      message: `群像成员 ID 重复：${id}`,
      fix: 'members[].id 须唯一',
    });
  }

  if (members.length < thresholds.minMembers) {
    push({
      code: 'THIN_ENSEMBLE',
      severity: 'FAIL',
      message: `群像仅 ${members.length} 人，少于 minMembers=${thresholds.minMembers}`,
      fix: `补齐家庭成员至 ≥${thresholds.minMembers}，并给每人独立 function/look/voice`,
    });
  }

  const ids = members.map((m) => m.id);
  for (const [tag, who] of dupKeys(
    members.map((m) => m.functionTag),
    ids,
  )) {
    if (who.length > 1) {
      push({
        code: 'DUP_FUNCTION_TAG',
        severity: 'FAIL',
        ids: who,
        message: `职能标签重复「${tag}」：${who.join(',')}`,
        fix: '每人须有不可互换的 functionTag（太奶奶温情重整 ≠ 失智恢复单元）',
      });
    }
  }
  for (const [tag, who] of dupKeys(
    members.map((m) => m.lookTag),
    ids,
  )) {
    if (who.length > 1) {
      push({
        code: 'DUP_LOOK_TAG',
        severity: 'FAIL',
        ids: who,
        message: `外形标签重复「${tag}」：${who.join(',')}`,
        fix: '群像脸须可辨：改 lookTag',
      });
    }
  }
  for (const [tag, who] of dupKeys(
    members.map((m) => m.voiceTag),
    ids,
  )) {
    if (who.length > 1) {
      push({
        code: 'DUP_VOICE_TAG',
        severity: 'FAIL',
        ids: who,
        message: `声线标签重复「${tag}」：${who.join(',')}`,
        fix: '群像声须可辨：改 voiceTag',
      });
    }
  }

  for (const m of members) {
    if (!m.lookTag && !m.voiceTag) {
      push({
        code: 'MISSING_DIFF_TAGS',
        severity: 'FAIL',
        ids: [m.id],
        message: `${m.id} 缺少 lookTag 与 voiceTag（群像不可辨）`,
        fix: '至少写 lookTag 或 voiceTag；推荐两者都写',
      });
    }
    if (m.spotlightEps.length === 0) {
      push({
        code: 'NO_SPOTLIGHT',
        severity: 'WARN',
        ids: [m.id],
        message: `${m.id} 无 spotlightEps（从未领过 A 情节拍）`,
        fix: '给该成员分配至少一个单元主场集',
      });
    }
    for (const ep of m.spotlightEps) {
      if (ep > latestEp) {
        push({
          code: 'FUTURE_EP',
          severity: 'FAIL',
          ids: [m.id],
          message: `${m.id} spotlightEps 含 E${ep} > latestEp=${latestEp}`,
          fix: 'spotlight 不得超最新集',
        });
      }
    }
  }

  const byId = new Map(members.map((m) => [m.id, m]));
  const appeared = new Set<string>();
  const leadCounts = new Map<string, number>();

  for (const u of units) {
    if (u.ep > latestEp) {
      push({
        code: 'FUTURE_EP',
        severity: 'FAIL',
        ids: [u.id],
        message: `单元 ${u.id} ep=E${u.ep} > latestEp=${latestEp}`,
        fix: '单元集号不得超最新集',
      });
    }
    if (u.leadIds.length === 0) {
      push({
        code: 'UNIT_NO_LEAD',
        severity: 'FAIL',
        ids: [u.id],
        message: `单元 ${u.id} 无 leadIds`,
        fix: '每个家庭单元至少指定一名主场成员',
      });
      continue;
    }
    for (const lid of u.leadIds) {
      const mem = byId.get(lid);
      if (!mem) {
        push({
          code: 'UNKNOWN_MEMBER',
          severity: 'FAIL',
          ids: [u.id, lid],
          message: `单元 ${u.id} lead=${lid} 不在 members`,
          fix: 'leadIds 须对应 members[].id',
        });
        continue;
      }
      appeared.add(lid);
      leadCounts.set(lid, (leadCounts.get(lid) ?? 0) + 1);
      if (!mem.spotlightEps.includes(u.ep)) {
        push({
          code: 'LEAD_NOT_SPOTLIGHTED',
          severity: 'FAIL',
          ids: [u.id, lid],
          message: `单元 ${u.id}@E${u.ep} 的 lead ${lid} 未把该集写入 spotlightEps`,
          fix: `把 ${u.ep} 加入 ${lid}.spotlightEps（主场集须记账）`,
        });
      }
    }
    for (const sid of u.supportIds ?? []) {
      if (!byId.has(sid)) {
        push({
          code: 'UNKNOWN_MEMBER',
          severity: 'FAIL',
          ids: [u.id, sid],
          message: `单元 ${u.id} support=${sid} 不在 members`,
          fix: 'supportIds 须对应 members[].id',
        });
      } else {
        appeared.add(sid);
      }
    }
  }

  for (const m of members) {
    if (!appeared.has(m.id) && units.length > 0) {
      push({
        code: 'ORPHAN_MEMBER',
        severity: 'WARN',
        ids: [m.id],
        message: `${m.id} 未出现在任何单元 lead/support（群像闲置）`,
        fix: '编进某单元 support，或删掉该成员',
      });
    }
  }

  if (units.length > 0) {
    const totalLeads = [...leadCounts.values()].reduce((a, b) => a + b, 0);
    if (totalLeads > 0) {
      for (const [id, n] of leadCounts) {
        const share = n / totalLeads;
        if (share > thresholds.maxLeadShare + 1e-9) {
          push({
            code: 'LEAD_MONOPOLY',
            severity: 'WARN',
            ids: [id],
            message: `${id} 占据 ${(share * 100).toFixed(0)}% 单元主场（>${thresholds.maxLeadShare * 100}%）`,
            fix: '把单元主场分给其他家庭成员，避免一人包办群像',
          });
        }
      }
    }
  }

  const hasFail = findings.some((f) => f.severity === 'FAIL');
  return {
    verdict: hasFail ? 'FAIL' : 'PASS',
    metrics: {
      members: members.length,
      units: units.length,
      warmthUnits: units.filter((u) => u.warmth).length,
      latestEp,
    },
    findings,
    thresholds,
    gates: GATES,
  };
}
