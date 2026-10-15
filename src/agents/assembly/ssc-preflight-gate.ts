/**
 * V12 · SSC Preflight Gate (影视前期预检闸门), offline, deterministic.
 *
 * Adapted from yzsp-studio/ssc (MIT, Copyright 2026 yzsp-ai): hard rules from SKILL.md §3
 * and references/08-QC (E01 / E05 / E13 / E14 / E15 + Panel9 continuity handoff).
 * Rewritten in TypeScript as an engineering gate — not a Skill orchestrator; no image/video/API calls.
 *
 *  SCHEMA              zod 校验失败
 *  E01_MISSING_ASSETS  A0 缺失，或 A5/B5/B8 缺必需要素
 *  E14_PENDING_AS_PASS a3CompletionStatus 为 PENDING/UNKNOWN/NONE/空，或 pendingAssets 非空
 *  E05_SPATIAL         坐标不是 {x,y} / {x,y,z}（裸数字、数组、字符串、缺键）
 *  E15_CHARACTER_COUNT 可见人物不在允许名单 / 数量超限 / 空名单却有人
 *  E13_SHAPE_COLOR     B5/B8 缺形状颜色表 FAIL；A5 仅 WARN（空对象算缺）
 *  PANEL9_HANDOFF      B5/B8 有 next 语境时 Panel9 衔接缺失或关键键不一致
 *
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';

const Stage = z.enum(['A5', 'B5', 'B8']);

const ContinuityBlockSchema = z
  .object({
    rolePositions: z.unknown().optional(),
    eyeline: z.unknown().optional(),
    props: z.unknown().optional(),
    camera: z.unknown().optional(),
  })
  .passthrough();

const PanelSchema = z.object({
  index: z.number().int().min(1).max(9),
  visibleCharacters: z.array(z.string()),
  characters: z
    .array(
      z.object({
        id: z.string().min(1),
        stagePositionXy: z.unknown().optional(),
        stagePositionXyz: z.unknown().optional(),
      }),
    )
    .optional(),
  props: z
    .array(
      z.object({
        id: z.string().min(1),
        stagePositionXy: z.unknown().optional(),
        stagePositionXyz: z.unknown().optional(),
      }),
    )
    .optional(),
});

export const SscPreflightInputSchema = z.object({
  videoTaskId: z.string().min(1),
  stage: Stage,
  a0Present: z.boolean(),
  assets: z.object({
    storyboardSummary: z.boolean().optional(),
    sceneSchedule: z.boolean().optional(),
    spaceTruth: z.boolean().optional(),
    visualAssets: z.boolean().optional(),
    stageMap: z.boolean().optional(),
    storyboardGrid: z.boolean().optional(),
  }),
  a3CompletionStatus: z.string().optional(),
  pendingAssets: z.array(z.unknown()).optional(),
  allowedVisibleCharacters: z.array(z.string()),
  panels: z.array(PanelSchema),
  panel9ContinuityHandoff: ContinuityBlockSchema.nullable().optional(),
  nextPanel1ContinuityStart: ContinuityBlockSchema.nullable().optional(),
  characterShapeColorMap: z.record(z.string()).nullable().optional(),
  propShapeColorMap: z.record(z.string()).nullable().optional(),
});

export type SscPreflightInput = z.infer<typeof SscPreflightInputSchema>;

export type SscFindingCode =
  | 'SCHEMA'
  | 'E01_MISSING_ASSETS'
  | 'E14_PENDING_AS_PASS'
  | 'E05_SPATIAL'
  | 'E15_CHARACTER_COUNT'
  | 'E13_SHAPE_COLOR'
  | 'PANEL9_HANDOFF';

export type SscFinding = {
  code: SscFindingCode;
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  panelIndex?: number;
};

export interface SscPreflightReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    panelCount: number;
    allowedCount: number;
    findingCounts: { FAIL: number; WARN: number };
  };
  findings: SscFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

const A5_REQUIRED = ['storyboardSummary', 'sceneSchedule', 'spaceTruth', 'visualAssets', 'stageMap'] as const;
const B_REQUIRED = [...A5_REQUIRED, 'storyboardGrid'] as const;

function isXy(v: unknown): boolean {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) return false;
  const o = v as Record<string, unknown>;
  return typeof o.x === 'number' && typeof o.y === 'number' && !Number.isNaN(o.x) && !Number.isNaN(o.y);
}

function isXyz(v: unknown): boolean {
  if (!isXy(v)) return false;
  const o = v as Record<string, unknown>;
  return typeof o.z === 'number' && !Number.isNaN(o.z);
}

function mapMissing(m: Record<string, string> | null | undefined): boolean {
  return m == null || Object.keys(m).length === 0;
}

function continuityKeys(block: Record<string, unknown> | null | undefined): string[] {
  if (!block || typeof block !== 'object') return [];
  return Object.keys(block).sort();
}

function isEmptyContinuity(block: unknown): boolean {
  if (block == null) return true;
  if (typeof block !== 'object') return true;
  return Object.keys(block as object).length === 0;
}

export function evaluateSscPreflight(input: unknown): SscPreflightReport {
  const rawPresent =
    input !== null && typeof input === 'object'
      ? {
          next: Object.prototype.hasOwnProperty.call(input, 'nextPanel1ContinuityStart'),
          handoff: Object.prototype.hasOwnProperty.call(input, 'panel9ContinuityHandoff'),
        }
      : { next: false, handoff: false };

  const parsed = SscPreflightInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      verdict: 'FAIL',
      metrics: { panelCount: 0, allowedCount: 0, findingCounts: { FAIL: 1, WARN: 0 } },
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

  const data = parsed.data;
  const findings: SscFinding[] = [];
  const push = (f: SscFinding) => findings.push(f);

  // E01 — A0 + stage assets
  if (!data.a0Present) {
    push({
      code: 'E01_MISSING_ASSETS',
      severity: 'FAIL',
      message: 'a0Present=false：进入下游前缺少 A0 数据中心',
      fix: '先完成 A0 再跑预检',
    });
  }
  const need = data.stage === 'A5' ? A5_REQUIRED : B_REQUIRED;
  const missing = need.filter((k) => data.assets[k] !== true);
  if (missing.length > 0) {
    push({
      code: 'E01_MISSING_ASSETS',
      severity: 'FAIL',
      message: `${data.stage} 缺必需要素：${missing.join(', ')}`,
      fix: '补齐 ACTIVE 资产后再进下游',
    });
  }

  // E14 — pending-as-PASS
  const status = data.a3CompletionStatus;
  const statusEmpty = status === undefined || status.trim() === '';
  if (statusEmpty || status === 'PENDING' || status === 'UNKNOWN' || status === 'NONE') {
    push({
      code: 'E14_PENDING_AS_PASS',
      severity: 'FAIL',
      message: `a3CompletionStatus=${status === undefined ? '(missing)' : JSON.stringify(status)} 不能当作 PASS`,
      fix: 'A3 冻结完成且 a3CompletionStatus=PASS 后再下游',
    });
  }
  if (Array.isArray(data.pendingAssets) && data.pendingAssets.length > 0) {
    push({
      code: 'E14_PENDING_AS_PASS',
      severity: 'FAIL',
      message: `pendingAssets 仍有 ${data.pendingAssets.length} 项，不能当作 PASS`,
      fix: '清空 pendingAssets 或完成待生成资产',
    });
  }

  // E05 — spatial coords when fields provided
  for (const panel of data.panels) {
    const entities = [...(panel.characters ?? []), ...(panel.props ?? [])];
    for (const ent of entities) {
      if ('stagePositionXy' in ent && ent.stagePositionXy !== undefined && !isXy(ent.stagePositionXy)) {
        push({
          code: 'E05_SPATIAL',
          severity: 'FAIL',
          panelIndex: panel.index,
          message: `Panel ${panel.index} ${ent.id} stagePositionXy 非法（需 {x:number,y:number}）`,
          fix: '改成带键名的 XY 对象，禁止裸数字/数组/字符串',
        });
      }
      if ('stagePositionXyz' in ent && ent.stagePositionXyz !== undefined && !isXyz(ent.stagePositionXyz)) {
        push({
          code: 'E05_SPATIAL',
          severity: 'FAIL',
          panelIndex: panel.index,
          message: `Panel ${panel.index} ${ent.id} stagePositionXyz 非法（需 {x,y,z:number}）`,
          fix: '改成带键名的 XYZ 对象，禁止裸数字/数组/字符串',
        });
      }
    }
  }

  // E15 — character count lock
  const allowed = data.allowedVisibleCharacters;
  const allowedSet = new Set(allowed);
  for (const panel of data.panels) {
    const vis = panel.visibleCharacters;
    if (allowed.length === 0 && vis.length > 0) {
      push({
        code: 'E15_CHARACTER_COUNT',
        severity: 'FAIL',
        panelIndex: panel.index,
        message: `Panel ${panel.index}：allowedVisibleCharacters 为空却有可见人物`,
        fix: '先声明本任务允许出场的中文全名名单',
      });
      continue;
    }
    const unknown = vis.filter((n) => !allowedSet.has(n));
    if (unknown.length > 0) {
      push({
        code: 'E15_CHARACTER_COUNT',
        severity: 'FAIL',
        panelIndex: panel.index,
        message: `Panel ${panel.index} 出现未允许人物：${unknown.join('、')}`,
        fix: '只保留 allowedVisibleCharacters 内的中文全名',
      });
    }
    if (vis.length > allowed.length) {
      push({
        code: 'E15_CHARACTER_COUNT',
        severity: 'FAIL',
        panelIndex: panel.index,
        message: `Panel ${panel.index} 可见人数 ${vis.length} > 允许 ${allowed.length}`,
        fix: '收紧可见名单或扩允许名单（仍须中文全名）',
      });
    }
  }

  // E13 — shape/color maps
  const charMissing = mapMissing(data.characterShapeColorMap);
  const propMissing = mapMissing(data.propShapeColorMap);
  if (charMissing || propMissing) {
    const bits = [
      charMissing ? 'characterShapeColorMap' : null,
      propMissing ? 'propShapeColorMap' : null,
    ].filter(Boolean);
    const sev: 'FAIL' | 'WARN' = data.stage === 'A5' ? 'WARN' : 'FAIL';
    push({
      code: 'E13_SHAPE_COLOR',
      severity: sev,
      message: `${data.stage} 缺形状颜色表：${bits.join(', ')}（空对象亦算缺）`,
      fix: '从 A4 继承 character/prop shape-color map，禁止下游重排配色',
    });
  }

  // PANEL9_HANDOFF — only B5/B8 when next context present
  if ((data.stage === 'B5' || data.stage === 'B8') && rawPresent.next) {
    const handoff = data.panel9ContinuityHandoff;
    const next = data.nextPanel1ContinuityStart;
    if (isEmptyContinuity(handoff)) {
      push({
        code: 'PANEL9_HANDOFF',
        severity: 'FAIL',
        message: '已提供 nextPanel1ContinuityStart，但 panel9ContinuityHandoff 缺失或为空',
        fix: 'Panel9 写入 continuity_handoff，下一任务 Panel1 继承为 continuity_start',
      });
    } else if (next != null && !isEmptyContinuity(next)) {
      const hk = continuityKeys(handoff as Record<string, unknown>);
      const nk = continuityKeys(next as Record<string, unknown>);
      if (hk.join('|') !== nk.join('|')) {
        push({
          code: 'PANEL9_HANDOFF',
          severity: 'FAIL',
          message: `Panel9 handoff 关键键 [${hk.join(',')}] 与 next Panel1 [${nk.join(',')}] 不一致`,
          fix: '两端对齐 rolePositions/eyeline/props/camera 关键键',
        });
      }
    } else if (next == null) {
      // next field present but null → still need a non-empty handoff (already checked);
      // null next with non-empty handoff: treat as key-inconsistency / incomplete start
      push({
        code: 'PANEL9_HANDOFF',
        severity: 'FAIL',
        message: 'nextPanel1ContinuityStart 为 null，无法与 Panel9 handoff 对齐',
        fix: '为下一任务 Panel1 填写 continuity_start，关键键与 handoff 一致',
      });
    }
  }

  const failN = findings.filter((f) => f.severity === 'FAIL').length;
  const warnN = findings.filter((f) => f.severity === 'WARN').length;
  return {
    verdict: failN > 0 ? 'FAIL' : 'PASS',
    metrics: {
      panelCount: data.panels.length,
      allowedCount: data.allowedVisibleCharacters.length,
      findingCounts: { FAIL: failN, WARN: warnN },
    },
    findings,
    gates: GATES,
  };
}
