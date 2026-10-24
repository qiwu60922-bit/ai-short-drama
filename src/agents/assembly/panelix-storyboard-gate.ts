/**
 * V12 · Panelix Storyboard Gate (网文→分镜包可拍性机械闸门), pre-gen, offline, deterministic.
 *
 * Method rewritten in TypeScript from zjzforfb-jpg/panelix pipeline concepts
 * (MIT, Copyright (c) 2026 zjzforfb-jpg) — code LICENSE only:
 * https://github.com/zjzforfb-jpg/panelix
 * Not wholesale vendoring: no React/FastAPI/Gemini/RxDB/OPFS copied. We encode
 * mechanical package completeness inspired by Plot Splitter → Writer → Asset Extractor
 * and SHOT_SCHEMA_GUIDE (三拍子 / WS·MS·CU / characterAssetIds / action+visual):
 *   beats with ids · panels linked to beats · character sheets resolve ·
 *   shootable bounds · no orphan panels · non-empty action · shotType band ·
 *   WARN for missing continuity / expression tags · WARN char overflow (>2).
 *
 * Field mapping (gate-friendly JSON ↔ upstream Panelix):
 *   schemaVersion / projectId              ← ProjectV2 id/version
 *   beats[].id / summary                   ← ExplainBeat.beatId / PlotEpisode scenes
 *   characters[].id / name                 ← Asset(type=character).id / name
 *   panels[].id                            ← ScriptPanel.panel_id (stringified)
 *   panels[].beatId                        ← NarrationBeatRef.beatId / beat link
 *   panels[].shotType                      ← PanelShot.shotSize (WS|MS|CU)
 *   panels[].framing                       ← PanelShot.composition / camera
 *   panels[].action                        ← PanelShot.action (required)
 *   panels[].dialogue                      ← PanelShot.dialogue (string | "" | null)
 *   panels[].characterIds[]                ← PanelShot.characterAssetIds
 *   panels[].continuityNote                ← ScriptPanel.continuityPrevHint
 *   panels[].expression                    ← optional face/emotion tag
 *   panels[].visual                        ← PanelShot.visual (optional for gate)
 *
 *  SCHEMA (FAIL)              input fails shape / empty beats or panels
 *  BEAT_DUP_ID (FAIL)         duplicate beat id
 *  CHAR_DUP_ID (FAIL)         duplicate character sheet id
 *  PANEL_DUP_ID (FAIL)        duplicate panel id
 *  ORPHAN_PANEL (FAIL)        panel.beatId not in beats
 *  BEAT_NO_PANEL (FAIL)       beat has zero covering panels
 *  CHAR_UNKNOWN (FAIL)        panel.characterIds cite missing sheet
 *  ACTION_EMPTY (FAIL)        panel.action blank
 *  SHOT_TYPE (FAIL)           shotType not in allowed set (default WS|MS|CU)
 *  PANEL_COUNT (FAIL)         panels length outside [minPanels, maxPanels]
 *  CONTINUITY_MISSING (WARN)  panel has no continuityNote
 *  EXPRESSION_MISSING (WARN)  panel has no expression tag
 *  CHAR_OVERFLOW (WARN)       characterIds length > maxCharsPerPanel (default 2)
 *
 * Engineering gate only: PASS ≠ Final ≠ G3. No Gemini / Seedance / paid APIs.
 */
import { z } from 'zod';

export const PANELIX_STORYBOARD_DEFAULTS = {
  minPanels: 3,
  maxPanels: 36,
  maxCharsPerPanel: 2,
  allowedShotTypes: ['WS', 'MS', 'CU'] as readonly string[],
} as const;

export interface PanelixStoryboardOptions {
  minPanels?: number;
  maxPanels?: number;
  maxCharsPerPanel?: number;
  allowedShotTypes?: readonly string[];
}

const BeatSchema = z.object({
  id: z.string().min(1),
  summary: z.string().min(1),
  hookType: z.string().optional(),
});

const CharacterSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
});

const PanelSchema = z.object({
  id: z.string().min(1),
  beatId: z.string().min(1),
  shotType: z.string().min(1),
  framing: z.string().min(1),
  action: z.string(),
  /** Dialogue-or-none: string (may be empty), null, or omitted → treated as none. */
  dialogue: z.union([z.string(), z.null()]).optional(),
  characterIds: z.array(z.string()),
  continuityNote: z.string().optional(),
  expression: z.string().optional(),
  visual: z.string().optional(),
});

export const PanelixStoryboardPackageSchema = z.object({
  schemaVersion: z.string().min(1),
  projectId: z.string().min(1),
  beats: z.array(BeatSchema).min(1),
  characters: z.array(CharacterSchema),
  panels: z.array(PanelSchema).min(1),
});

export type PanelixStoryboardPackage = z.infer<typeof PanelixStoryboardPackageSchema>;

export type PanelixStoryboardFindingCode =
  | 'SCHEMA'
  | 'BEAT_DUP_ID'
  | 'CHAR_DUP_ID'
  | 'PANEL_DUP_ID'
  | 'ORPHAN_PANEL'
  | 'BEAT_NO_PANEL'
  | 'CHAR_UNKNOWN'
  | 'ACTION_EMPTY'
  | 'SHOT_TYPE'
  | 'PANEL_COUNT'
  | 'CONTINUITY_MISSING'
  | 'EXPRESSION_MISSING'
  | 'CHAR_OVERFLOW';

export interface PanelixStoryboardFinding {
  code: PanelixStoryboardFindingCode;
  severity: 'FAIL' | 'WARN';
  message: string;
  panelId?: string;
  beatId?: string;
  fix?: string;
}

const GATES = { Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' } as const;

export interface PanelixStoryboardReport {
  verdict: 'PASS' | 'FAIL';
  metrics: {
    projectId: string;
    beats: number;
    characters: number;
    panels: number;
    findingCounts: { FAIL: number; WARN: number };
  };
  findings: PanelixStoryboardFinding[];
  thresholds: {
    minPanels: number;
    maxPanels: number;
    maxCharsPerPanel: number;
    allowedShotTypes: readonly string[];
  };
  gates: typeof GATES;
}

function schemaFail(
  message: string,
  t: PanelixStoryboardReport['thresholds'],
): PanelixStoryboardReport {
  return {
    verdict: 'FAIL',
    metrics: {
      projectId: '',
      beats: 0,
      characters: 0,
      panels: 0,
      findingCounts: { FAIL: 1, WARN: 0 },
    },
    findings: [{ code: 'SCHEMA', severity: 'FAIL', message }],
    thresholds: t,
    gates: GATES,
  };
}

function dupIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) dups.add(id);
    else seen.add(id);
  }
  return [...dups];
}

/**
 * Evaluate a Panelix-style novel→storyboard package for shootable completeness
 * (beats · panels · character sheets · framing · action).
 */
export function evaluatePanelixStoryboard(
  input: unknown,
  options: PanelixStoryboardOptions = {},
): PanelixStoryboardReport {
  const t = {
    minPanels: options.minPanels ?? PANELIX_STORYBOARD_DEFAULTS.minPanels,
    maxPanels: options.maxPanels ?? PANELIX_STORYBOARD_DEFAULTS.maxPanels,
    maxCharsPerPanel:
      options.maxCharsPerPanel ?? PANELIX_STORYBOARD_DEFAULTS.maxCharsPerPanel,
    allowedShotTypes:
      options.allowedShotTypes ?? PANELIX_STORYBOARD_DEFAULTS.allowedShotTypes,
  };

  const parsed = PanelixStoryboardPackageSchema.safeParse(input);
  if (!parsed.success) {
    return schemaFail(
      parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      t,
    );
  }

  const doc = parsed.data;
  const findings: PanelixStoryboardFinding[] = [];
  const allowed = new Set(t.allowedShotTypes.map((s) => s.toUpperCase()));

  for (const id of dupIds(doc.beats.map((b) => b.id))) {
    findings.push({
      code: 'BEAT_DUP_ID',
      severity: 'FAIL',
      message: `duplicate beat id "${id}"`,
      beatId: id,
      fix: 'Give each plot beat a unique id.',
    });
  }
  for (const id of dupIds(doc.characters.map((c) => c.id))) {
    findings.push({
      code: 'CHAR_DUP_ID',
      severity: 'FAIL',
      message: `duplicate character sheet id "${id}"`,
      fix: 'Character sheet ids must be unique (Panelix Asset.id).',
    });
  }
  for (const id of dupIds(doc.panels.map((p) => p.id))) {
    findings.push({
      code: 'PANEL_DUP_ID',
      severity: 'FAIL',
      message: `duplicate panel id "${id}"`,
      panelId: id,
      fix: 'Give each panel a unique id.',
    });
  }

  if (doc.panels.length < t.minPanels || doc.panels.length > t.maxPanels) {
    findings.push({
      code: 'PANEL_COUNT',
      severity: 'FAIL',
      message: `panels=${doc.panels.length} outside [${t.minPanels}, ${t.maxPanels}]`,
      fix: `Keep panel count between ${t.minPanels} and ${t.maxPanels} for a shootable package.`,
    });
  }

  const beatIds = new Set(doc.beats.map((b) => b.id));
  const charIds = new Set(doc.characters.map((c) => c.id));
  const panelsByBeat = new Map<string, number>();
  for (const b of doc.beats) panelsByBeat.set(b.id, 0);

  for (const panel of doc.panels) {
    if (!beatIds.has(panel.beatId)) {
      findings.push({
        code: 'ORPHAN_PANEL',
        severity: 'FAIL',
        message: `panel "${panel.id}" references unknown beatId "${panel.beatId}"`,
        panelId: panel.id,
        beatId: panel.beatId,
        fix: 'Link every panel to an existing beat id (no orphan panels).',
      });
    } else {
      panelsByBeat.set(panel.beatId, (panelsByBeat.get(panel.beatId) ?? 0) + 1);
    }

    if (!panel.action.trim()) {
      findings.push({
        code: 'ACTION_EMPTY',
        severity: 'FAIL',
        message: `panel "${panel.id}" has empty action`,
        panelId: panel.id,
        fix: 'Write a concrete action (Panelix PanelShot.action); no empty prose.',
      });
    }

    const shot = panel.shotType.trim().toUpperCase();
    if (!allowed.has(shot)) {
      findings.push({
        code: 'SHOT_TYPE',
        severity: 'FAIL',
        message: `panel "${panel.id}" shotType "${panel.shotType}" not in [${[...allowed].join('|')}]`,
        panelId: panel.id,
        fix: 'Use WS / MS / CU (Panelix ShotSize).',
      });
    }

    for (const cid of panel.characterIds) {
      if (!charIds.has(cid)) {
        findings.push({
          code: 'CHAR_UNKNOWN',
          severity: 'FAIL',
          message: `panel "${panel.id}" cites unknown character "${cid}"`,
          panelId: panel.id,
          fix: 'Add a character sheet or drop the dangling characterAssetId.',
        });
      }
    }

    if (panel.characterIds.length > t.maxCharsPerPanel) {
      findings.push({
        code: 'CHAR_OVERFLOW',
        severity: 'WARN',
        message: `panel "${panel.id}" has ${panel.characterIds.length} characters (max recommended ${t.maxCharsPerPanel})`,
        panelId: panel.id,
        fix: 'Panelix recommends ≤2 characterAssetIds per shot to keep refs stable.',
      });
    }

    if (!panel.continuityNote?.trim()) {
      findings.push({
        code: 'CONTINUITY_MISSING',
        severity: 'WARN',
        message: `panel "${panel.id}" missing continuityNote`,
        panelId: panel.id,
        fix: 'Add a short continuity handoff (how this panel picks up from the prior).',
      });
    }

    if (!panel.expression?.trim()) {
      findings.push({
        code: 'EXPRESSION_MISSING',
        severity: 'WARN',
        message: `panel "${panel.id}" missing expression tag`,
        panelId: panel.id,
        fix: 'Tag face/emotion for character-sheet consistency.',
      });
    }
  }

  for (const [beatId, count] of panelsByBeat) {
    if (count < 1) {
      findings.push({
        code: 'BEAT_NO_PANEL',
        severity: 'FAIL',
        message: `beat "${beatId}" has no covering panels`,
        beatId,
        fix: 'Every plot beat needs ≥1 shootable panel.',
      });
    }
  }

  const failN = findings.filter((f) => f.severity === 'FAIL').length;
  const warnN = findings.filter((f) => f.severity === 'WARN').length;

  return {
    verdict: failN > 0 ? 'FAIL' : 'PASS',
    metrics: {
      projectId: doc.projectId,
      beats: doc.beats.length,
      characters: doc.characters.length,
      panels: doc.panels.length,
      findingCounts: { FAIL: failN, WARN: warnN },
    },
    findings,
    thresholds: t,
    gates: GATES,
  };
}
