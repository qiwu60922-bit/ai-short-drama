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
 *   · coldOpenMidHook · dialogueBeforeCliffBan · setupMidCap
 *   · hookKindMixColdOpen · dialogueAfterReversalBan · midTurnSetupCap
 *   · coldOpenDetailHook · cliffTailDialogueBan · midHookSetupBan
 *   · coldOpenHookWindow · reactionReversalCliff · coldCloseCliffTail
 *   · midHookDialogueBan · setupDialogueCap · dialogueSetupBan
 *   · midTurnHookWindow · hookWindowReaction · midTurnReaction
 *   · reactionHookHard · midTurnHookHard · hookWindowBeforeCliff
 *   · coldOpenReaction · cliffTailHookHard · setupMidTurn
 *   · coldOpenMidTurn · cliffTailReaction · midHookReaction
 *   · coldOpenCliffTail · hookWindowMidTurn · midHookCliffTail
 *   · hookWindowCliffTail · midTurnCliffTail · coldCloseMidHook
 *   · coldCloseHookWindow · reactionCliffTail · midTurnColdClose
 *   · coldCloseMidTurn · hookWindowColdClose · cliffTailMidHook
 *   · coldCloseReaction · hookWindowMidHook · cliffTailHookWindow
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
import {
  evaluateColdOpenMidHook,
  type ColdOpenMidHookOptions,
  type ColdOpenMidHookReport,
} from './cold-open-mid-hook-gate';
import {
  evaluateDialogueBeforeCliffBan,
  type DialogueBeforeCliffBanOptions,
  type DialogueBeforeCliffBanReport,
} from './dialogue-before-cliff-ban-gate';
import {
  evaluateSetupMidCap,
  type SetupMidCapOptions,
  type SetupMidCapReport,
} from './setup-mid-cap-gate';
import {
  evaluateHookKindMixColdOpen,
  type HookKindMixColdOpenOptions,
  type HookKindMixColdOpenReport,
} from './hook-kind-mix-cold-open-gate';
import {
  evaluateDialogueAfterReversalBan,
  type DialogueAfterReversalBanOptions,
  type DialogueAfterReversalBanReport,
} from './dialogue-after-reversal-ban-gate';
import {
  evaluateMidTurnSetupCap,
  type MidTurnSetupCapOptions,
  type MidTurnSetupCapReport,
} from './mid-turn-setup-cap-gate';
import {
  evaluateColdOpenDetailHook,
  type ColdOpenDetailHookOptions,
  type ColdOpenDetailHookReport,
} from './cold-open-detail-hook-gate';
import {
  evaluateCliffTailDialogueBan,
  type CliffTailDialogueBanOptions,
  type CliffTailDialogueBanReport,
} from './cliff-tail-dialogue-ban-gate';
import {
  evaluateMidHookSetupBan,
  type MidHookSetupBanOptions,
  type MidHookSetupBanReport,
} from './mid-hook-setup-ban-gate';
import {
  evaluateColdOpenHookWindow,
  type ColdOpenHookWindowOptions,
  type ColdOpenHookWindowReport,
} from './cold-open-hook-window-gate';
import {
  evaluateReactionReversalCliff,
  type ReactionReversalCliffOptions,
  type ReactionReversalCliffReport,
} from './reaction-reversal-cliff-gate';
import {
  evaluateColdCloseCliffTail,
  type ColdCloseCliffTailOptions,
  type ColdCloseCliffTailReport,
} from './cold-close-cliff-tail-gate';

import {
  evaluateMidHookDialogueBan,
  type MidHookDialogueBanOptions,
  type MidHookDialogueBanReport,
} from './mid-hook-dialogue-ban-gate';
import {
  evaluateSetupDialogueCap,
  type SetupDialogueCapOptions,
  type SetupDialogueCapReport,
} from './setup-dialogue-cap-gate';
import {
  evaluateDialogueSetupBan,
  type DialogueSetupBanOptions,
  type DialogueSetupBanReport,
} from './dialogue-setup-ban-gate';

import {
  evaluateMidTurnHookWindow,
  type MidTurnHookWindowOptions,
  type MidTurnHookWindowReport,
} from './mid-turn-hook-window-gate';
import {
  evaluateHookWindowReaction,
  type HookWindowReactionOptions,
  type HookWindowReactionReport,
} from './hook-window-reaction-gate';
import {
  evaluateMidTurnReaction,
  type MidTurnReactionOptions,
  type MidTurnReactionReport,
} from './mid-turn-reaction-gate';

import {
  evaluateReactionHookHard,
  type ReactionHookHardOptions,
  type ReactionHookHardReport,
} from './reaction-hook-hard-gate';
import {
  evaluateMidTurnHookHard,
  type MidTurnHookHardOptions,
  type MidTurnHookHardReport,
} from './mid-turn-hook-hard-gate';
import {
  evaluateHookWindowBeforeCliff,
  type HookWindowBeforeCliffOptions,
  type HookWindowBeforeCliffReport,
} from './hook-window-before-cliff-gate';

import {
  evaluateColdOpenReaction,
  type ColdOpenReactionOptions,
  type ColdOpenReactionReport,
} from './cold-open-reaction-gate';
import {
  evaluateCliffTailHookHard,
  type CliffTailHookHardOptions,
  type CliffTailHookHardReport,
} from './cliff-tail-hook-hard-gate';
import {
  evaluateSetupMidTurn,
  type SetupMidTurnOptions,
  type SetupMidTurnReport,
} from './setup-mid-turn-gate';
import {
  evaluateColdOpenMidTurn,
  type ColdOpenMidTurnOptions,
  type ColdOpenMidTurnReport,
} from './cold-open-mid-turn-gate';
import {
  evaluateCliffTailReaction,
  type CliffTailReactionOptions,
  type CliffTailReactionReport,
} from './cliff-tail-reaction-gate';
import {
  evaluateMidHookReaction,
  type MidHookReactionOptions,
  type MidHookReactionReport,
} from './mid-hook-reaction-gate';
import {
  evaluateColdOpenCliffTail,
  type ColdOpenCliffTailOptions,
  type ColdOpenCliffTailReport,
} from './cold-open-cliff-tail-gate';
import {
  evaluateHookWindowMidTurn,
  type HookWindowMidTurnOptions,
  type HookWindowMidTurnReport,
} from './hook-window-mid-turn-gate';
import {
  evaluateMidHookCliffTail,
  type MidHookCliffTailOptions,
  type MidHookCliffTailReport,
} from './mid-hook-cliff-tail-gate';
import {
  evaluateHookWindowCliffTail,
  type HookWindowCliffTailOptions,
  type HookWindowCliffTailReport,
} from './hook-window-cliff-tail-gate';
import {
  evaluateMidTurnCliffTail,
  type MidTurnCliffTailOptions,
  type MidTurnCliffTailReport,
} from './mid-turn-cliff-tail-gate';
import {
  evaluateColdCloseMidHook,
  type ColdCloseMidHookOptions,
  type ColdCloseMidHookReport,
} from './cold-close-mid-hook-gate';
import {
  evaluateColdCloseHookWindow,
  type ColdCloseHookWindowOptions,
  type ColdCloseHookWindowReport,
} from './cold-close-hook-window-gate';
import {
  evaluateReactionCliffTail,
  type ReactionCliffTailOptions,
  type ReactionCliffTailReport,
} from './reaction-cliff-tail-gate';
import {
  evaluateMidTurnColdClose,
  type MidTurnColdCloseOptions,
  type MidTurnColdCloseReport,
} from './mid-turn-cold-close-gate';
import {
  evaluateColdCloseMidTurn,
  type ColdCloseMidTurnOptions,
  type ColdCloseMidTurnReport,
} from './cold-close-mid-turn-gate';
import {
  evaluateHookWindowColdClose,
  type HookWindowColdCloseOptions,
  type HookWindowColdCloseReport,
} from './hook-window-cold-close-gate';
import {
  evaluateCliffTailMidHook,
  type CliffTailMidHookOptions,
  type CliffTailMidHookReport,
} from './cliff-tail-mid-hook-gate';
import {
  evaluateColdCloseReaction,
  type ColdCloseReactionOptions,
  type ColdCloseReactionReport,
} from './cold-close-reaction-gate';
import {
  evaluateHookWindowMidHook,
  type HookWindowMidHookOptions,
  type HookWindowMidHookReport,
} from './hook-window-mid-hook-gate';
import {
  evaluateCliffTailHookWindow,
  type CliffTailHookWindowOptions,
  type CliffTailHookWindowReport,
} from './cliff-tail-hook-window-gate';

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
  'coldOpenMidHook',
  'dialogueBeforeCliffBan',
  'setupMidCap',
  'hookKindMixColdOpen',
  'dialogueAfterReversalBan',
  'midTurnSetupCap',
  'coldOpenDetailHook',
  'cliffTailDialogueBan',
  'midHookSetupBan',
  'coldOpenHookWindow',
  'reactionReversalCliff',
  'coldCloseCliffTail',
  'midHookDialogueBan',
  'setupDialogueCap',
  'dialogueSetupBan',
  'midTurnHookWindow',
  'hookWindowReaction',
  'midTurnReaction',
  'reactionHookHard',
  'midTurnHookHard',
  'hookWindowBeforeCliff',
  'coldOpenReaction',
  'cliffTailHookHard',
  'setupMidTurn',
  'coldOpenMidTurn',
  'cliffTailReaction',
  'midHookReaction',
  'coldOpenCliffTail',
  'hookWindowMidTurn',
  'midHookCliffTail',
  'hookWindowCliffTail',
  'midTurnCliffTail',
  'coldCloseMidHook',
  'coldCloseHookWindow',
  'reactionCliffTail',
  'midTurnColdClose',
  'coldCloseMidTurn',
  'hookWindowColdClose',
  'cliffTailMidHook',
  'coldCloseReaction',
  'hookWindowMidHook',
  'cliffTailHookWindow',
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

const ColdOpenMidHookOptsSchema = z
  .object({
    coldOpenWindowSec: z.number().positive().optional(),
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

const DialogueBeforeCliffBanOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requireReaction: z.boolean().optional(),
    banDialogueBeforeCliff: z.boolean().optional(),
  })
  .strict();

const SetupMidCapOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
  })
  .strict();

const HookKindMixColdOpenOptsSchema = z
  .object({
    coldOpenWindowSec: z.number().positive().optional(),
    minDistinctKinds: z.number().int().positive().optional(),
    maxFaceRatio: z.number().positive().optional(),
    earlyHooksOnly: z.boolean().optional(),
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
  })
  .strict();

const DialogueAfterReversalBanOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requireReaction: z.boolean().optional(),
    reversalOnly: z.boolean().optional(),
    banDialogueAfterReversal: z.boolean().optional(),
    lookforwardSec: z.number().positive().optional(),
  })
  .strict();

const MidTurnSetupCapOptsSchema = z
  .object({
    minTurns: z.number().int().positive().optional(),
    maxMidSetupRatio: z.number().positive().optional(),
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
  })
  .strict();

const ColdOpenDetailHookOptsSchema = z
  .object({
    coldOpenWindowSec: z.number().positive().optional(),
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

const CliffTailDialogueBanOptsSchema = z
  .object({
    hardTailToleranceSec: z.number().positive().optional(),
    banDialogueBeforeCliff: z.boolean().optional(),
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requireReaction: z.boolean().optional(),
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
  })
  .strict();

const MidHookSetupBanOptsSchema = z
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

const ColdOpenHookWindowOptsSchema = z
  .object({
    hardHookWindowSec: z.number().positive().optional(),
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

const ReactionReversalCliffOptsSchema = z
  .object({
    reversalOnly: z.boolean().optional(),
    requirePriorReaction: z.boolean().optional(),
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requireReaction: z.boolean().optional(),
  })
  .strict();

const ColdCloseCliffTailOptsSchema = z
  .object({
    coldTailSec: z.number().positive().optional(),
    hardTailToleranceSec: z.number().positive().optional(),
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
  })
  .strict();

const MidHookDialogueBanOptsSchema = z
  .object({
    midHookByRatio: z.number().positive().optional(),
    minActionChars: z.number().int().positive().optional(),
    unlabeledSpeechMin: z.number().int().positive().optional(),
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    midWindowHook: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
  })
  .strict();

const SetupDialogueCapOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
    minActionChars: z.number().int().positive().optional(),
    unlabeledSpeechMin: z.number().int().positive().optional(),
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    midWindowHook: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
  })
  .strict();

const DialogueSetupBanOptsSchema = z
  .object({
    minActionChars: z.number().int().positive().optional(),
    unlabeledSpeechMin: z.number().int().positive().optional(),
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    midWindowHook: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
  })
  .strict();



const MidTurnHookWindowOptsSchema = z
  .object({
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    midWindowHook: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
    minTurns: z.number().int().positive().optional(),
    hardHookWindowSec: z.number().positive().optional(),
  })
  .strict();

const HookWindowReactionOptsSchema = z
  .object({
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
    hardHookWindowSec: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requireReaction: z.boolean().optional(),
  })
  .strict();

const MidTurnReactionOptsSchema = z
  .object({
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    midWindowHook: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
    minTurns: z.number().int().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requireReaction: z.boolean().optional(),
  })
  .strict();

const ReactionHookHardOptsSchema = z
  .object({
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
    hardHookWindowSec: z.number().positive().optional(),
    reversalOnly: z.boolean().optional(),
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requireReaction: z.boolean().optional(),
  })
  .strict();

const MidTurnHookHardOptsSchema = z
  .object({
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    midWindowHook: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
    minTurns: z.number().int().positive().optional(),
    minDistinctKinds: z.number().int().positive().optional(),
    maxFaceRatio: z.number().positive().optional(),
    earlyHooksOnly: z.boolean().optional(),
  })
  .strict();

const HookWindowBeforeCliffOptsSchema = z
  .object({
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
    hardHookWindowSec: z.number().positive().optional(),
    banDialogueBeforeCliff: z.boolean().optional(),
    lookbackSec: z.number().positive().optional(),
    requireReaction: z.boolean().optional(),
    reactionWindowSec: z.number().positive().optional(),
  })
  .strict();






const ColdOpenReactionOptsSchema = z
  .object({
    coldOpenWindowSec: z.number().positive().optional(),
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requireReaction: z.boolean().optional(),
  })
  .strict();

const CliffTailHookHardOptsSchema = z
  .object({
    hardTailToleranceSec: z.number().positive().optional(),
    hardHookWindowSec: z.number().positive().optional(),
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
  })
  .strict();

const SetupMidTurnOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
    minTurns: z.number().int().positive().optional(),
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    midWindowHook: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
  })
  .strict();

const ColdOpenMidTurnOptsSchema = z
  .object({
    coldOpenWindowSec: z.number().positive().optional(),
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

const CliffTailReactionOptsSchema = z
  .object({
    hardTailToleranceSec: z.number().positive().optional(),
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
    lookbackSec: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
    reactionWindowSec: z.number().positive().optional(),
  })
  .strict();

const MidHookReactionOptsSchema = z
  .object({
    midHookByRatio: z.number().positive().optional(),
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    midWindowHook: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requireReaction: z.boolean().optional(),
    reversalOnly: z.boolean().optional(),
  })
  .strict();


const ColdOpenCliffTailOptsSchema = z
  .object({
    coldOpenWindowSec: z.number().positive().optional(),
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

const HookWindowMidTurnOptsSchema = z
  .object({
    hardHookWindowSec: z.number().positive().optional(),
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

const MidHookCliffTailOptsSchema = z
  .object({
    midHookByRatio: z.number().positive().optional(),
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    midWindowHook: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
    hardTailToleranceSec: z.number().positive().optional(),
  })
  .strict();

const HookWindowCliffTailOptsSchema = z
  .object({
    hardHookWindowSec: z.number().positive().optional(),
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

const MidTurnCliffTailOptsSchema = z
  .object({
    minTurns: z.number().int().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
    hardTailToleranceSec: z.number().positive().optional(),
  })
  .strict();

const ColdCloseMidHookOptsSchema = z
  .object({
    coldTailSec: z.number().positive().optional(),
    midHookByRatio: z.number().positive().optional(),
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    midWindowHook: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
  })
  .strict();


const ColdCloseHookWindowOptsSchema = z
  .object({
    coldTailSec: z.number().positive().optional(),
    hardHookWindowSec: z.number().positive().optional(),
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    midWindowHook: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
  })
  .strict();

const ReactionCliffTailOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requireReaction: z.boolean().optional(),
    requirePriorReaction: z.boolean().optional(),
    hardTailToleranceSec: z.number().positive().optional(),
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    midWindowHook: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
  })
  .strict();

const MidTurnColdCloseOptsSchema = z
  .object({
    minTurns: z.number().int().positive().optional(),
    coldTailSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindowHook: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
  })
  .strict();

const ColdCloseMidTurnOptsSchema = z
  .object({
    coldTailSec: z.number().positive().optional(),
    minTurns: z.number().int().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindowHook: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
  })
  .strict();

const HookWindowColdCloseOptsSchema = z
  .object({
    hardHookWindowSec: z.number().positive().optional(),
    coldTailSec: z.number().positive().optional(),
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    midWindowHook: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
  })
  .strict();

const CliffTailMidHookOptsSchema = z
  .object({
    hardTailToleranceSec: z.number().positive().optional(),
    midHookByRatio: z.number().positive().optional(),
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    midWindowHook: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
  })
  .strict();

const ColdCloseReactionOptsSchema = z
  .object({
    coldTailSec: z.number().positive().optional(),
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requireReaction: z.boolean().optional(),
    reversalOnly: z.boolean().optional(),
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    midWindowHook: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
  })
  .strict();

const HookWindowMidHookOptsSchema = z
  .object({
    hardHookWindowSec: z.number().positive().optional(),
    midHookByRatio: z.number().positive().optional(),
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    midWindowHook: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
  })
  .strict();

const CliffTailHookWindowOptsSchema = z
  .object({
    hardTailToleranceSec: z.number().positive().optional(),
    hardHookWindowSec: z.number().positive().optional(),
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    midWindowHook: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
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
    coldOpenMidHook: ShotSpecDocSchema.optional(),
    dialogueBeforeCliffBan: ShotSpecDocSchema.optional(),
    setupMidCap: ShotSpecDocSchema.optional(),
    hookKindMixColdOpen: ShotSpecDocSchema.optional(),
    dialogueAfterReversalBan: ShotSpecDocSchema.optional(),
    midTurnSetupCap: ShotSpecDocSchema.optional(),
    coldOpenDetailHook: ShotSpecDocSchema.optional(),
    cliffTailDialogueBan: ShotSpecDocSchema.optional(),
    midHookSetupBan: ShotSpecDocSchema.optional(),
    coldOpenHookWindow: ShotSpecDocSchema.optional(),
    reactionReversalCliff: ShotSpecDocSchema.optional(),
    coldCloseCliffTail: ShotSpecDocSchema.optional(),
    midHookDialogueBan: ShotSpecDocSchema.optional(),
    setupDialogueCap: ShotSpecDocSchema.optional(),
    dialogueSetupBan: ShotSpecDocSchema.optional(),
    midTurnHookWindow: ShotSpecDocSchema.optional(),
    hookWindowReaction: ShotSpecDocSchema.optional(),
    midTurnReaction: ShotSpecDocSchema.optional(),
    reactionHookHard: ShotSpecDocSchema.optional(),
    midTurnHookHard: ShotSpecDocSchema.optional(),
    hookWindowBeforeCliff: ShotSpecDocSchema.optional(),
    coldOpenReaction: ShotSpecDocSchema.optional(),
    cliffTailHookHard: ShotSpecDocSchema.optional(),
    setupMidTurn: ShotSpecDocSchema.optional(),
    coldOpenMidTurn: ShotSpecDocSchema.optional(),
    cliffTailReaction: ShotSpecDocSchema.optional(),
    midHookReaction: ShotSpecDocSchema.optional(),
    coldOpenCliffTail: ShotSpecDocSchema.optional(),
    hookWindowMidTurn: ShotSpecDocSchema.optional(),
    midHookCliffTail: ShotSpecDocSchema.optional(),
    hookWindowCliffTail: ShotSpecDocSchema.optional(),
    midTurnCliffTail: ShotSpecDocSchema.optional(),
    coldCloseMidHook: ShotSpecDocSchema.optional(),
    coldCloseHookWindow: ShotSpecDocSchema.optional(),
    reactionCliffTail: ShotSpecDocSchema.optional(),
    midTurnColdClose: ShotSpecDocSchema.optional(),
    coldCloseMidTurn: ShotSpecDocSchema.optional(),
    hookWindowColdClose: ShotSpecDocSchema.optional(),
    cliffTailMidHook: ShotSpecDocSchema.optional(),
    coldCloseReaction: ShotSpecDocSchema.optional(),
    hookWindowMidHook: ShotSpecDocSchema.optional(),
    cliffTailHookWindow: ShotSpecDocSchema.optional(),
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
    coldOpenMidHookOpts: ColdOpenMidHookOptsSchema.optional(),
    dialogueBeforeCliffBanOpts: DialogueBeforeCliffBanOptsSchema.optional(),
    setupMidCapOpts: SetupMidCapOptsSchema.optional(),
    hookKindMixColdOpenOpts: HookKindMixColdOpenOptsSchema.optional(),
    dialogueAfterReversalBanOpts: DialogueAfterReversalBanOptsSchema.optional(),
    midTurnSetupCapOpts: MidTurnSetupCapOptsSchema.optional(),
    coldOpenDetailHookOpts: ColdOpenDetailHookOptsSchema.optional(),
    cliffTailDialogueBanOpts: CliffTailDialogueBanOptsSchema.optional(),
    midHookSetupBanOpts: MidHookSetupBanOptsSchema.optional(),
    coldOpenHookWindowOpts: ColdOpenHookWindowOptsSchema.optional(),
    reactionReversalCliffOpts: ReactionReversalCliffOptsSchema.optional(),
    coldCloseCliffTailOpts: ColdCloseCliffTailOptsSchema.optional(),
    midHookDialogueBanOpts: MidHookDialogueBanOptsSchema.optional(),
    setupDialogueCapOpts: SetupDialogueCapOptsSchema.optional(),
    dialogueSetupBanOpts: DialogueSetupBanOptsSchema.optional(),
    midTurnHookWindowOpts: MidTurnHookWindowOptsSchema.optional(),
    hookWindowReactionOpts: HookWindowReactionOptsSchema.optional(),
    midTurnReactionOpts: MidTurnReactionOptsSchema.optional(),
    reactionHookHardOpts: ReactionHookHardOptsSchema.optional(),
    midTurnHookHardOpts: MidTurnHookHardOptsSchema.optional(),
    hookWindowBeforeCliffOpts: HookWindowBeforeCliffOptsSchema.optional(),
    coldOpenReactionOpts: ColdOpenReactionOptsSchema.optional(),
    cliffTailHookHardOpts: CliffTailHookHardOptsSchema.optional(),
    setupMidTurnOpts: SetupMidTurnOptsSchema.optional(),
    coldOpenMidTurnOpts: ColdOpenMidTurnOptsSchema.optional(),
    cliffTailReactionOpts: CliffTailReactionOptsSchema.optional(),
    midHookReactionOpts: MidHookReactionOptsSchema.optional(),
    coldOpenCliffTailOpts: ColdOpenCliffTailOptsSchema.optional(),
    hookWindowMidTurnOpts: HookWindowMidTurnOptsSchema.optional(),
    midHookCliffTailOpts: MidHookCliffTailOptsSchema.optional(),
    hookWindowCliffTailOpts: HookWindowCliffTailOptsSchema.optional(),
    midTurnCliffTailOpts: MidTurnCliffTailOptsSchema.optional(),
    coldCloseMidHookOpts: ColdCloseMidHookOptsSchema.optional(),
    coldCloseHookWindowOpts: ColdCloseHookWindowOptsSchema.optional(),
    reactionCliffTailOpts: ReactionCliffTailOptsSchema.optional(),
    midTurnColdCloseOpts: MidTurnColdCloseOptsSchema.optional(),
    coldCloseMidTurnOpts: ColdCloseMidTurnOptsSchema.optional(),
    hookWindowColdCloseOpts: HookWindowColdCloseOptsSchema.optional(),
    cliffTailMidHookOpts: CliffTailMidHookOptsSchema.optional(),
    coldCloseReactionOpts: ColdCloseReactionOptsSchema.optional(),
    hookWindowMidHookOpts: HookWindowMidHookOptsSchema.optional(),
    cliffTailHookWindowOpts: CliffTailHookWindowOptsSchema.optional(),
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
  | ReactionBeforeCliffReport
  | ColdOpenMidHookReport
  | DialogueBeforeCliffBanReport
  | SetupMidCapReport
  | HookKindMixColdOpenReport
  | DialogueAfterReversalBanReport
  | MidTurnSetupCapReport
  | ColdOpenDetailHookReport
  | CliffTailDialogueBanReport
  | MidHookSetupBanReport
  | ColdOpenHookWindowReport
  | ReactionReversalCliffReport
  | ColdCloseCliffTailReport
  | MidHookDialogueBanReport
  | SetupDialogueCapReport
  | DialogueSetupBanReport
  | MidTurnHookWindowReport
  | HookWindowReactionReport
  | MidTurnReactionReport
  | ReactionHookHardReport
  | MidTurnHookHardReport
  | HookWindowBeforeCliffReport
  | ColdOpenReactionReport
  | CliffTailHookHardReport
  | SetupMidTurnReport
  | ColdOpenMidTurnReport
  | CliffTailReactionReport
  | MidHookReactionReport
  | ColdOpenCliffTailReport
  | HookWindowMidTurnReport
  | MidHookCliffTailReport
  | HookWindowCliffTailReport
  | MidTurnCliffTailReport
  | ColdCloseMidHookReport
  | ColdCloseHookWindowReport
  | ReactionCliffTailReport
  | MidTurnColdCloseReport
  | ColdCloseMidTurnReport
  | HookWindowColdCloseReport
  | CliffTailMidHookReport
  | ColdCloseReactionReport
  | HookWindowMidHookReport
  | CliffTailHookWindowReport;

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
    coldOpenMidHookOpts,
    dialogueBeforeCliffBanOpts,
    setupMidCapOpts,
    hookKindMixColdOpenOpts,
    dialogueAfterReversalBanOpts,
    midTurnSetupCapOpts,
    coldOpenDetailHookOpts,
    cliffTailDialogueBanOpts,
    midHookSetupBanOpts,
    coldOpenHookWindowOpts,
    reactionReversalCliffOpts,
    coldCloseCliffTailOpts,
    midHookDialogueBanOpts,
    setupDialogueCapOpts,
    dialogueSetupBanOpts,
    midTurnHookWindowOpts,
    hookWindowReactionOpts,
    midTurnReactionOpts,
    reactionHookHardOpts,
    midTurnHookHardOpts,
    hookWindowBeforeCliffOpts,
    coldOpenReactionOpts,
    cliffTailHookHardOpts,
    setupMidTurnOpts,
    coldOpenMidTurnOpts,
    cliffTailReactionOpts,
    midHookReactionOpts,
    coldOpenCliffTailOpts,
    hookWindowMidTurnOpts,
    midHookCliffTailOpts,
    hookWindowCliffTailOpts,
    midTurnCliffTailOpts,
    coldCloseMidHookOpts,
    coldCloseHookWindowOpts,
    reactionCliffTailOpts,
    midTurnColdCloseOpts,
    coldCloseMidTurnOpts,
    hookWindowColdCloseOpts,
    cliffTailMidHookOpts,
    coldCloseReactionOpts,
    hookWindowMidHookOpts,
    cliffTailHookWindowOpts,
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
  if (sections.coldOpenMidHook !== undefined) {
    run(
      'coldOpenMidHook',
      evaluateColdOpenMidHook(
        sections.coldOpenMidHook,
        (coldOpenMidHookOpts ?? {}) as ColdOpenMidHookOptions,
      ),
    );
  }
  if (sections.dialogueBeforeCliffBan !== undefined) {
    run(
      'dialogueBeforeCliffBan',
      evaluateDialogueBeforeCliffBan(
        sections.dialogueBeforeCliffBan,
        (dialogueBeforeCliffBanOpts ?? {}) as DialogueBeforeCliffBanOptions,
      ),
    );
  }
  if (sections.setupMidCap !== undefined) {
    run(
      'setupMidCap',
      evaluateSetupMidCap(
        sections.setupMidCap,
        (setupMidCapOpts ?? {}) as SetupMidCapOptions,
      ),
    );
  }
  if (sections.hookKindMixColdOpen !== undefined) {
    run(
      'hookKindMixColdOpen',
      evaluateHookKindMixColdOpen(
        sections.hookKindMixColdOpen,
        (hookKindMixColdOpenOpts ?? {}) as HookKindMixColdOpenOptions,
      ),
    );
  }
  if (sections.dialogueAfterReversalBan !== undefined) {
    run(
      'dialogueAfterReversalBan',
      evaluateDialogueAfterReversalBan(
        sections.dialogueAfterReversalBan,
        (dialogueAfterReversalBanOpts ?? {}) as DialogueAfterReversalBanOptions,
      ),
    );
  }
  if (sections.midTurnSetupCap !== undefined) {
    run(
      'midTurnSetupCap',
      evaluateMidTurnSetupCap(
        sections.midTurnSetupCap,
        (midTurnSetupCapOpts ?? {}) as MidTurnSetupCapOptions,
      ),
    );
  }
  if (sections.coldOpenDetailHook !== undefined) {
    run(
      'coldOpenDetailHook',
      evaluateColdOpenDetailHook(
        sections.coldOpenDetailHook,
        (coldOpenDetailHookOpts ?? {}) as ColdOpenDetailHookOptions,
      ),
    );
  }
  if (sections.cliffTailDialogueBan !== undefined) {
    run(
      'cliffTailDialogueBan',
      evaluateCliffTailDialogueBan(
        sections.cliffTailDialogueBan,
        (cliffTailDialogueBanOpts ?? {}) as CliffTailDialogueBanOptions,
      ),
    );
  }
  if (sections.midHookSetupBan !== undefined) {
    run(
      'midHookSetupBan',
      evaluateMidHookSetupBan(
        sections.midHookSetupBan,
        (midHookSetupBanOpts ?? {}) as MidHookSetupBanOptions,
      ),
    );
  }
  if (sections.coldOpenHookWindow !== undefined) {
    run(
      'coldOpenHookWindow',
      evaluateColdOpenHookWindow(
        sections.coldOpenHookWindow,
        (coldOpenHookWindowOpts ?? {}) as ColdOpenHookWindowOptions,
      ),
    );
  }
  if (sections.reactionReversalCliff !== undefined) {
    run(
      'reactionReversalCliff',
      evaluateReactionReversalCliff(
        sections.reactionReversalCliff,
        (reactionReversalCliffOpts ?? {}) as ReactionReversalCliffOptions,
      ),
    );
  }
  if (sections.coldCloseCliffTail !== undefined) {
    run(
      'coldCloseCliffTail',
      evaluateColdCloseCliffTail(
        sections.coldCloseCliffTail,
        (coldCloseCliffTailOpts ?? {}) as ColdCloseCliffTailOptions,
      ),
    );
  }
  if (sections.midHookDialogueBan !== undefined) {
    run(
      'midHookDialogueBan',
      evaluateMidHookDialogueBan(
        sections.midHookDialogueBan,
        (midHookDialogueBanOpts ?? {}) as MidHookDialogueBanOptions,
      ),
    );
  }
  if (sections.setupDialogueCap !== undefined) {
    run(
      'setupDialogueCap',
      evaluateSetupDialogueCap(
        sections.setupDialogueCap,
        (setupDialogueCapOpts ?? {}) as SetupDialogueCapOptions,
      ),
    );
  }
  if (sections.dialogueSetupBan !== undefined) {
    run(
      'dialogueSetupBan',
      evaluateDialogueSetupBan(
        sections.dialogueSetupBan,
        (dialogueSetupBanOpts ?? {}) as DialogueSetupBanOptions,
      ),
    );
  }
  if (sections.midTurnHookWindow !== undefined) {
    run(
      'midTurnHookWindow',
      evaluateMidTurnHookWindow(
        sections.midTurnHookWindow,
        (midTurnHookWindowOpts ?? {}) as MidTurnHookWindowOptions,
      ),
    );
  }
  if (sections.hookWindowReaction !== undefined) {
    run(
      'hookWindowReaction',
      evaluateHookWindowReaction(
        sections.hookWindowReaction,
        (hookWindowReactionOpts ?? {}) as HookWindowReactionOptions,
      ),
    );
  }
  if (sections.midTurnReaction !== undefined) {
    run(
      'midTurnReaction',
      evaluateMidTurnReaction(
        sections.midTurnReaction,
        (midTurnReactionOpts ?? {}) as MidTurnReactionOptions,
      ),
    );
  }
  if (sections.reactionHookHard !== undefined) {
    run(
      'reactionHookHard',
      evaluateReactionHookHard(
        sections.reactionHookHard,
        (reactionHookHardOpts ?? {}) as ReactionHookHardOptions,
      ),
    );
  }
  if (sections.midTurnHookHard !== undefined) {
    run(
      'midTurnHookHard',
      evaluateMidTurnHookHard(
        sections.midTurnHookHard,
        (midTurnHookHardOpts ?? {}) as MidTurnHookHardOptions,
      ),
    );
  }
  if (sections.hookWindowBeforeCliff !== undefined) {
    run(
      'hookWindowBeforeCliff',
      evaluateHookWindowBeforeCliff(
        sections.hookWindowBeforeCliff,
        (hookWindowBeforeCliffOpts ?? {}) as HookWindowBeforeCliffOptions,
      ),
    );
  }
  if (sections.coldOpenReaction !== undefined) {
    run(
      'coldOpenReaction',
      evaluateColdOpenReaction(
        sections.coldOpenReaction,
        (coldOpenReactionOpts ?? {}) as ColdOpenReactionOptions,
      ),
    );
  }
  if (sections.cliffTailHookHard !== undefined) {
    run(
      'cliffTailHookHard',
      evaluateCliffTailHookHard(
        sections.cliffTailHookHard,
        (cliffTailHookHardOpts ?? {}) as CliffTailHookHardOptions,
      ),
    );
  }
  if (sections.setupMidTurn !== undefined) {
    run(
      'setupMidTurn',
      evaluateSetupMidTurn(
        sections.setupMidTurn,
        (setupMidTurnOpts ?? {}) as SetupMidTurnOptions,
      ),
    );
  }
  if (sections.coldOpenMidTurn !== undefined) {
    run(
      'coldOpenMidTurn',
      evaluateColdOpenMidTurn(
        sections.coldOpenMidTurn,
        (coldOpenMidTurnOpts ?? {}) as ColdOpenMidTurnOptions,
      ),
    );
  }
  if (sections.cliffTailReaction !== undefined) {
    run(
      'cliffTailReaction',
      evaluateCliffTailReaction(
        sections.cliffTailReaction,
        (cliffTailReactionOpts ?? {}) as CliffTailReactionOptions,
      ),
    );
  }
  if (sections.midHookReaction !== undefined) {
    run(
      'midHookReaction',
      evaluateMidHookReaction(
        sections.midHookReaction,
        (midHookReactionOpts ?? {}) as MidHookReactionOptions,
      ),
    );
  }
  if (sections.coldOpenCliffTail !== undefined) {
    run(
      'coldOpenCliffTail',
      evaluateColdOpenCliffTail(
        sections.coldOpenCliffTail,
        (coldOpenCliffTailOpts ?? {}) as ColdOpenCliffTailOptions,
      ),
    );
  }
  if (sections.hookWindowMidTurn !== undefined) {
    run(
      'hookWindowMidTurn',
      evaluateHookWindowMidTurn(
        sections.hookWindowMidTurn,
        (hookWindowMidTurnOpts ?? {}) as HookWindowMidTurnOptions,
      ),
    );
  }
  if (sections.midHookCliffTail !== undefined) {
    run(
      'midHookCliffTail',
      evaluateMidHookCliffTail(
        sections.midHookCliffTail,
        (midHookCliffTailOpts ?? {}) as MidHookCliffTailOptions,
      ),
    );
  }
  if (sections.hookWindowCliffTail !== undefined) {
    run(
      'hookWindowCliffTail',
      evaluateHookWindowCliffTail(
        sections.hookWindowCliffTail,
        (hookWindowCliffTailOpts ?? {}) as HookWindowCliffTailOptions,
      ),
    );
  }
  if (sections.midTurnCliffTail !== undefined) {
    run(
      'midTurnCliffTail',
      evaluateMidTurnCliffTail(
        sections.midTurnCliffTail,
        (midTurnCliffTailOpts ?? {}) as MidTurnCliffTailOptions,
      ),
    );
  }
  if (sections.coldCloseMidHook !== undefined) {
    run(
      'coldCloseMidHook',
      evaluateColdCloseMidHook(
        sections.coldCloseMidHook,
        (coldCloseMidHookOpts ?? {}) as ColdCloseMidHookOptions,
      ),
    );
  }
  if (sections.coldCloseHookWindow !== undefined) {
    run(
      'coldCloseHookWindow',
      evaluateColdCloseHookWindow(
        sections.coldCloseHookWindow,
        (coldCloseHookWindowOpts ?? {}) as ColdCloseHookWindowOptions,
      ),
    );
  }
  if (sections.reactionCliffTail !== undefined) {
    run(
      'reactionCliffTail',
      evaluateReactionCliffTail(
        sections.reactionCliffTail,
        (reactionCliffTailOpts ?? {}) as ReactionCliffTailOptions,
      ),
    );
  }
  if (sections.midTurnColdClose !== undefined) {
    run(
      'midTurnColdClose',
      evaluateMidTurnColdClose(
        sections.midTurnColdClose,
        (midTurnColdCloseOpts ?? {}) as MidTurnColdCloseOptions,
      ),
    );
  }
  if (sections.coldCloseMidTurn !== undefined) {
    run(
      'coldCloseMidTurn',
      evaluateColdCloseMidTurn(
        sections.coldCloseMidTurn,
        (coldCloseMidTurnOpts ?? {}) as ColdCloseMidTurnOptions,
      ),
    );
  }
  if (sections.hookWindowColdClose !== undefined) {
    run(
      'hookWindowColdClose',
      evaluateHookWindowColdClose(
        sections.hookWindowColdClose,
        (hookWindowColdCloseOpts ?? {}) as HookWindowColdCloseOptions,
      ),
    );
  }
  if (sections.cliffTailMidHook !== undefined) {
    run(
      'cliffTailMidHook',
      evaluateCliffTailMidHook(
        sections.cliffTailMidHook,
        (cliffTailMidHookOpts ?? {}) as CliffTailMidHookOptions,
      ),
    );
  }
  if (sections.coldCloseReaction !== undefined) {
    run(
      'coldCloseReaction',
      evaluateColdCloseReaction(
        sections.coldCloseReaction,
        (coldCloseReactionOpts ?? {}) as ColdCloseReactionOptions,
      ),
    );
  }
  if (sections.hookWindowMidHook !== undefined) {
    run(
      'hookWindowMidHook',
      evaluateHookWindowMidHook(
        sections.hookWindowMidHook,
        (hookWindowMidHookOpts ?? {}) as HookWindowMidHookOptions,
      ),
    );
  }
  if (sections.cliffTailHookWindow !== undefined) {
    run(
      'cliffTailHookWindow',
      evaluateCliffTailHookWindow(
        sections.cliffTailHookWindow,
        (cliffTailHookWindowOpts ?? {}) as CliffTailHookWindowOptions,
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
