/**
 * V12 · Scenario Plan Gate (剧本→成片生成计划 / 付费前双门禁), pre-gen, offline, deterministic.
 *
 * Method rewritten in TypeScript from reedodev/scenario-to-film
 *   skills/scenario-to-film/scripts/validate-plan.mjs
 *   + SKILL.md Gate 1 (previs) / Gate 2 (cost) discipline
 * (MIT, Copyright (c) 2026 reedodev) — code LICENSE only:
 * https://github.com/reedodev/scenario-to-film
 * Not wholesale vendoring: no CozyClay/Blender/ffmpeg scripts, no paid model calls.
 * We encode the mechanical plan rules:
 *   settings + non-empty scenes/clips · scene id shape · no duplicate scenes ·
 *   first scene cannot continue_previous · ref image/video/audio caps ·
 *   clip scene_id must exist · no backtrack / no re-enter after leave ·
 *   mode ∈ {I2V,R2V,T2V} · seconds ∈ [3,15] · non-empty prompt ·
 *   fresh I2V needs first_image · @picture_N within scene image list ·
 *   no <placeholder> leftovers · optional human previs+cost approvals ·
 *   never autoSpend / selfSpend.
 *
 * Field mapping (gate-friendly JSON ↔ upstream plan.json):
 *   settings / scenes[] / clips[] / approvals?
 *   scene.id / prompt / continue_previous / references.{images,videos,audios}
 *   clip.scene_id / mode / seconds / prompt / first_image / refiner
 *   approvals.previsApproved / costApproved (V11 HumanLock-aligned dual gate)
 *
 *  SETTINGS_MISSING (FAIL)     settings object missing
 *  SCENES_EMPTY (FAIL)         scenes missing or empty
 *  CLIPS_EMPTY (FAIL)          clips missing or empty
 *  SCENE_ID (FAIL)             id not 1–64 [A-Za-z0-9_-]
 *  DUP_SCENE (FAIL)            duplicate scene id
 *  FIRST_CONTINUE (FAIL)       first scene continue_previous=true
 *  REF_IMAGES_MAX (FAIL)       > maxRefImages (default 9)
 *  REF_VIDEOS_MAX (FAIL)       > maxRefVideos (default 3)
 *  REF_AUDIOS_MAX (FAIL)       > maxRefAudios (default 3)
 *  CLIP_SCENE_UNKNOWN (FAIL)   clip.scene_id not in scenes
 *  SCENE_BACKTRACK (FAIL)      clip goes back to earlier scene order
 *  SCENE_REENTER (FAIL)        returns to a scene after leaving it
 *  MODE (FAIL)                 mode not I2V/R2V/T2V
 *  DURATION (FAIL)             seconds outside [minClipSec, maxClipSec]
 *  PROMPT_EMPTY (FAIL)         clip prompt empty
 *  I2V_FIRST_IMAGE (FAIL)      fresh I2V clip missing first_image
 *  PICTURE_TAG (FAIL)          @picture_N out of scene image list
 *  PLACEHOLDER (FAIL)          <...> or "placeholder" left in plan
 *  PREVIS_GATE (FAIL)          requireHumanGates and previs not approved
 *  COST_GATE (FAIL)            requireHumanGates and cost not approved
 *  AUTO_SPEND (FAIL)           plan claims autoSpend/selfSpend
 *  SCENE_PROMPT_EVENT (WARN)   scene prompt looks like events/dialogue
 *  REFINER (WARN)              refiner missing or mode not on/off
 *  SCHEMA (FAIL)               input fails shape
 *
 * Engineering gate only: PASS ≠ Final ≠ G3. Never spends credits.
 */
import { z } from 'zod';

export const SCENARIO_PLAN_MODES = ['I2V', 'R2V', 'T2V'] as const;
export type ScenarioPlanMode = (typeof SCENARIO_PLAN_MODES)[number];

export const SCENARIO_PLAN_DEFAULTS = {
  minClipSec: 3,
  maxClipSec: 15,
  maxShotSec: 10,
  maxRefImages: 9,
  maxRefVideos: 3,
  maxRefAudios: 3,
  requireHumanGates: true,
} as const;

export interface ScenarioPlanOptions {
  minClipSec?: number;
  maxClipSec?: number;
  maxRefImages?: number;
  maxRefVideos?: number;
  maxRefAudios?: number;
  /** When true (default), previsApproved + costApproved must both be true. */
  requireHumanGates?: boolean;
  /** When true, allow <placeholder> strings (template lint only). */
  allowPlaceholders?: boolean;
}

const RefinerSchema = z
  .object({
    mode: z.string().optional(),
    strength: z.number().optional(),
    reference_clip: z.number().optional(),
    reason: z.string().optional(),
  })
  .passthrough()
  .optional();

const SceneSchema = z
  .object({
    id: z.string(),
    name: z.string().optional(),
    prompt: z.string().optional(),
    continue_previous: z.boolean().optional(),
    references: z
      .object({
        images: z.array(z.string()).optional(),
        videos: z.array(z.string()).optional(),
        audios: z.array(z.string()).optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

const ClipSchema = z
  .object({
    scene_id: z.string(),
    mode: z.string(),
    seconds: z.number().finite(),
    prompt: z.string().optional(),
    first_image: z.string().optional(),
    last_image: z.string().optional(),
    seed: z.number().optional(),
    use_common_references: z.boolean().optional(),
    refiner: RefinerSchema,
  })
  .passthrough();

const ApprovalsSchema = z
  .object({
    previsApproved: z.boolean().optional(),
    previsApprovedBy: z.string().optional(),
    costApproved: z.boolean().optional(),
    costApprovedBy: z.string().optional(),
    estimatedCredits: z.number().finite().optional(),
    estimatedCreditsKind: z.string().optional(),
  })
  .passthrough()
  .optional();

export const ScenarioPlanDocSchema = z
  .object({
    settings: z.record(z.unknown()).optional(),
    sequence_mode: z.boolean().optional(),
    scenes: z.array(SceneSchema).optional(),
    clips: z.array(ClipSchema).optional(),
    approvals: ApprovalsSchema,
  })
  .passthrough();

export type ScenarioPlanDoc = z.infer<typeof ScenarioPlanDocSchema>;

export type ScenarioPlanFindingCode =
  | 'SCHEMA'
  | 'SETTINGS_MISSING'
  | 'SCENES_EMPTY'
  | 'CLIPS_EMPTY'
  | 'SCENE_ID'
  | 'DUP_SCENE'
  | 'FIRST_CONTINUE'
  | 'REF_IMAGES_MAX'
  | 'REF_VIDEOS_MAX'
  | 'REF_AUDIOS_MAX'
  | 'CLIP_SCENE_UNKNOWN'
  | 'SCENE_BACKTRACK'
  | 'SCENE_REENTER'
  | 'MODE'
  | 'DURATION'
  | 'PROMPT_EMPTY'
  | 'I2V_FIRST_IMAGE'
  | 'PICTURE_TAG'
  | 'PLACEHOLDER'
  | 'PREVIS_GATE'
  | 'COST_GATE'
  | 'AUTO_SPEND'
  | 'SCENE_PROMPT_EVENT'
  | 'REFINER';

export interface ScenarioPlanFinding {
  code: ScenarioPlanFindingCode;
  severity: 'FAIL' | 'WARN';
  message: string;
  sceneId?: string;
  clipIndex?: number;
  fix?: string;
}

export interface ScenarioPlanReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    scenes: number;
    clips: number;
    totalTargetSeconds: number;
  };
  findings: ScenarioPlanFinding[];
  thresholds: Required<
    Pick<
      ScenarioPlanOptions,
      | 'minClipSec'
      | 'maxClipSec'
      | 'maxRefImages'
      | 'maxRefVideos'
      | 'maxRefAudios'
      | 'requireHumanGates'
      | 'allowPlaceholders'
    >
  >;
}

const SCENE_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const EVENT_IN_SCENE_RE = /\b(dialogue|says|said)\b|<d>|\[Shot/i;
const PLACEHOLDER_RE = /^<.*>$/;
const PICTURE_TAG_RE = /@picture_(\d+)/g;

function schemaFail(
  message: string,
  t: ScenarioPlanReport['thresholds'],
): ScenarioPlanReport {
  return {
    verdict: 'FAIL',
    metrics: { scenes: 0, clips: 0, totalTargetSeconds: 0 },
    findings: [{ code: 'SCHEMA', severity: 'FAIL', message }],
    thresholds: t,
  };
}

function walkPlaceholders(
  value: unknown,
  path: string,
  findings: ScenarioPlanFinding[],
): void {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (PLACEHOLDER_RE.test(trimmed) || /placeholder/i.test(value)) {
      findings.push({
        code: 'PLACEHOLDER',
        severity: 'FAIL',
        message: `placeholder left in ${path || '(root)'}: "${trimmed.slice(0, 40)}"`,
        fix: 'Replace <...> template tokens with real values (use allowPlaceholders only for the template)',
      });
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((x, i) => walkPlaceholders(x, `${path}[${i}]`, findings));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [k, x] of Object.entries(value as Record<string, unknown>)) {
      walkPlaceholders(x, path ? `${path}.${k}` : k, findings);
    }
  }
}

function hasAutoSpendFlag(settings: Record<string, unknown> | undefined): boolean {
  if (!settings) return false;
  for (const [k, v] of Object.entries(settings)) {
    if (/^(autoSpend|selfSpend|auto_spend|self_spend)$/i.test(k) && v === true) {
      return true;
    }
  }
  return false;
}

/**
 * Evaluate a reedodev-style generation plan.json before any paid clip is generated.
 */
export function evaluateScenarioPlan(
  input: unknown,
  options: ScenarioPlanOptions = {},
): ScenarioPlanReport {
  const t: ScenarioPlanReport['thresholds'] = {
    minClipSec: options.minClipSec ?? SCENARIO_PLAN_DEFAULTS.minClipSec,
    maxClipSec: options.maxClipSec ?? SCENARIO_PLAN_DEFAULTS.maxClipSec,
    maxRefImages: options.maxRefImages ?? SCENARIO_PLAN_DEFAULTS.maxRefImages,
    maxRefVideos: options.maxRefVideos ?? SCENARIO_PLAN_DEFAULTS.maxRefVideos,
    maxRefAudios: options.maxRefAudios ?? SCENARIO_PLAN_DEFAULTS.maxRefAudios,
    requireHumanGates:
      options.requireHumanGates ?? SCENARIO_PLAN_DEFAULTS.requireHumanGates,
    allowPlaceholders: options.allowPlaceholders ?? false,
  };

  const parsed = ScenarioPlanDocSchema.safeParse(input);
  if (!parsed.success) {
    return schemaFail(parsed.error.issues[0]?.message ?? 'invalid scenario plan', t);
  }
  const doc = parsed.data;
  const findings: ScenarioPlanFinding[] = [];

  if (!doc.settings || typeof doc.settings !== 'object') {
    findings.push({
      code: 'SETTINGS_MISSING',
      severity: 'FAIL',
      message: 'settings missing',
    });
  } else if (hasAutoSpendFlag(doc.settings as Record<string, unknown>)) {
    findings.push({
      code: 'AUTO_SPEND',
      severity: 'FAIL',
      message: 'settings claims autoSpend/selfSpend — skill never self-spends credits',
      fix: 'Remove autoSpend; wait for HUMAN_GO / costApproved before any paid call',
    });
  }

  const scenes = Array.isArray(doc.scenes) ? doc.scenes : [];
  const clips = Array.isArray(doc.clips) ? doc.clips : [];
  if (!scenes.length) {
    findings.push({
      code: 'SCENES_EMPTY',
      severity: 'FAIL',
      message: 'scenes missing or empty',
    });
  }
  if (!clips.length) {
    findings.push({
      code: 'CLIPS_EMPTY',
      severity: 'FAIL',
      message: 'clips missing or empty',
    });
  }

  const ids = new Set<string>();
  const order: string[] = [];
  scenes.forEach((s, i) => {
    if (!SCENE_ID_RE.test(s.id ?? '')) {
      findings.push({
        code: 'SCENE_ID',
        severity: 'FAIL',
        sceneId: s.id,
        message: `scene ${i + 1}: id must be 1-64 letters, digits, _ or -`,
      });
    }
    if (ids.has(s.id)) {
      findings.push({
        code: 'DUP_SCENE',
        severity: 'FAIL',
        sceneId: s.id,
        message: `scene ${i + 1}: duplicate id ${s.id}`,
      });
    }
    ids.add(s.id);
    order.push(s.id);

    const sp = String(s.prompt ?? '');
    if (EVENT_IN_SCENE_RE.test(sp)) {
      findings.push({
        code: 'SCENE_PROMPT_EVENT',
        severity: 'WARN',
        sceneId: s.id,
        message: `scene ${s.id}: scene prompt looks like it holds events or dialogue (keep it static)`,
      });
    }
    if (i === 0 && s.continue_previous === true) {
      findings.push({
        code: 'FIRST_CONTINUE',
        severity: 'FAIL',
        sceneId: s.id,
        message: 'first scene cannot continue a previous scene',
      });
    }
    const imgs = s.references?.images ?? [];
    const vids = s.references?.videos ?? [];
    const auds = s.references?.audios ?? [];
    if (imgs.length > t.maxRefImages) {
      findings.push({
        code: 'REF_IMAGES_MAX',
        severity: 'FAIL',
        sceneId: s.id,
        message: `scene ${s.id}: more than ${t.maxRefImages} reference images`,
      });
    }
    if (vids.length > t.maxRefVideos) {
      findings.push({
        code: 'REF_VIDEOS_MAX',
        severity: 'FAIL',
        sceneId: s.id,
        message: `scene ${s.id}: more than ${t.maxRefVideos} reference videos`,
      });
    }
    if (auds.length > t.maxRefAudios) {
      findings.push({
        code: 'REF_AUDIOS_MAX',
        severity: 'FAIL',
        sceneId: s.id,
        message: `scene ${s.id}: more than ${t.maxRefAudios} reference audios`,
      });
    }
  });

  let lastIdx = -1;
  const finished = new Set<string>();
  let prevScene: string | null = null;
  clips.forEach((c, i) => {
    const n = i + 1;
    if (!ids.has(c.scene_id)) {
      findings.push({
        code: 'CLIP_SCENE_UNKNOWN',
        severity: 'FAIL',
        clipIndex: n,
        message: `clip ${n}: scene_id ${c.scene_id} not found`,
      });
      return;
    }
    const idx = order.indexOf(c.scene_id);
    if (idx < lastIdx) {
      findings.push({
        code: 'SCENE_BACKTRACK',
        severity: 'FAIL',
        clipIndex: n,
        sceneId: c.scene_id,
        message: `clip ${n}: goes back to an earlier scene (${c.scene_id})`,
      });
    }
    if (prevScene && c.scene_id !== prevScene) finished.add(prevScene);
    if (finished.has(c.scene_id)) {
      findings.push({
        code: 'SCENE_REENTER',
        severity: 'FAIL',
        clipIndex: n,
        sceneId: c.scene_id,
        message: `clip ${n}: returns to scene ${c.scene_id} after leaving it`,
      });
    }
    lastIdx = Math.max(lastIdx, idx);
    prevScene = c.scene_id;

    if (!(SCENARIO_PLAN_MODES as readonly string[]).includes(c.mode)) {
      findings.push({
        code: 'MODE',
        severity: 'FAIL',
        clipIndex: n,
        message: `clip ${n}: mode must be I2V, R2V or T2V`,
      });
    }
    const sec = Number(c.seconds);
    if (!Number.isFinite(sec) || sec < t.minClipSec || sec > t.maxClipSec) {
      findings.push({
        code: 'DURATION',
        severity: 'FAIL',
        clipIndex: n,
        message: `clip ${n}: seconds must be between ${t.minClipSec} and ${t.maxClipSec}`,
      });
    }
    if (!String(c.prompt ?? '').trim()) {
      findings.push({
        code: 'PROMPT_EMPTY',
        severity: 'FAIL',
        clipIndex: n,
        message: `clip ${n}: prompt empty`,
      });
    }

    const isFresh =
      i === 0 || clips[i - 1]?.scene_id !== c.scene_id;
    if (c.mode === 'I2V' && isFresh && !String(c.first_image ?? '').trim()) {
      findings.push({
        code: 'I2V_FIRST_IMAGE',
        severity: 'FAIL',
        clipIndex: n,
        message: `clip ${n}: fresh I2V clip needs first_image`,
      });
    }

    if (!c.refiner || !['on', 'off'].includes(String(c.refiner.mode ?? ''))) {
      findings.push({
        code: 'REFINER',
        severity: 'WARN',
        clipIndex: n,
        message: `clip ${n}: refiner not set (use off by default)`,
      });
    }

    const tags = [...String(c.prompt ?? '').matchAll(PICTURE_TAG_RE)].map((m) =>
      Number(m[1]),
    );
    const sceneImgs =
      scenes.find((s) => s.id === c.scene_id)?.references?.images ?? [];
    for (const tag of tags) {
      if (tag < 1 || tag > sceneImgs.length) {
        findings.push({
          code: 'PICTURE_TAG',
          severity: 'FAIL',
          clipIndex: n,
          sceneId: c.scene_id,
          message: `clip ${n}: @picture_${tag} is not in scene ${c.scene_id}'s image list (${sceneImgs.length} images)`,
        });
      }
    }
  });

  if (!t.allowPlaceholders) {
    walkPlaceholders(doc, '', findings);
  }

  if (t.requireHumanGates) {
    const a = doc.approvals;
    if (!a?.previsApproved) {
      findings.push({
        code: 'PREVIS_GATE',
        severity: 'FAIL',
        message: 'Gate 1 (previs) not approved — user must watch previs before paid gen',
        fix: 'Set approvals.previsApproved=true after HumanLock / user watches previs',
      });
    }
    if (!a?.costApproved) {
      findings.push({
        code: 'COST_GATE',
        severity: 'FAIL',
        message: 'Gate 2 (cost) not approved — never spend credits before costApproved',
        fix: 'Set approvals.costApproved=true only after HUMAN_GO / user approves cost table',
      });
    }
  }

  const totalTargetSeconds = clips.reduce(
    (sum, c) => sum + (Number.isFinite(c.seconds) ? c.seconds : 0),
    0,
  );
  const hasFail = findings.some((f) => f.severity === 'FAIL');
  return {
    verdict: hasFail ? 'FAIL' : 'PASS',
    metrics: {
      scenes: scenes.length,
      clips: clips.length,
      totalTargetSeconds,
    },
    findings,
    thresholds: t,
  };
}
