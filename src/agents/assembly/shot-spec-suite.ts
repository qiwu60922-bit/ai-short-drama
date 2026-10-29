/**
 * V12 · Shot-Spec Suite (pre-gen visual/structure 旁路总入口),
 * offline, deterministic.
 *
 * Bundles ShotSpec / CutTimeline / contract gates beside story-ledger-suite:
 *   hookStructure · openingCascade · cutTimeline
 *   · shotContract · shotPrompt · storyRhythm · mvShotlist
 *   · keyframePlate · reactionBeat
 *   · dialogueExposition · seriesRhythm
 *   · coldOpenHook · mvBeatMap
 *   · detailHookKind · tailColdClose
 *   · midTurnDensity · hookKindMix
 *   · setupRatioHard · coldOpenCascade · reactionAfterReversal
 *   · hookWindowHard · cliffTailTight · dialogueAfterHook
 *   · midHookEarly · setupAfterHookBan · reactionBeforeCliff
 * shotContract mounts DEFAULT_SHOT_CONTRACT_RULESET when contractOpts.ruleset omitted.
 *
 * Absent sections → SKIP. Zero sections → EMPTY_SUITE FAIL.
 * Unknown keys → SCHEMA FAIL (strict).
 * Engineering suite only: PASS ≠ Final ≠ G3. $0.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import {
  evaluateHookStructure,
  type HookStructureOptions,
  type HookStructureReport,
} from './hook-structure-gate';
import {
  evaluateOpeningCascade,
  type OpeningCascadeOptions,
  type OpeningCascadeReport,
} from './opening-cascade-gate';
import {
  CutTimelineSchema,
  evaluateCutTimeline,
  type CutTimelineOptions,
  type CutTimelineReport,
} from './cut-timeline-gate';
import {
  ShotContractDocSchema,
  evaluateShotContract,
  type ShotContractOptions,
  type ShotContractReport,
} from './shot-contract-gate';
import {
  evaluateShotPrompts,
  type ShotPromptGateOptions,
  type ShotPromptReport,
} from './shot-prompt-gate';
import {
  evaluateStoryRhythm,
  type RhythmOptions,
  type RhythmReport,
} from './story-rhythm-gate';
import {
  MvShotlistDocSchema,
  evaluateMvShotlist,
  type MvShotlistReport,
} from './mv-shotlist-gate';
import {
  KeyframePlateDocSchema,
  evaluateKeyframePlate,
  type KeyframePlateOptions,
  type KeyframePlateReport,
} from './keyframe-plate-gate';
import {
  evaluateReactionBeats,
  type ReactionBeatOptions,
  type ReactionBeatReport,
} from './reaction-beat-gate';
import { DEFAULT_SHOT_CONTRACT_RULESET } from './shot-contract-gate';
import {
  evaluateDialogueExposition,
  type DialogueExpositionOptions,
  type DialogueExpositionReport,
} from './dialogue-exposition-gate';
import {
  evaluateSeriesRhythm,
  type SeriesRhythmOptions,
  type SeriesRhythmReport,
} from './series-rhythm-profile';
import {
  evaluateColdOpenHook,
  type ColdOpenHookOptions,
  type ColdOpenHookReport,
} from './cold-open-hook-gate';
import {
  MvBeatMapDocSchema,
  evaluateMvBeatMap,
  type MvBeatMapReport,
} from './mv-beat-map-gate';
import {
  evaluateDetailHookKind,
  type DetailHookKindOptions,
  type DetailHookKindReport,
} from './detail-hook-kind-gate';
import {
  evaluateTailColdClose,
  type TailColdCloseOptions,
  type TailColdCloseReport,
} from './tail-cold-close-gate';
import {
  evaluateMidTurnDensity,
  type MidTurnDensityOptions,
  type MidTurnDensityReport,
} from './mid-turn-density-gate';
import {
  evaluateHookKindMix,
  type HookKindMixOptions,
  type HookKindMixReport,
} from './hook-kind-mix-gate';
import {
  evaluateSetupRatioHard,
  type SetupRatioHardOptions,
  type SetupRatioHardReport,
} from './setup-ratio-hard-gate';
import {
  evaluateColdOpenCascade,
  type ColdOpenCascadeOptions,
  type ColdOpenCascadeReport,
} from './cold-open-cascade-gate';
import {
  evaluateReactionAfterReversal,
  type ReactionAfterReversalOptions,
  type ReactionAfterReversalReport,
} from './reaction-after-reversal-gate';

import {
  evaluateHookWindowHard,
  type HookWindowHardOptions,
  type HookWindowHardReport,
} from './hook-window-hard-gate';
import {
  evaluateCliffTailTight,
  type CliffTailTightOptions,
  type CliffTailTightReport,
} from './cliff-tail-tight-gate';
import {
  evaluateDialogueAfterHook,
  type DialogueAfterHookOptions,
  type DialogueAfterHookReport,
} from './dialogue-after-hook-gate';
import {
  evaluateMidHookEarly,
  type MidHookEarlyOptions,
  type MidHookEarlyReport,
} from './mid-hook-early-gate';
import {
  evaluateSetupAfterHookBan,
  type SetupAfterHookBanOptions,
  type SetupAfterHookBanReport,
} from './setup-after-hook-ban-gate';
import {
  evaluateReactionBeforeCliff,
  type ReactionBeforeCliffOptions,
  type ReactionBeforeCliffReport,
} from './reaction-before-cliff-gate';

export const SHOT_SPEC_GATE_IDS = [
  'hookStructure',
  'openingCascade',
  'cutTimeline',
  'shotContract',
  'shotPrompt',
  'storyRhythm',
  'mvShotlist',
  'keyframePlate',
  'reactionBeat',
  'dialogueExposition',
  'seriesRhythm',
  'coldOpenHook',
  'mvBeatMap',
  'detailHookKind',
  'tailColdClose',
  'midTurnDensity',
  'hookKindMix',
  'setupRatioHard',
  'coldOpenCascade',
  'reactionAfterReversal',
  'hookWindowHard',
  'cliffTailTight',
  'dialogueAfterHook',
  'midHookEarly',
  'setupAfterHookBan',
  'reactionBeforeCliff',
] as const;

export type ShotSpecGateId = (typeof SHOT_SPEC_GATE_IDS)[number];

const HookOptsSchema = z
  .object({
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
  })
  .strict();

const CascadeOptsSchema = z
  .object({
    cascadeWindowSec: z.number().positive().optional(),
    minCascadeBeats: z.number().int().positive().optional(),
  })
  .strict();

const CutOptsSchema = z
  .object({
    maxBeatSec: z.number().positive().optional(),
    minBeatSec: z.number().positive().optional(),
  })
  .strict();

const ContractOptsSchema = z
  .object({
    minDurationSec: z.number().positive().optional(),
    maxDurationSec: z.number().positive().optional(),
    maxRulesPerShot: z.number().int().positive().optional(),
    ruleset: z
      .object({
        rules: z.array(z.object({ id: z.string().optional() }).passthrough()).optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
  })
  .strict();

const PromptOptsSchema = z
  .object({
    safeChars: z.number().positive().optional(),
    hardChars: z.number().positive().optional(),
    maxUnitsPerSec: z.number().positive().optional(),
    estUnitsPerSec: z.number().positive().optional(),
    pauseSec: z.number().nonnegative().optional(),
    strictFiveLines: z.boolean().optional(),
    hardBans: z.array(z.string()).optional(),
    processTerms: z.array(z.string()).optional(),
  })
  .strict();

const RhythmOptsSchema = z
  .object({
    minEventsPer90s: z.number().positive().optional(),
    maxShotSeconds: z.number().positive().optional(),
    maxSecondsPerEvent: z.number().positive().optional(),
    requireCutMotive: z.boolean().optional(),
  })
  .strict();

const KeyframeOptsSchema = z
  .object({
    minPlates: z.number().int().positive().optional(),
    minClips: z.number().int().positive().optional(),
  })
  .strict();

const ReactionOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requireReaction: z.boolean().optional(),
  })
  .strict();

const DialogueOptsSchema = z
  .object({
    minActionChars: z.number().int().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    unlabeledSpeechMin: z.number().int().positive().optional(),
  })
  .strict();

const SeriesRhythmOptsSchema = z
  .object({
    profile: z.enum(['dense', 'default', 'intrigue', 'slow_burn']).optional(),
    minEventsPer90s: z.number().positive().optional(),
    maxShotSeconds: z.number().positive().optional(),
    maxSecondsPerEvent: z.number().positive().optional(),
    requireCutMotive: z.boolean().optional(),
  })
  .strict();

const ColdOpenOptsSchema = z
  .object({
    coldOpenWindowSec: z.number().positive().optional(),
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
  })
  .strict();

const DetailHookOptsSchema = z
  .object({
    requireDetailCu: z.boolean().optional(),
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
  })
  .strict();

const TailColdOptsSchema = z
  .object({
    coldTailSec: z.number().positive().optional(),
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
  })
  .strict();


const MidTurnOptsSchema = z
  .object({
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
    minTurns: z.number().int().positive().optional(),
  })
  .strict();

const HookKindMixOptsSchema = z
  .object({
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
    minDistinctKinds: z.number().int().positive().optional(),
    maxFaceRatio: z.number().positive().optional(),
    earlyHooksOnly: z.boolean().optional(),
  })
  .strict();


const SetupRatioHardOptsSchema = z
  .object({
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
    hardMaxSetupRatio: z.number().positive().optional(),
  })
  .strict();

const ColdOpenCascadeOptsSchema = z
  .object({
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
    coldOpenWindowSec: z.number().positive().optional(),
    cascadeWindowSec: z.number().positive().optional(),
    minCascadeBeats: z.number().int().positive().optional(),
  })
  .strict();

const ReactionAfterReversalOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requireReaction: z.boolean().optional(),
    reversalOnly: z.boolean().optional(),
  })
  .strict();

const HookWindowHardOptsSchema = z
  .object({
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
    hardHookWindowSec: z.number().positive().optional(),
  })
  .strict();

const CliffTailTightOptsSchema = z
  .object({
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
    hardTailToleranceSec: z.number().positive().optional(),
  })
  .strict();

const DialogueAfterHookOptsSchema = z
  .object({
    minActionChars: z.number().int().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    unlabeledSpeechMin: z.number().int().positive().optional(),
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindowHook: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
  })
  .strict();

const MidHookEarlyOptsSchema = z
  .object({
    midHookByRatio: z.number().positive().optional(),
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
  })
  .strict();

const SetupAfterHookBanOptsSchema = z
  .object({
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
  })
  .strict();

const ReactionBeforeCliffOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requireReaction: z.boolean().optional(),
    requirePriorReaction: z.boolean().optional(),
  })
  .strict();



export const ShotSpecSuiteSchema = z
  .object({
    episode: z.string().min(1),
    hookStructure: ShotSpecDocSchema.optional(),
    openingCascade: ShotSpecDocSchema.optional(),
    cutTimeline: CutTimelineSchema.optional(),
    shotContract: ShotContractDocSchema.optional(),
    shotPrompt: ShotSpecDocSchema.optional(),
    storyRhythm: ShotSpecDocSchema.optional(),
    mvShotlist: MvShotlistDocSchema.optional(),
    keyframePlate: KeyframePlateDocSchema.optional(),
    reactionBeat: ShotSpecDocSchema.optional(),
    dialogueExposition: ShotSpecDocSchema.optional(),
    seriesRhythm: ShotSpecDocSchema.optional(),
    coldOpenHook: ShotSpecDocSchema.optional(),
    mvBeatMap: MvBeatMapDocSchema.optional(),
    detailHookKind: ShotSpecDocSchema.optional(),
    tailColdClose: ShotSpecDocSchema.optional(),
    midTurnDensity: ShotSpecDocSchema.optional(),
    hookKindMix: ShotSpecDocSchema.optional(),
    setupRatioHard: ShotSpecDocSchema.optional(),
    coldOpenCascade: ShotSpecDocSchema.optional(),
    reactionAfterReversal: ShotSpecDocSchema.optional(),
    hookWindowHard: ShotSpecDocSchema.optional(),
    cliffTailTight: ShotSpecDocSchema.optional(),
    dialogueAfterHook: ShotSpecDocSchema.optional(),
    midHookEarly: ShotSpecDocSchema.optional(),
    setupAfterHookBan: ShotSpecDocSchema.optional(),
    reactionBeforeCliff: ShotSpecDocSchema.optional(),
    hookOpts: HookOptsSchema.optional(),
    cascadeOpts: CascadeOptsSchema.optional(),
    cutOpts: CutOptsSchema.optional(),
    contractOpts: ContractOptsSchema.optional(),
    promptOpts: PromptOptsSchema.optional(),
    rhythmOpts: RhythmOptsSchema.optional(),
    keyframeOpts: KeyframeOptsSchema.optional(),
    reactionOpts: ReactionOptsSchema.optional(),
    dialogueOpts: DialogueOptsSchema.optional(),
    seriesRhythmOpts: SeriesRhythmOptsSchema.optional(),
    coldOpenOpts: ColdOpenOptsSchema.optional(),
    detailHookOpts: DetailHookOptsSchema.optional(),
    tailColdOpts: TailColdOptsSchema.optional(),
    midTurnOpts: MidTurnOptsSchema.optional(),
    hookKindMixOpts: HookKindMixOptsSchema.optional(),
    setupRatioHardOpts: SetupRatioHardOptsSchema.optional(),
    coldOpenCascadeOpts: ColdOpenCascadeOptsSchema.optional(),
    reactionAfterReversalOpts: ReactionAfterReversalOptsSchema.optional(),
    hookWindowHardOpts: HookWindowHardOptsSchema.optional(),
    cliffTailTightOpts: CliffTailTightOptsSchema.optional(),
    dialogueAfterHookOpts: DialogueAfterHookOptsSchema.optional(),
    midHookEarlyOpts: MidHookEarlyOptsSchema.optional(),
    setupAfterHookBanOpts: SetupAfterHookBanOptsSchema.optional(),
    reactionBeforeCliffOpts: ReactionBeforeCliffOptsSchema.optional(),
  })
  .strict();

export type ShotSpecSuiteInput = z.infer<typeof ShotSpecSuiteSchema>;

export type ShotSpecChildReport =
  | HookStructureReport
  | OpeningCascadeReport
  | CutTimelineReport
  | ShotContractReport
  | ShotPromptReport
  | RhythmReport
  | MvShotlistReport
  | KeyframePlateReport
  | ReactionBeatReport
  | DialogueExpositionReport
  | SeriesRhythmReport
  | ColdOpenHookReport
  | MvBeatMapReport
  | DetailHookKindReport
  | TailColdCloseReport
  | MidTurnDensityReport
  | HookKindMixReport
  | SetupRatioHardReport
  | ColdOpenCascadeReport
  | ReactionAfterReversalReport
  | HookWindowHardReport
  | CliffTailTightReport
  | DialogueAfterHookReport
  | MidHookEarlyReport
  | SetupAfterHookBanReport
  | ReactionBeforeCliffReport;

export type ShotSpecGateResult = {
  status: 'PASS' | 'FAIL' | 'SKIP';
  report?: ShotSpecChildReport;
};

export type ShotSpecSuiteFinding = {
  code: 'SCHEMA' | 'EMPTY_SUITE' | 'GATE_FAIL';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface ShotSpecSuiteReport {
  schema: 'v12/ShotSpecSuite/v1';
  verdict: 'PASS' | 'FAIL';
  metrics: {
    ran: number;
    passed: number;
    failed: number;
    skipped: number;
    episode: string;
  };
  results: Record<ShotSpecGateId, ShotSpecGateResult>;
  findings: ShotSpecSuiteFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

function emptyResults(): Record<ShotSpecGateId, ShotSpecGateResult> {
  return Object.fromEntries(
    SHOT_SPEC_GATE_IDS.map((id) => [id, { status: 'SKIP' as const }]),
  ) as Record<ShotSpecGateId, ShotSpecGateResult>;
}

export function evaluateShotSpecSuite(input: unknown): ShotSpecSuiteReport {
  const results = emptyResults();
  const findings: ShotSpecSuiteFinding[] = [];

  const parsed = ShotSpecSuiteSchema.safeParse(input);
  if (!parsed.success) {
    findings.push({
      code: 'SCHEMA',
      severity: 'FAIL',
      message: `ShotSpecSuite schema: ${parsed.error.issues[0]?.message ?? 'invalid'}`,
      fix: `提供 episode，以及 0+ 已知 section（${SHOT_SPEC_GATE_IDS.join(' | ')}）`,
    });
    return {
      schema: 'v12/ShotSpecSuite/v1',
      verdict: 'FAIL',
      metrics: {
        ran: 0,
        passed: 0,
        failed: 0,
        skipped: SHOT_SPEC_GATE_IDS.length,
        episode: '',
      },
      results,
      findings,
      gates: GATES,
    };
  }

  const {
    episode,
    hookOpts,
    cascadeOpts,
    cutOpts,
    contractOpts,
    promptOpts,
    rhythmOpts,
    keyframeOpts,
    reactionOpts,
    dialogueOpts,
    seriesRhythmOpts,
    coldOpenOpts,
    detailHookOpts,
    tailColdOpts,
    midTurnOpts,
    hookKindMixOpts,
    setupRatioHardOpts,
    coldOpenCascadeOpts,
    reactionAfterReversalOpts,
    hookWindowHardOpts,
    cliffTailTightOpts,
    dialogueAfterHookOpts,
    midHookEarlyOpts,
    setupAfterHookBanOpts,
    reactionBeforeCliffOpts,
    ...sections
  } = parsed.data;
  let ran = 0;
  let passed = 0;
  let failed = 0;

  const run = (id: ShotSpecGateId, report: ShotSpecChildReport) => {
    ran += 1;
    if (report.verdict === 'PASS') {
      passed += 1;
      results[id] = { status: 'PASS', report };
    } else {
      failed += 1;
      results[id] = { status: 'FAIL', report };
      findings.push({
        code: 'GATE_FAIL',
        severity: 'FAIL',
        ids: [id],
        message: `${id} verdict=FAIL (${report.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code).join(',') || 'see report'})`,
        fix: `修复 ${id} 子闸门后重跑 shot-spec-suite`,
      });
    }
  };

  if (sections.hookStructure !== undefined) {
    run(
      'hookStructure',
      evaluateHookStructure(sections.hookStructure, (hookOpts ?? {}) as HookStructureOptions),
    );
  }
  if (sections.openingCascade !== undefined) {
    run(
      'openingCascade',
      evaluateOpeningCascade(
        sections.openingCascade,
        (cascadeOpts ?? {}) as OpeningCascadeOptions,
      ),
    );
  }
  if (sections.cutTimeline !== undefined) {
    run(
      'cutTimeline',
      evaluateCutTimeline(sections.cutTimeline, (cutOpts ?? {}) as CutTimelineOptions),
    );
  }
  if (sections.shotContract !== undefined) {
    const co = (contractOpts ?? {}) as ShotContractOptions;
    run(
      'shotContract',
      evaluateShotContract(sections.shotContract, {
        ...co,
        ruleset: co.ruleset === undefined ? DEFAULT_SHOT_CONTRACT_RULESET : co.ruleset,
      }),
    );
  }
  if (sections.shotPrompt !== undefined) {
    const po = promptOpts ?? {};
    run(
      'shotPrompt',
      evaluateShotPrompts(sections.shotPrompt, {
        ...po,
        processTerms: po.processTerms,
      } as ShotPromptGateOptions),
    );
  }
  if (sections.storyRhythm !== undefined) {
    run(
      'storyRhythm',
      evaluateStoryRhythm(sections.storyRhythm, (rhythmOpts ?? {}) as RhythmOptions),
    );
  }
  if (sections.mvShotlist !== undefined) {
    run('mvShotlist', evaluateMvShotlist(sections.mvShotlist));
  }
  if (sections.keyframePlate !== undefined) {
    run(
      'keyframePlate',
      evaluateKeyframePlate(sections.keyframePlate, (keyframeOpts ?? {}) as KeyframePlateOptions),
    );
  }
  if (sections.reactionBeat !== undefined) {
    run(
      'reactionBeat',
      evaluateReactionBeats(sections.reactionBeat, (reactionOpts ?? {}) as ReactionBeatOptions),
    );
  }
  if (sections.dialogueExposition !== undefined) {
    run(
      'dialogueExposition',
      evaluateDialogueExposition(
        sections.dialogueExposition,
        (dialogueOpts ?? {}) as DialogueExpositionOptions,
      ),
    );
  }
  if (sections.seriesRhythm !== undefined) {
    run(
      'seriesRhythm',
      evaluateSeriesRhythm(
        sections.seriesRhythm,
        (seriesRhythmOpts ?? {}) as SeriesRhythmOptions,
      ),
    );
  }
  if (sections.coldOpenHook !== undefined) {
    run(
      'coldOpenHook',
      evaluateColdOpenHook(
        sections.coldOpenHook,
        (coldOpenOpts ?? {}) as ColdOpenHookOptions,
      ),
    );
  }
  if (sections.mvBeatMap !== undefined) {
    run('mvBeatMap', evaluateMvBeatMap(sections.mvBeatMap));
  }
  if (sections.detailHookKind !== undefined) {
    run(
      'detailHookKind',
      evaluateDetailHookKind(
        sections.detailHookKind,
        (detailHookOpts ?? {}) as DetailHookKindOptions,
      ),
    );
  }
  if (sections.tailColdClose !== undefined) {
    run(
      'tailColdClose',
      evaluateTailColdClose(
        sections.tailColdClose,
        (tailColdOpts ?? {}) as TailColdCloseOptions,
      ),
    );
  }
  if (sections.midTurnDensity !== undefined) {
    run(
      'midTurnDensity',
      evaluateMidTurnDensity(
        sections.midTurnDensity,
        (midTurnOpts ?? {}) as MidTurnDensityOptions,
      ),
    );
  }
  if (sections.hookKindMix !== undefined) {
    run(
      'hookKindMix',
      evaluateHookKindMix(
        sections.hookKindMix,
        (hookKindMixOpts ?? {}) as HookKindMixOptions,
      ),
    );
  }
  if (sections.setupRatioHard !== undefined) {
    run(
      'setupRatioHard',
      evaluateSetupRatioHard(
        sections.setupRatioHard,
        (setupRatioHardOpts ?? {}) as SetupRatioHardOptions,
      ),
    );
  }
  if (sections.coldOpenCascade !== undefined) {
    run(
      'coldOpenCascade',
      evaluateColdOpenCascade(
        sections.coldOpenCascade,
        (coldOpenCascadeOpts ?? {}) as ColdOpenCascadeOptions,
      ),
    );
  }
  if (sections.reactionAfterReversal !== undefined) {
    run(
      'reactionAfterReversal',
      evaluateReactionAfterReversal(
        sections.reactionAfterReversal,
        (reactionAfterReversalOpts ?? {}) as ReactionAfterReversalOptions,
      ),
    );
  }
  if (sections.hookWindowHard !== undefined) {
    run(
      'hookWindowHard',
      evaluateHookWindowHard(
        sections.hookWindowHard,
        (hookWindowHardOpts ?? {}) as HookWindowHardOptions,
      ),
    );
  }
  if (sections.cliffTailTight !== undefined) {
    run(
      'cliffTailTight',
      evaluateCliffTailTight(
        sections.cliffTailTight,
        (cliffTailTightOpts ?? {}) as CliffTailTightOptions,
      ),
    );
  }
  if (sections.dialogueAfterHook !== undefined) {
    run(
      'dialogueAfterHook',
      evaluateDialogueAfterHook(
        sections.dialogueAfterHook,
        (dialogueAfterHookOpts ?? {}) as DialogueAfterHookOptions,
      ),
    );
  }
  if (sections.midHookEarly !== undefined) {
    run(
      'midHookEarly',
      evaluateMidHookEarly(
        sections.midHookEarly,
        (midHookEarlyOpts ?? {}) as MidHookEarlyOptions,
      ),
    );
  }
  if (sections.setupAfterHookBan !== undefined) {
    run(
      'setupAfterHookBan',
      evaluateSetupAfterHookBan(
        sections.setupAfterHookBan,
        (setupAfterHookBanOpts ?? {}) as SetupAfterHookBanOptions,
      ),
    );
  }
  if (sections.reactionBeforeCliff !== undefined) {
    run(
      'reactionBeforeCliff',
      evaluateReactionBeforeCliff(
        sections.reactionBeforeCliff,
        (reactionBeforeCliffOpts ?? {}) as ReactionBeforeCliffOptions,
      ),
    );
  }

  const skipped = SHOT_SPEC_GATE_IDS.length - ran;
  if (ran === 0) {
    findings.push({
      code: 'EMPTY_SUITE',
      severity: 'FAIL',
      message: '未提供任何 shot-spec section',
      fix: `至少挂载一项：${SHOT_SPEC_GATE_IDS.join(' | ')}`,
    });
  }

  return {
    schema: 'v12/ShotSpecSuite/v1',
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { ran, passed, failed, skipped, episode },
    results,
    findings,
    gates: GATES,
  };
}
