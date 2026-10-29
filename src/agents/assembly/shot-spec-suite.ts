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
 *   · hookHardColdCap · hookHardTailCap · hookHardWindowRatio
 *   · hookHardReactionRatio · hookHardDialogueBan · hookHardCliffDialogueBan
 *   · hookHardReactionBan · hookHardMidDialogueBan · hookHardSetupDialogueBan
 *   · hookHardColdDialogueBan · hookHardTailDialogueBan · hookHardWindowDialogueBan
 *   · hookHardWindowCap · hookHardFaceRatio · hookHardFaceCap
 *   · hookHardWindowFaceCap · hookHardTailRatio · hookHardColdRatio
 *   · hookHardWindowTailCap · hookHardFaceTailCap · hookHardColdFaceCap
 *   · hookHardMidFaceCap · hookHardSetupFaceCap · hookHardReactionFaceCap
 *   · hookHardMidTailCap · hookHardSetupTailCap · hookHardReactionTailCap
 *   · hookHardMidColdCap · hookHardSetupColdCap · hookHardReactionColdCap
 *   · hookHardMidWindow · hookHardSetupWindow · hookHardReactionWinCap
 *   · hookHardMidWinCap · hookHardSetupWinCap · hookHardReactionWinHold
 *   · hookHardMidWinHold · hookHardSetupWinHold · hookHardReactionWinFloor
 *   · hookHardMidWinFloor · hookHardSetupWinFloor · hookHardReactionWinCeil
 *   · hookHardMidWinCeil · hookHardSetupWinCeil · hookHardReactionWinSpan
 *   · hookHardMidWinSpan · hookHardSetupWinSpan · hookHardReactionWinPeak
 *   · hookHardMidWinPeak · hookHardSetupWinPeak · hookHardReactionWinEdge
 *   · hookHardMidWinEdge · hookHardSetupWinEdge · hookHardReactionWinCrest
 *   · hookHardMidWinLatch · hookHardSetupWinLatch · hookHardReactionWinLatch
  · hookHardMidWinBind · hookHardSetupWinBind · hookHardReactionWinBind
 *   · hookHardMidWinSeal · hookHardSetupWinSeal · hookHardReactionWinSeal
 *   · hookHardMidWinLock · hookHardSetupWinLock · hookHardReactionWinLock
 *   · hookHardMidWinClamp · hookHardSetupWinClamp · hookHardReactionWinClamp
 *   · hookHardMidWinBolt · hookHardSetupWinBolt · hookHardReactionWinBolt
 *   · hookHardMidWinBrace · hookHardSetupWinBrace · hookHardReactionWinBrace
 *   · hookHardMidWinCinch · hookHardSetupWinCinch · hookHardReactionWinCinch
 *   · hookHardMidWinHitch · hookHardSetupWinHitch · hookHardReactionWinHitch
 *   · hookHardMidWinKnot · hookHardSetupWinKnot · hookHardReactionWinKnot
 *   · hookHardMidWinLace · hookHardSetupWinLace · hookHardReactionWinLace
 *   · hookHardMidWinSash · hookHardSetupWinSash · hookHardReactionWinSash
 *   · hookHardMidWinWrap · hookHardSetupWinWrap · hookHardReactionWinWrap
 *   · hookHardMidWinBand · hookHardSetupWinBand · hookHardReactionWinBand
 *   · hookHardMidWinCord · hookHardSetupWinCord · hookHardReactionWinCord
 *   · hookHardMidWinStrap · hookHardSetupWinStrap · hookHardReactionWinStrap
 *   · hookHardMidWinTie · hookHardSetupWinTie · hookHardReactionWinTie
 *   · hookHardMidWinPin · hookHardSetupWinPin · hookHardReactionWinPin
 *   · hookHardMidWinClip · hookHardSetupWinClip · hookHardReactionWinClip
 *   · hookHardMidWinGrip · hookHardSetupWinGrip · hookHardReactionWinGrip
 *   · hookHardMidWinClasp · hookHardSetupWinClasp · hookHardReactionWinClasp
 *   · hookHardMidWinGrasp · hookHardSetupWinGrasp · hookHardReactionWinGrasp
 *   · hookHardMidWinRivet · hookHardSetupWinRivet · hookHardReactionWinRivet
 *   · hookHardMidWinWeld · hookHardSetupWinWeld · hookHardReactionWinWeld
 *   · hookHardMidWinCleat · hookHardSetupWinCleat · hookHardReactionWinCleat
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



import {
  evaluateHookHardColdCap,
  type HookHardColdCapOptions,
  type HookHardColdCapReport,
} from './hook-hard-cold-cap-gate';
import {
  evaluateHookHardTailCap,
  type HookHardTailCapOptions,
  type HookHardTailCapReport,
} from './hook-hard-tail-cap-gate';
import {
  evaluateHookHardWindowRatio,
  type HookHardWindowRatioOptions,
  type HookHardWindowRatioReport,
} from './hook-hard-window-ratio-gate';

import {
  evaluateHookHardReactionRatio,
  type HookHardReactionRatioOptions,
  type HookHardReactionRatioReport,
} from './hook-hard-reaction-ratio-gate';
import {
  evaluateHookHardDialogueBan,
  type HookHardDialogueBanOptions,
  type HookHardDialogueBanReport,
} from './hook-hard-dialogue-ban-gate';
import {
  evaluateHookHardCliffDialogueBan,
  type HookHardCliffDialogueBanOptions,
  type HookHardCliffDialogueBanReport,
} from './hook-hard-cliff-dialogue-ban-gate';

import {
  evaluateHookHardReactionBan,
  type HookHardReactionBanOptions,
  type HookHardReactionBanReport,
} from './hook-hard-reaction-ban-gate';
import {
  evaluateHookHardMidDialogueBan,
  type HookHardMidDialogueBanOptions,
  type HookHardMidDialogueBanReport,
} from './hook-hard-mid-dialogue-ban-gate';
import {
  evaluateHookHardSetupDialogueBan,
  type HookHardSetupDialogueBanOptions,
  type HookHardSetupDialogueBanReport,
} from './hook-hard-setup-dialogue-ban-gate';

import {
  evaluateHookHardColdDialogueBan,
  type HookHardColdDialogueBanOptions,
  type HookHardColdDialogueBanReport,
} from './hook-hard-cold-dialogue-ban-gate';
import {
  evaluateHookHardTailDialogueBan,
  type HookHardTailDialogueBanOptions,
  type HookHardTailDialogueBanReport,
} from './hook-hard-tail-dialogue-ban-gate';
import {
  evaluateHookHardWindowDialogueBan,
  type HookHardWindowDialogueBanOptions,
  type HookHardWindowDialogueBanReport,
} from './hook-hard-window-dialogue-ban-gate';

import {
  evaluateHookHardWindowCap,
  type HookHardWindowCapOptions,
  type HookHardWindowCapReport,
} from './hook-hard-window-cap-gate';
import {
  evaluateHookHardFaceRatio,
  type HookHardFaceRatioOptions,
  type HookHardFaceRatioReport,
} from './hook-hard-face-ratio-gate';
import {
  evaluateHookHardFaceCap,
  type HookHardFaceCapOptions,
  type HookHardFaceCapReport,
} from './hook-hard-face-cap-gate';
import {
  evaluateHookHardWindowFaceCap,
  type HookHardWindowFaceCapOptions,
  type HookHardWindowFaceCapReport,
} from './hook-hard-window-face-cap-gate';
import {
  evaluateHookHardTailRatio,
  type HookHardTailRatioOptions,
  type HookHardTailRatioReport,
} from './hook-hard-tail-ratio-gate';
import {
  evaluateHookHardColdRatio,
  type HookHardColdRatioOptions,
  type HookHardColdRatioReport,
} from './hook-hard-cold-ratio-gate';
import {
  evaluateHookHardWindowTailCap,
  type HookHardWindowTailCapOptions,
  type HookHardWindowTailCapReport,
} from './hook-hard-window-tail-cap-gate';
import {
  evaluateHookHardFaceTailCap,
  type HookHardFaceTailCapOptions,
  type HookHardFaceTailCapReport,
} from './hook-hard-face-tail-cap-gate';
import {
  evaluateHookHardColdFaceCap,
  type HookHardColdFaceCapOptions,
  type HookHardColdFaceCapReport,
} from './hook-hard-cold-face-cap-gate';
import {
  evaluateHookHardMidFaceCap,
  type HookHardMidFaceCapOptions,
  type HookHardMidFaceCapReport,
} from './hook-hard-mid-face-cap-gate';
import {
  evaluateHookHardSetupFaceCap,
  type HookHardSetupFaceCapOptions,
  type HookHardSetupFaceCapReport,
} from './hook-hard-setup-face-cap-gate';
import {
  evaluateHookHardReactionFaceCap,
  type HookHardReactionFaceCapOptions,
  type HookHardReactionFaceCapReport,
} from './hook-hard-reaction-face-cap-gate';
import {
  evaluateHookHardMidTailCap,
  type HookHardMidTailCapOptions,
  type HookHardMidTailCapReport,
} from './hook-hard-mid-tail-cap-gate';
import {
  evaluateHookHardSetupTailCap,
  type HookHardSetupTailCapOptions,
  type HookHardSetupTailCapReport,
} from './hook-hard-setup-tail-cap-gate';
import {
  evaluateHookHardReactionTailCap,
  type HookHardReactionTailCapOptions,
  type HookHardReactionTailCapReport,
} from './hook-hard-reaction-tail-cap-gate';

import {
  evaluateHookHardMidColdCap,
  type HookHardMidColdCapOptions,
  type HookHardMidColdCapReport,
} from './hook-hard-mid-cold-cap-gate';
import {
  evaluateHookHardSetupColdCap,
  type HookHardSetupColdCapOptions,
  type HookHardSetupColdCapReport,
} from './hook-hard-setup-cold-cap-gate';
import {
  evaluateHookHardReactionColdCap,
  type HookHardReactionColdCapOptions,
  type HookHardReactionColdCapReport,
} from './hook-hard-reaction-cold-cap-gate';
import {
  evaluateHookHardMidWindow,
  type HookHardMidWindowOptions,
  type HookHardMidWindowReport,
} from './hook-hard-mid-window-gate';
import {
  evaluateHookHardSetupWindow,
  type HookHardSetupWindowOptions,
  type HookHardSetupWindowReport,
} from './hook-hard-setup-window-gate';
import {
  evaluateHookHardReactionWinCap,
  type HookHardReactionWinCapOptions,
  type HookHardReactionWinCapReport,
} from './hook-hard-reaction-win-cap-gate';

import {
  evaluateHookHardMidWinCap,
  type HookHardMidWinCapOptions,
  type HookHardMidWinCapReport,
} from './hook-hard-mid-win-cap-gate';
import {
  evaluateHookHardSetupWinCap,
  type HookHardSetupWinCapOptions,
  type HookHardSetupWinCapReport,
} from './hook-hard-setup-win-cap-gate';
import {
  evaluateHookHardReactionWinHold,
  type HookHardReactionWinHoldOptions,
  type HookHardReactionWinHoldReport,
} from './hook-hard-reaction-win-hold-gate';

import {
  evaluateHookHardMidWinHold,
  type HookHardMidWinHoldOptions,
  type HookHardMidWinHoldReport,
} from './hook-hard-mid-win-hold-gate';
import {
  evaluateHookHardSetupWinHold,
  type HookHardSetupWinHoldOptions,
  type HookHardSetupWinHoldReport,
} from './hook-hard-setup-win-hold-gate';
import {
  evaluateHookHardReactionWinFloor,
  type HookHardReactionWinFloorOptions,
  type HookHardReactionWinFloorReport,
} from './hook-hard-reaction-win-floor-gate';

import {
  evaluateHookHardMidWinFloor,
  type HookHardMidWinFloorOptions,
  type HookHardMidWinFloorReport,
} from './hook-hard-mid-win-floor-gate';
import {
  evaluateHookHardSetupWinFloor,
  type HookHardSetupWinFloorOptions,
  type HookHardSetupWinFloorReport,
} from './hook-hard-setup-win-floor-gate';
import {
  evaluateHookHardReactionWinCeil,
  type HookHardReactionWinCeilOptions,
  type HookHardReactionWinCeilReport,
} from './hook-hard-reaction-win-ceil-gate';

import {
  evaluateHookHardMidWinCeil,
  type HookHardMidWinCeilOptions,
  type HookHardMidWinCeilReport,
} from './hook-hard-mid-win-ceil-gate';
import {
  evaluateHookHardSetupWinCeil,
  type HookHardSetupWinCeilOptions,
  type HookHardSetupWinCeilReport,
} from './hook-hard-setup-win-ceil-gate';
import {
  evaluateHookHardReactionWinSpan,
  type HookHardReactionWinSpanOptions,
  type HookHardReactionWinSpanReport,
} from './hook-hard-reaction-win-span-gate';

import {
  evaluateHookHardMidWinSpan,
  type HookHardMidWinSpanOptions,
  type HookHardMidWinSpanReport,
} from './hook-hard-mid-win-span-gate';
import {
  evaluateHookHardSetupWinSpan,
  type HookHardSetupWinSpanOptions,
  type HookHardSetupWinSpanReport,
} from './hook-hard-setup-win-span-gate';
import {
  evaluateHookHardReactionWinPeak,
  type HookHardReactionWinPeakOptions,
  type HookHardReactionWinPeakReport,
} from './hook-hard-reaction-win-peak-gate';
import {
  evaluateHookHardMidWinPeak,
  type HookHardMidWinPeakOptions,
  type HookHardMidWinPeakReport,
} from './hook-hard-mid-win-peak-gate';
import {
  evaluateHookHardSetupWinPeak,
  type HookHardSetupWinPeakOptions,
  type HookHardSetupWinPeakReport,
} from './hook-hard-setup-win-peak-gate';
import {
  evaluateHookHardReactionWinEdge,
  type HookHardReactionWinEdgeOptions,
  type HookHardReactionWinEdgeReport,
} from './hook-hard-reaction-win-edge-gate';

import {
  evaluateHookHardMidWinEdge,
  type HookHardMidWinEdgeOptions,
  type HookHardMidWinEdgeReport,
} from './hook-hard-mid-win-edge-gate';
import {
  evaluateHookHardSetupWinEdge,
  type HookHardSetupWinEdgeOptions,
  type HookHardSetupWinEdgeReport,
} from './hook-hard-setup-win-edge-gate';
import {
  evaluateHookHardReactionWinCrest,
  type HookHardReactionWinCrestOptions,
  type HookHardReactionWinCrestReport,
} from './hook-hard-reaction-win-crest-gate';

import {
  evaluateHookHardMidWinLatch,
  type HookHardMidWinLatchOptions,
  type HookHardMidWinLatchReport,
} from './hook-hard-mid-win-latch-gate';
import {
  evaluateHookHardSetupWinLatch,
  type HookHardSetupWinLatchOptions,
  type HookHardSetupWinLatchReport,
} from './hook-hard-setup-win-latch-gate';
import {
  evaluateHookHardReactionWinLatch,
  type HookHardReactionWinLatchOptions,
  type HookHardReactionWinLatchReport,
} from './hook-hard-reaction-win-latch-gate';

import {
  evaluateHookHardMidWinBind,
  type HookHardMidWinBindOptions,
  type HookHardMidWinBindReport,
} from './hook-hard-mid-win-bind-gate';
import {
  evaluateHookHardSetupWinBind,
  type HookHardSetupWinBindOptions,
  type HookHardSetupWinBindReport,
} from './hook-hard-setup-win-bind-gate';
import {
  evaluateHookHardReactionWinBind,
  type HookHardReactionWinBindOptions,
  type HookHardReactionWinBindReport,
} from './hook-hard-reaction-win-bind-gate';

import {
  evaluateHookHardMidWinSeal,
  type HookHardMidWinSealOptions,
  type HookHardMidWinSealReport,
} from './hook-hard-mid-win-seal-gate';
import {
  evaluateHookHardSetupWinSeal,
  type HookHardSetupWinSealOptions,
  type HookHardSetupWinSealReport,
} from './hook-hard-setup-win-seal-gate';
import {
  evaluateHookHardReactionWinSeal,
  type HookHardReactionWinSealOptions,
  type HookHardReactionWinSealReport,
} from './hook-hard-reaction-win-seal-gate';

import {
  evaluateHookHardMidWinLock,
  type HookHardMidWinLockOptions,
  type HookHardMidWinLockReport,
} from './hook-hard-mid-win-lock-gate';
import {
  evaluateHookHardSetupWinLock,
  type HookHardSetupWinLockOptions,
  type HookHardSetupWinLockReport,
} from './hook-hard-setup-win-lock-gate';
import {
  evaluateHookHardReactionWinLock,
  type HookHardReactionWinLockOptions,
  type HookHardReactionWinLockReport,
} from './hook-hard-reaction-win-lock-gate';

import {
  evaluateHookHardMidWinClamp,
  type HookHardMidWinClampOptions,
  type HookHardMidWinClampReport,
} from './hook-hard-mid-win-clamp-gate';
import {
  evaluateHookHardSetupWinClamp,
  type HookHardSetupWinClampOptions,
  type HookHardSetupWinClampReport,
} from './hook-hard-setup-win-clamp-gate';
import {
  evaluateHookHardReactionWinClamp,
  type HookHardReactionWinClampOptions,
  type HookHardReactionWinClampReport,
} from './hook-hard-reaction-win-clamp-gate';

import {
  evaluateHookHardMidWinBolt,
  type HookHardMidWinBoltOptions,
  type HookHardMidWinBoltReport,
} from './hook-hard-mid-win-bolt-gate';
import {
  evaluateHookHardSetupWinBolt,
  type HookHardSetupWinBoltOptions,
  type HookHardSetupWinBoltReport,
} from './hook-hard-setup-win-bolt-gate';
import {
  evaluateHookHardReactionWinBolt,
  type HookHardReactionWinBoltOptions,
  type HookHardReactionWinBoltReport,
} from './hook-hard-reaction-win-bolt-gate';

import {
  evaluateHookHardMidWinBrace,
  type HookHardMidWinBraceOptions,
  type HookHardMidWinBraceReport,
} from './hook-hard-mid-win-brace-gate';
import {
  evaluateHookHardSetupWinBrace,
  type HookHardSetupWinBraceOptions,
  type HookHardSetupWinBraceReport,
} from './hook-hard-setup-win-brace-gate';
import {
  evaluateHookHardReactionWinBrace,
  type HookHardReactionWinBraceOptions,
  type HookHardReactionWinBraceReport,
} from './hook-hard-reaction-win-brace-gate';

import {
  evaluateHookHardMidWinCinch,
  type HookHardMidWinCinchOptions,
  type HookHardMidWinCinchReport,
} from './hook-hard-mid-win-cinch-gate';
import {
  evaluateHookHardSetupWinCinch,
  type HookHardSetupWinCinchOptions,
  type HookHardSetupWinCinchReport,
} from './hook-hard-setup-win-cinch-gate';
import {
  evaluateHookHardReactionWinCinch,
  type HookHardReactionWinCinchOptions,
  type HookHardReactionWinCinchReport,
} from './hook-hard-reaction-win-cinch-gate';

import {
  evaluateHookHardMidWinHitch,
  type HookHardMidWinHitchOptions,
  type HookHardMidWinHitchReport,
} from './hook-hard-mid-win-hitch-gate';
import {
  evaluateHookHardSetupWinHitch,
  type HookHardSetupWinHitchOptions,
  type HookHardSetupWinHitchReport,
} from './hook-hard-setup-win-hitch-gate';
import {
  evaluateHookHardReactionWinHitch,
  type HookHardReactionWinHitchOptions,
  type HookHardReactionWinHitchReport,
} from './hook-hard-reaction-win-hitch-gate';

import {
  evaluateHookHardMidWinKnot,
  type HookHardMidWinKnotOptions,
  type HookHardMidWinKnotReport,
} from './hook-hard-mid-win-knot-gate';
import {
  evaluateHookHardSetupWinKnot,
  type HookHardSetupWinKnotOptions,
  type HookHardSetupWinKnotReport,
} from './hook-hard-setup-win-knot-gate';
import {
  evaluateHookHardReactionWinKnot,
  type HookHardReactionWinKnotOptions,
  type HookHardReactionWinKnotReport,
} from './hook-hard-reaction-win-knot-gate';

import {
  evaluateHookHardMidWinLace,
  type HookHardMidWinLaceOptions,
  type HookHardMidWinLaceReport,
} from './hook-hard-mid-win-lace-gate';
import {
  evaluateHookHardSetupWinLace,
  type HookHardSetupWinLaceOptions,
  type HookHardSetupWinLaceReport,
} from './hook-hard-setup-win-lace-gate';
import {
  evaluateHookHardReactionWinLace,
  type HookHardReactionWinLaceOptions,
  type HookHardReactionWinLaceReport,
} from './hook-hard-reaction-win-lace-gate';

import {
  evaluateHookHardMidWinSash,
  type HookHardMidWinSashOptions,
  type HookHardMidWinSashReport,
} from './hook-hard-mid-win-sash-gate';
import {
  evaluateHookHardSetupWinSash,
  type HookHardSetupWinSashOptions,
  type HookHardSetupWinSashReport,
} from './hook-hard-setup-win-sash-gate';
import {
  evaluateHookHardReactionWinSash,
  type HookHardReactionWinSashOptions,
  type HookHardReactionWinSashReport,
} from './hook-hard-reaction-win-sash-gate';

import {
  evaluateHookHardMidWinWrap,
  type HookHardMidWinWrapOptions,
  type HookHardMidWinWrapReport,
} from './hook-hard-mid-win-wrap-gate';
import {
  evaluateHookHardSetupWinWrap,
  type HookHardSetupWinWrapOptions,
  type HookHardSetupWinWrapReport,
} from './hook-hard-setup-win-wrap-gate';
import {
  evaluateHookHardReactionWinWrap,
  type HookHardReactionWinWrapOptions,
  type HookHardReactionWinWrapReport,
} from './hook-hard-reaction-win-wrap-gate';

import {
  evaluateHookHardMidWinBand,
  type HookHardMidWinBandOptions,
  type HookHardMidWinBandReport,
} from './hook-hard-mid-win-band-gate';
import {
  evaluateHookHardSetupWinBand,
  type HookHardSetupWinBandOptions,
  type HookHardSetupWinBandReport,
} from './hook-hard-setup-win-band-gate';
import {
  evaluateHookHardReactionWinBand,
  type HookHardReactionWinBandOptions,
  type HookHardReactionWinBandReport,
} from './hook-hard-reaction-win-band-gate';

import {
  evaluateHookHardMidWinCord,
  type HookHardMidWinCordOptions,
  type HookHardMidWinCordReport,
} from './hook-hard-mid-win-cord-gate';
import {
  evaluateHookHardSetupWinCord,
  type HookHardSetupWinCordOptions,
  type HookHardSetupWinCordReport,
} from './hook-hard-setup-win-cord-gate';
import {
  evaluateHookHardReactionWinCord,
  type HookHardReactionWinCordOptions,
  type HookHardReactionWinCordReport,
} from './hook-hard-reaction-win-cord-gate';
















import {
  evaluateHookHardMidWinStrap,
  type HookHardMidWinStrapOptions,
  type HookHardMidWinStrapReport,
} from './hook-hard-mid-win-strap-gate';
import {
  evaluateHookHardSetupWinStrap,
  type HookHardSetupWinStrapOptions,
  type HookHardSetupWinStrapReport,
} from './hook-hard-setup-win-strap-gate';
import {
  evaluateHookHardReactionWinStrap,
  type HookHardReactionWinStrapOptions,
  type HookHardReactionWinStrapReport,
} from './hook-hard-reaction-win-strap-gate';
import {
  evaluateHookHardMidWinTie,
  type HookHardMidWinTieOptions,
  type HookHardMidWinTieReport,
} from './hook-hard-mid-win-tie-gate';
import {
  evaluateHookHardSetupWinTie,
  type HookHardSetupWinTieOptions,
  type HookHardSetupWinTieReport,
} from './hook-hard-setup-win-tie-gate';
import {
  evaluateHookHardReactionWinTie,
  type HookHardReactionWinTieOptions,
  type HookHardReactionWinTieReport,
} from './hook-hard-reaction-win-tie-gate';
import {
  evaluateHookHardMidWinPin,
  type HookHardMidWinPinOptions,
  type HookHardMidWinPinReport,
} from './hook-hard-mid-win-pin-gate';
import {
  evaluateHookHardSetupWinPin,
  type HookHardSetupWinPinOptions,
  type HookHardSetupWinPinReport,
} from './hook-hard-setup-win-pin-gate';
import {
  evaluateHookHardReactionWinPin,
  type HookHardReactionWinPinOptions,
  type HookHardReactionWinPinReport,
} from './hook-hard-reaction-win-pin-gate';
import {
  evaluateHookHardMidWinClip,
  type HookHardMidWinClipOptions,
  type HookHardMidWinClipReport,
} from './hook-hard-mid-win-clip-gate';
import {
  evaluateHookHardSetupWinClip,
  type HookHardSetupWinClipOptions,
  type HookHardSetupWinClipReport,
} from './hook-hard-setup-win-clip-gate';
import {
  evaluateHookHardReactionWinClip,
  type HookHardReactionWinClipOptions,
  type HookHardReactionWinClipReport,
} from './hook-hard-reaction-win-clip-gate';
import {
  evaluateHookHardMidWinGrip,
  type HookHardMidWinGripOptions,
  type HookHardMidWinGripReport,
} from './hook-hard-mid-win-grip-gate';
import {
  evaluateHookHardSetupWinGrip,
  type HookHardSetupWinGripOptions,
  type HookHardSetupWinGripReport,
} from './hook-hard-setup-win-grip-gate';
import {
  evaluateHookHardReactionWinGrip,
  type HookHardReactionWinGripOptions,
  type HookHardReactionWinGripReport,
} from './hook-hard-reaction-win-grip-gate';
import {
  evaluateHookHardMidWinClasp,
  type HookHardMidWinClaspOptions,
  type HookHardMidWinClaspReport,
} from './hook-hard-mid-win-clasp-gate';
import {
  evaluateHookHardSetupWinClasp,
  type HookHardSetupWinClaspOptions,
  type HookHardSetupWinClaspReport,
} from './hook-hard-setup-win-clasp-gate';
import {
  evaluateHookHardReactionWinClasp,
  type HookHardReactionWinClaspOptions,
  type HookHardReactionWinClaspReport,
} from './hook-hard-reaction-win-clasp-gate';
import {
  evaluateHookHardMidWinGrasp,
  type HookHardMidWinGraspOptions,
  type HookHardMidWinGraspReport,
} from './hook-hard-mid-win-grasp-gate';
import {
  evaluateHookHardSetupWinGrasp,
  type HookHardSetupWinGraspOptions,
  type HookHardSetupWinGraspReport,
} from './hook-hard-setup-win-grasp-gate';
import {
  evaluateHookHardReactionWinGrasp,
  type HookHardReactionWinGraspOptions,
  type HookHardReactionWinGraspReport,
} from './hook-hard-reaction-win-grasp-gate';
import {
  evaluateHookHardMidWinRivet,
  type HookHardMidWinRivetOptions,
  type HookHardMidWinRivetReport,
} from './hook-hard-mid-win-rivet-gate';
import {
  evaluateHookHardSetupWinRivet,
  type HookHardSetupWinRivetOptions,
  type HookHardSetupWinRivetReport,
} from './hook-hard-setup-win-rivet-gate';
import {
  evaluateHookHardReactionWinRivet,
  type HookHardReactionWinRivetOptions,
  type HookHardReactionWinRivetReport,
} from './hook-hard-reaction-win-rivet-gate';
import {
  evaluateHookHardMidWinWeld,
  type HookHardMidWinWeldOptions,
  type HookHardMidWinWeldReport,
} from './hook-hard-mid-win-weld-gate';
import {
  evaluateHookHardSetupWinWeld,
  type HookHardSetupWinWeldOptions,
  type HookHardSetupWinWeldReport,
} from './hook-hard-setup-win-weld-gate';
import {
  evaluateHookHardReactionWinWeld,
  type HookHardReactionWinWeldOptions,
  type HookHardReactionWinWeldReport,
} from './hook-hard-reaction-win-weld-gate';
import {
  evaluateHookHardMidWinCleat,
  type HookHardMidWinCleatOptions,
  type HookHardMidWinCleatReport,
} from './hook-hard-mid-win-cleat-gate';
import {
  evaluateHookHardSetupWinCleat,
  type HookHardSetupWinCleatOptions,
  type HookHardSetupWinCleatReport,
} from './hook-hard-setup-win-cleat-gate';
import {
  evaluateHookHardReactionWinCleat,
  type HookHardReactionWinCleatOptions,
  type HookHardReactionWinCleatReport,
} from './hook-hard-reaction-win-cleat-gate';

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
  'hookHardColdCap',
  'hookHardTailCap',
  'hookHardWindowRatio',
  'hookHardReactionRatio',
  'hookHardDialogueBan',
  'hookHardCliffDialogueBan',
  'hookHardReactionBan',
  'hookHardMidDialogueBan',
  'hookHardSetupDialogueBan',
  'hookHardColdDialogueBan',
  'hookHardTailDialogueBan',
  'hookHardWindowDialogueBan',
  'hookHardWindowCap',
  'hookHardFaceRatio',
  'hookHardFaceCap',
  'hookHardWindowFaceCap',
  'hookHardTailRatio',
  'hookHardColdRatio',
  'hookHardWindowTailCap',
  'hookHardFaceTailCap',
  'hookHardColdFaceCap',
  'hookHardMidFaceCap',
  'hookHardSetupFaceCap',
  'hookHardReactionFaceCap',
  'hookHardMidTailCap',
  'hookHardSetupTailCap',
  'hookHardReactionTailCap',
  'hookHardMidColdCap',
  'hookHardSetupColdCap',
  'hookHardReactionColdCap',
  'hookHardMidWindow',
  'hookHardSetupWindow',
  'hookHardReactionWinCap',
  'hookHardMidWinCap',
  'hookHardSetupWinCap',
  'hookHardReactionWinHold',
  'hookHardMidWinHold',
  'hookHardSetupWinHold',
  'hookHardReactionWinFloor',
  'hookHardMidWinFloor',
  'hookHardSetupWinFloor',
  'hookHardReactionWinCeil',
  'hookHardMidWinCeil',
  'hookHardSetupWinCeil',
  'hookHardReactionWinSpan',
  'hookHardMidWinSpan',
  'hookHardSetupWinSpan',
  'hookHardReactionWinPeak',
  'hookHardMidWinPeak',
  'hookHardSetupWinPeak',
  'hookHardReactionWinEdge',
  'hookHardMidWinEdge',
  'hookHardSetupWinEdge',
  'hookHardReactionWinCrest',
  'hookHardMidWinLatch',
  'hookHardSetupWinLatch',
  'hookHardReactionWinLatch',
  'hookHardMidWinBind',
  'hookHardSetupWinBind',
  'hookHardReactionWinBind',
  'hookHardMidWinSeal',
  'hookHardSetupWinSeal',
  'hookHardReactionWinSeal',
  'hookHardMidWinLock',
  'hookHardSetupWinLock',
  'hookHardReactionWinLock',
  'hookHardMidWinClamp',
  'hookHardSetupWinClamp',
  'hookHardReactionWinClamp',
  'hookHardMidWinBolt',
  'hookHardSetupWinBolt',
  'hookHardReactionWinBolt',
  'hookHardMidWinBrace',
  'hookHardSetupWinBrace',
  'hookHardReactionWinBrace',
  'hookHardMidWinCinch',
  'hookHardSetupWinCinch',
  'hookHardReactionWinCinch',
  'hookHardMidWinHitch',
  'hookHardSetupWinHitch',
  'hookHardReactionWinHitch',
  'hookHardMidWinKnot',
  'hookHardSetupWinKnot',
  'hookHardReactionWinKnot',
  'hookHardMidWinLace',
  'hookHardSetupWinLace',
  'hookHardReactionWinLace',
  'hookHardMidWinSash',
  'hookHardSetupWinSash',
  'hookHardReactionWinSash',
  'hookHardMidWinWrap',
  'hookHardSetupWinWrap',
  'hookHardReactionWinWrap',
  'hookHardMidWinBand',
  'hookHardSetupWinBand',
  'hookHardReactionWinBand',
  'hookHardMidWinCord',
  'hookHardSetupWinCord',
  'hookHardReactionWinCord',
  'hookHardMidWinStrap',
  'hookHardSetupWinStrap',
  'hookHardReactionWinStrap',
  'hookHardMidWinTie',
  'hookHardSetupWinTie',
  'hookHardReactionWinTie',
  'hookHardMidWinPin',
  'hookHardSetupWinPin',
  'hookHardReactionWinPin',
  'hookHardMidWinClip',
  'hookHardSetupWinClip',
  'hookHardReactionWinClip',
  'hookHardMidWinGrip',
  'hookHardSetupWinGrip',
  'hookHardReactionWinGrip',
  'hookHardMidWinClasp',
  'hookHardSetupWinClasp',
  'hookHardReactionWinClasp',
  'hookHardMidWinGrasp',
  'hookHardSetupWinGrasp',
  'hookHardReactionWinGrasp',
  'hookHardMidWinRivet',
  'hookHardSetupWinRivet',
  'hookHardReactionWinRivet',
  'hookHardMidWinWeld',
  'hookHardSetupWinWeld',
  'hookHardReactionWinWeld',
  'hookHardMidWinCleat',
  'hookHardSetupWinCleat',
  'hookHardReactionWinCleat',
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



const HookHardColdCapOptsSchema = z
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

const HookHardTailCapOptsSchema = z
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

const HookHardWindowRatioOptsSchema = z
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

const HookHardReactionRatioOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requireReaction: z.boolean().optional(),
    requirePriorReaction: z.boolean().optional(),
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

const HookHardDialogueBanOptsSchema = z
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

const HookHardCliffDialogueBanOptsSchema = z
  .object({
    banDialogueBeforeCliff: z.boolean().optional(),
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

const HookHardReactionBanOptsSchema = z
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

const HookHardMidDialogueBanOptsSchema = z
  .object({
    midHookByRatio: z.number().positive().optional(),
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

const HookHardSetupDialogueBanOptsSchema = z
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




const HookHardColdDialogueBanOptsSchema = z
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

const HookHardTailDialogueBanOptsSchema = z
  .object({
    hardTailToleranceSec: z.number().positive().optional(),
    banDialogueBeforeCliff: z.boolean().optional(),
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

const HookHardWindowDialogueBanOptsSchema = z
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

const HookHardWindowCapOptsSchema = z
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

const HookHardFaceRatioOptsSchema = z
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

const HookHardFaceCapOptsSchema = z
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

const HookHardWindowFaceCapOptsSchema = z
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

const HookHardTailRatioOptsSchema = z
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

const HookHardColdRatioOptsSchema = z
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

const HookHardWindowTailCapOptsSchema = z
  .object({
    hardHookWindowSec: z.number().positive().optional(),
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

const HookHardFaceTailCapOptsSchema = z
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

const HookHardColdFaceCapOptsSchema = z
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

const HookHardMidFaceCapOptsSchema = z
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

const HookHardSetupFaceCapOptsSchema = z
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

const HookHardReactionFaceCapOptsSchema = z
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

const HookHardMidTailCapOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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

const HookHardSetupTailCapOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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

const HookHardReactionTailCapOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requireReaction: z.boolean().optional(),
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

const HookHardMidColdCapOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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

const HookHardSetupColdCapOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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

const HookHardReactionColdCapOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requireReaction: z.boolean().optional(),
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

const HookHardMidWindowOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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

const HookHardSetupWindowOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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

const HookHardReactionWinCapOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requireReaction: z.boolean().optional(),
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

const HookHardMidWinCapOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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

const HookHardSetupWinCapOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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

const HookHardReactionWinHoldOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requireReaction: z.boolean().optional(),
    requirePriorReaction: z.boolean().optional(),
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

const HookHardMidWinHoldOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
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

const HookHardSetupWinHoldOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
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

const HookHardReactionWinFloorOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requireReaction: z.boolean().optional(),
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

const HookHardMidWinFloorOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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

const HookHardSetupWinFloorOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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

const HookHardReactionWinCeilOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
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

const HookHardMidWinCeilOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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

const HookHardSetupWinCeilOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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

const HookHardReactionWinSpanOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
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

const HookHardMidWinSpanOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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

const HookHardSetupWinSpanOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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

const HookHardReactionWinPeakOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
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

const HookHardMidWinPeakOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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

const HookHardSetupWinPeakOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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


const HookHardMidWinEdgeOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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

const HookHardSetupWinEdgeOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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

const HookHardReactionWinCrestOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
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

const HookHardMidWinLatchOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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

const HookHardSetupWinLatchOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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

const HookHardReactionWinLatchOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
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

const HookHardMidWinBindOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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

const HookHardSetupWinBindOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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

const HookHardReactionWinBindOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
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

const HookHardMidWinSealOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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

const HookHardSetupWinSealOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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

const HookHardReactionWinSealOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
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

const HookHardMidWinLockOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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

const HookHardSetupWinLockOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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

const HookHardReactionWinLockOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
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

const HookHardMidWinClampOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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

const HookHardSetupWinClampOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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

const HookHardReactionWinClampOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
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

const HookHardMidWinBoltOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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

const HookHardSetupWinBoltOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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

const HookHardReactionWinBoltOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
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

const HookHardMidWinBraceOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardSetupWinBraceOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardReactionWinBraceOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
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

const HookHardMidWinCinchOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardSetupWinCinchOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardReactionWinCinchOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
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

const HookHardMidWinHitchOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardSetupWinHitchOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardReactionWinHitchOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
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

const HookHardMidWinKnotOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardSetupWinKnotOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardReactionWinKnotOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
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

const HookHardMidWinLaceOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardSetupWinLaceOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardReactionWinLaceOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
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

const HookHardMidWinSashOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardSetupWinSashOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardReactionWinSashOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
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

const HookHardMidWinWrapOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardSetupWinWrapOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardReactionWinWrapOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
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

const HookHardMidWinBandOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardSetupWinBandOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardReactionWinBandOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
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

const HookHardMidWinCordOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardSetupWinCordOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardReactionWinCordOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
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

const HookHardMidWinStrapOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardSetupWinStrapOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardReactionWinStrapOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
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
const HookHardMidWinTieOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardSetupWinTieOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardReactionWinTieOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
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

const HookHardMidWinPinOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardSetupWinPinOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardReactionWinPinOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
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

const HookHardMidWinClipOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardSetupWinClipOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardReactionWinClipOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
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

const HookHardMidWinGripOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardSetupWinGripOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardReactionWinGripOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
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

const HookHardMidWinClaspOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardSetupWinClaspOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardReactionWinClaspOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
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

const HookHardMidWinGraspOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardSetupWinGraspOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardReactionWinGraspOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
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

const HookHardMidWinRivetOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardSetupWinRivetOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardReactionWinRivetOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
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

const HookHardMidWinWeldOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardSetupWinWeldOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardReactionWinWeldOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
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

const HookHardMidWinCleatOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardSetupWinCleatOptsSchema = z
  .object({
    maxMidSetupRatio: z.number().positive().optional(),
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
const HookHardReactionWinCleatOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
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




const HookHardReactionWinEdgeOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requirePriorReaction: z.boolean().optional(),
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
    hookHardColdCap: ShotSpecDocSchema.optional(),
    hookHardTailCap: ShotSpecDocSchema.optional(),
    hookHardWindowRatio: ShotSpecDocSchema.optional(),
    hookHardReactionRatio: ShotSpecDocSchema.optional(),
    hookHardDialogueBan: ShotSpecDocSchema.optional(),
    hookHardCliffDialogueBan: ShotSpecDocSchema.optional(),
    hookHardReactionBan: ShotSpecDocSchema.optional(),
    hookHardMidDialogueBan: ShotSpecDocSchema.optional(),
    hookHardSetupDialogueBan: ShotSpecDocSchema.optional(),
        hookHardColdDialogueBan: ShotSpecDocSchema.optional(),
    hookHardTailDialogueBan: ShotSpecDocSchema.optional(),
    hookHardWindowDialogueBan: ShotSpecDocSchema.optional(),
    hookHardWindowCap: ShotSpecDocSchema.optional(),
    hookHardFaceRatio: ShotSpecDocSchema.optional(),
    hookHardFaceCap: ShotSpecDocSchema.optional(),
    hookHardWindowFaceCap: ShotSpecDocSchema.optional(),
    hookHardTailRatio: ShotSpecDocSchema.optional(),
    hookHardColdRatio: ShotSpecDocSchema.optional(),
    hookHardWindowTailCap: ShotSpecDocSchema.optional(),
    hookHardFaceTailCap: ShotSpecDocSchema.optional(),
    hookHardColdFaceCap: ShotSpecDocSchema.optional(),
    hookHardMidFaceCap: ShotSpecDocSchema.optional(),
    hookHardSetupFaceCap: ShotSpecDocSchema.optional(),
    hookHardReactionFaceCap: ShotSpecDocSchema.optional(),
    hookHardMidTailCap: ShotSpecDocSchema.optional(),
    hookHardSetupTailCap: ShotSpecDocSchema.optional(),
    hookHardReactionTailCap: ShotSpecDocSchema.optional(),
    hookHardMidColdCap: ShotSpecDocSchema.optional(),
    hookHardSetupColdCap: ShotSpecDocSchema.optional(),
    hookHardReactionColdCap: ShotSpecDocSchema.optional(),
    hookHardMidWindow: ShotSpecDocSchema.optional(),
    hookHardSetupWindow: ShotSpecDocSchema.optional(),
    hookHardReactionWinCap: ShotSpecDocSchema.optional(),
    hookHardMidWinCap: ShotSpecDocSchema.optional(),
    hookHardSetupWinCap: ShotSpecDocSchema.optional(),
    hookHardReactionWinHold: ShotSpecDocSchema.optional(),
    hookHardMidWinHold: ShotSpecDocSchema.optional(),
    hookHardSetupWinHold: ShotSpecDocSchema.optional(),
    hookHardReactionWinFloor: ShotSpecDocSchema.optional(),
    hookHardMidWinFloor: ShotSpecDocSchema.optional(),
    hookHardSetupWinFloor: ShotSpecDocSchema.optional(),
    hookHardReactionWinCeil: ShotSpecDocSchema.optional(),
    hookHardMidWinCeil: ShotSpecDocSchema.optional(),
    hookHardSetupWinCeil: ShotSpecDocSchema.optional(),
    hookHardReactionWinSpan: ShotSpecDocSchema.optional(),
    hookHardMidWinSpan: ShotSpecDocSchema.optional(),
    hookHardSetupWinSpan: ShotSpecDocSchema.optional(),
    hookHardReactionWinPeak: ShotSpecDocSchema.optional(),
    hookHardMidWinPeak: ShotSpecDocSchema.optional(),
    hookHardSetupWinPeak: ShotSpecDocSchema.optional(),
    hookHardReactionWinEdge: ShotSpecDocSchema.optional(),
    hookHardMidWinEdge: ShotSpecDocSchema.optional(),
    hookHardSetupWinEdge: ShotSpecDocSchema.optional(),
    hookHardReactionWinCrest: ShotSpecDocSchema.optional(),
    hookHardMidWinLatch: ShotSpecDocSchema.optional(),
    hookHardSetupWinLatch: ShotSpecDocSchema.optional(),
    hookHardReactionWinLatch: ShotSpecDocSchema.optional(),
    hookHardMidWinBind: ShotSpecDocSchema.optional(),
    hookHardSetupWinBind: ShotSpecDocSchema.optional(),
    hookHardReactionWinBind: ShotSpecDocSchema.optional(),
    hookHardMidWinSeal: ShotSpecDocSchema.optional(),
    hookHardSetupWinSeal: ShotSpecDocSchema.optional(),
    hookHardReactionWinSeal: ShotSpecDocSchema.optional(),
    hookHardMidWinLock: ShotSpecDocSchema.optional(),
    hookHardSetupWinLock: ShotSpecDocSchema.optional(),
    hookHardReactionWinLock: ShotSpecDocSchema.optional(),
    hookHardMidWinClamp: ShotSpecDocSchema.optional(),
    hookHardSetupWinClamp: ShotSpecDocSchema.optional(),
    hookHardReactionWinClamp: ShotSpecDocSchema.optional(),
    hookHardMidWinBolt: ShotSpecDocSchema.optional(),
    hookHardSetupWinBolt: ShotSpecDocSchema.optional(),
    hookHardReactionWinBolt: ShotSpecDocSchema.optional(),
    hookHardMidWinBrace: ShotSpecDocSchema.optional(),
    hookHardSetupWinBrace: ShotSpecDocSchema.optional(),
    hookHardReactionWinBrace: ShotSpecDocSchema.optional(),
    hookHardMidWinCinch: ShotSpecDocSchema.optional(),
    hookHardSetupWinCinch: ShotSpecDocSchema.optional(),
    hookHardReactionWinCinch: ShotSpecDocSchema.optional(),
    hookHardMidWinHitch: ShotSpecDocSchema.optional(),
    hookHardSetupWinHitch: ShotSpecDocSchema.optional(),
    hookHardReactionWinHitch: ShotSpecDocSchema.optional(),
    hookHardMidWinKnot: ShotSpecDocSchema.optional(),
    hookHardSetupWinKnot: ShotSpecDocSchema.optional(),
    hookHardReactionWinKnot: ShotSpecDocSchema.optional(),
    hookHardMidWinLace: ShotSpecDocSchema.optional(),
    hookHardSetupWinLace: ShotSpecDocSchema.optional(),
    hookHardReactionWinLace: ShotSpecDocSchema.optional(),
    hookHardMidWinSash: ShotSpecDocSchema.optional(),
    hookHardSetupWinSash: ShotSpecDocSchema.optional(),
    hookHardReactionWinSash: ShotSpecDocSchema.optional(),
    hookHardMidWinWrap: ShotSpecDocSchema.optional(),
    hookHardSetupWinWrap: ShotSpecDocSchema.optional(),
    hookHardReactionWinWrap: ShotSpecDocSchema.optional(),
    hookHardMidWinBand: ShotSpecDocSchema.optional(),
    hookHardSetupWinBand: ShotSpecDocSchema.optional(),
    hookHardReactionWinBand: ShotSpecDocSchema.optional(),
    hookHardMidWinCord: ShotSpecDocSchema.optional(),
    hookHardSetupWinCord: ShotSpecDocSchema.optional(),
    hookHardReactionWinCord: ShotSpecDocSchema.optional(),
    hookHardMidWinStrap: ShotSpecDocSchema.optional(),
    hookHardSetupWinStrap: ShotSpecDocSchema.optional(),
    hookHardReactionWinStrap: ShotSpecDocSchema.optional(),
    hookHardMidWinTie: ShotSpecDocSchema.optional(),
    hookHardSetupWinTie: ShotSpecDocSchema.optional(),
    hookHardReactionWinTie: ShotSpecDocSchema.optional(),
    hookHardMidWinPin: ShotSpecDocSchema.optional(),
    hookHardSetupWinPin: ShotSpecDocSchema.optional(),
    hookHardReactionWinPin: ShotSpecDocSchema.optional(),
    hookHardMidWinClip: ShotSpecDocSchema.optional(),
    hookHardSetupWinClip: ShotSpecDocSchema.optional(),
    hookHardReactionWinClip: ShotSpecDocSchema.optional(),
    hookHardMidWinGrip: ShotSpecDocSchema.optional(),
    hookHardSetupWinGrip: ShotSpecDocSchema.optional(),
    hookHardReactionWinGrip: ShotSpecDocSchema.optional(),
    hookHardMidWinClasp: ShotSpecDocSchema.optional(),
    hookHardSetupWinClasp: ShotSpecDocSchema.optional(),
    hookHardReactionWinClasp: ShotSpecDocSchema.optional(),
    hookHardMidWinGrasp: ShotSpecDocSchema.optional(),
    hookHardSetupWinGrasp: ShotSpecDocSchema.optional(),
    hookHardReactionWinGrasp: ShotSpecDocSchema.optional(),
    hookHardMidWinRivet: ShotSpecDocSchema.optional(),
    hookHardSetupWinRivet: ShotSpecDocSchema.optional(),
    hookHardReactionWinRivet: ShotSpecDocSchema.optional(),
    hookHardMidWinWeld: ShotSpecDocSchema.optional(),
    hookHardSetupWinWeld: ShotSpecDocSchema.optional(),
    hookHardReactionWinWeld: ShotSpecDocSchema.optional(),
    hookHardMidWinCleat: ShotSpecDocSchema.optional(),
    hookHardSetupWinCleat: ShotSpecDocSchema.optional(),
    hookHardReactionWinCleat: ShotSpecDocSchema.optional(),
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
    hookHardColdCapOpts: HookHardColdCapOptsSchema.optional(),
    hookHardTailCapOpts: HookHardTailCapOptsSchema.optional(),
    hookHardWindowRatioOpts: HookHardWindowRatioOptsSchema.optional(),
    hookHardReactionRatioOpts: HookHardReactionRatioOptsSchema.optional(),
    hookHardDialogueBanOpts: HookHardDialogueBanOptsSchema.optional(),
    hookHardCliffDialogueBanOpts: HookHardCliffDialogueBanOptsSchema.optional(),
    hookHardReactionBanOpts: HookHardReactionBanOptsSchema.optional(),
    hookHardMidDialogueBanOpts: HookHardMidDialogueBanOptsSchema.optional(),
    hookHardSetupDialogueBanOpts: HookHardSetupDialogueBanOptsSchema.optional(),
    hookHardColdDialogueBanOpts: HookHardColdDialogueBanOptsSchema.optional(),
    hookHardTailDialogueBanOpts: HookHardTailDialogueBanOptsSchema.optional(),
    hookHardWindowDialogueBanOpts: HookHardWindowDialogueBanOptsSchema.optional(),
    hookHardWindowCapOpts: HookHardWindowCapOptsSchema.optional(),
    hookHardFaceRatioOpts: HookHardFaceRatioOptsSchema.optional(),
    hookHardFaceCapOpts: HookHardFaceCapOptsSchema.optional(),
    hookHardWindowFaceCapOpts: HookHardWindowFaceCapOptsSchema.optional(),
    hookHardTailRatioOpts: HookHardTailRatioOptsSchema.optional(),
    hookHardColdRatioOpts: HookHardColdRatioOptsSchema.optional(),
    hookHardWindowTailCapOpts: HookHardWindowTailCapOptsSchema.optional(),
    hookHardFaceTailCapOpts: HookHardFaceTailCapOptsSchema.optional(),
    hookHardColdFaceCapOpts: HookHardColdFaceCapOptsSchema.optional(),
    hookHardMidFaceCapOpts: HookHardMidFaceCapOptsSchema.optional(),
    hookHardSetupFaceCapOpts: HookHardSetupFaceCapOptsSchema.optional(),
    hookHardReactionFaceCapOpts: HookHardReactionFaceCapOptsSchema.optional(),
    hookHardMidTailCapOpts: HookHardMidTailCapOptsSchema.optional(),
    hookHardSetupTailCapOpts: HookHardSetupTailCapOptsSchema.optional(),
    hookHardReactionTailCapOpts: HookHardReactionTailCapOptsSchema.optional(),
    hookHardMidColdCapOpts: HookHardMidColdCapOptsSchema.optional(),
    hookHardSetupColdCapOpts: HookHardSetupColdCapOptsSchema.optional(),
    hookHardReactionColdCapOpts: HookHardReactionColdCapOptsSchema.optional(),
    hookHardMidWindowOpts: HookHardMidWindowOptsSchema.optional(),
    hookHardSetupWindowOpts: HookHardSetupWindowOptsSchema.optional(),
    hookHardReactionWinCapOpts: HookHardReactionWinCapOptsSchema.optional(),
    hookHardMidWinCapOpts: HookHardMidWinCapOptsSchema.optional(),
    hookHardSetupWinCapOpts: HookHardSetupWinCapOptsSchema.optional(),
    hookHardReactionWinHoldOpts: HookHardReactionWinHoldOptsSchema.optional(),
    hookHardMidWinHoldOpts: HookHardMidWinHoldOptsSchema.optional(),
    hookHardSetupWinHoldOpts: HookHardSetupWinHoldOptsSchema.optional(),
    hookHardReactionWinFloorOpts: HookHardReactionWinFloorOptsSchema.optional(),
    hookHardMidWinFloorOpts: HookHardMidWinFloorOptsSchema.optional(),
    hookHardSetupWinFloorOpts: HookHardSetupWinFloorOptsSchema.optional(),
    hookHardReactionWinCeilOpts: HookHardReactionWinCeilOptsSchema.optional(),
    hookHardMidWinCeilOpts: HookHardMidWinCeilOptsSchema.optional(),
    hookHardSetupWinCeilOpts: HookHardSetupWinCeilOptsSchema.optional(),
    hookHardReactionWinSpanOpts: HookHardReactionWinSpanOptsSchema.optional(),
    hookHardMidWinSpanOpts: HookHardMidWinSpanOptsSchema.optional(),
    hookHardSetupWinSpanOpts: HookHardSetupWinSpanOptsSchema.optional(),
    hookHardReactionWinPeakOpts: HookHardReactionWinPeakOptsSchema.optional(),
    hookHardMidWinPeakOpts: HookHardMidWinPeakOptsSchema.optional(),
    hookHardSetupWinPeakOpts: HookHardSetupWinPeakOptsSchema.optional(),
    hookHardReactionWinEdgeOpts: HookHardReactionWinEdgeOptsSchema.optional(),
    hookHardMidWinEdgeOpts: HookHardMidWinEdgeOptsSchema.optional(),
    hookHardSetupWinEdgeOpts: HookHardSetupWinEdgeOptsSchema.optional(),
    hookHardReactionWinCrestOpts: HookHardReactionWinCrestOptsSchema.optional(),
    hookHardMidWinLatchOpts: HookHardMidWinLatchOptsSchema.optional(),
    hookHardSetupWinLatchOpts: HookHardSetupWinLatchOptsSchema.optional(),
    hookHardReactionWinLatchOpts: HookHardReactionWinLatchOptsSchema.optional(),
    hookHardMidWinBindOpts: HookHardMidWinBindOptsSchema.optional(),
    hookHardSetupWinBindOpts: HookHardSetupWinBindOptsSchema.optional(),
    hookHardReactionWinBindOpts: HookHardReactionWinBindOptsSchema.optional(),
    hookHardMidWinSealOpts: HookHardMidWinSealOptsSchema.optional(),
    hookHardSetupWinSealOpts: HookHardSetupWinSealOptsSchema.optional(),
    hookHardReactionWinSealOpts: HookHardReactionWinSealOptsSchema.optional(),
    hookHardMidWinLockOpts: HookHardMidWinLockOptsSchema.optional(),
    hookHardSetupWinLockOpts: HookHardSetupWinLockOptsSchema.optional(),
    hookHardReactionWinLockOpts: HookHardReactionWinLockOptsSchema.optional(),
    hookHardMidWinClampOpts: HookHardMidWinClampOptsSchema.optional(),
    hookHardSetupWinClampOpts: HookHardSetupWinClampOptsSchema.optional(),
    hookHardReactionWinClampOpts: HookHardReactionWinClampOptsSchema.optional(),
    hookHardMidWinBoltOpts: HookHardMidWinBoltOptsSchema.optional(),
    hookHardSetupWinBoltOpts: HookHardSetupWinBoltOptsSchema.optional(),
    hookHardReactionWinBoltOpts: HookHardReactionWinBoltOptsSchema.optional(),
    hookHardMidWinBraceOpts: HookHardMidWinBraceOptsSchema.optional(),
    hookHardSetupWinBraceOpts: HookHardSetupWinBraceOptsSchema.optional(),
    hookHardReactionWinBraceOpts: HookHardReactionWinBraceOptsSchema.optional(),
    hookHardMidWinCinchOpts: HookHardMidWinCinchOptsSchema.optional(),
    hookHardSetupWinCinchOpts: HookHardSetupWinCinchOptsSchema.optional(),
    hookHardReactionWinCinchOpts: HookHardReactionWinCinchOptsSchema.optional(),
    hookHardMidWinHitchOpts: HookHardMidWinHitchOptsSchema.optional(),
    hookHardSetupWinHitchOpts: HookHardSetupWinHitchOptsSchema.optional(),
    hookHardReactionWinHitchOpts: HookHardReactionWinHitchOptsSchema.optional(),
    hookHardMidWinKnotOpts: HookHardMidWinKnotOptsSchema.optional(),
    hookHardSetupWinKnotOpts: HookHardSetupWinKnotOptsSchema.optional(),
    hookHardReactionWinKnotOpts: HookHardReactionWinKnotOptsSchema.optional(),
    hookHardMidWinLaceOpts: HookHardMidWinLaceOptsSchema.optional(),
    hookHardSetupWinLaceOpts: HookHardSetupWinLaceOptsSchema.optional(),
    hookHardReactionWinLaceOpts: HookHardReactionWinLaceOptsSchema.optional(),
    hookHardMidWinSashOpts: HookHardMidWinSashOptsSchema.optional(),
    hookHardSetupWinSashOpts: HookHardSetupWinSashOptsSchema.optional(),
    hookHardReactionWinSashOpts: HookHardReactionWinSashOptsSchema.optional(),
    hookHardMidWinWrapOpts: HookHardMidWinWrapOptsSchema.optional(),
    hookHardSetupWinWrapOpts: HookHardSetupWinWrapOptsSchema.optional(),
    hookHardReactionWinWrapOpts: HookHardReactionWinWrapOptsSchema.optional(),
    hookHardMidWinBandOpts: HookHardMidWinBandOptsSchema.optional(),
    hookHardSetupWinBandOpts: HookHardSetupWinBandOptsSchema.optional(),
    hookHardReactionWinBandOpts: HookHardReactionWinBandOptsSchema.optional(),
    hookHardMidWinCordOpts: HookHardMidWinCordOptsSchema.optional(),
    hookHardSetupWinCordOpts: HookHardSetupWinCordOptsSchema.optional(),
    hookHardReactionWinCordOpts: HookHardReactionWinCordOptsSchema.optional(),
    hookHardMidWinStrapOpts: HookHardMidWinStrapOptsSchema.optional(),
    hookHardSetupWinStrapOpts: HookHardSetupWinStrapOptsSchema.optional(),
    hookHardReactionWinStrapOpts: HookHardReactionWinStrapOptsSchema.optional(),
    hookHardMidWinTieOpts: HookHardMidWinTieOptsSchema.optional(),
    hookHardSetupWinTieOpts: HookHardSetupWinTieOptsSchema.optional(),
    hookHardReactionWinTieOpts: HookHardReactionWinTieOptsSchema.optional(),
    hookHardMidWinPinOpts: HookHardMidWinPinOptsSchema.optional(),
    hookHardSetupWinPinOpts: HookHardSetupWinPinOptsSchema.optional(),
    hookHardReactionWinPinOpts: HookHardReactionWinPinOptsSchema.optional(),
    hookHardMidWinClipOpts: HookHardMidWinClipOptsSchema.optional(),
    hookHardSetupWinClipOpts: HookHardSetupWinClipOptsSchema.optional(),
    hookHardReactionWinClipOpts: HookHardReactionWinClipOptsSchema.optional(),
    hookHardMidWinGripOpts: HookHardMidWinGripOptsSchema.optional(),
    hookHardSetupWinGripOpts: HookHardSetupWinGripOptsSchema.optional(),
    hookHardReactionWinGripOpts: HookHardReactionWinGripOptsSchema.optional(),
    hookHardMidWinClaspOpts: HookHardMidWinClaspOptsSchema.optional(),
    hookHardSetupWinClaspOpts: HookHardSetupWinClaspOptsSchema.optional(),
    hookHardReactionWinClaspOpts: HookHardReactionWinClaspOptsSchema.optional(),
    hookHardMidWinGraspOpts: HookHardMidWinGraspOptsSchema.optional(),
    hookHardSetupWinGraspOpts: HookHardSetupWinGraspOptsSchema.optional(),
    hookHardReactionWinGraspOpts: HookHardReactionWinGraspOptsSchema.optional(),
    hookHardMidWinRivetOpts: HookHardMidWinRivetOptsSchema.optional(),
    hookHardSetupWinRivetOpts: HookHardSetupWinRivetOptsSchema.optional(),
    hookHardReactionWinRivetOpts: HookHardReactionWinRivetOptsSchema.optional(),
    hookHardMidWinWeldOpts: HookHardMidWinWeldOptsSchema.optional(),
    hookHardSetupWinWeldOpts: HookHardSetupWinWeldOptsSchema.optional(),
    hookHardReactionWinWeldOpts: HookHardReactionWinWeldOptsSchema.optional(),
    hookHardMidWinCleatOpts: HookHardMidWinCleatOptsSchema.optional(),
    hookHardSetupWinCleatOpts: HookHardSetupWinCleatOptsSchema.optional(),
    hookHardReactionWinCleatOpts: HookHardReactionWinCleatOptsSchema.optional(),
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
  | HookHardDialogueRatioReport
  | HookHardColdCapReport
  | HookHardTailCapReport
  | HookHardWindowRatioReport
  | HookHardReactionRatioReport
  | HookHardDialogueBanReport
  | HookHardCliffDialogueBanReport
  | HookHardReactionBanReport
  | HookHardMidDialogueBanReport
  | HookHardSetupDialogueBanReport
  | HookHardWindowDialogueBanReport
  | HookHardWindowCapReport
  | HookHardFaceRatioReport
  | HookHardFaceCapReport
  | HookHardWindowFaceCapReport
  | HookHardTailRatioReport
  | HookHardColdRatioReport
  | HookHardWindowTailCapReport
  | HookHardFaceTailCapReport
  | HookHardColdFaceCapReport
  | HookHardMidFaceCapReport
  | HookHardSetupFaceCapReport
  | HookHardReactionFaceCapReport
  | HookHardMidTailCapReport
  | HookHardSetupTailCapReport
  | HookHardReactionTailCapReport
  | HookHardMidColdCapReport
  | HookHardSetupColdCapReport
  | HookHardReactionColdCapReport
  | HookHardMidWindowReport
  | HookHardSetupWindowReport
  | HookHardReactionWinCapReport
  | HookHardMidWinCapReport
  | HookHardSetupWinCapReport
  | HookHardReactionWinHoldReport
  | HookHardMidWinHoldReport
  | HookHardSetupWinHoldReport
  | HookHardReactionWinFloorReport
  | HookHardMidWinFloorReport
  | HookHardSetupWinFloorReport
  | HookHardReactionWinCeilReport
  | HookHardMidWinCeilReport
  | HookHardSetupWinCeilReport
  | HookHardReactionWinSpanReport
  | HookHardMidWinSpanReport
  | HookHardSetupWinSpanReport
  | HookHardReactionWinPeakReport
  | HookHardMidWinPeakReport
  | HookHardSetupWinPeakReport
  | HookHardReactionWinEdgeReport
  | HookHardMidWinEdgeReport
  | HookHardSetupWinEdgeReport
  | HookHardReactionWinCrestReport
  | HookHardMidWinLatchReport
  | HookHardSetupWinLatchReport
  | HookHardReactionWinLatchReport
  | HookHardMidWinBindReport
  | HookHardSetupWinBindReport
  | HookHardReactionWinBindReport
  | HookHardMidWinSealReport
  | HookHardSetupWinSealReport
  | HookHardReactionWinSealReport
  | HookHardMidWinLockReport
  | HookHardSetupWinLockReport
  | HookHardReactionWinLockReport
  | HookHardMidWinClampReport
  | HookHardSetupWinClampReport
  | HookHardReactionWinClampReport
  | HookHardMidWinBoltReport
  | HookHardSetupWinBoltReport
  | HookHardReactionWinBoltReport
  | HookHardMidWinBraceReport
  | HookHardSetupWinBraceReport
  | HookHardReactionWinBraceReport
  | HookHardMidWinCinchReport
  | HookHardSetupWinCinchReport
  | HookHardReactionWinCinchReport
  | HookHardMidWinHitchReport
  | HookHardSetupWinHitchReport
  | HookHardReactionWinHitchReport
  | HookHardMidWinKnotReport
  | HookHardSetupWinKnotReport
  | HookHardReactionWinKnotReport
  | HookHardMidWinLaceReport
  | HookHardSetupWinLaceReport
  | HookHardReactionWinLaceReport
  | HookHardMidWinSashReport
  | HookHardSetupWinSashReport
  | HookHardReactionWinSashReport
  | HookHardMidWinWrapReport
  | HookHardSetupWinWrapReport
  | HookHardReactionWinWrapReport
  | HookHardMidWinBandReport
  | HookHardSetupWinBandReport
  | HookHardReactionWinBandReport
  | HookHardMidWinCordReport
  | HookHardSetupWinCordReport
  | HookHardReactionWinCordReport
  | HookHardMidWinStrapReport
  | HookHardSetupWinStrapReport
  | HookHardReactionWinStrapReport
  | HookHardMidWinTieReport
  | HookHardSetupWinTieReport
  | HookHardReactionWinTieReport
  | HookHardMidWinPinReport
  | HookHardSetupWinPinReport
  | HookHardReactionWinPinReport
  | HookHardMidWinClipReport
  | HookHardSetupWinClipReport
  | HookHardReactionWinClipReport
  | HookHardMidWinGripReport
  | HookHardSetupWinGripReport
  | HookHardReactionWinGripReport
  | HookHardMidWinClaspReport
  | HookHardSetupWinClaspReport
  | HookHardReactionWinClaspReport
  | HookHardMidWinGraspReport
  | HookHardSetupWinGraspReport
  | HookHardReactionWinGraspReport
  | HookHardMidWinRivetReport
  | HookHardSetupWinRivetReport
  | HookHardReactionWinRivetReport
  | HookHardMidWinWeldReport
  | HookHardSetupWinWeldReport
  | HookHardReactionWinWeldReport
  | HookHardMidWinCleatReport
  | HookHardSetupWinCleatReport
  | HookHardReactionWinCleatReport;

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
    hookHardColdCapOpts,
    hookHardTailCapOpts,
    hookHardWindowRatioOpts,
    hookHardReactionRatioOpts,
    hookHardDialogueBanOpts,
    hookHardCliffDialogueBanOpts,
    hookHardReactionBanOpts,
    hookHardMidDialogueBanOpts,
    hookHardSetupDialogueBanOpts,
    hookHardColdDialogueBanOpts,
    hookHardTailDialogueBanOpts,
    hookHardWindowDialogueBanOpts,
    hookHardWindowCapOpts,
    hookHardFaceRatioOpts,
    hookHardFaceCapOpts,
    hookHardWindowFaceCapOpts,
    hookHardTailRatioOpts,
    hookHardColdRatioOpts,
    hookHardWindowTailCapOpts,
    hookHardFaceTailCapOpts,
    hookHardColdFaceCapOpts,
    hookHardMidFaceCapOpts,
    hookHardSetupFaceCapOpts,
    hookHardReactionFaceCapOpts,
    hookHardMidTailCapOpts,
    hookHardSetupTailCapOpts,
    hookHardReactionTailCapOpts,
    hookHardMidColdCapOpts,
    hookHardSetupColdCapOpts,
    hookHardReactionColdCapOpts,
    hookHardMidWindowOpts,
    hookHardSetupWindowOpts,
    hookHardReactionWinCapOpts,
    hookHardMidWinCapOpts,
    hookHardSetupWinCapOpts,
    hookHardReactionWinHoldOpts,
    hookHardMidWinHoldOpts,
    hookHardSetupWinHoldOpts,
    hookHardReactionWinFloorOpts,
    hookHardMidWinFloorOpts,
    hookHardSetupWinFloorOpts,
    hookHardReactionWinCeilOpts,
    hookHardMidWinCeilOpts,
    hookHardSetupWinCeilOpts,
    hookHardReactionWinSpanOpts,
    hookHardMidWinSpanOpts,
    hookHardSetupWinSpanOpts,
    hookHardReactionWinPeakOpts,
    hookHardMidWinPeakOpts,
    hookHardSetupWinPeakOpts,
    hookHardReactionWinEdgeOpts,
    hookHardMidWinEdgeOpts,
    hookHardSetupWinEdgeOpts,
    hookHardReactionWinCrestOpts,
    hookHardMidWinLatchOpts,
    hookHardSetupWinLatchOpts,
    hookHardReactionWinLatchOpts,
    hookHardMidWinBindOpts,
    hookHardSetupWinBindOpts,
    hookHardReactionWinBindOpts,
    hookHardMidWinSealOpts,
    hookHardSetupWinSealOpts,
    hookHardReactionWinSealOpts,
    hookHardMidWinLockOpts,
    hookHardSetupWinLockOpts,
    hookHardReactionWinLockOpts,
    hookHardMidWinClampOpts,
    hookHardSetupWinClampOpts,
    hookHardReactionWinClampOpts,
    hookHardMidWinBoltOpts,
    hookHardSetupWinBoltOpts,
    hookHardReactionWinBoltOpts,
    hookHardMidWinBraceOpts,
    hookHardSetupWinBraceOpts,
    hookHardReactionWinBraceOpts,
    hookHardMidWinCinchOpts,
    hookHardSetupWinCinchOpts,
    hookHardReactionWinCinchOpts,
    hookHardMidWinHitchOpts,
    hookHardSetupWinHitchOpts,
    hookHardReactionWinHitchOpts,
    hookHardMidWinKnotOpts,
    hookHardSetupWinKnotOpts,
    hookHardReactionWinKnotOpts,
    hookHardMidWinLaceOpts,
    hookHardSetupWinLaceOpts,
    hookHardReactionWinLaceOpts,
    hookHardMidWinSashOpts,
    hookHardSetupWinSashOpts,
    hookHardReactionWinSashOpts,
    hookHardMidWinWrapOpts,
    hookHardSetupWinWrapOpts,
    hookHardReactionWinWrapOpts,
    hookHardMidWinBandOpts,
    hookHardSetupWinBandOpts,
    hookHardReactionWinBandOpts,
    hookHardMidWinCordOpts,
    hookHardSetupWinCordOpts,
    hookHardReactionWinCordOpts,
    hookHardMidWinStrapOpts,
    hookHardSetupWinStrapOpts,
    hookHardReactionWinStrapOpts,
    hookHardMidWinTieOpts,
    hookHardSetupWinTieOpts,
    hookHardReactionWinTieOpts,
    hookHardMidWinPinOpts,
    hookHardSetupWinPinOpts,
    hookHardReactionWinPinOpts,
    hookHardMidWinClipOpts,
    hookHardSetupWinClipOpts,
    hookHardReactionWinClipOpts,
    hookHardMidWinGripOpts,
    hookHardSetupWinGripOpts,
    hookHardReactionWinGripOpts,
    hookHardMidWinClaspOpts,
    hookHardSetupWinClaspOpts,
    hookHardReactionWinClaspOpts,
    hookHardMidWinGraspOpts,
    hookHardSetupWinGraspOpts,
    hookHardReactionWinGraspOpts,
    hookHardMidWinRivetOpts,
    hookHardSetupWinRivetOpts,
    hookHardReactionWinRivetOpts,
    hookHardMidWinWeldOpts,
    hookHardSetupWinWeldOpts,
    hookHardReactionWinWeldOpts,
    hookHardMidWinCleatOpts,
    hookHardSetupWinCleatOpts,
    hookHardReactionWinCleatOpts,
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

  if (sections.hookHardColdCap !== undefined) {
    run(
      'hookHardColdCap',
      evaluateHookHardColdCap(
        sections.hookHardColdCap,
        (hookHardColdCapOpts ?? {}) as HookHardColdCapOptions,
      ),
    );
  }
  if (sections.hookHardTailCap !== undefined) {
    run(
      'hookHardTailCap',
      evaluateHookHardTailCap(
        sections.hookHardTailCap,
        (hookHardTailCapOpts ?? {}) as HookHardTailCapOptions,
      ),
    );
  }
  if (sections.hookHardWindowRatio !== undefined) {
    run(
      'hookHardWindowRatio',
      evaluateHookHardWindowRatio(
        sections.hookHardWindowRatio,
        (hookHardWindowRatioOpts ?? {}) as HookHardWindowRatioOptions,
      ),
    );
  }


  if (sections.hookHardReactionRatio !== undefined) {
    run(
      'hookHardReactionRatio',
      evaluateHookHardReactionRatio(
        sections.hookHardReactionRatio,
        (hookHardReactionRatioOpts ?? {}) as HookHardReactionRatioOptions,
      ),
    );
  }
  if (sections.hookHardDialogueBan !== undefined) {
    run(
      'hookHardDialogueBan',
      evaluateHookHardDialogueBan(
        sections.hookHardDialogueBan,
        (hookHardDialogueBanOpts ?? {}) as HookHardDialogueBanOptions,
      ),
    );
  }
  if (sections.hookHardCliffDialogueBan !== undefined) {
    run(
      'hookHardCliffDialogueBan',
      evaluateHookHardCliffDialogueBan(
        sections.hookHardCliffDialogueBan,
        (hookHardCliffDialogueBanOpts ?? {}) as HookHardCliffDialogueBanOptions,
      ),
    );
  }
  if (sections.hookHardReactionBan !== undefined) {
    run(
      'hookHardReactionBan',
      evaluateHookHardReactionBan(
        sections.hookHardReactionBan,
        (hookHardReactionBanOpts ?? {}) as HookHardReactionBanOptions,
      ),
    );
  }
  if (sections.hookHardMidDialogueBan !== undefined) {
    run(
      'hookHardMidDialogueBan',
      evaluateHookHardMidDialogueBan(
        sections.hookHardMidDialogueBan,
        (hookHardMidDialogueBanOpts ?? {}) as HookHardMidDialogueBanOptions,
      ),
    );
  }
  if (sections.hookHardSetupDialogueBan !== undefined) {
    run(
      'hookHardSetupDialogueBan',
      evaluateHookHardSetupDialogueBan(
        sections.hookHardSetupDialogueBan,
        (hookHardSetupDialogueBanOpts ?? {}) as HookHardSetupDialogueBanOptions,
      ),
    );
  }

  if (sections.hookHardColdDialogueBan !== undefined) {
    run(
      'hookHardColdDialogueBan',
      evaluateHookHardColdDialogueBan(
        sections.hookHardColdDialogueBan,
        (hookHardColdDialogueBanOpts ?? {}) as HookHardColdDialogueBanOptions,
      ),
    );
  }
  if (sections.hookHardTailDialogueBan !== undefined) {
    run(
      'hookHardTailDialogueBan',
      evaluateHookHardTailDialogueBan(
        sections.hookHardTailDialogueBan,
        (hookHardTailDialogueBanOpts ?? {}) as HookHardTailDialogueBanOptions,
      ),
    );
  }
  if (sections.hookHardWindowDialogueBan !== undefined) {
    run(
      'hookHardWindowDialogueBan',
      evaluateHookHardWindowDialogueBan(
        sections.hookHardWindowDialogueBan,
        (hookHardWindowDialogueBanOpts ?? {}) as HookHardWindowDialogueBanOptions,
      ),
    );
  }
  if (sections.hookHardWindowCap !== undefined) {
    run(
      'hookHardWindowCap',
      evaluateHookHardWindowCap(
        sections.hookHardWindowCap,
        (hookHardWindowCapOpts ?? {}) as HookHardWindowCapOptions,
      ),
    );
  }
  if (sections.hookHardFaceRatio !== undefined) {
    run(
      'hookHardFaceRatio',
      evaluateHookHardFaceRatio(
        sections.hookHardFaceRatio,
        (hookHardFaceRatioOpts ?? {}) as HookHardFaceRatioOptions,
      ),
    );
  }
  if (sections.hookHardFaceCap !== undefined) {
    run(
      'hookHardFaceCap',
      evaluateHookHardFaceCap(
        sections.hookHardFaceCap,
        (hookHardFaceCapOpts ?? {}) as HookHardFaceCapOptions,
      ),
    );
  }
  if (sections.hookHardWindowFaceCap !== undefined) {
    run(
      'hookHardWindowFaceCap',
      evaluateHookHardWindowFaceCap(
        sections.hookHardWindowFaceCap,
        (hookHardWindowFaceCapOpts ?? {}) as HookHardWindowFaceCapOptions,
      ),
    );
  }
  if (sections.hookHardTailRatio !== undefined) {
    run(
      'hookHardTailRatio',
      evaluateHookHardTailRatio(
        sections.hookHardTailRatio,
        (hookHardTailRatioOpts ?? {}) as HookHardTailRatioOptions,
      ),
    );
  }
  if (sections.hookHardColdRatio !== undefined) {
    run(
      'hookHardColdRatio',
      evaluateHookHardColdRatio(
        sections.hookHardColdRatio,
        (hookHardColdRatioOpts ?? {}) as HookHardColdRatioOptions,
      ),
    );
  }

  if (sections.hookHardWindowTailCap !== undefined) {
    run(
      'hookHardWindowTailCap',
      evaluateHookHardWindowTailCap(
        sections.hookHardWindowTailCap,
        (hookHardWindowTailCapOpts ?? {}) as HookHardWindowTailCapOptions,
      ),
    );
  }
  if (sections.hookHardFaceTailCap !== undefined) {
    run(
      'hookHardFaceTailCap',
      evaluateHookHardFaceTailCap(
        sections.hookHardFaceTailCap,
        (hookHardFaceTailCapOpts ?? {}) as HookHardFaceTailCapOptions,
      ),
    );
  }
  if (sections.hookHardColdFaceCap !== undefined) {
    run(
      'hookHardColdFaceCap',
      evaluateHookHardColdFaceCap(
        sections.hookHardColdFaceCap,
        (hookHardColdFaceCapOpts ?? {}) as HookHardColdFaceCapOptions,
      ),
    );
  }

  if (sections.hookHardMidFaceCap !== undefined) {
    run(
      'hookHardMidFaceCap',
      evaluateHookHardMidFaceCap(
        sections.hookHardMidFaceCap,
        (hookHardMidFaceCapOpts ?? {}) as HookHardMidFaceCapOptions,
      ),
    );
  }
  if (sections.hookHardSetupFaceCap !== undefined) {
    run(
      'hookHardSetupFaceCap',
      evaluateHookHardSetupFaceCap(
        sections.hookHardSetupFaceCap,
        (hookHardSetupFaceCapOpts ?? {}) as HookHardSetupFaceCapOptions,
      ),
    );
  }
  if (sections.hookHardReactionFaceCap !== undefined) {
    run(
      'hookHardReactionFaceCap',
      evaluateHookHardReactionFaceCap(
        sections.hookHardReactionFaceCap,
        (hookHardReactionFaceCapOpts ?? {}) as HookHardReactionFaceCapOptions,
      ),
    );
  }

  if (sections.hookHardMidTailCap !== undefined) {
    run(
      'hookHardMidTailCap',
      evaluateHookHardMidTailCap(
        sections.hookHardMidTailCap,
        (hookHardMidTailCapOpts ?? {}) as HookHardMidTailCapOptions,
      ),
    );
  }
  if (sections.hookHardSetupTailCap !== undefined) {
    run(
      'hookHardSetupTailCap',
      evaluateHookHardSetupTailCap(
        sections.hookHardSetupTailCap,
        (hookHardSetupTailCapOpts ?? {}) as HookHardSetupTailCapOptions,
      ),
    );
  }
  if (sections.hookHardReactionTailCap !== undefined) {
    run(
      'hookHardReactionTailCap',
      evaluateHookHardReactionTailCap(
        sections.hookHardReactionTailCap,
        (hookHardReactionTailCapOpts ?? {}) as HookHardReactionTailCapOptions,
      ),
    );
  }

  if (sections.hookHardMidColdCap !== undefined) {
    run(
      'hookHardMidColdCap',
      evaluateHookHardMidColdCap(
        sections.hookHardMidColdCap,
        (hookHardMidColdCapOpts ?? {}) as HookHardMidColdCapOptions,
      ),
    );
  }
  if (sections.hookHardSetupColdCap !== undefined) {
    run(
      'hookHardSetupColdCap',
      evaluateHookHardSetupColdCap(
        sections.hookHardSetupColdCap,
        (hookHardSetupColdCapOpts ?? {}) as HookHardSetupColdCapOptions,
      ),
    );
  }
  if (sections.hookHardReactionColdCap !== undefined) {
    run(
      'hookHardReactionColdCap',
      evaluateHookHardReactionColdCap(
        sections.hookHardReactionColdCap,
        (hookHardReactionColdCapOpts ?? {}) as HookHardReactionColdCapOptions,
      ),
    );
  }
  if (sections.hookHardMidWindow !== undefined) {
    run(
      'hookHardMidWindow',
      evaluateHookHardMidWindow(
        sections.hookHardMidWindow,
        (hookHardMidWindowOpts ?? {}) as HookHardMidWindowOptions,
      ),
    );
  }
  if (sections.hookHardSetupWindow !== undefined) {
    run(
      'hookHardSetupWindow',
      evaluateHookHardSetupWindow(
        sections.hookHardSetupWindow,
        (hookHardSetupWindowOpts ?? {}) as HookHardSetupWindowOptions,
      ),
    );
  }
  if (sections.hookHardReactionWinCap !== undefined) {
    run(
      'hookHardReactionWinCap',
      evaluateHookHardReactionWinCap(
        sections.hookHardReactionWinCap,
        (hookHardReactionWinCapOpts ?? {}) as HookHardReactionWinCapOptions,
      ),
    );
  }
  if (sections.hookHardMidWinCap !== undefined) {
    run(
      'hookHardMidWinCap',
      evaluateHookHardMidWinCap(
        sections.hookHardMidWinCap,
        (hookHardMidWinCapOpts ?? {}) as HookHardMidWinCapOptions,
      ),
    );
  }
  if (sections.hookHardSetupWinCap !== undefined) {
    run(
      'hookHardSetupWinCap',
      evaluateHookHardSetupWinCap(
        sections.hookHardSetupWinCap,
        (hookHardSetupWinCapOpts ?? {}) as HookHardSetupWinCapOptions,
      ),
    );
  }
  if (sections.hookHardReactionWinHold !== undefined) {
    run(
      'hookHardReactionWinHold',
      evaluateHookHardReactionWinHold(
        sections.hookHardReactionWinHold,
        (hookHardReactionWinHoldOpts ?? {}) as HookHardReactionWinHoldOptions,
      ),
    );
  }

  if (sections.hookHardMidWinHold !== undefined) {
    run(
      'hookHardMidWinHold',
      evaluateHookHardMidWinHold(
        sections.hookHardMidWinHold,
        (hookHardMidWinHoldOpts ?? {}) as HookHardMidWinHoldOptions,
      ),
    );
  }
  if (sections.hookHardSetupWinHold !== undefined) {
    run(
      'hookHardSetupWinHold',
      evaluateHookHardSetupWinHold(
        sections.hookHardSetupWinHold,
        (hookHardSetupWinHoldOpts ?? {}) as HookHardSetupWinHoldOptions,
      ),
    );
  }
  if (sections.hookHardReactionWinFloor !== undefined) {
    run(
      'hookHardReactionWinFloor',
      evaluateHookHardReactionWinFloor(
        sections.hookHardReactionWinFloor,
        (hookHardReactionWinFloorOpts ?? {}) as HookHardReactionWinFloorOptions,
      ),
    );
  }

  if (sections.hookHardMidWinFloor !== undefined) {
    run(
      'hookHardMidWinFloor',
      evaluateHookHardMidWinFloor(
        sections.hookHardMidWinFloor,
        (hookHardMidWinFloorOpts ?? {}) as HookHardMidWinFloorOptions,
      ),
    );
  }
  if (sections.hookHardSetupWinFloor !== undefined) {
    run(
      'hookHardSetupWinFloor',
      evaluateHookHardSetupWinFloor(
        sections.hookHardSetupWinFloor,
        (hookHardSetupWinFloorOpts ?? {}) as HookHardSetupWinFloorOptions,
      ),
    );
  }
  if (sections.hookHardReactionWinCeil !== undefined) {
    run(
      'hookHardReactionWinCeil',
      evaluateHookHardReactionWinCeil(
        sections.hookHardReactionWinCeil,
        (hookHardReactionWinCeilOpts ?? {}) as HookHardReactionWinCeilOptions,
      ),
    );
  }

  if (sections.hookHardMidWinCeil !== undefined) {
    run(
      'hookHardMidWinCeil',
      evaluateHookHardMidWinCeil(
        sections.hookHardMidWinCeil,
        (hookHardMidWinCeilOpts ?? {}) as HookHardMidWinCeilOptions,
      ),
    );
  }
  if (sections.hookHardSetupWinCeil !== undefined) {
    run(
      'hookHardSetupWinCeil',
      evaluateHookHardSetupWinCeil(
        sections.hookHardSetupWinCeil,
        (hookHardSetupWinCeilOpts ?? {}) as HookHardSetupWinCeilOptions,
      ),
    );
  }
  if (sections.hookHardReactionWinSpan !== undefined) {
    run(
      'hookHardReactionWinSpan',
      evaluateHookHardReactionWinSpan(
        sections.hookHardReactionWinSpan,
        (hookHardReactionWinSpanOpts ?? {}) as HookHardReactionWinSpanOptions,
      ),
    );
  }

  if (sections.hookHardMidWinSpan !== undefined) {
    run(
      'hookHardMidWinSpan',
      evaluateHookHardMidWinSpan(
        sections.hookHardMidWinSpan,
        (hookHardMidWinSpanOpts ?? {}) as HookHardMidWinSpanOptions,
      ),
    );
  }
  if (sections.hookHardSetupWinSpan !== undefined) {
    run(
      'hookHardSetupWinSpan',
      evaluateHookHardSetupWinSpan(
        sections.hookHardSetupWinSpan,
        (hookHardSetupWinSpanOpts ?? {}) as HookHardSetupWinSpanOptions,
      ),
    );
  }
  if (sections.hookHardReactionWinPeak !== undefined) {
    run(
      'hookHardReactionWinPeak',
      evaluateHookHardReactionWinPeak(
        sections.hookHardReactionWinPeak,
        (hookHardReactionWinPeakOpts ?? {}) as HookHardReactionWinPeakOptions,
      ),
    );
  }

  if (sections.hookHardMidWinPeak !== undefined) {
    run(
      'hookHardMidWinPeak',
      evaluateHookHardMidWinPeak(
        sections.hookHardMidWinPeak,
        (hookHardMidWinPeakOpts ?? {}) as HookHardMidWinPeakOptions,
      ),
    );
  }
  if (sections.hookHardSetupWinPeak !== undefined) {
    run(
      'hookHardSetupWinPeak',
      evaluateHookHardSetupWinPeak(
        sections.hookHardSetupWinPeak,
        (hookHardSetupWinPeakOpts ?? {}) as HookHardSetupWinPeakOptions,
      ),
    );
  }
  if (sections.hookHardReactionWinEdge !== undefined) {
    run(
      'hookHardReactionWinEdge',
      evaluateHookHardReactionWinEdge(
        sections.hookHardReactionWinEdge,
        (hookHardReactionWinEdgeOpts ?? {}) as HookHardReactionWinEdgeOptions,
      ),
    );
  }

  if (sections.hookHardMidWinEdge !== undefined) {
    run(
      'hookHardMidWinEdge',
      evaluateHookHardMidWinEdge(
        sections.hookHardMidWinEdge,
        (hookHardMidWinEdgeOpts ?? {}) as HookHardMidWinEdgeOptions,
      ),
    );
  }
  if (sections.hookHardSetupWinEdge !== undefined) {
    run(
      'hookHardSetupWinEdge',
      evaluateHookHardSetupWinEdge(
        sections.hookHardSetupWinEdge,
        (hookHardSetupWinEdgeOpts ?? {}) as HookHardSetupWinEdgeOptions,
      ),
    );
  }
  if (sections.hookHardReactionWinCrest !== undefined) {
    run(
      'hookHardReactionWinCrest',
      evaluateHookHardReactionWinCrest(
        sections.hookHardReactionWinCrest,
        (hookHardReactionWinCrestOpts ?? {}) as HookHardReactionWinCrestOptions,
      ),
    );
  }

  if (sections.hookHardMidWinLatch !== undefined) {
    run(
      'hookHardMidWinLatch',
      evaluateHookHardMidWinLatch(
        sections.hookHardMidWinLatch,
        (hookHardMidWinLatchOpts ?? {}) as HookHardMidWinLatchOptions,
      ),
    );
  }
  if (sections.hookHardSetupWinLatch !== undefined) {
    run(
      'hookHardSetupWinLatch',
      evaluateHookHardSetupWinLatch(
        sections.hookHardSetupWinLatch,
        (hookHardSetupWinLatchOpts ?? {}) as HookHardSetupWinLatchOptions,
      ),
    );
  }
  if (sections.hookHardReactionWinLatch !== undefined) {
    run(
      'hookHardReactionWinLatch',
      evaluateHookHardReactionWinLatch(
        sections.hookHardReactionWinLatch,
        (hookHardReactionWinLatchOpts ?? {}) as HookHardReactionWinLatchOptions,
      ),
    );
  }

  if (sections.hookHardMidWinBind !== undefined) {
    run(
      'hookHardMidWinBind',
      evaluateHookHardMidWinBind(
        sections.hookHardMidWinBind,
        (hookHardMidWinBindOpts ?? {}) as HookHardMidWinBindOptions,
      ),
    );
  }
  if (sections.hookHardSetupWinBind !== undefined) {
    run(
      'hookHardSetupWinBind',
      evaluateHookHardSetupWinBind(
        sections.hookHardSetupWinBind,
        (hookHardSetupWinBindOpts ?? {}) as HookHardSetupWinBindOptions,
      ),
    );
  }
  if (sections.hookHardReactionWinBind !== undefined) {
    run(
      'hookHardReactionWinBind',
      evaluateHookHardReactionWinBind(
        sections.hookHardReactionWinBind,
        (hookHardReactionWinBindOpts ?? {}) as HookHardReactionWinBindOptions,
      ),
    );
  }

  if (sections.hookHardMidWinSeal !== undefined) {
    run(
      'hookHardMidWinSeal',
      evaluateHookHardMidWinSeal(
        sections.hookHardMidWinSeal,
        (hookHardMidWinSealOpts ?? {}) as HookHardMidWinSealOptions,
      ),
    );
  }
  if (sections.hookHardSetupWinSeal !== undefined) {
    run(
      'hookHardSetupWinSeal',
      evaluateHookHardSetupWinSeal(
        sections.hookHardSetupWinSeal,
        (hookHardSetupWinSealOpts ?? {}) as HookHardSetupWinSealOptions,
      ),
    );
  }
  if (sections.hookHardReactionWinSeal !== undefined) {
    run(
      'hookHardReactionWinSeal',
      evaluateHookHardReactionWinSeal(
        sections.hookHardReactionWinSeal,
        (hookHardReactionWinSealOpts ?? {}) as HookHardReactionWinSealOptions,
      ),
    );
  }
  if (sections.hookHardMidWinLock !== undefined) {
    run(
      'hookHardMidWinLock',
      evaluateHookHardMidWinLock(
        sections.hookHardMidWinLock,
        (hookHardMidWinLockOpts ?? {}) as HookHardMidWinLockOptions,
      ),
    );
  }
  if (sections.hookHardSetupWinLock !== undefined) {
    run(
      'hookHardSetupWinLock',
      evaluateHookHardSetupWinLock(
        sections.hookHardSetupWinLock,
        (hookHardSetupWinLockOpts ?? {}) as HookHardSetupWinLockOptions,
      ),
    );
  }
  if (sections.hookHardReactionWinLock !== undefined) {
    run(
      'hookHardReactionWinLock',
      evaluateHookHardReactionWinLock(
        sections.hookHardReactionWinLock,
        (hookHardReactionWinLockOpts ?? {}) as HookHardReactionWinLockOptions,
      ),
    );
  }
  if (sections.hookHardMidWinClamp !== undefined) {
    run(
      'hookHardMidWinClamp',
      evaluateHookHardMidWinClamp(
        sections.hookHardMidWinClamp,
        (hookHardMidWinClampOpts ?? {}) as HookHardMidWinClampOptions,
      ),
    );
  }
  if (sections.hookHardSetupWinClamp !== undefined) {
    run(
      'hookHardSetupWinClamp',
      evaluateHookHardSetupWinClamp(
        sections.hookHardSetupWinClamp,
        (hookHardSetupWinClampOpts ?? {}) as HookHardSetupWinClampOptions,
      ),
    );
  }
  if (sections.hookHardReactionWinClamp !== undefined) {
    run(
      'hookHardReactionWinClamp',
      evaluateHookHardReactionWinClamp(
        sections.hookHardReactionWinClamp,
        (hookHardReactionWinClampOpts ?? {}) as HookHardReactionWinClampOptions,
      ),
    );
  }

  if (sections.hookHardMidWinBolt !== undefined) {
    run(
      'hookHardMidWinBolt',
      evaluateHookHardMidWinBolt(
        sections.hookHardMidWinBolt,
        (hookHardMidWinBoltOpts ?? {}) as HookHardMidWinBoltOptions,
      ),
    );
  }
  if (sections.hookHardSetupWinBolt !== undefined) {
    run(
      'hookHardSetupWinBolt',
      evaluateHookHardSetupWinBolt(
        sections.hookHardSetupWinBolt,
        (hookHardSetupWinBoltOpts ?? {}) as HookHardSetupWinBoltOptions,
      ),
    );
  }
  if (sections.hookHardReactionWinBolt !== undefined) {
    run(
      'hookHardReactionWinBolt',
      evaluateHookHardReactionWinBolt(
        sections.hookHardReactionWinBolt,
        (hookHardReactionWinBoltOpts ?? {}) as HookHardReactionWinBoltOptions,
      ),
    );
  }

  if (sections.hookHardMidWinBrace !== undefined) {
    run(
      'hookHardMidWinBrace',
      evaluateHookHardMidWinBrace(
        sections.hookHardMidWinBrace,
        (hookHardMidWinBraceOpts ?? {}) as HookHardMidWinBraceOptions,
      ),
    );
  }
  if (sections.hookHardSetupWinBrace !== undefined) {
    run(
      'hookHardSetupWinBrace',
      evaluateHookHardSetupWinBrace(
        sections.hookHardSetupWinBrace,
        (hookHardSetupWinBraceOpts ?? {}) as HookHardSetupWinBraceOptions,
      ),
    );
  }
  if (sections.hookHardReactionWinBrace !== undefined) {
    run(
      'hookHardReactionWinBrace',
      evaluateHookHardReactionWinBrace(
        sections.hookHardReactionWinBrace,
        (hookHardReactionWinBraceOpts ?? {}) as HookHardReactionWinBraceOptions,
      ),
    );
  }

  if (sections.hookHardMidWinCinch !== undefined) {
    run(
      'hookHardMidWinCinch',
      evaluateHookHardMidWinCinch(
        sections.hookHardMidWinCinch,
        (hookHardMidWinCinchOpts ?? {}) as HookHardMidWinCinchOptions,
      ),
    );
  }
  if (sections.hookHardSetupWinCinch !== undefined) {
    run(
      'hookHardSetupWinCinch',
      evaluateHookHardSetupWinCinch(
        sections.hookHardSetupWinCinch,
        (hookHardSetupWinCinchOpts ?? {}) as HookHardSetupWinCinchOptions,
      ),
    );
  }
  if (sections.hookHardReactionWinCinch !== undefined) {
    run(
      'hookHardReactionWinCinch',
      evaluateHookHardReactionWinCinch(
        sections.hookHardReactionWinCinch,
        (hookHardReactionWinCinchOpts ?? {}) as HookHardReactionWinCinchOptions,
      ),
    );
  }

  if (sections.hookHardMidWinHitch !== undefined) {
    run(
      'hookHardMidWinHitch',
      evaluateHookHardMidWinHitch(
        sections.hookHardMidWinHitch,
        (hookHardMidWinHitchOpts ?? {}) as HookHardMidWinHitchOptions,
      ),
    );
  }
  if (sections.hookHardSetupWinHitch !== undefined) {
    run(
      'hookHardSetupWinHitch',
      evaluateHookHardSetupWinHitch(
        sections.hookHardSetupWinHitch,
        (hookHardSetupWinHitchOpts ?? {}) as HookHardSetupWinHitchOptions,
      ),
    );
  }
  if (sections.hookHardReactionWinHitch !== undefined) {
    run(
      'hookHardReactionWinHitch',
      evaluateHookHardReactionWinHitch(
        sections.hookHardReactionWinHitch,
        (hookHardReactionWinHitchOpts ?? {}) as HookHardReactionWinHitchOptions,
      ),
    );
  }

  if (sections.hookHardMidWinKnot !== undefined) {
    run(
      'hookHardMidWinKnot',
      evaluateHookHardMidWinKnot(
        sections.hookHardMidWinKnot,
        (hookHardMidWinKnotOpts ?? {}) as HookHardMidWinKnotOptions,
      ),
    );
  }
  if (sections.hookHardSetupWinKnot !== undefined) {
    run(
      'hookHardSetupWinKnot',
      evaluateHookHardSetupWinKnot(
        sections.hookHardSetupWinKnot,
        (hookHardSetupWinKnotOpts ?? {}) as HookHardSetupWinKnotOptions,
      ),
    );
  }
  if (sections.hookHardReactionWinKnot !== undefined) {
    run(
      'hookHardReactionWinKnot',
      evaluateHookHardReactionWinKnot(
        sections.hookHardReactionWinKnot,
        (hookHardReactionWinKnotOpts ?? {}) as HookHardReactionWinKnotOptions,
      ),
    );
  }

  if (sections.hookHardMidWinLace !== undefined) {
    run(
      'hookHardMidWinLace',
      evaluateHookHardMidWinLace(
        sections.hookHardMidWinLace,
        (hookHardMidWinLaceOpts ?? {}) as HookHardMidWinLaceOptions,
      ),
    );
  }
  if (sections.hookHardSetupWinLace !== undefined) {
    run(
      'hookHardSetupWinLace',
      evaluateHookHardSetupWinLace(
        sections.hookHardSetupWinLace,
        (hookHardSetupWinLaceOpts ?? {}) as HookHardSetupWinLaceOptions,
      ),
    );
  }
  if (sections.hookHardReactionWinLace !== undefined) {
    run(
      'hookHardReactionWinLace',
      evaluateHookHardReactionWinLace(
        sections.hookHardReactionWinLace,
        (hookHardReactionWinLaceOpts ?? {}) as HookHardReactionWinLaceOptions,
      ),
    );
  }

  if (sections.hookHardMidWinSash !== undefined) {
    run(
      'hookHardMidWinSash',
      evaluateHookHardMidWinSash(
        sections.hookHardMidWinSash,
        (hookHardMidWinSashOpts ?? {}) as HookHardMidWinSashOptions,
      ),
    );
  }
  if (sections.hookHardSetupWinSash !== undefined) {
    run(
      'hookHardSetupWinSash',
      evaluateHookHardSetupWinSash(
        sections.hookHardSetupWinSash,
        (hookHardSetupWinSashOpts ?? {}) as HookHardSetupWinSashOptions,
      ),
    );
  }
  if (sections.hookHardReactionWinSash !== undefined) {
    run(
      'hookHardReactionWinSash',
      evaluateHookHardReactionWinSash(
        sections.hookHardReactionWinSash,
        (hookHardReactionWinSashOpts ?? {}) as HookHardReactionWinSashOptions,
      ),
    );
  }

  if (sections.hookHardMidWinWrap !== undefined) {
    run(
      'hookHardMidWinWrap',
      evaluateHookHardMidWinWrap(
        sections.hookHardMidWinWrap,
        (hookHardMidWinWrapOpts ?? {}) as HookHardMidWinWrapOptions,
      ),
    );
  }
  if (sections.hookHardSetupWinWrap !== undefined) {
    run(
      'hookHardSetupWinWrap',
      evaluateHookHardSetupWinWrap(
        sections.hookHardSetupWinWrap,
        (hookHardSetupWinWrapOpts ?? {}) as HookHardSetupWinWrapOptions,
      ),
    );
  }
  if (sections.hookHardReactionWinWrap !== undefined) {
    run(
      'hookHardReactionWinWrap',
      evaluateHookHardReactionWinWrap(
        sections.hookHardReactionWinWrap,
        (hookHardReactionWinWrapOpts ?? {}) as HookHardReactionWinWrapOptions,
      ),
    );
  }

  if (sections.hookHardMidWinBand !== undefined) {
    run(
      'hookHardMidWinBand',
      evaluateHookHardMidWinBand(
        sections.hookHardMidWinBand,
        (hookHardMidWinBandOpts ?? {}) as HookHardMidWinBandOptions,
      ),
    );
  }
  if (sections.hookHardSetupWinBand !== undefined) {
    run(
      'hookHardSetupWinBand',
      evaluateHookHardSetupWinBand(
        sections.hookHardSetupWinBand,
        (hookHardSetupWinBandOpts ?? {}) as HookHardSetupWinBandOptions,
      ),
    );
  }
  if (sections.hookHardReactionWinBand !== undefined) {
    run(
      'hookHardReactionWinBand',
      evaluateHookHardReactionWinBand(
        sections.hookHardReactionWinBand,
        (hookHardReactionWinBandOpts ?? {}) as HookHardReactionWinBandOptions,
      ),
    );
  }

  if (sections.hookHardMidWinCord !== undefined) {
    run(
      'hookHardMidWinCord',
      evaluateHookHardMidWinCord(
        sections.hookHardMidWinCord,
        (hookHardMidWinCordOpts ?? {}) as HookHardMidWinCordOptions,
      ),
    );
  }
  if (sections.hookHardSetupWinCord !== undefined) {
    run(
      'hookHardSetupWinCord',
      evaluateHookHardSetupWinCord(
        sections.hookHardSetupWinCord,
        (hookHardSetupWinCordOpts ?? {}) as HookHardSetupWinCordOptions,
      ),
    );
  }
  if (sections.hookHardReactionWinCord !== undefined) {
    run(
      'hookHardReactionWinCord',
      evaluateHookHardReactionWinCord(
        sections.hookHardReactionWinCord,
        (hookHardReactionWinCordOpts ?? {}) as HookHardReactionWinCordOptions,
      ),
    );
  }

  if (sections.hookHardMidWinStrap !== undefined) {
    run(
      'hookHardMidWinStrap',
      evaluateHookHardMidWinStrap(
        sections.hookHardMidWinStrap,
        (hookHardMidWinStrapOpts ?? {}) as HookHardMidWinStrapOptions,
      ),
    );
  }
  if (sections.hookHardSetupWinStrap !== undefined) {
    run(
      'hookHardSetupWinStrap',
      evaluateHookHardSetupWinStrap(
        sections.hookHardSetupWinStrap,
        (hookHardSetupWinStrapOpts ?? {}) as HookHardSetupWinStrapOptions,
      ),
    );
  }
  if (sections.hookHardReactionWinStrap !== undefined) {
    run(
      'hookHardReactionWinStrap',
      evaluateHookHardReactionWinStrap(
        sections.hookHardReactionWinStrap,
        (hookHardReactionWinStrapOpts ?? {}) as HookHardReactionWinStrapOptions,
      ),
    );
  }

  if (sections.hookHardMidWinTie !== undefined) {
    run(
      'hookHardMidWinTie',
      evaluateHookHardMidWinTie(
        sections.hookHardMidWinTie,
        (hookHardMidWinTieOpts ?? {}) as HookHardMidWinTieOptions,
      ),
    );
  }
  if (sections.hookHardSetupWinTie !== undefined) {
    run(
      'hookHardSetupWinTie',
      evaluateHookHardSetupWinTie(
        sections.hookHardSetupWinTie,
        (hookHardSetupWinTieOpts ?? {}) as HookHardSetupWinTieOptions,
      ),
    );
  }
  if (sections.hookHardReactionWinTie !== undefined) {
    run(
      'hookHardReactionWinTie',
      evaluateHookHardReactionWinTie(
        sections.hookHardReactionWinTie,
        (hookHardReactionWinTieOpts ?? {}) as HookHardReactionWinTieOptions,
      ),
    );
  }
  if (sections.hookHardMidWinPin !== undefined) {
    run(
      'hookHardMidWinPin',
      evaluateHookHardMidWinPin(
        sections.hookHardMidWinPin,
        (hookHardMidWinPinOpts ?? {}) as HookHardMidWinPinOptions,
      ),
    );
  }
  if (sections.hookHardSetupWinPin !== undefined) {
    run(
      'hookHardSetupWinPin',
      evaluateHookHardSetupWinPin(
        sections.hookHardSetupWinPin,
        (hookHardSetupWinPinOpts ?? {}) as HookHardSetupWinPinOptions,
      ),
    );
  }
  if (sections.hookHardReactionWinPin !== undefined) {
    run(
      'hookHardReactionWinPin',
      evaluateHookHardReactionWinPin(
        sections.hookHardReactionWinPin,
        (hookHardReactionWinPinOpts ?? {}) as HookHardReactionWinPinOptions,
      ),
    );
  }
  if (sections.hookHardMidWinClip !== undefined) {
    run(
      'hookHardMidWinClip',
      evaluateHookHardMidWinClip(
        sections.hookHardMidWinClip,
        (hookHardMidWinClipOpts ?? {}) as HookHardMidWinClipOptions,
      ),
    );
  }
  if (sections.hookHardSetupWinClip !== undefined) {
    run(
      'hookHardSetupWinClip',
      evaluateHookHardSetupWinClip(
        sections.hookHardSetupWinClip,
        (hookHardSetupWinClipOpts ?? {}) as HookHardSetupWinClipOptions,
      ),
    );
  }
  if (sections.hookHardReactionWinClip !== undefined) {
    run(
      'hookHardReactionWinClip',
      evaluateHookHardReactionWinClip(
        sections.hookHardReactionWinClip,
        (hookHardReactionWinClipOpts ?? {}) as HookHardReactionWinClipOptions,
      ),
    );
  }
  if (sections.hookHardMidWinGrip !== undefined) {
    run(
      'hookHardMidWinGrip',
      evaluateHookHardMidWinGrip(
        sections.hookHardMidWinGrip,
        (hookHardMidWinGripOpts ?? {}) as HookHardMidWinGripOptions,
      ),
    );
  }
  if (sections.hookHardSetupWinGrip !== undefined) {
    run(
      'hookHardSetupWinGrip',
      evaluateHookHardSetupWinGrip(
        sections.hookHardSetupWinGrip,
        (hookHardSetupWinGripOpts ?? {}) as HookHardSetupWinGripOptions,
      ),
    );
  }
  if (sections.hookHardReactionWinGrip !== undefined) {
    run(
      'hookHardReactionWinGrip',
      evaluateHookHardReactionWinGrip(
        sections.hookHardReactionWinGrip,
        (hookHardReactionWinGripOpts ?? {}) as HookHardReactionWinGripOptions,
      ),
    );
  }
  if (sections.hookHardMidWinClasp !== undefined) {
    run(
      'hookHardMidWinClasp',
      evaluateHookHardMidWinClasp(
        sections.hookHardMidWinClasp,
        (hookHardMidWinClaspOpts ?? {}) as HookHardMidWinClaspOptions,
      ),
    );
  }
  if (sections.hookHardSetupWinClasp !== undefined) {
    run(
      'hookHardSetupWinClasp',
      evaluateHookHardSetupWinClasp(
        sections.hookHardSetupWinClasp,
        (hookHardSetupWinClaspOpts ?? {}) as HookHardSetupWinClaspOptions,
      ),
    );
  }
  if (sections.hookHardReactionWinClasp !== undefined) {
    run(
      'hookHardReactionWinClasp',
      evaluateHookHardReactionWinClasp(
        sections.hookHardReactionWinClasp,
        (hookHardReactionWinClaspOpts ?? {}) as HookHardReactionWinClaspOptions,
      ),
    );
  }
  if (sections.hookHardMidWinGrasp !== undefined) {
    run(
      'hookHardMidWinGrasp',
      evaluateHookHardMidWinGrasp(
        sections.hookHardMidWinGrasp,
        (hookHardMidWinGraspOpts ?? {}) as HookHardMidWinGraspOptions,
      ),
    );
  }
  if (sections.hookHardSetupWinGrasp !== undefined) {
    run(
      'hookHardSetupWinGrasp',
      evaluateHookHardSetupWinGrasp(
        sections.hookHardSetupWinGrasp,
        (hookHardSetupWinGraspOpts ?? {}) as HookHardSetupWinGraspOptions,
      ),
    );
  }
  if (sections.hookHardReactionWinGrasp !== undefined) {
    run(
      'hookHardReactionWinGrasp',
      evaluateHookHardReactionWinGrasp(
        sections.hookHardReactionWinGrasp,
        (hookHardReactionWinGraspOpts ?? {}) as HookHardReactionWinGraspOptions,
      ),
    );
  }
  if (sections.hookHardMidWinRivet !== undefined) {
    run(
      'hookHardMidWinRivet',
      evaluateHookHardMidWinRivet(
        sections.hookHardMidWinRivet,
        (hookHardMidWinRivetOpts ?? {}) as HookHardMidWinRivetOptions,
      ),
    );
  }
  if (sections.hookHardSetupWinRivet !== undefined) {
    run(
      'hookHardSetupWinRivet',
      evaluateHookHardSetupWinRivet(
        sections.hookHardSetupWinRivet,
        (hookHardSetupWinRivetOpts ?? {}) as HookHardSetupWinRivetOptions,
      ),
    );
  }
  if (sections.hookHardReactionWinRivet !== undefined) {
    run(
      'hookHardReactionWinRivet',
      evaluateHookHardReactionWinRivet(
        sections.hookHardReactionWinRivet,
        (hookHardReactionWinRivetOpts ?? {}) as HookHardReactionWinRivetOptions,
      ),
    );
  }
  if (sections.hookHardMidWinWeld !== undefined) {
    run(
      'hookHardMidWinWeld',
      evaluateHookHardMidWinWeld(
        sections.hookHardMidWinWeld,
        (hookHardMidWinWeldOpts ?? {}) as HookHardMidWinWeldOptions,
      ),
    );
  }
  if (sections.hookHardSetupWinWeld !== undefined) {
    run(
      'hookHardSetupWinWeld',
      evaluateHookHardSetupWinWeld(
        sections.hookHardSetupWinWeld,
        (hookHardSetupWinWeldOpts ?? {}) as HookHardSetupWinWeldOptions,
      ),
    );
  }
  if (sections.hookHardReactionWinWeld !== undefined) {
    run(
      'hookHardReactionWinWeld',
      evaluateHookHardReactionWinWeld(
        sections.hookHardReactionWinWeld,
        (hookHardReactionWinWeldOpts ?? {}) as HookHardReactionWinWeldOptions,
      ),
    );
  }
  if (sections.hookHardMidWinCleat !== undefined) {
    run(
      'hookHardMidWinCleat',
      evaluateHookHardMidWinCleat(
        sections.hookHardMidWinCleat,
        (hookHardMidWinCleatOpts ?? {}) as HookHardMidWinCleatOptions,
      ),
    );
  }
  if (sections.hookHardSetupWinCleat !== undefined) {
    run(
      'hookHardSetupWinCleat',
      evaluateHookHardSetupWinCleat(
        sections.hookHardSetupWinCleat,
        (hookHardSetupWinCleatOpts ?? {}) as HookHardSetupWinCleatOptions,
      ),
    );
  }
  if (sections.hookHardReactionWinCleat !== undefined) {
    run(
      'hookHardReactionWinCleat',
      evaluateHookHardReactionWinCleat(
        sections.hookHardReactionWinCleat,
        (hookHardReactionWinCleatOpts ?? {}) as HookHardReactionWinCleatOptions,
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
