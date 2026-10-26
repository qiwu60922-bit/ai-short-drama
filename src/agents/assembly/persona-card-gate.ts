/**
 * V12 · Persona-Card Gate (角色卡完整性 · 锚点×4 · 虚构禁 unknown · 衣柜), pre-gen, offline, deterministic.
 *
 * Method rewritten in TypeScript from huihui308/ai-persona-studio
 * (MIT, Copyright (c) 2026 huihui308) — code LICENSE only:
 * https://github.com/huihui308/ai-persona-studio
 * Not wholesale vendoring: no SKILL.md prompt templates / sheet generators /
 * image or video providers copied. We encode mechanical character-card checks
 * inspired by references/character-card.schema.json (+ SKILL adult/resemblance/
 * anchors/wardrobe rules):
 *   adult must be true · resemblance enum · anchors exactly 4 unique non-empty ·
 *   face/hair/skin/body required keys · fiction (resemblance=none) forbids literal
 *   "unknown" · wardrobe baseline + unique ids · ageCues required.
 *
 * Field mapping (gate-friendly camelCase ↔ upstream schema):
 *   slug / name / adult / age / gender / resemblance / persona / notes
 *   face / hair / skin / body          ← same; Chinese keys also accepted
 *     face: faceShape|脸型, eyeShape|眼型, noseShape|鼻型, lips|嘴唇
 *     hair: hairColor|发色|color, hairLength|发长|length
 *     skin: skinTone|肤色|tone
 *     body: heightFeel|身高感|height, bodyProportion|身材比例|proportion
 *   ageCues                            ← age_cues
 *   wardrobe[].id / name / items / occasion
 *                                      ← id / 名称 / 单品 / 场合
 *   anchors[4]
 *   reference.sourcePhoto              ← reference.source_photo
 *   reference.sheetImages              ← reference.sheet_images
 *
 *  SCHEMA (FAIL)                 input fails PersonaCardSchema
 *  ADULT_REQUIRED (FAIL)         adult !== true (minors: no card)
 *  RESEMBLANCE_INVALID (FAIL)    not none|similar|same-person
 *  SLUG_INVALID (FAIL)           slug empty or contains whitespace
 *  ANCHORS_COUNT (FAIL)          anchors length !== 4 or empty string
 *  ANCHORS_DUP (FAIL)            duplicate anchor text
 *  FACE_INCOMPLETE (FAIL)        missing faceShape/eyeShape/noseShape/lips (or 中文)
 *  HAIR_INCOMPLETE (FAIL)        missing hairColor/hairLength (or 发色/发长)
 *  SKIN_INCOMPLETE (FAIL)        missing skinTone (or 肤色)
 *  BODY_INCOMPLETE (FAIL)        missing heightFeel/bodyProportion (or 身高感/身材比例)
 *  UNKNOWN_ON_FICTION (FAIL)     resemblance=none and any feature/ageCue == "unknown"
 *  WARDROBE_EMPTY (FAIL)         wardrobe length < 1
 *  WARDROBE_BASELINE (FAIL)      first outfit missing id or empty items
 *  WARDROBE_DUP_ID (FAIL)        duplicate wardrobe id
 *  AGE_CUES_EMPTY (FAIL)         ageCues empty
 *  SOURCE_PHOTO_MISSING (WARN)   similar|same-person and sourcePhoto empty/none
 *  SHEET_IMAGES_EMPTY (WARN)     sheetImages missing/empty
 *  WARDROBE_THIN (WARN)          wardrobe.length < 3
 *  AGE_CUES_THIN (WARN)          ageCues.length < 2
 *
 * Engineering gate only: PASS ≠ Final ≠ G3. No image/video / MiniMax / paid APIs.
 */
import { z } from 'zod';

const RESEMBLANCES = ['none', 'similar', 'same-person'] as const;

/** String map for feature blocks; empty-string values fail completeness later. */
const FeatureBlockSchema = z.record(z.string());

const WardrobeItemSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().optional(),
    items: z.string().optional(),
    occasion: z.string().optional(),
    名称: z.string().optional(),
    单品: z.string().optional(),
    场合: z.string().optional(),
  })
  .passthrough();

const ReferenceSchema = z
  .object({
    sourcePhoto: z.string().optional(),
    source_photo: z.string().optional(),
    sheetImages: z.array(z.string()).optional(),
    sheet_images: z.array(z.string()).optional(),
  })
  .passthrough()
  .optional();

/**
 * Soft schema: structural presence. Semantic rules (adult/anchors/…) run after parse
 * so we can emit dedicated FAIL codes instead of a single SCHEMA blob.
 */
export const PersonaCardSchema = z
  .object({
    slug: z.string(),
    name: z.string().min(1),
    adult: z.boolean(),
    age: z.number().optional(),
    gender: z.string().optional(),
    resemblance: z.string().min(1),
    persona: z.record(z.unknown()).optional(),
    face: FeatureBlockSchema,
    hair: FeatureBlockSchema,
    skin: FeatureBlockSchema,
    body: FeatureBlockSchema,
    ageCues: z.array(z.string()).optional(),
    age_cues: z.array(z.string()).optional(),
    wardrobe: z.array(WardrobeItemSchema),
    anchors: z.array(z.string()),
    reference: ReferenceSchema,
    notes: z.string().optional(),
  })
  .passthrough();

export type PersonaCard = z.infer<typeof PersonaCardSchema>;

export type PersonaCardFindingCode =
  | 'SCHEMA'
  | 'ADULT_REQUIRED'
  | 'RESEMBLANCE_INVALID'
  | 'SLUG_INVALID'
  | 'ANCHORS_COUNT'
  | 'ANCHORS_DUP'
  | 'FACE_INCOMPLETE'
  | 'HAIR_INCOMPLETE'
  | 'SKIN_INCOMPLETE'
  | 'BODY_INCOMPLETE'
  | 'UNKNOWN_ON_FICTION'
  | 'WARDROBE_EMPTY'
  | 'WARDROBE_BASELINE'
  | 'WARDROBE_DUP_ID'
  | 'AGE_CUES_EMPTY'
  | 'SOURCE_PHOTO_MISSING'
  | 'SHEET_IMAGES_EMPTY'
  | 'WARDROBE_THIN'
  | 'AGE_CUES_THIN';

export interface PersonaCardFinding {
  code: PersonaCardFindingCode;
  severity: 'FAIL' | 'WARN';
  message: string;
  path?: string;
  fix?: string;
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export interface PersonaCardReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    slug: string;
    anchors: number;
    wardrobe: number;
    ageCues: number;
    findingCounts: { FAIL: number; WARN: number };
  };
  findings: PersonaCardFinding[];
  gates: typeof GATES;
  summary?: string;
}

function schemaFail(message: string): PersonaCardReport {
  return {
    verdict: 'FAIL',
    metrics: {
      slug: '',
      anchors: 0,
      wardrobe: 0,
      ageCues: 0,
      findingCounts: { FAIL: 1, WARN: 0 },
    },
    findings: [{ code: 'SCHEMA', severity: 'FAIL', message }],
    gates: GATES,
  };
}

function pickStr(
  block: Record<string, string>,
  keys: string[],
): string | undefined {
  for (const k of keys) {
    const v = block[k];
    if (typeof v === 'string' && v.trim().length > 0) return v.trim();
  }
  return undefined;
}

function isUnknownLiteral(v: string): boolean {
  return v.trim().toLowerCase() === 'unknown';
}

function wardrobeItems(w: {
  items?: string;
  单品?: string;
}): string {
  return (w.items ?? w.单品 ?? '').trim();
}

function wardrobeName(w: { name?: string; 名称?: string }): string {
  return (w.name ?? w.名称 ?? '').trim();
}

/**
 * Evaluate a persona / character card for integrity & fiction safety rules.
 */
export function evaluatePersonaCard(input: unknown): PersonaCardReport {
  const parsed = PersonaCardSchema.safeParse(input);
  if (!parsed.success) {
    return schemaFail(
      parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
    );
  }

  const doc = parsed.data;
  const findings: PersonaCardFinding[] = [];

  const ageCues = doc.ageCues ?? doc.age_cues ?? [];
  const sourcePhoto = (
    doc.reference?.sourcePhoto ??
    doc.reference?.source_photo ??
    ''
  ).trim();
  const sheetImages =
    doc.reference?.sheetImages ?? doc.reference?.sheet_images ?? [];

  if (!doc.slug.trim() || /\s/.test(doc.slug)) {
    findings.push({
      code: 'SLUG_INVALID',
      severity: 'FAIL',
      message: `slug "${doc.slug}" must be non-empty and contain no whitespace`,
      path: '$.slug',
      fix: 'Use a URL-safe slug like "lin-xiaoyu".',
    });
  }

  if (doc.adult !== true) {
    findings.push({
      code: 'ADULT_REQUIRED',
      severity: 'FAIL',
      message: 'adult must be true; do not build cards for minors',
      path: '$.adult',
      fix: 'Confirm the subject is an adult with authorization, then set adult: true.',
    });
  }

  if (!(RESEMBLANCES as readonly string[]).includes(doc.resemblance)) {
    findings.push({
      code: 'RESEMBLANCE_INVALID',
      severity: 'FAIL',
      message: `resemblance "${doc.resemblance}" must be none|similar|same-person`,
      path: '$.resemblance',
      fix: 'none = fiction; similar = reference but not likeness; same-person = authorized self.',
    });
  }

  if (doc.anchors.length !== 4 || doc.anchors.some((a) => !a.trim())) {
    findings.push({
      code: 'ANCHORS_COUNT',
      severity: 'FAIL',
      message: `anchors must be exactly 4 non-empty strings (got ${doc.anchors.length})`,
      path: '$.anchors',
      fix: 'Write four identity anchors repeated verbatim at the start of every prompt.',
    });
  } else {
    const seen = new Set<string>();
    const dups = new Set<string>();
    for (const a of doc.anchors) {
      const key = a.trim();
      if (seen.has(key)) dups.add(key);
      else seen.add(key);
    }
    for (const d of dups) {
      findings.push({
        code: 'ANCHORS_DUP',
        severity: 'FAIL',
        message: `duplicate anchor "${d}"`,
        path: '$.anchors',
        fix: 'Each of the four anchors must be distinct.',
      });
    }
  }

  const faceOk =
    pickStr(doc.face, ['faceShape', '脸型']) &&
    pickStr(doc.face, ['eyeShape', '眼型']) &&
    pickStr(doc.face, ['noseShape', '鼻型']) &&
    pickStr(doc.face, ['lips', '嘴唇']);
  if (!faceOk) {
    findings.push({
      code: 'FACE_INCOMPLETE',
      severity: 'FAIL',
      message:
        'face must include faceShape/脸型, eyeShape/眼型, noseShape/鼻型, lips/嘴唇 (non-empty)',
      path: '$.face',
      fix: 'Fill the four face keys with concrete values.',
    });
  }

  const hairOk =
    pickStr(doc.hair, ['hairColor', '发色', 'color']) &&
    pickStr(doc.hair, ['hairLength', '发长', 'length']);
  if (!hairOk) {
    findings.push({
      code: 'HAIR_INCOMPLETE',
      severity: 'FAIL',
      message: 'hair must include hairColor/发色 and hairLength/发长 (non-empty)',
      path: '$.hair',
      fix: 'Fill hair color and length.',
    });
  }

  const skinOk = pickStr(doc.skin, ['skinTone', '肤色', 'tone']);
  if (!skinOk) {
    findings.push({
      code: 'SKIN_INCOMPLETE',
      severity: 'FAIL',
      message: 'skin must include skinTone/肤色 (non-empty)',
      path: '$.skin',
      fix: 'Fill skin tone.',
    });
  }

  const bodyOk =
    pickStr(doc.body, ['heightFeel', '身高感', 'height']) &&
    pickStr(doc.body, ['bodyProportion', '身材比例', 'proportion']);
  if (!bodyOk) {
    findings.push({
      code: 'BODY_INCOMPLETE',
      severity: 'FAIL',
      message:
        'body must include heightFeel/身高感 and bodyProportion/身材比例 (non-empty)',
      path: '$.body',
      fix: 'Fill height feel and body proportion.',
    });
  }

  if (doc.resemblance === 'none') {
    const featureValues: Array<{ path: string; value: string }> = [];
    for (const [blockName, block] of [
      ['face', doc.face],
      ['hair', doc.hair],
      ['skin', doc.skin],
      ['body', doc.body],
    ] as const) {
      for (const [k, v] of Object.entries(block)) {
        featureValues.push({ path: `$.${blockName}.${k}`, value: v });
      }
    }
    for (let i = 0; i < ageCues.length; i++) {
      featureValues.push({ path: `$.ageCues[${i}]`, value: ageCues[i] });
    }
    for (const fv of featureValues) {
      if (isUnknownLiteral(fv.value)) {
        findings.push({
          code: 'UNKNOWN_ON_FICTION',
          severity: 'FAIL',
          message: `fiction (resemblance=none) forbids literal "unknown" at ${fv.path}`,
          path: fv.path,
          fix: 'Invent a concrete value; unknown is only for photo-based cards with unseen parts.',
        });
      }
    }
  }

  if (doc.wardrobe.length < 1) {
    findings.push({
      code: 'WARDROBE_EMPTY',
      severity: 'FAIL',
      message: 'wardrobe must contain at least one outfit (baseline)',
      path: '$.wardrobe',
      fix: 'Add a baseline outfit as wardrobe[0].',
    });
  } else {
    const baseline = doc.wardrobe[0];
    const baseId = (baseline.id ?? '').trim();
    const baseItems = wardrobeItems(baseline);
    if (!baseId || !baseItems) {
      findings.push({
        code: 'WARDROBE_BASELINE',
        severity: 'FAIL',
        message: `wardrobe[0] "${wardrobeName(baseline) || '?'}" needs non-empty id and items/单品`,
        path: '$.wardrobe[0]',
        fix: 'Baseline outfit occupies sheet-two five angles; id + items required.',
      });
    }

    const seenIds = new Set<string>();
    const dupIds = new Set<string>();
    for (const w of doc.wardrobe) {
      const id = (w.id ?? '').trim();
      if (!id) continue;
      if (seenIds.has(id)) dupIds.add(id);
      else seenIds.add(id);
    }
    for (const id of dupIds) {
      findings.push({
        code: 'WARDROBE_DUP_ID',
        severity: 'FAIL',
        message: `duplicate wardrobe id "${id}"`,
        path: '$.wardrobe',
        fix: 'Give each outfit a unique id (W1, W2, …).',
      });
    }
  }

  if (ageCues.length === 0) {
    findings.push({
      code: 'AGE_CUES_EMPTY',
      severity: 'FAIL',
      message: 'ageCues must list visible age evidence (wrinkles, nasolabial, pores…)',
      path: '$.ageCues',
      fix: 'Numbers alone make models draw younger; write visible cues.',
    });
  }

  // WARNs
  if (
    (doc.resemblance === 'similar' || doc.resemblance === 'same-person') &&
    (!sourcePhoto || sourcePhoto.toLowerCase() === 'none')
  ) {
    findings.push({
      code: 'SOURCE_PHOTO_MISSING',
      severity: 'WARN',
      message: `resemblance=${doc.resemblance} but reference.sourcePhoto is missing/empty/none`,
      path: '$.reference.sourcePhoto',
      fix: 'Point sourcePhoto at the primary front reference image.',
    });
  }

  if (sheetImages.length === 0) {
    findings.push({
      code: 'SHEET_IMAGES_EMPTY',
      severity: 'WARN',
      message: 'reference.sheetImages empty — fixed sheets not back-filled yet',
      path: '$.reference.sheetImages',
      fix: 'After generating sheets 1–3, append paths in order.',
    });
  }

  if (doc.wardrobe.length > 0 && doc.wardrobe.length < 3) {
    findings.push({
      code: 'WARDROBE_THIN',
      severity: 'WARN',
      message: `wardrobe has ${doc.wardrobe.length} outfit(s); full persona board usually needs ≥3`,
      path: '$.wardrobe',
      fix: 'Add home / outing / work looks beyond the baseline.',
    });
  }

  if (ageCues.length > 0 && ageCues.length < 2) {
    findings.push({
      code: 'AGE_CUES_THIN',
      severity: 'WARN',
      message: `ageCues has ${ageCues.length} entry; prefer ≥2 visible cues`,
      path: '$.ageCues',
      fix: 'Add another visible cue (e.g. neck line, pores).',
    });
  }

  const failN = findings.filter((f) => f.severity === 'FAIL').length;
  const warnN = findings.filter((f) => f.severity === 'WARN').length;

  return {
    verdict: failN > 0 ? 'FAIL' : 'PASS',
    metrics: {
      slug: doc.slug,
      anchors: doc.anchors.length,
      wardrobe: doc.wardrobe.length,
      ageCues: ageCues.length,
      findingCounts: { FAIL: failN, WARN: warnN },
    },
    findings,
    gates: GATES,
    summary:
      failN > 0
        ? `FAIL (${failN} fail, ${warnN} warn)`
        : warnN > 0
          ? `PASS with ${warnN} warn`
          : 'PASS',
  };
}
