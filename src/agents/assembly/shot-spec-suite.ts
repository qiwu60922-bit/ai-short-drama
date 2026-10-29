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
 *   · cliffTailColdClose · midHookColdClose · reactionHookWindow
 *   · reactionColdClose · reactionMidHook · cliffTailMidTurn
 *   · coldOpenColdClose · detailHookColdClose · detailHookReaction
 *   · detailHookMidHook · detailHookCliffTail · coldCloseDetailHook
 *   · midHookDetailHook · cliffTailDetailHook · reactionDetailHook
 *   · detailHookColdOpen · midHookColdOpen · cliffTailColdOpen
 *   · reactionColdOpen · hookWindowColdOpen · midTurnColdOpen
 *   · coldCloseColdOpen · midTurnDetailHook · hookWindowDetailHook
 *   · reactionMidTurn · midTurnMidHook · midHookHookWindow
 *   · midHookMidTurn · detailHookMidTurn · detailHookHookWindow
 *   · midHookHookHard · detailHookHookHard · hookWindowHookHard
 *   · coldOpenHookHard · coldCloseHookHard · hookHardMidHook
 *   · hookHardColdOpen · hookHardColdClose · hookHardDetailHook
 *   · hookHardHookWindow · hookHardMidTurn · hookHardReaction
 *   · hookHardCliffTail · hookHardSetupCap · hookHardSetupRatio
 *   · hookHardReactionWindow · hookHardDetailCap · hookHardMidRatio
 *   · hookHardDialogueCap · hookHardSetupBan · hookHardDetailRatio
 *   · hookHardReactionCap · hookHardMidCap · hookHardDialogueRatio
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

import {
  evaluateCliffTailColdClose,
  type CliffTailColdCloseOptions,
  type CliffTailColdCloseReport,
} from './cliff-tail-cold-close-gate';
import {
  evaluateMidHookColdClose,
  type MidHookColdCloseOptions,
  type MidHookColdCloseReport,
} from './mid-hook-cold-close-gate';
import {
  evaluateReactionHookWindow,
  type ReactionHookWindowOptions,
  type ReactionHookWindowReport,
} from './reaction-hook-window-gate';

import {
  evaluateReactionColdClose,
  type ReactionColdCloseOptions,
  type ReactionColdCloseReport,
} from './reaction-cold-close-gate';
import {
  evaluateReactionMidHook,
  type ReactionMidHookOptions,
  type ReactionMidHookReport,
} from './reaction-mid-hook-gate';
import {
  evaluateCliffTailMidTurn,
  type CliffTailMidTurnOptions,
  type CliffTailMidTurnReport,
} from './cliff-tail-mid-turn-gate';

import {
  evaluateColdOpenColdClose,
  type ColdOpenColdCloseOptions,
  type ColdOpenColdCloseReport,
} from './cold-open-cold-close-gate';
import {
  evaluateDetailHookColdClose,
  type DetailHookColdCloseOptions,
  type DetailHookColdCloseReport,
} from './detail-hook-cold-close-gate';
import {
  evaluateDetailHookReaction,
  type DetailHookReactionOptions,
  type DetailHookReactionReport,
} from './detail-hook-reaction-gate';
import {
  evaluateDetailHookMidHook,
  type DetailHookMidHookOptions,
  type DetailHookMidHookReport,
} from './detail-hook-mid-hook-gate';
import {
  evaluateDetailHookCliffTail,
  type DetailHookCliffTailOptions,
  type DetailHookCliffTailReport,
} from './detail-hook-cliff-tail-gate';
import {
  evaluateColdCloseDetailHook,
  type ColdCloseDetailHookOptions,
  type ColdCloseDetailHookReport,
} from './cold-close-detail-hook-gate';
import {
  evaluateMidHookDetailHook,
  type MidHookDetailHookOptions,
  type MidHookDetailHookReport,
} from './mid-hook-detail-hook-gate';
import {
  evaluateCliffTailDetailHook,
  type CliffTailDetailHookOptions,
  type CliffTailDetailHookReport,
} from './cliff-tail-detail-hook-gate';
import {
  evaluateReactionDetailHook,
  type ReactionDetailHookOptions,
  type ReactionDetailHookReport,
} from './reaction-detail-hook-gate';
import {
  evaluateDetailHookColdOpen,
  type DetailHookColdOpenOptions,
  type DetailHookColdOpenReport,
} from './detail-hook-cold-open-gate';
import {
  evaluateMidHookColdOpen,
  type MidHookColdOpenOptions,
  type MidHookColdOpenReport,
} from './mid-hook-cold-open-gate';
import {
  evaluateCliffTailColdOpen,
  type CliffTailColdOpenOptions,
  type CliffTailColdOpenReport,
} from './cliff-tail-cold-open-gate';
import {
  evaluateReactionColdOpen,
  type ReactionColdOpenOptions,
  type ReactionColdOpenReport,
} from './reaction-cold-open-gate';
import {
  evaluateHookWindowColdOpen,
  type HookWindowColdOpenOptions,
  type HookWindowColdOpenReport,
} from './hook-window-cold-open-gate';
import {
  evaluateMidTurnColdOpen,
  type MidTurnColdOpenOptions,
  type MidTurnColdOpenReport,
} from './mid-turn-cold-open-gate';

import {
  evaluateColdCloseColdOpen,
  type ColdCloseColdOpenOptions,
  type ColdCloseColdOpenReport,
} from './cold-close-cold-open-gate';
import {
  evaluateMidTurnDetailHook,
  type MidTurnDetailHookOptions,
  type MidTurnDetailHookReport,
} from './mid-turn-detail-hook-gate';
import {
  evaluateHookWindowDetailHook,
  type HookWindowDetailHookOptions,
  type HookWindowDetailHookReport,
} from './hook-window-detail-hook-gate';

import {
  evaluateReactionMidTurn,
  type ReactionMidTurnOptions,
  type ReactionMidTurnReport,
} from './reaction-mid-turn-gate';
import {
  evaluateMidTurnMidHook,
  type MidTurnMidHookOptions,
  type MidTurnMidHookReport,
} from './mid-turn-mid-hook-gate';
import {
  evaluateMidHookHookWindow,
  type MidHookHookWindowOptions,
  type MidHookHookWindowReport,
} from './mid-hook-hook-window-gate';

import {
  evaluateMidHookMidTurn,
  type MidHookMidTurnOptions,
  type MidHookMidTurnReport,
} from './mid-hook-mid-turn-gate';
import {
  evaluateDetailHookMidTurn,
  type DetailHookMidTurnOptions,
  type DetailHookMidTurnReport,
} from './detail-hook-mid-turn-gate';
import {
  evaluateDetailHookHookWindow,
  type DetailHookHookWindowOptions,
  type DetailHookHookWindowReport,
} from './detail-hook-hook-window-gate';

import {
  evaluateMidHookHookHard,
  type MidHookHookHardOptions,
  type MidHookHookHardReport,
} from './mid-hook-hook-hard-gate';
import {
  evaluateDetailHookHookHard,
  type DetailHookHookHardOptions,
  type DetailHookHookHardReport,
} from './detail-hook-hook-hard-gate';
import {
  evaluateHookWindowHookHard,
  type HookWindowHookHardOptions,
  type HookWindowHookHardReport,
} from './hook-window-hook-hard-gate';
import {
  evaluateColdOpenHookHard,
  type ColdOpenHookHardOptions,
  type ColdOpenHookHardReport,
} from './cold-open-hook-hard-gate';
import {
  evaluateColdCloseHookHard,
  type ColdCloseHookHardOptions,
  type ColdCloseHookHardReport,
} from './cold-close-hook-hard-gate';
import {
  evaluateHookHardMidHook,
  type HookHardMidHookOptions,
  type HookHardMidHookReport,
} from './hook-hard-mid-hook-gate';
import {
  evaluateHookHardColdOpen,
  type HookHardColdOpenOptions,
  type HookHardColdOpenReport,
} from './hook-hard-cold-open-gate';
import {
  evaluateHookHardColdClose,
  type HookHardColdCloseOptions,
  type HookHardColdCloseReport,
} from './hook-hard-cold-close-gate';
import {
  evaluateHookHardDetailHook,
  type HookHardDetailHookOptions,
  type HookHardDetailHookReport,
} from './hook-hard-detail-hook-gate';
import {
  evaluateHookHardHookWindow,
  type HookHardHookWindowOptions,
  type HookHardHookWindowReport,
} from './hook-hard-hook-window-gate';
import {
  evaluateHookHardMidTurn,
  type HookHardMidTurnOptions,
  type HookHardMidTurnReport,
} from './hook-hard-mid-turn-gate';
import {
  evaluateHookHardReaction,
  type HookHardReactionOptions,
  type HookHardReactionReport,
} from './hook-hard-reaction-gate';

import {
  evaluateHookHardCliffTail,
  type HookHardCliffTailOptions,
  type HookHardCliffTailReport,
} from './hook-hard-cliff-tail-gate';
import {
  evaluateHookHardSetupCap,
  type HookHardSetupCapOptions,
  type HookHardSetupCapReport,
} from './hook-hard-setup-cap-gate';
import {
  evaluateHookHardSetupRatio,
  type HookHardSetupRatioOptions,
  type HookHardSetupRatioReport,
} from './hook-hard-setup-ratio-gate';

import {
  evaluateHookHardReactionWindow,
  type HookHardReactionWindowOptions,
  type HookHardReactionWindowReport,
} from './hook-hard-reaction-window-gate';
import {
  evaluateHookHardDetailCap,
  type HookHardDetailCapOptions,
  type HookHardDetailCapReport,
} from './hook-hard-detail-cap-gate';
import {
  evaluateHookHardMidRatio,
  type HookHardMidRatioOptions,
  type HookHardMidRatioReport,
} from './hook-hard-mid-ratio-gate';


import {
  evaluateHookHardDialogueCap,
  type HookHardDialogueCapOptions,
  type HookHardDialogueCapReport,
} from './hook-hard-dialogue-cap-gate';
import {
  evaluateHookHardSetupBan,
  type HookHardSetupBanOptions,
  type HookHardSetupBanReport,
} from './hook-hard-setup-ban-gate';
import {
  evaluateHookHardDetailRatio,
  type HookHardDetailRatioOptions,
  type HookHardDetailRatioReport,
} from './hook-hard-detail-ratio-gate';

import {
  evaluateHookHardReactionCap,
  type HookHardReactionCapOptions,
  type HookHardReactionCapReport,
} from './hook-hard-reaction-cap-gate';
import {
  evaluateHookHardMidCap,
  type HookHardMidCapOptions,
  type HookHardMidCapReport,
} from './hook-hard-mid-cap-gate';
import {
  evaluateHookHardDialogueRatio,
  type HookHardDialogueRatioOptions,
  type HookHardDialogueRatioReport,
} from './hook-hard-dialogue-ratio-gate';




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
  'cliffTailColdClose',
  'midHookColdClose',
  'reactionHookWindow',
  'reactionColdClose',
  'reactionMidHook',
  'cliffTailMidTurn',
  'coldOpenColdClose',
  'detailHookColdClose',
  'detailHookReaction',
  'detailHookMidHook',
  'detailHookCliffTail',
  'coldCloseDetailHook',
  'midHookDetailHook',
  'cliffTailDetailHook',
  'reactionDetailHook',
  'detailHookColdOpen',
  'midHookColdOpen',
  'cliffTailColdOpen',
  'reactionColdOpen',
  'hookWindowColdOpen',
  'midTurnColdOpen',
  'coldCloseColdOpen',
  'midTurnDetailHook',
  'hookWindowDetailHook',
  'reactionMidTurn',
  'midTurnMidHook',
  'midHookHookWindow',
  'midHookMidTurn',
  'detailHookMidTurn',
  'detailHookHookWindow',
  'midHookHookHard',
  'detailHookHookHard',
  'hookWindowHookHard',
  'coldOpenHookHard',
  'coldCloseHookHard',
  'hookHardMidHook',
  'hookHardColdOpen',
  'hookHardColdClose',
  'hookHardDetailHook',
  'hookHardHookWindow',
  'hookHardMidTurn',
  'hookHardReaction',
  'hookHardCliffTail',
  'hookHardSetupCap',
  'hookHardSetupRatio',
  'hookHardReactionWindow',
  'hookHardDetailCap',
  'hookHardMidRatio',
  'hookHardDialogueCap',
  'hookHardSetupBan',
  'hookHardDetailRatio',
  'hookHardReactionCap',
  'hookHardMidCap',
  'hookHardDialogueRatio',
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

const CliffTailColdCloseOptsSchema = z
  .object({
    hardTailToleranceSec: z.number().positive().optional(),
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

const MidHookColdCloseOptsSchema = z
  .object({
    midHookByRatio: z.number().positive().optional(),
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

const ReactionHookWindowOptsSchema = z
  .object({
    hardHookWindowSec: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requireReaction: z.boolean().optional(),
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

const ReactionColdCloseOptsSchema = z
  .object({
    coldTailSec: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requireReaction: z.boolean().optional(),
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

const ReactionMidHookOptsSchema = z
  .object({
    midHookByRatio: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requireReaction: z.boolean().optional(),
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

const CliffTailMidTurnOptsSchema = z
  .object({
    hardTailToleranceSec: z.number().positive().optional(),
    minTurns: z.number().positive().optional(),
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




const ColdOpenColdCloseOptsSchema = z
  .object({
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

const DetailHookColdCloseOptsSchema = z
  .object({
    coldTailSec: z.number().positive().optional(),
    requireDetailCu: z.boolean().optional(),
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

const DetailHookReactionOptsSchema = z
  .object({
    requireDetailCu: z.boolean().optional(),
    requirePriorReaction: z.boolean().optional(),
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requireReaction: z.boolean().optional(),
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

const DetailHookMidHookOptsSchema = z
  .object({
    requireDetailCu: z.boolean().optional(),
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

const DetailHookCliffTailOptsSchema = z
  .object({
    requireDetailCu: z.boolean().optional(),
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

const ColdCloseDetailHookOptsSchema = z
  .object({
    coldTailSec: z.number().positive().optional(),
    requireDetailCu: z.boolean().optional(),
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

const MidHookDetailHookOptsSchema = z
  .object({
    requireDetailCu: z.boolean().optional(),
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

const CliffTailDetailHookOptsSchema = z
  .object({
    requireDetailCu: z.boolean().optional(),
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

const ReactionDetailHookOptsSchema = z
  .object({
    requireDetailCu: z.boolean().optional(),
    requirePriorReaction: z.boolean().optional(),
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requireReaction: z.boolean().optional(),
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

const DetailHookColdOpenOptsSchema = z
  .object({
    requireDetailCu: z.boolean().optional(),
    coldOpenWindowSec: z.number().positive().optional(),
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

const MidHookColdOpenOptsSchema = z
  .object({
    midHookByRatio: z.number().positive().optional(),
    coldOpenWindowSec: z.number().positive().optional(),
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

const CliffTailColdOpenOptsSchema = z
  .object({
    hardTailToleranceSec: z.number().positive().optional(),
    coldOpenWindowSec: z.number().positive().optional(),
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

const ReactionColdOpenOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requireReaction: z.boolean().optional(),
    reversalOnly: z.boolean().optional(),
    coldOpenWindowSec: z.number().positive().optional(),
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

const HookWindowColdOpenOptsSchema = z
  .object({
    hardHookWindowSec: z.number().positive().optional(),
    coldOpenWindowSec: z.number().positive().optional(),
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

const MidTurnColdOpenOptsSchema = z
  .object({
    minTurns: z.number().int().positive().optional(),
    coldOpenWindowSec: z.number().positive().optional(),
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

const ColdCloseColdOpenOptsSchema = z
  .object({
    coldTailSec: z.number().positive().optional(),
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

const MidTurnDetailHookOptsSchema = z
  .object({
    minTurns: z.number().int().positive().optional(),
    requireDetailCu: z.boolean().optional(),
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

const HookWindowDetailHookOptsSchema = z
  .object({
    hardHookWindowSec: z.number().positive().optional(),
    requireDetailCu: z.boolean().optional(),
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

const ReactionMidTurnOptsSchema = z
  .object({
    minTurns: z.number().int().positive().optional(),
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
  })
  .strict();

const MidTurnMidHookOptsSchema = z
  .object({
    minTurns: z.number().int().positive().optional(),
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

const MidHookHookWindowOptsSchema = z
  .object({
    midHookByRatio: z.number().positive().optional(),
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

const MidHookMidTurnOptsSchema = z
  .object({
    midHookByRatio: z.number().positive().optional(),
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

const DetailHookMidTurnOptsSchema = z
  .object({
    requireDetailCu: z.boolean().optional(),
    minTurns: z.number().int().positive().optional(),
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
  })
  .strict();

const DetailHookHookWindowOptsSchema = z
  .object({
    requireDetailCu: z.boolean().optional(),
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

const MidHookHookHardOptsSchema = z
  .object({
    midHookByRatio: z.number().positive().optional(),
    minDistinctKinds: z.number().int().positive().optional(),
    maxFaceRatio: z.number().positive().optional(),
    earlyHooksOnly: z.boolean().optional(),
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

const DetailHookHookHardOptsSchema = z
  .object({
    requireDetailCu: z.boolean().optional(),
    minDistinctKinds: z.number().int().positive().optional(),
    maxFaceRatio: z.number().positive().optional(),
    earlyHooksOnly: z.boolean().optional(),
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

const HookWindowHookHardOptsSchema = z
  .object({
    hardHookWindowSec: z.number().positive().optional(),
    minDistinctKinds: z.number().int().positive().optional(),
    maxFaceRatio: z.number().positive().optional(),
    earlyHooksOnly: z.boolean().optional(),
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

const ColdOpenHookHardOptsSchema = z
  .object({
    coldOpenWindowSec: z.number().positive().optional(),
    minDistinctKinds: z.number().int().positive().optional(),
    maxFaceRatio: z.number().positive().optional(),
    earlyHooksOnly: z.boolean().optional(),
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

const ColdCloseHookHardOptsSchema = z
  .object({
    coldTailSec: z.number().positive().optional(),
    minDistinctKinds: z.number().int().positive().optional(),
    maxFaceRatio: z.number().positive().optional(),
    earlyHooksOnly: z.boolean().optional(),
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

const HookHardMidHookOptsSchema = z
  .object({
    midHookByRatio: z.number().positive().optional(),
    minDistinctKinds: z.number().int().positive().optional(),
    maxFaceRatio: z.number().positive().optional(),
    earlyHooksOnly: z.boolean().optional(),
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

const HookHardColdOpenOptsSchema = z
  .object({
    coldOpenWindowSec: z.number().positive().optional(),
    minDistinctKinds: z.number().int().positive().optional(),
    maxFaceRatio: z.number().positive().optional(),
    earlyHooksOnly: z.boolean().optional(),
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

const HookHardColdCloseOptsSchema = z
  .object({
    coldTailSec: z.number().positive().optional(),
    minDistinctKinds: z.number().int().positive().optional(),
    maxFaceRatio: z.number().positive().optional(),
    earlyHooksOnly: z.boolean().optional(),
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

const HookHardDetailHookOptsSchema = z
  .object({
    requireDetailCu: z.boolean().optional(),
    minDistinctKinds: z.number().int().positive().optional(),
    maxFaceRatio: z.number().positive().optional(),
    earlyHooksOnly: z.boolean().optional(),
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

const HookHardHookWindowOptsSchema = z
  .object({
    hardHookWindowSec: z.number().positive().optional(),
    minDistinctKinds: z.number().int().positive().optional(),
    maxFaceRatio: z.number().positive().optional(),
    earlyHooksOnly: z.boolean().optional(),
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

const HookHardMidTurnOptsSchema = z
  .object({
    minTurns: z.number().int().positive().optional(),
    minDistinctKinds: z.number().int().positive().optional(),
    maxFaceRatio: z.number().positive().optional(),
    earlyHooksOnly: z.boolean().optional(),
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

const HookHardReactionOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requireReaction: z.boolean().optional(),
    reversalOnly: z.boolean().optional(),
    minDistinctKinds: z.number().int().positive().optional(),
    maxFaceRatio: z.number().positive().optional(),
    earlyHooksOnly: z.boolean().optional(),
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


const HookHardCliffTailOptsSchema = z
  .object({
    hardTailToleranceSec: z.number().positive().optional(),
    minDistinctKinds: z.number().int().positive().optional(),
    maxFaceRatio: z.number().positive().optional(),
    earlyHooksOnly: z.boolean().optional(),
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

const HookHardSetupCapOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
    minDistinctKinds: z.number().int().positive().optional(),
    maxFaceRatio: z.number().positive().optional(),
    earlyHooksOnly: z.boolean().optional(),
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

const HookHardSetupRatioOptsSchema = z
  .object({
    hardMaxSetupRatio: z.number().positive().optional(),
    minDistinctKinds: z.number().int().positive().optional(),
    maxFaceRatio: z.number().positive().optional(),
    earlyHooksOnly: z.boolean().optional(),
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


const HookHardReactionWindowOptsSchema = z
  .object({
    requirePriorReaction: z.boolean().optional(),
    lookbackSec: z.number().positive().optional(),
    reactionWindowSec: z.number().positive().optional(),
    minDistinctKinds: z.number().int().positive().optional(),
    maxFaceRatio: z.number().positive().optional(),
    earlyHooksOnly: z.boolean().optional(),
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

const HookHardDetailCapOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
    minActionChars: z.number().int().nonnegative().optional(),
    unlabeledSpeechMin: z.number().int().nonnegative().optional(),
    minDistinctKinds: z.number().int().positive().optional(),
    maxFaceRatio: z.number().positive().optional(),
    earlyHooksOnly: z.boolean().optional(),
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

const HookHardMidRatioOptsSchema = z
  .object({
    minTurns: z.number().int().positive().optional(),
    maxMidSetupRatio: z.number().positive().optional(),
    minDistinctKinds: z.number().int().positive().optional(),
    maxFaceRatio: z.number().positive().optional(),
    earlyHooksOnly: z.boolean().optional(),
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

const HookHardDialogueCapOptsSchema = z
  .object({
    minActionChars: z.number().int().nonnegative().optional(),
    unlabeledSpeechMin: z.number().int().nonnegative().optional(),
    minDistinctKinds: z.number().int().positive().optional(),
    maxFaceRatio: z.number().positive().optional(),
    earlyHooksOnly: z.boolean().optional(),
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

const HookHardSetupBanOptsSchema = z
  .object({
    minDistinctKinds: z.number().int().positive().optional(),
    maxFaceRatio: z.number().positive().optional(),
    earlyHooksOnly: z.boolean().optional(),
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

const HookHardDetailRatioOptsSchema = z
  .object({
    minDistinctKinds: z.number().int().positive().optional(),
    maxFaceRatio: z.number().positive().optional(),
    earlyHooksOnly: z.boolean().optional(),
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

const HookHardReactionCapOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requireReaction: z.boolean().optional(),
    minDistinctKinds: z.number().int().positive().optional(),
    maxFaceRatio: z.number().positive().optional(),
    earlyHooksOnly: z.boolean().optional(),
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

const HookHardMidCapOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
    minDistinctKinds: z.number().int().positive().optional(),
    maxFaceRatio: z.number().positive().optional(),
    earlyHooksOnly: z.boolean().optional(),
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

const HookHardDialogueRatioOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
    minActionChars: z.number().int().nonnegative().optional(),
    unlabeledSpeechMin: z.number().int().nonnegative().optional(),
    minDistinctKinds: z.number().int().positive().optional(),
    maxFaceRatio: z.number().positive().optional(),
    earlyHooksOnly: z.boolean().optional(),
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
    cliffTailColdClose: ShotSpecDocSchema.optional(),
    midHookColdClose: ShotSpecDocSchema.optional(),
    reactionHookWindow: ShotSpecDocSchema.optional(),
    reactionColdClose: ShotSpecDocSchema.optional(),
    reactionMidHook: ShotSpecDocSchema.optional(),
    cliffTailMidTurn: ShotSpecDocSchema.optional(),
    coldOpenColdClose: ShotSpecDocSchema.optional(),
    detailHookColdClose: ShotSpecDocSchema.optional(),
    detailHookReaction: ShotSpecDocSchema.optional(),
    detailHookMidHook: ShotSpecDocSchema.optional(),
    detailHookCliffTail: ShotSpecDocSchema.optional(),
    coldCloseDetailHook: ShotSpecDocSchema.optional(),
    midHookDetailHook: ShotSpecDocSchema.optional(),
    cliffTailDetailHook: ShotSpecDocSchema.optional(),
    reactionDetailHook: ShotSpecDocSchema.optional(),
    detailHookColdOpen: ShotSpecDocSchema.optional(),
    midHookColdOpen: ShotSpecDocSchema.optional(),
    cliffTailColdOpen: ShotSpecDocSchema.optional(),
    reactionColdOpen: ShotSpecDocSchema.optional(),
    hookWindowColdOpen: ShotSpecDocSchema.optional(),
    midTurnColdOpen: ShotSpecDocSchema.optional(),
    coldCloseColdOpen: ShotSpecDocSchema.optional(),
    midTurnDetailHook: ShotSpecDocSchema.optional(),
    hookWindowDetailHook: ShotSpecDocSchema.optional(),
    reactionMidTurn: ShotSpecDocSchema.optional(),
    midTurnMidHook: ShotSpecDocSchema.optional(),
    midHookHookWindow: ShotSpecDocSchema.optional(),
    midHookMidTurn: ShotSpecDocSchema.optional(),
    detailHookMidTurn: ShotSpecDocSchema.optional(),
    detailHookHookWindow: ShotSpecDocSchema.optional(),
    midHookHookHard: ShotSpecDocSchema.optional(),
    detailHookHookHard: ShotSpecDocSchema.optional(),
    hookWindowHookHard: ShotSpecDocSchema.optional(),
    coldOpenHookHard: ShotSpecDocSchema.optional(),
    coldCloseHookHard: ShotSpecDocSchema.optional(),
    hookHardMidHook: ShotSpecDocSchema.optional(),
    hookHardColdOpen: ShotSpecDocSchema.optional(),
    hookHardColdClose: ShotSpecDocSchema.optional(),
    hookHardDetailHook: ShotSpecDocSchema.optional(),
    hookHardHookWindow: ShotSpecDocSchema.optional(),
    hookHardMidTurn: ShotSpecDocSchema.optional(),
    hookHardReaction: ShotSpecDocSchema.optional(),
    hookHardCliffTail: ShotSpecDocSchema.optional(),
    hookHardSetupCap: ShotSpecDocSchema.optional(),
    hookHardSetupRatio: ShotSpecDocSchema.optional(),
    hookHardReactionWindow: ShotSpecDocSchema.optional(),
    hookHardDetailCap: ShotSpecDocSchema.optional(),
    hookHardMidRatio: ShotSpecDocSchema.optional(),
    hookHardDialogueCap: ShotSpecDocSchema.optional(),
    hookHardSetupBan: ShotSpecDocSchema.optional(),
    hookHardDetailRatio: ShotSpecDocSchema.optional(),
    hookHardReactionCap: ShotSpecDocSchema.optional(),
    hookHardMidCap: ShotSpecDocSchema.optional(),
    hookHardDialogueRatio: ShotSpecDocSchema.optional(),
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
    cliffTailColdCloseOpts: CliffTailColdCloseOptsSchema.optional(),
    midHookColdCloseOpts: MidHookColdCloseOptsSchema.optional(),
    reactionHookWindowOpts: ReactionHookWindowOptsSchema.optional(),
    reactionColdCloseOpts: ReactionColdCloseOptsSchema.optional(),
    reactionMidHookOpts: ReactionMidHookOptsSchema.optional(),
    cliffTailMidTurnOpts: CliffTailMidTurnOptsSchema.optional(),
    coldOpenColdCloseOpts: ColdOpenColdCloseOptsSchema.optional(),
    detailHookColdCloseOpts: DetailHookColdCloseOptsSchema.optional(),
    detailHookReactionOpts: DetailHookReactionOptsSchema.optional(),
    detailHookMidHookOpts: DetailHookMidHookOptsSchema.optional(),
    detailHookCliffTailOpts: DetailHookCliffTailOptsSchema.optional(),
    coldCloseDetailHookOpts: ColdCloseDetailHookOptsSchema.optional(),
    midHookDetailHookOpts: MidHookDetailHookOptsSchema.optional(),
    cliffTailDetailHookOpts: CliffTailDetailHookOptsSchema.optional(),
    reactionDetailHookOpts: ReactionDetailHookOptsSchema.optional(),
    detailHookColdOpenOpts: DetailHookColdOpenOptsSchema.optional(),
    midHookColdOpenOpts: MidHookColdOpenOptsSchema.optional(),
    cliffTailColdOpenOpts: CliffTailColdOpenOptsSchema.optional(),
    reactionColdOpenOpts: ReactionColdOpenOptsSchema.optional(),
    hookWindowColdOpenOpts: HookWindowColdOpenOptsSchema.optional(),
    midTurnColdOpenOpts: MidTurnColdOpenOptsSchema.optional(),
    coldCloseColdOpenOpts: ColdCloseColdOpenOptsSchema.optional(),
    midTurnDetailHookOpts: MidTurnDetailHookOptsSchema.optional(),
    hookWindowDetailHookOpts: HookWindowDetailHookOptsSchema.optional(),
    reactionMidTurnOpts: ReactionMidTurnOptsSchema.optional(),
    midTurnMidHookOpts: MidTurnMidHookOptsSchema.optional(),
    midHookHookWindowOpts: MidHookHookWindowOptsSchema.optional(),
    midHookMidTurnOpts: MidHookMidTurnOptsSchema.optional(),
    detailHookMidTurnOpts: DetailHookMidTurnOptsSchema.optional(),
    detailHookHookWindowOpts: DetailHookHookWindowOptsSchema.optional(),
    midHookHookHardOpts: MidHookHookHardOptsSchema.optional(),
    detailHookHookHardOpts: DetailHookHookHardOptsSchema.optional(),
    hookWindowHookHardOpts: HookWindowHookHardOptsSchema.optional(),
    coldOpenHookHardOpts: ColdOpenHookHardOptsSchema.optional(),
    coldCloseHookHardOpts: ColdCloseHookHardOptsSchema.optional(),
    hookHardMidHookOpts: HookHardMidHookOptsSchema.optional(),
    hookHardColdOpenOpts: HookHardColdOpenOptsSchema.optional(),
    hookHardColdCloseOpts: HookHardColdCloseOptsSchema.optional(),
    hookHardDetailHookOpts: HookHardDetailHookOptsSchema.optional(),
    hookHardHookWindowOpts: HookHardHookWindowOptsSchema.optional(),
    hookHardMidTurnOpts: HookHardMidTurnOptsSchema.optional(),
    hookHardReactionOpts: HookHardReactionOptsSchema.optional(),
    hookHardCliffTailOpts: HookHardCliffTailOptsSchema.optional(),
    hookHardSetupCapOpts: HookHardSetupCapOptsSchema.optional(),
    hookHardSetupRatioOpts: HookHardSetupRatioOptsSchema.optional(),
    hookHardReactionWindowOpts: HookHardReactionWindowOptsSchema.optional(),
    hookHardDetailCapOpts: HookHardDetailCapOptsSchema.optional(),
    hookHardMidRatioOpts: HookHardMidRatioOptsSchema.optional(),
    hookHardDialogueCapOpts: HookHardDialogueCapOptsSchema.optional(),
    hookHardSetupBanOpts: HookHardSetupBanOptsSchema.optional(),
    hookHardDetailRatioOpts: HookHardDetailRatioOptsSchema.optional(),
    hookHardReactionCapOpts: HookHardReactionCapOptsSchema.optional(),
    hookHardMidCapOpts: HookHardMidCapOptsSchema.optional(),
    hookHardDialogueRatioOpts: HookHardDialogueRatioOptsSchema.optional(),
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
  | CliffTailHookWindowReport
  | CliffTailColdCloseReport
  | MidHookColdCloseReport
  | ReactionHookWindowReport
  | ReactionColdCloseReport
  | ReactionMidHookReport
  | CliffTailMidTurnReport
  | ColdOpenColdCloseReport
  | DetailHookColdCloseReport
  | DetailHookReactionReport
  | DetailHookMidHookReport
  | DetailHookCliffTailReport
  | ColdCloseDetailHookReport
  | MidHookDetailHookReport
  | CliffTailDetailHookReport
  | ReactionDetailHookReport
  | DetailHookColdOpenReport
  | MidHookColdOpenReport
  | CliffTailColdOpenReport
  | ReactionColdOpenReport
  | HookWindowColdOpenReport
  | MidTurnColdOpenReport
  | ColdCloseColdOpenReport
  | MidTurnDetailHookReport
  | HookWindowDetailHookReport
  | ReactionMidTurnReport
  | MidTurnMidHookReport
  | MidHookHookWindowReport
  | MidHookMidTurnReport
  | DetailHookMidTurnReport
  | DetailHookHookWindowReport
  | MidHookHookHardReport
  | DetailHookHookHardReport
  | HookWindowHookHardReport
  | ColdOpenHookHardReport
  | ColdCloseHookHardReport
  | HookHardMidHookReport
  | HookHardColdOpenReport
  | HookHardColdCloseReport
  | HookHardDetailHookReport
  | HookHardHookWindowReport
  | HookHardMidTurnReport
  | HookHardReactionReport
  | HookHardCliffTailReport
  | HookHardSetupCapReport
  | HookHardSetupRatioReport
  | HookHardReactionWindowReport
  | HookHardDetailCapReport
  | HookHardMidRatioReport
  | HookHardDialogueCapReport
  | HookHardSetupBanReport
  | HookHardDetailRatioReport
  | HookHardReactionCapReport
  | HookHardMidCapReport
  | HookHardDialogueRatioReport;

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
    cliffTailColdCloseOpts,
    midHookColdCloseOpts,
    reactionHookWindowOpts,
    reactionColdCloseOpts,
    reactionMidHookOpts,
    cliffTailMidTurnOpts,
    coldOpenColdCloseOpts,
    detailHookColdCloseOpts,
    detailHookReactionOpts,
    detailHookMidHookOpts,
    detailHookCliffTailOpts,
    coldCloseDetailHookOpts,
    midHookDetailHookOpts,
    cliffTailDetailHookOpts,
    reactionDetailHookOpts,
    detailHookColdOpenOpts,
    midHookColdOpenOpts,
    cliffTailColdOpenOpts,
    reactionColdOpenOpts,
    hookWindowColdOpenOpts,
    midTurnColdOpenOpts,
    coldCloseColdOpenOpts,
    midTurnDetailHookOpts,
    hookWindowDetailHookOpts,
    reactionMidTurnOpts,
    midTurnMidHookOpts,
    midHookHookWindowOpts,
    midHookMidTurnOpts,
    detailHookMidTurnOpts,
    detailHookHookWindowOpts,
    midHookHookHardOpts,
    detailHookHookHardOpts,
    hookWindowHookHardOpts,
    coldOpenHookHardOpts,
    coldCloseHookHardOpts,
    hookHardMidHookOpts,
    hookHardColdOpenOpts,
    hookHardColdCloseOpts,
    hookHardDetailHookOpts,
    hookHardHookWindowOpts,
    hookHardMidTurnOpts,
    hookHardReactionOpts,
    hookHardCliffTailOpts,
    hookHardSetupCapOpts,
    hookHardSetupRatioOpts,
    hookHardReactionWindowOpts,
    hookHardDetailCapOpts,
    hookHardMidRatioOpts,
    hookHardDialogueCapOpts,
    hookHardSetupBanOpts,
    hookHardDetailRatioOpts,
    hookHardReactionCapOpts,
    hookHardMidCapOpts,
    hookHardDialogueRatioOpts,
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
  if (sections.cliffTailColdClose !== undefined) {
    run(
      'cliffTailColdClose',
      evaluateCliffTailColdClose(
        sections.cliffTailColdClose,
        (cliffTailColdCloseOpts ?? {}) as CliffTailColdCloseOptions,
      ),
    );
  }
  if (sections.midHookColdClose !== undefined) {
    run(
      'midHookColdClose',
      evaluateMidHookColdClose(
        sections.midHookColdClose,
        (midHookColdCloseOpts ?? {}) as MidHookColdCloseOptions,
      ),
    );
  }
  if (sections.reactionHookWindow !== undefined) {
    run(
      'reactionHookWindow',
      evaluateReactionHookWindow(
        sections.reactionHookWindow,
        (reactionHookWindowOpts ?? {}) as ReactionHookWindowOptions,
      ),
    );
  }


  if (sections.reactionColdClose !== undefined) {
    run(
      'reactionColdClose',
      evaluateReactionColdClose(
        sections.reactionColdClose,
        (reactionColdCloseOpts ?? {}) as ReactionColdCloseOptions,
      ),
    );
  }
  if (sections.reactionMidHook !== undefined) {
    run(
      'reactionMidHook',
      evaluateReactionMidHook(
        sections.reactionMidHook,
        (reactionMidHookOpts ?? {}) as ReactionMidHookOptions,
      ),
    );
  }
  if (sections.cliffTailMidTurn !== undefined) {
    run(
      'cliffTailMidTurn',
      evaluateCliffTailMidTurn(
        sections.cliffTailMidTurn,
        (cliffTailMidTurnOpts ?? {}) as CliffTailMidTurnOptions,
      ),
    );
  }

  if (sections.coldOpenColdClose !== undefined) {
    run(
      'coldOpenColdClose',
      evaluateColdOpenColdClose(
        sections.coldOpenColdClose,
        (coldOpenColdCloseOpts ?? {}) as ColdOpenColdCloseOptions,
      ),
    );
  }
  if (sections.detailHookColdClose !== undefined) {
    run(
      'detailHookColdClose',
      evaluateDetailHookColdClose(
        sections.detailHookColdClose,
        (detailHookColdCloseOpts ?? {}) as DetailHookColdCloseOptions,
      ),
    );
  }
  if (sections.detailHookReaction !== undefined) {
    run(
      'detailHookReaction',
      evaluateDetailHookReaction(
        sections.detailHookReaction,
        (detailHookReactionOpts ?? {}) as DetailHookReactionOptions,
      ),
    );
  }
  if (sections.detailHookMidHook !== undefined) {
    run(
      'detailHookMidHook',
      evaluateDetailHookMidHook(
        sections.detailHookMidHook,
        (detailHookMidHookOpts ?? {}) as DetailHookMidHookOptions,
      ),
    );
  }
  if (sections.detailHookCliffTail !== undefined) {
    run(
      'detailHookCliffTail',
      evaluateDetailHookCliffTail(
        sections.detailHookCliffTail,
        (detailHookCliffTailOpts ?? {}) as DetailHookCliffTailOptions,
      ),
    );
  }
  if (sections.coldCloseDetailHook !== undefined) {
    run(
      'coldCloseDetailHook',
      evaluateColdCloseDetailHook(
        sections.coldCloseDetailHook,
        (coldCloseDetailHookOpts ?? {}) as ColdCloseDetailHookOptions,
      ),
    );
  }
  if (sections.midHookDetailHook !== undefined) {
    run(
      'midHookDetailHook',
      evaluateMidHookDetailHook(
        sections.midHookDetailHook,
        (midHookDetailHookOpts ?? {}) as MidHookDetailHookOptions,
      ),
    );
  }
  if (sections.cliffTailDetailHook !== undefined) {
    run(
      'cliffTailDetailHook',
      evaluateCliffTailDetailHook(
        sections.cliffTailDetailHook,
        (cliffTailDetailHookOpts ?? {}) as CliffTailDetailHookOptions,
      ),
    );
  }
  if (sections.reactionDetailHook !== undefined) {
    run(
      'reactionDetailHook',
      evaluateReactionDetailHook(
        sections.reactionDetailHook,
        (reactionDetailHookOpts ?? {}) as ReactionDetailHookOptions,
      ),
    );
  }
  if (sections.detailHookColdOpen !== undefined) {
    run(
      'detailHookColdOpen',
      evaluateDetailHookColdOpen(
        sections.detailHookColdOpen,
        (detailHookColdOpenOpts ?? {}) as DetailHookColdOpenOptions,
      ),
    );
  }
  if (sections.midHookColdOpen !== undefined) {
    run(
      'midHookColdOpen',
      evaluateMidHookColdOpen(
        sections.midHookColdOpen,
        (midHookColdOpenOpts ?? {}) as MidHookColdOpenOptions,
      ),
    );
  }
  if (sections.cliffTailColdOpen !== undefined) {
    run(
      'cliffTailColdOpen',
      evaluateCliffTailColdOpen(
        sections.cliffTailColdOpen,
        (cliffTailColdOpenOpts ?? {}) as CliffTailColdOpenOptions,
      ),
    );
  }
  if (sections.reactionColdOpen !== undefined) {
    run(
      'reactionColdOpen',
      evaluateReactionColdOpen(
        sections.reactionColdOpen,
        (reactionColdOpenOpts ?? {}) as ReactionColdOpenOptions,
      ),
    );
  }
  if (sections.hookWindowColdOpen !== undefined) {
    run(
      'hookWindowColdOpen',
      evaluateHookWindowColdOpen(
        sections.hookWindowColdOpen,
        (hookWindowColdOpenOpts ?? {}) as HookWindowColdOpenOptions,
      ),
    );
  }
  if (sections.midTurnColdOpen !== undefined) {
    run(
      'midTurnColdOpen',
      evaluateMidTurnColdOpen(
        sections.midTurnColdOpen,
        (midTurnColdOpenOpts ?? {}) as MidTurnColdOpenOptions,
      ),
    );
  }
  if (sections.coldCloseColdOpen !== undefined) {
    run(
      'coldCloseColdOpen',
      evaluateColdCloseColdOpen(
        sections.coldCloseColdOpen,
        (coldCloseColdOpenOpts ?? {}) as ColdCloseColdOpenOptions,
      ),
    );
  }
  if (sections.midTurnDetailHook !== undefined) {
    run(
      'midTurnDetailHook',
      evaluateMidTurnDetailHook(
        sections.midTurnDetailHook,
        (midTurnDetailHookOpts ?? {}) as MidTurnDetailHookOptions,
      ),
    );
  }
  if (sections.hookWindowDetailHook !== undefined) {
    run(
      'hookWindowDetailHook',
      evaluateHookWindowDetailHook(
        sections.hookWindowDetailHook,
        (hookWindowDetailHookOpts ?? {}) as HookWindowDetailHookOptions,
      ),
    );
  }
  if (sections.reactionMidTurn !== undefined) {
    run(
      'reactionMidTurn',
      evaluateReactionMidTurn(
        sections.reactionMidTurn,
        (reactionMidTurnOpts ?? {}) as ReactionMidTurnOptions,
      ),
    );
  }
  if (sections.midTurnMidHook !== undefined) {
    run(
      'midTurnMidHook',
      evaluateMidTurnMidHook(
        sections.midTurnMidHook,
        (midTurnMidHookOpts ?? {}) as MidTurnMidHookOptions,
      ),
    );
  }
  if (sections.midHookHookWindow !== undefined) {
    run(
      'midHookHookWindow',
      evaluateMidHookHookWindow(
        sections.midHookHookWindow,
        (midHookHookWindowOpts ?? {}) as MidHookHookWindowOptions,
      ),
    );
  }
  if (sections.midHookMidTurn !== undefined) {
    run(
      'midHookMidTurn',
      evaluateMidHookMidTurn(
        sections.midHookMidTurn,
        (midHookMidTurnOpts ?? {}) as MidHookMidTurnOptions,
      ),
    );
  }
  if (sections.detailHookMidTurn !== undefined) {
    run(
      'detailHookMidTurn',
      evaluateDetailHookMidTurn(
        sections.detailHookMidTurn,
        (detailHookMidTurnOpts ?? {}) as DetailHookMidTurnOptions,
      ),
    );
  }
  if (sections.detailHookHookWindow !== undefined) {
    run(
      'detailHookHookWindow',
      evaluateDetailHookHookWindow(
        sections.detailHookHookWindow,
        (detailHookHookWindowOpts ?? {}) as DetailHookHookWindowOptions,
      ),
    );
  }
  if (sections.midHookHookHard !== undefined) {
    run(
      'midHookHookHard',
      evaluateMidHookHookHard(
        sections.midHookHookHard,
        (midHookHookHardOpts ?? {}) as MidHookHookHardOptions,
      ),
    );
  }
  if (sections.detailHookHookHard !== undefined) {
    run(
      'detailHookHookHard',
      evaluateDetailHookHookHard(
        sections.detailHookHookHard,
        (detailHookHookHardOpts ?? {}) as DetailHookHookHardOptions,
      ),
    );
  }
  if (sections.hookWindowHookHard !== undefined) {
    run(
      'hookWindowHookHard',
      evaluateHookWindowHookHard(
        sections.hookWindowHookHard,
        (hookWindowHookHardOpts ?? {}) as HookWindowHookHardOptions,
      ),
    );
  }
  if (sections.coldOpenHookHard !== undefined) {
    run(
      'coldOpenHookHard',
      evaluateColdOpenHookHard(
        sections.coldOpenHookHard,
        (coldOpenHookHardOpts ?? {}) as ColdOpenHookHardOptions,
      ),
    );
  }
  if (sections.coldCloseHookHard !== undefined) {
    run(
      'coldCloseHookHard',
      evaluateColdCloseHookHard(
        sections.coldCloseHookHard,
        (coldCloseHookHardOpts ?? {}) as ColdCloseHookHardOptions,
      ),
    );
  }
  if (sections.hookHardMidHook !== undefined) {
    run(
      'hookHardMidHook',
      evaluateHookHardMidHook(
        sections.hookHardMidHook,
        (hookHardMidHookOpts ?? {}) as HookHardMidHookOptions,
      ),
    );
  }
  if (sections.hookHardColdOpen !== undefined) {
    run(
      'hookHardColdOpen',
      evaluateHookHardColdOpen(
        sections.hookHardColdOpen,
        (hookHardColdOpenOpts ?? {}) as HookHardColdOpenOptions,
      ),
    );
  }
  if (sections.hookHardColdClose !== undefined) {
    run(
      'hookHardColdClose',
      evaluateHookHardColdClose(
        sections.hookHardColdClose,
        (hookHardColdCloseOpts ?? {}) as HookHardColdCloseOptions,
      ),
    );
  }
  if (sections.hookHardDetailHook !== undefined) {
    run(
      'hookHardDetailHook',
      evaluateHookHardDetailHook(
        sections.hookHardDetailHook,
        (hookHardDetailHookOpts ?? {}) as HookHardDetailHookOptions,
      ),
    );
  }
  if (sections.hookHardHookWindow !== undefined) {
    run(
      'hookHardHookWindow',
      evaluateHookHardHookWindow(
        sections.hookHardHookWindow,
        (hookHardHookWindowOpts ?? {}) as HookHardHookWindowOptions,
      ),
    );
  }
  if (sections.hookHardMidTurn !== undefined) {
    run(
      'hookHardMidTurn',
      evaluateHookHardMidTurn(
        sections.hookHardMidTurn,
        (hookHardMidTurnOpts ?? {}) as HookHardMidTurnOptions,
      ),
    );
  }
  if (sections.hookHardReaction !== undefined) {
    run(
      'hookHardReaction',
      evaluateHookHardReaction(
        sections.hookHardReaction,
        (hookHardReactionOpts ?? {}) as HookHardReactionOptions,
      ),
    );
  }
  if (sections.hookHardCliffTail !== undefined) {
    run(
      'hookHardCliffTail',
      evaluateHookHardCliffTail(
        sections.hookHardCliffTail,
        (hookHardCliffTailOpts ?? {}) as HookHardCliffTailOptions,
      ),
    );
  }
  if (sections.hookHardSetupCap !== undefined) {
    run(
      'hookHardSetupCap',
      evaluateHookHardSetupCap(
        sections.hookHardSetupCap,
        (hookHardSetupCapOpts ?? {}) as HookHardSetupCapOptions,
      ),
    );
  }
  if (sections.hookHardSetupRatio !== undefined) {
    run(
      'hookHardSetupRatio',
      evaluateHookHardSetupRatio(
        sections.hookHardSetupRatio,
        (hookHardSetupRatioOpts ?? {}) as HookHardSetupRatioOptions,
      ),
    );
  }

  if (sections.hookHardReactionWindow !== undefined) {
    run(
      'hookHardReactionWindow',
      evaluateHookHardReactionWindow(
        sections.hookHardReactionWindow,
        (hookHardReactionWindowOpts ?? {}) as HookHardReactionWindowOptions,
      ),
    );
  }
  if (sections.hookHardDetailCap !== undefined) {
    run(
      'hookHardDetailCap',
      evaluateHookHardDetailCap(
        sections.hookHardDetailCap,
        (hookHardDetailCapOpts ?? {}) as HookHardDetailCapOptions,
      ),
    );
  }
  if (sections.hookHardMidRatio !== undefined) {
    run(
      'hookHardMidRatio',
      evaluateHookHardMidRatio(
        sections.hookHardMidRatio,
        (hookHardMidRatioOpts ?? {}) as HookHardMidRatioOptions,
      ),
    );
  }


  if (sections.hookHardDialogueCap !== undefined) {
    run(
      'hookHardDialogueCap',
      evaluateHookHardDialogueCap(
        sections.hookHardDialogueCap,
        (hookHardDialogueCapOpts ?? {}) as HookHardDialogueCapOptions,
      ),
    );
  }
  if (sections.hookHardSetupBan !== undefined) {
    run(
      'hookHardSetupBan',
      evaluateHookHardSetupBan(
        sections.hookHardSetupBan,
        (hookHardSetupBanOpts ?? {}) as HookHardSetupBanOptions,
      ),
    );
  }
  if (sections.hookHardDetailRatio !== undefined) {
    run(
      'hookHardDetailRatio',
      evaluateHookHardDetailRatio(
        sections.hookHardDetailRatio,
        (hookHardDetailRatioOpts ?? {}) as HookHardDetailRatioOptions,
      ),
    );
  }

  if (sections.hookHardReactionCap !== undefined) {
    run(
      'hookHardReactionCap',
      evaluateHookHardReactionCap(
        sections.hookHardReactionCap,
        (hookHardReactionCapOpts ?? {}) as HookHardReactionCapOptions,
      ),
    );
  }
  if (sections.hookHardMidCap !== undefined) {
    run(
      'hookHardMidCap',
      evaluateHookHardMidCap(
        sections.hookHardMidCap,
        (hookHardMidCapOpts ?? {}) as HookHardMidCapOptions,
      ),
    );
  }
  if (sections.hookHardDialogueRatio !== undefined) {
    run(
      'hookHardDialogueRatio',
      evaluateHookHardDialogueRatio(
        sections.hookHardDialogueRatio,
        (hookHardDialogueRatioOpts ?? {}) as HookHardDialogueRatioOptions,
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
