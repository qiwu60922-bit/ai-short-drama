/**
 * V12 · Story-Ledger Suite (pre-gen rehearsal/assembly 总入口),
 * offline, deterministic.
 *
 * Bundles the 2026-10-29+ cross-ledger / ensemble gates into one
 * entry so EP01 rehearsal / factory can enforce them before fake generation:
 *   bondFrequencyLink · vestMaskPeakLink · frequencyPeakLink · amnesiaMotifLink
 *   ensembleCast · fakeLedgerReconcile · cliffCascadeLink · foreshadowMotifLink
 *   · allianceBondLink · personaVestLink · stageGoalConflictLink · reactionPeakLink
 *   · stageGoal · conflictPayoff · peakBeforePayoff · abilityRule  (baseline singles)
 *   · qualityLeap · foreshadowLedger · motifCallback · allianceLedger
 *   · bondContract · identityVest · frequencyTipping  (more baselines)
 *   · abilityStageLink · countdownCliffLink · dialogueReactionLink
 *   · personaCard · personaMask · amnesiaArc · openingCascade · cliffhangerHandoff
 *   · maskVestLink · frequencyAbilityLink · motifQualityLink
 *   · personaMaskLink · handoffCountdownLink
 *   · qualityReactionLink · foreshadowHandoffLink
 *   · peakQualityLink · abilityMaskLink · cliffHandoffLink
 *   · qualityMaskLink · abilityCliffLink · peakHandoffLink
 *   · motifRhythmBridge · qualityCliffLink
 *   · maskHandoffLink · abilityPeakLink
 *   · foreshadowRhythmBridge · amnesiaPeakLink · qualityHandoffLink · motifMaskLink
 *   · bondPeakLink · countdownMaskLink · allianceHandoffLink · frequencyMaskLink
 *   · vestMaskRhythmBridge
 *   · amnesiaHandoffLink · bondMaskLink · foreshadowPeakLink
 *   · motifForeshadowRhythmBridge
 *   · qualityMaskPeakBridge
 *   · abilityMaskPeakBridge
 *   · bondMaskPeakBridge
 *   · motifQualityRhythmBridge
 *   · abilityHandoffLink · alliancePeakLink · vestQualityLink · countdownPeakLink
 *   · foreshadowMaskPeakBridge · bondQualityRhythmBridge · personaVestPeakBridge
 *   · frequencyHandoffLink · motifPeakLink · amnesiaQualityLink · cliffMaskLink
 *   · abilityQualityRhythmBridge · maskHandoffPeakBridge · vestMotifPeakBridge
 *   · foreshadowQualityLink · bondHandoffLink · personaCliffLink · motifHandoffLink
 *   · abilityBondPeakBridge · foreshadowHandoffRhythmBridge · personaMotifPeakBridge
 *   · vestCliffLink · qualityFrequencyLink · amnesiaBondLink · motifCliffLink
 *   · conflictVestPeakBridge · allianceAmnesiaBondBridge · qualityHandoffRhythmBridge
 *   · conflictCliffLink · personaHandoffLink · foreshadowVestLink · abilityVestLink
 *   · allianceVestPeakBridge · amnesiaMaskPeakBridge · foreshadowQualityRhythmBridge
 *   · allianceCliffLink · bondVestLink · personaPeakLink · foreshadowCliffLink
 *
 * Absent sections → SKIP. Zero sections → EMPTY_SUITE FAIL.
 * Unknown keys → SCHEMA FAIL (strict).
 * Engineering suite only: PASS ≠ Final ≠ G3. $0.
 */
import { z } from 'zod';
import {
  EnsembleMemberSchema,
  EnsembleUnitSchema,
  evaluateEnsembleCast,
  type EnsembleCastReport,
} from './ensemble-cast-gate';
import {
  FakeLedgerEntrySchema,
  FakeLedgerLinkSchema,
  evaluateFakeLedgerReconcile,
  type FakeLedgerReconcileReport,
} from './fake-ledger-reconcile-gate';
import {
  BondContractEntrySchema,
  evaluateBondContract,
  type BondContractReport,
} from './bond-contract-gate';
import {
  FrequencyTippingEntrySchema,
  evaluateFrequencyTipping,
  type FrequencyTippingReport,
} from './frequency-tipping-gate';
import {
  BondFrequencyLinkEntrySchema,
  evaluateBondFrequencyLink,
  type BondFrequencyLinkReport,
} from './bond-frequency-link-gate';
import {
  evaluateVestMaskPeakLink,
  VestMaskPeakLinkEntrySchema,
  type VestMaskPeakLinkReport,
} from './vest-mask-peak-link-gate';
import {
  IdentityVestEntrySchema,
  evaluateIdentityVest,
  type IdentityVestReport,
} from './identity-vest-gate';
import {
  PersonaMaskEntrySchema,
  evaluatePersonaMask,
  type PersonaMaskReport,
} from './persona-mask-gate';
import {
  FrequencyPeakLinkEntrySchema,
  evaluateFrequencyPeakLink,
  type FrequencyPeakLinkReport,
} from './frequency-peak-link-gate';
import {
  AmnesiaMotifLinkEntrySchema,
  evaluateAmnesiaMotifLink,
  type AmnesiaMotifLinkReport,
} from './amnesia-motif-link-gate';
import {
  AmnesiaArcEntrySchema,
  evaluateAmnesiaArc,
  type AmnesiaArcReport,
} from './amnesia-arc-gate';
import {
  MotifEntrySchema,
  MotifAppearanceSchema,
  evaluateMotifCallbacks,
  type MotifCallbackReport,
} from './motif-callback-gate';
import {
  CliffCascadeLinkEntrySchema,
  evaluateCliffCascadeLink,
  type CliffCascadeLinkReport,
} from './cliff-cascade-link-gate';
import {
  ForeshadowMotifLinkEntrySchema,
  evaluateForeshadowMotifLink,
  type ForeshadowMotifLinkReport,
} from './foreshadow-motif-link-gate';
import {
  ForeshadowItemSchema,
  evaluateForeshadowLedger,
  type ForeshadowLedgerReport,
} from './foreshadow-ledger-gate';
import {
  AllianceBondLinkEntrySchema,
  evaluateAllianceBondLink,
  type AllianceBondLinkReport,
} from './alliance-bond-link-gate';
import {
  AllianceEntrySchema,
  AllianceEventSchema,
  evaluateAllianceLedger,
  type AllianceLedgerReport,
} from './alliance-ledger-gate';
import {
  PersonaVestLinkEntrySchema,
  evaluatePersonaVestLink,
  type PersonaVestLinkReport,
} from './persona-vest-link-gate';
import {
  PersonaCardSchema,
  evaluatePersonaCard,
  type PersonaCardReport,
} from './persona-card-gate';
import {
  StageGoalConflictLinkEntrySchema,
  evaluateStageGoalConflictLink,
  type StageGoalConflictLinkReport,
} from './stage-goal-conflict-link-gate';
import {
  StageGoalEntrySchema,
  StageProgressSchema,
  StageCountdownSchema,
} from './stage-goal-gate';
import { ConflictEntrySchema } from './conflict-payoff-gap-gate';
import {
  ReactionPeakLinkEntrySchema,
  evaluateReactionPeakLink,
  type ReactionPeakLinkReport,
} from './reaction-peak-link-gate';
import {
  PeakBeforePayoffEntrySchema,
  evaluatePeakBeforePayoff,
  type PeakBeforePayoffReport,
} from './peak-before-payoff-gate';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import {
  evaluateStageGoals,
  type StageGoalReport,
} from './stage-goal-gate';
import {
  evaluateConflictPayoffGap,
  type ConflictPayoffReport,
} from './conflict-payoff-gap-gate';
import {
  AbilityEntrySchema,
  AbilityUseSchema,
  evaluateAbilityRules,
  type AbilityRuleReport,
} from './ability-rule-gate';
import {
  QualityLeapDocSchema,
  evaluateQualityLeap,
  type QualityLeapReport,
} from './quality-leap-gate';
import {
  AbilityStageLinkEntrySchema,
  evaluateAbilityStageLink,
  type AbilityStageLinkReport,
} from './ability-stage-link-gate';
import {
  CountdownCliffLinkEntrySchema,
  evaluateCountdownCliffLink,
  type CountdownCliffLinkReport,
} from './countdown-cliff-link-gate';
import {
  DialogueReactionLinkEntrySchema,
  evaluateDialogueReactionLink,
  type DialogueReactionLinkReport,
} from './dialogue-reaction-link-gate';
import {
  evaluateOpeningCascade,
  type OpeningCascadeReport,
} from './opening-cascade-gate';
import {
  evaluateCliffhangerHandoff,
  type CliffhangerHandoffReport,
} from './cliffhanger-handoff-gate';
import {
  MaskVestLinkEntrySchema,
  evaluateMaskVestLink,
  type MaskVestLinkReport,
} from './mask-vest-link-gate';
import {
  FrequencyAbilityLinkEntrySchema,
  evaluateFrequencyAbilityLink,
  type FrequencyAbilityLinkReport,
} from './frequency-ability-link-gate';
import {
  MotifQualityLinkEntrySchema,
  evaluateMotifQualityLink,
  type MotifQualityLinkReport,
} from './motif-quality-link-gate';
import {
  PersonaMaskLinkEntrySchema,
  evaluatePersonaMaskLink,
  type PersonaMaskLinkReport,
} from './persona-mask-link-gate';
import {
  HandoffCountdownLinkEntrySchema,
  HandoffEntrySchema,
  evaluateHandoffCountdownLink,
  type HandoffCountdownLinkReport,
} from './handoff-countdown-link-gate';
import {
  QualityReactionLinkEntrySchema,
  evaluateQualityReactionLink,
  type QualityReactionLinkReport,
} from './quality-reaction-link-gate';
import {
  ForeshadowHandoffLinkEntrySchema,
  ForeshadowHandoffEntrySchema,
  evaluateForeshadowHandoffLink,
  type ForeshadowHandoffLinkReport,
} from './foreshadow-handoff-link-gate';
import {
  PeakQualityLinkEntrySchema,
  evaluatePeakQualityLink,
  type PeakQualityLinkReport,
} from './peak-quality-link-gate';
import {
  AbilityMaskLinkEntrySchema,
  evaluateAbilityMaskLink,
  type AbilityMaskLinkReport,
} from './ability-mask-link-gate';
import {
  CliffHandoffLinkEntrySchema,
  CliffHandoffEntrySchema,
  evaluateCliffHandoffLink,
  type CliffHandoffLinkReport,
} from './cliff-handoff-link-gate';
import {
  QualityMaskLinkEntrySchema,
  evaluateQualityMaskLink,
  type QualityMaskLinkReport,
} from './quality-mask-link-gate';
import {
  AbilityCliffLinkEntrySchema,
  evaluateAbilityCliffLink,
  type AbilityCliffLinkReport,
} from './ability-cliff-link-gate';
import {
  PeakHandoffLinkEntrySchema,
  PeakHandoffEntrySchema,
  evaluatePeakHandoffLink,
  type PeakHandoffLinkReport,
} from './peak-handoff-link-gate';
import {
  MotifRhythmBridgeLinkSchema,
  evaluateMotifRhythmBridge,
  type MotifRhythmBridgeReport,
} from './motif-rhythm-bridge-gate';
import {
  QualityCliffLinkEntrySchema,
  evaluateQualityCliffLink,
  type QualityCliffLinkReport,
} from './quality-cliff-link-gate';
import {
  MaskHandoffLinkEntrySchema,
  MaskHandoffEntrySchema,
  evaluateMaskHandoffLink,
  type MaskHandoffLinkReport,
} from './mask-handoff-link-gate';
import {
  AbilityPeakLinkEntrySchema,
  evaluateAbilityPeakLink,
  type AbilityPeakLinkReport,
} from './ability-peak-link-gate';
import {
  ForeshadowRhythmBridgeLinkSchema,
  evaluateForeshadowRhythmBridge,
  type ForeshadowRhythmBridgeReport,
} from './foreshadow-rhythm-bridge-gate';
import {
  AmnesiaPeakLinkEntrySchema,
  evaluateAmnesiaPeakLink,
  type AmnesiaPeakLinkReport,
} from './amnesia-peak-link-gate';
import {
  QualityHandoffLinkEntrySchema,
  QualityHandoffEntrySchema,
  evaluateQualityHandoffLink,
  type QualityHandoffLinkReport,
} from './quality-handoff-link-gate';
import {
  MotifMaskLinkEntrySchema,
  evaluateMotifMaskLink,
  type MotifMaskLinkReport,
} from './motif-mask-link-gate';

import {
  BondPeakLinkEntrySchema,
  evaluateBondPeakLink,
  type BondPeakLinkReport,
} from './bond-peak-link-gate';
import {
  CountdownMaskLinkEntrySchema,
  evaluateCountdownMaskLink,
  type CountdownMaskLinkReport,
} from './countdown-mask-link-gate';
import {
  AllianceHandoffLinkEntrySchema,
  AllianceHandoffEntrySchema,
  evaluateAllianceHandoffLink,
  type AllianceHandoffLinkReport,
} from './alliance-handoff-link-gate';
import {
  FrequencyMaskLinkEntrySchema,
  evaluateFrequencyMaskLink,
  type FrequencyMaskLinkReport,
} from './frequency-mask-link-gate';
import {
  VestMaskRhythmBridgeLinkSchema,
  evaluateVestMaskRhythmBridge,
  type VestMaskRhythmBridgeReport,
} from './vest-mask-rhythm-bridge-gate';
import {
  AmnesiaHandoffLinkEntrySchema,
  AmnesiaHandoffEntrySchema,
  evaluateAmnesiaHandoffLink,
  type AmnesiaHandoffLinkReport,
} from './amnesia-handoff-link-gate';
import {
  BondMaskLinkEntrySchema,
  evaluateBondMaskLink,
  type BondMaskLinkReport,
} from './bond-mask-link-gate';
import {
  ForeshadowPeakLinkEntrySchema,
  evaluateForeshadowPeakLink,
  type ForeshadowPeakLinkReport,
} from './foreshadow-peak-link-gate';
import {
  MotifForeshadowRhythmBridgeLinkSchema,
  evaluateMotifForeshadowRhythmBridge,
  type MotifForeshadowRhythmBridgeReport,
} from './motif-foreshadow-rhythm-bridge-gate';
import {
  QualityMaskPeakBridgeLinkSchema,
  evaluateQualityMaskPeakBridge,
  type QualityMaskPeakBridgeReport,
} from './quality-mask-peak-bridge-gate';
import {
  AbilityMaskPeakBridgeLinkSchema,
  evaluateAbilityMaskPeakBridge,
  type AbilityMaskPeakBridgeReport,
} from './ability-mask-peak-bridge-gate';
import {
  BondMaskPeakBridgeLinkSchema,
  evaluateBondMaskPeakBridge,
  type BondMaskPeakBridgeReport,
} from './bond-mask-peak-bridge-gate';
import {
  MotifQualityRhythmBridgeLinkSchema,
  evaluateMotifQualityRhythmBridge,
  type MotifQualityRhythmBridgeReport,
} from './motif-quality-rhythm-bridge-gate';
import {
  AbilityHandoffLinkEntrySchema,
  AbilityHandoffEntrySchema,
  evaluateAbilityHandoffLink,
  type AbilityHandoffLinkReport,
} from './ability-handoff-link-gate';
import {
  AlliancePeakLinkEntrySchema,
  evaluateAlliancePeakLink,
  type AlliancePeakLinkReport,
} from './alliance-peak-link-gate';
import {
  VestQualityLinkEntrySchema,
  evaluateVestQualityLink,
  type VestQualityLinkReport,
} from './vest-quality-link-gate';
import {
  CountdownPeakLinkEntrySchema,
  evaluateCountdownPeakLink,
  type CountdownPeakLinkReport,
} from './countdown-peak-link-gate';
import {
  ForeshadowMaskPeakBridgeLinkSchema,
  evaluateForeshadowMaskPeakBridge,
  type ForeshadowMaskPeakBridgeReport,
} from './foreshadow-mask-peak-bridge-gate';
import {
  BondQualityRhythmBridgeLinkSchema,
  evaluateBondQualityRhythmBridge,
  type BondQualityRhythmBridgeReport,
} from './bond-quality-rhythm-bridge-gate';
import {
  PersonaVestPeakBridgeLinkSchema,
  evaluatePersonaVestPeakBridge,
  type PersonaVestPeakBridgeReport,
} from './persona-vest-peak-bridge-gate';
import {
  FrequencyHandoffEntrySchema,
  FrequencyHandoffLinkEntrySchema,
  evaluateFrequencyHandoffLink,
  type FrequencyHandoffLinkReport,
} from './frequency-handoff-link-gate';
import {
  MotifPeakLinkEntrySchema,
  evaluateMotifPeakLink,
  type MotifPeakLinkReport,
} from './motif-peak-link-gate';
import {
  AmnesiaQualityLinkEntrySchema,
  evaluateAmnesiaQualityLink,
  type AmnesiaQualityLinkReport,
} from './amnesia-quality-link-gate';
import {
  CliffMaskLinkEntrySchema,
  evaluateCliffMaskLink,
  type CliffMaskLinkReport,
} from './cliff-mask-link-gate';

import {
  AbilityQualityRhythmBridgeLinkSchema,
  evaluateAbilityQualityRhythmBridge,
  type AbilityQualityRhythmBridgeReport,
} from './ability-quality-rhythm-bridge-gate';
import {
  MaskHandoffPeakBridgeLinkSchema,
  MaskHandoffPeakHandoffEntrySchema,
  evaluateMaskHandoffPeakBridge,
  type MaskHandoffPeakBridgeReport,
} from './mask-handoff-peak-bridge-gate';
import {
  VestMotifPeakBridgeLinkSchema,
  evaluateVestMotifPeakBridge,
  type VestMotifPeakBridgeReport,
} from './vest-motif-peak-bridge-gate';
import {
  ForeshadowQualityLinkEntrySchema,
  evaluateForeshadowQualityLink,
  type ForeshadowQualityLinkReport,
} from './foreshadow-quality-link-gate';
import {
  BondHandoffEntrySchema,
  BondHandoffLinkEntrySchema,
  evaluateBondHandoffLink,
  type BondHandoffLinkReport,
} from './bond-handoff-link-gate';
import {
  PersonaCliffLinkEntrySchema,
  evaluatePersonaCliffLink,
  type PersonaCliffLinkReport,
} from './persona-cliff-link-gate';
import {
  MotifHandoffEntrySchema,
  MotifHandoffLinkEntrySchema,
  evaluateMotifHandoffLink,
  type MotifHandoffLinkReport,
} from './motif-handoff-link-gate';

import {
  AbilityBondPeakBridgeLinkSchema,
  evaluateAbilityBondPeakBridge,
  type AbilityBondPeakBridgeReport,
} from './ability-bond-peak-bridge-gate';
import {
  ForeshadowHandoffRhythmBridgeLinkSchema,
  ForeshadowHandoffRhythmHandoffEntrySchema,
  evaluateForeshadowHandoffRhythmBridge,
  type ForeshadowHandoffRhythmBridgeReport,
} from './foreshadow-handoff-rhythm-bridge-gate';
import {
  PersonaMotifPeakBridgeLinkSchema,
  evaluatePersonaMotifPeakBridge,
  type PersonaMotifPeakBridgeReport,
} from './persona-motif-peak-bridge-gate';
import {
  VestCliffLinkEntrySchema,
  evaluateVestCliffLink,
  type VestCliffLinkReport,
} from './vest-cliff-link-gate';
import {
  QualityFrequencyLinkEntrySchema,
  evaluateQualityFrequencyLink,
  type QualityFrequencyLinkReport,
} from './quality-frequency-link-gate';
import {
  AmnesiaBondLinkEntrySchema,
  evaluateAmnesiaBondLink,
  type AmnesiaBondLinkReport,
} from './amnesia-bond-link-gate';
import {
  MotifCliffLinkEntrySchema,
  evaluateMotifCliffLink,
  type MotifCliffLinkReport,
} from './motif-cliff-link-gate';

import {
  ConflictVestPeakBridgeLinkSchema,
  evaluateConflictVestPeakBridge,
  type ConflictVestPeakBridgeReport,
} from './conflict-vest-peak-bridge-gate';
import {
  AllianceAmnesiaBondBridgeLinkSchema,
  evaluateAllianceAmnesiaBondBridge,
  type AllianceAmnesiaBondBridgeReport,
} from './alliance-amnesia-bond-bridge-gate';
import {
  QualityHandoffRhythmBridgeLinkSchema,
  QualityHandoffRhythmHandoffEntrySchema,
  evaluateQualityHandoffRhythmBridge,
  type QualityHandoffRhythmBridgeReport,
} from './quality-handoff-rhythm-bridge-gate';
import {
  ConflictCliffLinkEntrySchema,
  evaluateConflictCliffLink,
  type ConflictCliffLinkReport,
} from './conflict-cliff-link-gate';
import {
  PersonaHandoffEntrySchema,
  PersonaHandoffLinkEntrySchema,
  evaluatePersonaHandoffLink,
  type PersonaHandoffLinkReport,
} from './persona-handoff-link-gate';
import {
  ForeshadowVestLinkEntrySchema,
  evaluateForeshadowVestLink,
  type ForeshadowVestLinkReport,
} from './foreshadow-vest-link-gate';
import {
  AbilityVestLinkEntrySchema,
  evaluateAbilityVestLink,
  type AbilityVestLinkReport,
} from './ability-vest-link-gate';
import {
  AllianceVestPeakBridgeLinkSchema,
  evaluateAllianceVestPeakBridge,
  type AllianceVestPeakBridgeReport,
} from './alliance-vest-peak-bridge-gate';
import {
  AmnesiaMaskPeakBridgeLinkSchema,
  evaluateAmnesiaMaskPeakBridge,
  type AmnesiaMaskPeakBridgeReport,
} from './amnesia-mask-peak-bridge-gate';
import {
  ForeshadowQualityRhythmBridgeLinkSchema,
  evaluateForeshadowQualityRhythmBridge,
  type ForeshadowQualityRhythmBridgeReport,
} from './foreshadow-quality-rhythm-bridge-gate';
import {
  AllianceCliffLinkEntrySchema,
  evaluateAllianceCliffLink,
  type AllianceCliffLinkReport,
} from './alliance-cliff-link-gate';
import {
  BondVestLinkEntrySchema,
  evaluateBondVestLink,
  type BondVestLinkReport,
} from './bond-vest-link-gate';
import {
  PersonaPeakLinkEntrySchema,
  evaluatePersonaPeakLink,
  type PersonaPeakLinkReport,
} from './persona-peak-link-gate';
import {
  ForeshadowCliffLinkEntrySchema,
  evaluateForeshadowCliffLink,
  type ForeshadowCliffLinkReport,
} from './foreshadow-cliff-link-gate';

const Ep = z.number().int().positive();

export const STORY_LEDGER_GATE_IDS = [
  'bondFrequencyLink',
  'vestMaskPeakLink',
  'frequencyPeakLink',
  'amnesiaMotifLink',
  'ensembleCast',
  'fakeLedgerReconcile',
  'cliffCascadeLink',
  'foreshadowMotifLink',
  'allianceBondLink',
  'personaVestLink',
  'stageGoalConflictLink',
  'reactionPeakLink',
  'stageGoal',
  'conflictPayoff',
  'peakBeforePayoff',
  'abilityRule',
  'qualityLeap',
  'foreshadowLedger',
  'motifCallback',
  'allianceLedger',
  'bondContract',
  'identityVest',
  'frequencyTipping',
  'abilityStageLink',
  'countdownCliffLink',
  'dialogueReactionLink',
  'personaCard',
  'personaMask',
  'amnesiaArc',
  'openingCascade',
  'cliffhangerHandoff',
  'maskVestLink',
  'frequencyAbilityLink',
  'motifQualityLink',
  'personaMaskLink',
  'handoffCountdownLink',
  'qualityReactionLink',
  'foreshadowHandoffLink',
  'peakQualityLink',
  'abilityMaskLink',
  'cliffHandoffLink',
  'qualityMaskLink',
  'abilityCliffLink',
  'peakHandoffLink',
  'motifRhythmBridge',
  'qualityCliffLink',
  'maskHandoffLink',
  'abilityPeakLink',
  'foreshadowRhythmBridge',
  'amnesiaPeakLink',
  'qualityHandoffLink',
  'motifMaskLink',
  'bondPeakLink',
  'countdownMaskLink',
  'allianceHandoffLink',
  'frequencyMaskLink',
  'vestMaskRhythmBridge',
  'amnesiaHandoffLink',
  'bondMaskLink',
  'foreshadowPeakLink',
  'motifForeshadowRhythmBridge',
  'qualityMaskPeakBridge',
  'abilityMaskPeakBridge',
  'bondMaskPeakBridge',
  'motifQualityRhythmBridge',
  'abilityHandoffLink',
  'alliancePeakLink',
  'vestQualityLink',
  'countdownPeakLink',
  'foreshadowMaskPeakBridge',
  'bondQualityRhythmBridge',
  'personaVestPeakBridge',
  'frequencyHandoffLink',
  'motifPeakLink',
  'amnesiaQualityLink',
  'cliffMaskLink',
  'abilityQualityRhythmBridge',
  'maskHandoffPeakBridge',
  'vestMotifPeakBridge',
  'foreshadowQualityLink',
  'bondHandoffLink',
  'personaCliffLink',
  'motifHandoffLink',
  'abilityBondPeakBridge',
  'foreshadowHandoffRhythmBridge',
  'personaMotifPeakBridge',
  'vestCliffLink',
  'qualityFrequencyLink',
  'amnesiaBondLink',
  'motifCliffLink',
  'conflictVestPeakBridge',
  'allianceAmnesiaBondBridge',
  'qualityHandoffRhythmBridge',
  'conflictCliffLink',
  'personaHandoffLink',
  'foreshadowVestLink',
  'abilityVestLink',
  'allianceVestPeakBridge',
  'amnesiaMaskPeakBridge',
  'foreshadowQualityRhythmBridge',
  'allianceCliffLink',
  'bondVestLink',
  'personaPeakLink',
  'foreshadowCliffLink',
] as const;

export type StoryLedgerGateId = (typeof STORY_LEDGER_GATE_IDS)[number];

const EnsembleSectionSchema = z.object({
  members: z.array(EnsembleMemberSchema),
  units: z.array(EnsembleUnitSchema),
});

const FakeLedgerSectionSchema = z.object({
  surfaceEntries: z.array(FakeLedgerEntrySchema),
  trueEntries: z.array(FakeLedgerEntrySchema),
  links: z.array(FakeLedgerLinkSchema),
});

const BondFrequencySectionSchema = z.object({
  bonds: z.array(BondContractEntrySchema),
  frequencies: z.array(FrequencyTippingEntrySchema),
  links: z.array(BondFrequencyLinkEntrySchema),
});

const VestMaskPeakSectionSchema = z.object({
  vests: z.array(IdentityVestEntrySchema),
  masks: z.array(PersonaMaskEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(VestMaskPeakLinkEntrySchema),
});

const FrequencyPeakSectionSchema = z.object({
  frequencies: z.array(FrequencyTippingEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(FrequencyPeakLinkEntrySchema),
});

const AmnesiaMotifSectionSchema = z.object({
  amnesias: z.array(AmnesiaArcEntrySchema),
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  links: z.array(AmnesiaMotifLinkEntrySchema),
});

const CliffCascadeSectionSchema = z.object({
  links: z.array(CliffCascadeLinkEntrySchema),
  cliffOpts: z
    .object({
      hookWindowSec: z.number().positive().optional(),
      tailToleranceSec: z.number().positive().optional(),
    })
    .optional(),
  cascadeOpts: z
    .object({
      cascadeWindowSec: z.number().positive().optional(),
      minCascadeBeats: z.number().int().positive().optional(),
    })
    .optional(),
});

const ForeshadowMotifSectionSchema = z.object({
  foreshadows: z.array(ForeshadowItemSchema),
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  links: z.array(ForeshadowMotifLinkEntrySchema),
});

const AllianceBondSectionSchema = z.object({
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  bonds: z.array(BondContractEntrySchema),
  links: z.array(AllianceBondLinkEntrySchema),
});

const PersonaVestSectionSchema = z.object({
  cards: z.array(PersonaCardSchema).min(1),
  vests: z.array(IdentityVestEntrySchema),
  links: z.array(PersonaVestLinkEntrySchema),
});

const StageGoalConflictSectionSchema = z.object({
  seasonId: z.string().min(1),
  goals: z.array(StageGoalEntrySchema).min(1),
  progress: z.array(StageProgressSchema),
  countdowns: z.array(StageCountdownSchema).optional(),
  conflicts: z.array(ConflictEntrySchema),
  links: z.array(StageGoalConflictLinkEntrySchema),
});

const ReactionPeakSectionSchema = z.object({
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(ReactionPeakLinkEntrySchema),
});

const StageGoalSectionSchema = z.object({
  seasonId: z.string().min(1),
  goals: z.array(StageGoalEntrySchema).min(1),
  progress: z.array(StageProgressSchema),
  countdowns: z.array(StageCountdownSchema).optional(),
});

const ConflictPayoffSectionSchema = z.object({
  conflicts: z.array(ConflictEntrySchema),
});

const PeakBeforePayoffSectionSchema = z.object({
  entries: z.array(PeakBeforePayoffEntrySchema),
});

const AbilityRuleSectionSchema = z.object({
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
});

const ForeshadowLedgerSectionSchema = z.object({
  items: z.array(ForeshadowItemSchema),
  episodes: z
    .array(
      z.object({
        ep: Ep,
        plants: z.array(z.string()).optional(),
        advances: z.array(z.string()).optional(),
        payoffs: z.array(z.string()).optional(),
      }),
    )
    .optional(),
});

const MotifCallbackSectionSchema = z.object({
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
});

const AllianceLedgerSectionSchema = z.object({
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
});

const BondContractSectionSchema = z.object({
  entries: z.array(BondContractEntrySchema),
});

const IdentityVestSectionSchema = z.object({
  entries: z.array(IdentityVestEntrySchema),
});

const FrequencyTippingSectionSchema = z.object({
  entries: z.array(FrequencyTippingEntrySchema),
});

const AbilityStageSectionSchema = z.object({
  seasonId: z.string().min(1),
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  goals: z.array(StageGoalEntrySchema).min(1),
  progress: z.array(StageProgressSchema),
  countdowns: z.array(StageCountdownSchema).optional(),
  links: z.array(AbilityStageLinkEntrySchema),
});

const CountdownCliffSectionSchema = z.object({
  seasonId: z.string().min(1),
  goals: z.array(StageGoalEntrySchema).min(1),
  progress: z.array(StageProgressSchema),
  countdowns: z.array(StageCountdownSchema).min(1),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  links: z.array(CountdownCliffLinkEntrySchema),
});

const DialogueReactionSectionSchema = z.object({
  requireLabeledExposition: z.boolean().optional(),
  links: z.array(DialogueReactionLinkEntrySchema),
});

const PersonaMaskSectionSchema = z.object({
  entries: z.array(PersonaMaskEntrySchema),
});

const AmnesiaArcSectionSchema = z.object({
  entries: z.array(AmnesiaArcEntrySchema),
});

const CliffhangerHandoffSectionSchema = z.object({
  prev: ShotSpecDocSchema,
  next: ShotSpecDocSchema,
});

const MaskVestSectionSchema = z.object({
  masks: z.array(PersonaMaskEntrySchema),
  vests: z.array(IdentityVestEntrySchema),
  links: z.array(MaskVestLinkEntrySchema),
});

const FrequencyAbilitySectionSchema = z.object({
  frequencies: z.array(FrequencyTippingEntrySchema),
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  links: z.array(FrequencyAbilityLinkEntrySchema),
});

const MotifQualitySectionSchema = z.object({
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  links: z.array(MotifQualityLinkEntrySchema),
});

const PersonaMaskLinkSectionSchema = z.object({
  cards: z.array(PersonaCardSchema).min(1),
  masks: z.array(PersonaMaskEntrySchema),
  links: z.array(PersonaMaskLinkEntrySchema),
});

const HandoffCountdownSectionSchema = z.object({
  seasonId: z.string().min(1),
  goals: z.array(StageGoalEntrySchema).min(1),
  progress: z.array(StageProgressSchema),
  countdowns: z.array(StageCountdownSchema).min(1),
  handoffs: z.array(HandoffEntrySchema),
  links: z.array(HandoffCountdownLinkEntrySchema),
});

const QualityReactionSectionSchema = z.object({
  minIntense: z.number().int().min(1).max(5).optional(),
  links: z.array(QualityReactionLinkEntrySchema),
});

const ForeshadowHandoffSectionSchema = z.object({
  foreshadows: z.array(ForeshadowItemSchema),
  handoffs: z.array(ForeshadowHandoffEntrySchema),
  links: z.array(ForeshadowHandoffLinkEntrySchema),
});

const PeakQualitySectionSchema = z.object({
  minPeakIntense: z.number().int().min(1).max(5).optional(),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(PeakQualityLinkEntrySchema),
});

const AbilityMaskSectionSchema = z.object({
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  masks: z.array(PersonaMaskEntrySchema),
  links: z.array(AbilityMaskLinkEntrySchema),
});

const CliffHandoffLinkSectionSchema = z.object({
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  handoffs: z.array(CliffHandoffEntrySchema),
  links: z.array(CliffHandoffLinkEntrySchema),
});

const QualityMaskSectionSchema = z.object({
  minRevealIntense: z.number().int().min(1).max(5).optional(),
  masks: z.array(PersonaMaskEntrySchema),
  links: z.array(QualityMaskLinkEntrySchema),
});

const AbilityCliffSectionSchema = z.object({
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  links: z.array(AbilityCliffLinkEntrySchema),
});

const PeakHandoffSectionSchema = z.object({
  peaks: z.array(PeakBeforePayoffEntrySchema),
  handoffs: z.array(PeakHandoffEntrySchema),
  links: z.array(PeakHandoffLinkEntrySchema),
});

const MotifRhythmBridgeSectionSchema = z.object({
  profile: z.enum(['dense', 'default', 'intrigue', 'slow_burn']).optional(),
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  links: z.array(MotifRhythmBridgeLinkSchema),
});

const QualityCliffSectionSchema = z.object({
  minHandoffIntense: z.number().int().min(1).max(5).optional(),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  links: z.array(QualityCliffLinkEntrySchema),
});

const MaskHandoffSectionSchema = z.object({
  masks: z.array(PersonaMaskEntrySchema),
  handoffs: z.array(MaskHandoffEntrySchema),
  links: z.array(MaskHandoffLinkEntrySchema),
});

const AbilityPeakSectionSchema = z.object({
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AbilityPeakLinkEntrySchema),
});

const ForeshadowRhythmBridgeSectionSchema = z.object({
  profile: z.enum(['dense', 'default', 'intrigue', 'slow_burn']).optional(),
  items: z.array(ForeshadowItemSchema),
  links: z.array(ForeshadowRhythmBridgeLinkSchema),
});

const AmnesiaPeakSectionSchema = z.object({
  amnesias: z.array(AmnesiaArcEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AmnesiaPeakLinkEntrySchema),
});

const QualityHandoffSectionSchema = z.object({
  minHandoffIntense: z.number().int().min(1).max(5).optional(),
  handoffs: z.array(QualityHandoffEntrySchema),
  links: z.array(QualityHandoffLinkEntrySchema),
});

const MotifMaskSectionSchema = z.object({
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  masks: z.array(PersonaMaskEntrySchema),
  links: z.array(MotifMaskLinkEntrySchema),
});


const BondPeakSectionSchema = z.object({
  bonds: z.array(BondContractEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(BondPeakLinkEntrySchema),
});

const CountdownMaskSectionSchema = z.object({
  countdowns: z.array(StageCountdownSchema),
  masks: z.array(PersonaMaskEntrySchema),
  links: z.array(CountdownMaskLinkEntrySchema),
});

const AllianceHandoffSectionSchema = z.object({
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  handoffs: z.array(AllianceHandoffEntrySchema),
  links: z.array(AllianceHandoffLinkEntrySchema),
});

const FrequencyMaskSectionSchema = z.object({
  frequencies: z.array(FrequencyTippingEntrySchema),
  masks: z.array(PersonaMaskEntrySchema),
  links: z.array(FrequencyMaskLinkEntrySchema),
});

const VestMaskRhythmBridgeSectionSchema = z.object({
  profile: z.enum(['dense', 'default', 'intrigue', 'slow_burn']).optional(),
  vests: z.array(IdentityVestEntrySchema),
  masks: z.array(PersonaMaskEntrySchema),
  links: z.array(VestMaskRhythmBridgeLinkSchema),
});

const AmnesiaHandoffSectionSchema = z.object({
  amnesias: z.array(AmnesiaArcEntrySchema),
  handoffs: z.array(AmnesiaHandoffEntrySchema),
  links: z.array(AmnesiaHandoffLinkEntrySchema),
});

const BondMaskSectionSchema = z.object({
  bonds: z.array(BondContractEntrySchema),
  masks: z.array(PersonaMaskEntrySchema),
  links: z.array(BondMaskLinkEntrySchema),
});

const ForeshadowPeakSectionSchema = z.object({
  items: z.array(ForeshadowItemSchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(ForeshadowPeakLinkEntrySchema),
});

const MotifForeshadowRhythmBridgeSectionSchema = z.object({
  profile: z.enum(['dense', 'default', 'intrigue', 'slow_burn']).optional(),
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  items: z.array(ForeshadowItemSchema),
  links: z.array(MotifForeshadowRhythmBridgeLinkSchema),
});

const QualityMaskPeakBridgeSectionSchema = z.object({
  minTernaryIntense: z.number().int().min(1).max(5).optional(),
  masks: z.array(PersonaMaskEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(QualityMaskPeakBridgeLinkSchema),
});

const AbilityMaskPeakBridgeSectionSchema = z.object({
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  masks: z.array(PersonaMaskEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AbilityMaskPeakBridgeLinkSchema),
});

const BondMaskPeakBridgeSectionSchema = z.object({
  bonds: z.array(BondContractEntrySchema),
  masks: z.array(PersonaMaskEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(BondMaskPeakBridgeLinkSchema),
});

const MotifQualityRhythmBridgeSectionSchema = z.object({
  profile: z.enum(['dense', 'default', 'intrigue', 'slow_burn']).optional(),
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  links: z.array(MotifQualityRhythmBridgeLinkSchema),
});

const AbilityHandoffSectionSchema = z.object({
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  handoffs: z.array(AbilityHandoffEntrySchema),
  links: z.array(AbilityHandoffLinkEntrySchema),
});

const AlliancePeakSectionSchema = z.object({
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AlliancePeakLinkEntrySchema),
});

const VestQualitySectionSchema = z.object({
  minDropIntense: z.number().int().min(1).max(5).optional(),
  vests: z.array(IdentityVestEntrySchema),
  links: z.array(VestQualityLinkEntrySchema),
});

const CountdownPeakSectionSchema = z.object({
  countdowns: z.array(StageCountdownSchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(CountdownPeakLinkEntrySchema),
});

const ForeshadowMaskPeakBridgeSectionSchema = z.object({
  items: z.array(ForeshadowItemSchema),
  masks: z.array(PersonaMaskEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(ForeshadowMaskPeakBridgeLinkSchema),
});

const BondQualityRhythmBridgeSectionSchema = z.object({
  profile: z.enum(['dense', 'default', 'intrigue', 'slow_burn']).optional(),
  bonds: z.array(BondContractEntrySchema),
  links: z.array(BondQualityRhythmBridgeLinkSchema),
});

const PersonaVestPeakBridgeSectionSchema = z.object({
  cards: z.array(PersonaCardSchema).min(1),
  vests: z.array(IdentityVestEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(PersonaVestPeakBridgeLinkSchema),
});

const FrequencyHandoffSectionSchema = z.object({
  frequencies: z.array(FrequencyTippingEntrySchema),
  handoffs: z.array(FrequencyHandoffEntrySchema),
  links: z.array(FrequencyHandoffLinkEntrySchema),
});

const MotifPeakSectionSchema = z.object({
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(MotifPeakLinkEntrySchema),
});

const AmnesiaQualitySectionSchema = z.object({
  minRecoverIntense: z.number().int().min(1).max(5).optional(),
  amnesias: z.array(AmnesiaArcEntrySchema),
  links: z.array(AmnesiaQualityLinkEntrySchema),
});

const CliffMaskSectionSchema = z.object({
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  masks: z.array(PersonaMaskEntrySchema),
  links: z.array(CliffMaskLinkEntrySchema),
});

const AbilityQualityRhythmBridgeSectionSchema = z.object({
  profile: z.enum(['dense', 'default', 'intrigue', 'slow_burn']).optional(),
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  links: z.array(AbilityQualityRhythmBridgeLinkSchema),
});

const MaskHandoffPeakBridgeSectionSchema = z.object({
  masks: z.array(PersonaMaskEntrySchema),
  handoffs: z.array(MaskHandoffPeakHandoffEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(MaskHandoffPeakBridgeLinkSchema),
});

const VestMotifPeakBridgeSectionSchema = z.object({
  vests: z.array(IdentityVestEntrySchema),
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(VestMotifPeakBridgeLinkSchema),
});

const ForeshadowQualitySectionSchema = z.object({
  minPayoffIntense: z.number().int().min(1).max(5).optional(),
  items: z.array(ForeshadowItemSchema),
  links: z.array(ForeshadowQualityLinkEntrySchema),
});

const BondHandoffSectionSchema = z.object({
  bonds: z.array(BondContractEntrySchema),
  handoffs: z.array(BondHandoffEntrySchema),
  links: z.array(BondHandoffLinkEntrySchema),
});

const PersonaCliffSectionSchema = z.object({
  cards: z.array(PersonaCardSchema).min(1),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  links: z.array(PersonaCliffLinkEntrySchema),
});

const MotifHandoffSectionSchema = z.object({
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  handoffs: z.array(MotifHandoffEntrySchema),
  links: z.array(MotifHandoffLinkEntrySchema),
});



const AbilityBondPeakBridgeSectionSchema = z.object({
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  bonds: z.array(BondContractEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AbilityBondPeakBridgeLinkSchema),
});

const ForeshadowHandoffRhythmBridgeSectionSchema = z.object({
  profile: z.enum(['dense', 'default', 'intrigue', 'slow_burn']).optional(),
  items: z.array(ForeshadowItemSchema),
  handoffs: z.array(ForeshadowHandoffRhythmHandoffEntrySchema),
  links: z.array(ForeshadowHandoffRhythmBridgeLinkSchema),
});

const PersonaMotifPeakBridgeSectionSchema = z.object({
  cards: z.array(PersonaCardSchema).min(1),
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(PersonaMotifPeakBridgeLinkSchema),
});

const VestCliffSectionSchema = z.object({
  vests: z.array(IdentityVestEntrySchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  links: z.array(VestCliffLinkEntrySchema),
});

const QualityFrequencySectionSchema = z.object({
  minTipIntense: z.number().int().min(1).max(5).optional(),
  frequencies: z.array(FrequencyTippingEntrySchema),
  links: z.array(QualityFrequencyLinkEntrySchema),
});

const AmnesiaBondSectionSchema = z.object({
  amnesias: z.array(AmnesiaArcEntrySchema),
  bonds: z.array(BondContractEntrySchema),
  links: z.array(AmnesiaBondLinkEntrySchema),
});

const MotifCliffSectionSchema = z.object({
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  links: z.array(MotifCliffLinkEntrySchema),
});

const ConflictVestPeakBridgeSectionSchema = z.object({
  conflicts: z.array(ConflictEntrySchema),
  vests: z.array(IdentityVestEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(ConflictVestPeakBridgeLinkSchema),
});

const AllianceAmnesiaBondBridgeSectionSchema = z.object({
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  amnesias: z.array(AmnesiaArcEntrySchema),
  bonds: z.array(BondContractEntrySchema),
  links: z.array(AllianceAmnesiaBondBridgeLinkSchema),
});

const QualityHandoffRhythmBridgeSectionSchema = z.object({
  profile: z.enum(['dense', 'default', 'intrigue', 'slow_burn']).optional(),
  handoffs: z.array(QualityHandoffRhythmHandoffEntrySchema),
  links: z.array(QualityHandoffRhythmBridgeLinkSchema),
});

const ConflictCliffSectionSchema = z.object({
  conflicts: z.array(ConflictEntrySchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  links: z.array(ConflictCliffLinkEntrySchema),
});

const PersonaHandoffSectionSchema = z.object({
  cards: z.array(PersonaCardSchema).min(1),
  handoffs: z.array(PersonaHandoffEntrySchema),
  links: z.array(PersonaHandoffLinkEntrySchema),
});

const ForeshadowVestSectionSchema = z.object({
  items: z.array(ForeshadowItemSchema),
  vests: z.array(IdentityVestEntrySchema),
  links: z.array(ForeshadowVestLinkEntrySchema),
});

const AbilityVestSectionSchema = z.object({
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  vests: z.array(IdentityVestEntrySchema),
  links: z.array(AbilityVestLinkEntrySchema),
});

const AllianceVestPeakBridgeSectionSchema = z.object({
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  vests: z.array(IdentityVestEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AllianceVestPeakBridgeLinkSchema),
});

const AmnesiaMaskPeakBridgeSectionSchema = z.object({
  amnesias: z.array(AmnesiaArcEntrySchema),
  masks: z.array(PersonaMaskEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AmnesiaMaskPeakBridgeLinkSchema),
});

const ForeshadowQualityRhythmBridgeSectionSchema = z.object({
  profile: z.enum(['dense', 'default', 'intrigue', 'slow_burn']).optional(),
  items: z.array(ForeshadowItemSchema),
  links: z.array(ForeshadowQualityRhythmBridgeLinkSchema),
});

const AllianceCliffSectionSchema = z.object({
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  links: z.array(AllianceCliffLinkEntrySchema),
});

const BondVestSectionSchema = z.object({
  bonds: z.array(BondContractEntrySchema),
  vests: z.array(IdentityVestEntrySchema),
  links: z.array(BondVestLinkEntrySchema),
});

const PersonaPeakSectionSchema = z.object({
  cards: z.array(PersonaCardSchema).min(1),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(PersonaPeakLinkEntrySchema),
});

const ForeshadowCliffSectionSchema = z.object({
  items: z.array(ForeshadowItemSchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  links: z.array(ForeshadowCliffLinkEntrySchema),
});

export const StoryLedgerSuiteSchema = z
  .object({
    series: z.string().min(1),
    latestEp: Ep,
    bondFrequencyLink: BondFrequencySectionSchema.optional(),
    vestMaskPeakLink: VestMaskPeakSectionSchema.optional(),
    frequencyPeakLink: FrequencyPeakSectionSchema.optional(),
    amnesiaMotifLink: AmnesiaMotifSectionSchema.optional(),
    ensembleCast: EnsembleSectionSchema.optional(),
    fakeLedgerReconcile: FakeLedgerSectionSchema.optional(),
    cliffCascadeLink: CliffCascadeSectionSchema.optional(),
    foreshadowMotifLink: ForeshadowMotifSectionSchema.optional(),
    allianceBondLink: AllianceBondSectionSchema.optional(),
    personaVestLink: PersonaVestSectionSchema.optional(),
    stageGoalConflictLink: StageGoalConflictSectionSchema.optional(),
    reactionPeakLink: ReactionPeakSectionSchema.optional(),
    stageGoal: StageGoalSectionSchema.optional(),
    conflictPayoff: ConflictPayoffSectionSchema.optional(),
    peakBeforePayoff: PeakBeforePayoffSectionSchema.optional(),
    abilityRule: AbilityRuleSectionSchema.optional(),
    qualityLeap: QualityLeapDocSchema.optional(),
    foreshadowLedger: ForeshadowLedgerSectionSchema.optional(),
    motifCallback: MotifCallbackSectionSchema.optional(),
    allianceLedger: AllianceLedgerSectionSchema.optional(),
    bondContract: BondContractSectionSchema.optional(),
    identityVest: IdentityVestSectionSchema.optional(),
    frequencyTipping: FrequencyTippingSectionSchema.optional(),
    abilityStageLink: AbilityStageSectionSchema.optional(),
    countdownCliffLink: CountdownCliffSectionSchema.optional(),
    dialogueReactionLink: DialogueReactionSectionSchema.optional(),
    personaCard: PersonaCardSchema.optional(),
    personaMask: PersonaMaskSectionSchema.optional(),
    amnesiaArc: AmnesiaArcSectionSchema.optional(),
    openingCascade: ShotSpecDocSchema.optional(),
    cliffhangerHandoff: CliffhangerHandoffSectionSchema.optional(),
    maskVestLink: MaskVestSectionSchema.optional(),
    frequencyAbilityLink: FrequencyAbilitySectionSchema.optional(),
    motifQualityLink: MotifQualitySectionSchema.optional(),
    personaMaskLink: PersonaMaskLinkSectionSchema.optional(),
    handoffCountdownLink: HandoffCountdownSectionSchema.optional(),
    qualityReactionLink: QualityReactionSectionSchema.optional(),
    foreshadowHandoffLink: ForeshadowHandoffSectionSchema.optional(),
    peakQualityLink: PeakQualitySectionSchema.optional(),
    abilityMaskLink: AbilityMaskSectionSchema.optional(),
    cliffHandoffLink: CliffHandoffLinkSectionSchema.optional(),
    qualityMaskLink: QualityMaskSectionSchema.optional(),
    abilityCliffLink: AbilityCliffSectionSchema.optional(),
    peakHandoffLink: PeakHandoffSectionSchema.optional(),
    motifRhythmBridge: MotifRhythmBridgeSectionSchema.optional(),
    qualityCliffLink: QualityCliffSectionSchema.optional(),
    maskHandoffLink: MaskHandoffSectionSchema.optional(),
    abilityPeakLink: AbilityPeakSectionSchema.optional(),
    foreshadowRhythmBridge: ForeshadowRhythmBridgeSectionSchema.optional(),
    amnesiaPeakLink: AmnesiaPeakSectionSchema.optional(),
    qualityHandoffLink: QualityHandoffSectionSchema.optional(),
    motifMaskLink: MotifMaskSectionSchema.optional(),
    bondPeakLink: BondPeakSectionSchema.optional(),
    countdownMaskLink: CountdownMaskSectionSchema.optional(),
    allianceHandoffLink: AllianceHandoffSectionSchema.optional(),
    frequencyMaskLink: FrequencyMaskSectionSchema.optional(),
    vestMaskRhythmBridge: VestMaskRhythmBridgeSectionSchema.optional(),
    amnesiaHandoffLink: AmnesiaHandoffSectionSchema.optional(),
    bondMaskLink: BondMaskSectionSchema.optional(),
    foreshadowPeakLink: ForeshadowPeakSectionSchema.optional(),
    motifForeshadowRhythmBridge: MotifForeshadowRhythmBridgeSectionSchema.optional(),
    qualityMaskPeakBridge: QualityMaskPeakBridgeSectionSchema.optional(),
    abilityMaskPeakBridge: AbilityMaskPeakBridgeSectionSchema.optional(),
    bondMaskPeakBridge: BondMaskPeakBridgeSectionSchema.optional(),
    motifQualityRhythmBridge: MotifQualityRhythmBridgeSectionSchema.optional(),
    abilityHandoffLink: AbilityHandoffSectionSchema.optional(),
    alliancePeakLink: AlliancePeakSectionSchema.optional(),
    vestQualityLink: VestQualitySectionSchema.optional(),
    countdownPeakLink: CountdownPeakSectionSchema.optional(),
    foreshadowMaskPeakBridge: ForeshadowMaskPeakBridgeSectionSchema.optional(),
    bondQualityRhythmBridge: BondQualityRhythmBridgeSectionSchema.optional(),
    personaVestPeakBridge: PersonaVestPeakBridgeSectionSchema.optional(),
    frequencyHandoffLink: FrequencyHandoffSectionSchema.optional(),
    motifPeakLink: MotifPeakSectionSchema.optional(),
    amnesiaQualityLink: AmnesiaQualitySectionSchema.optional(),
    cliffMaskLink: CliffMaskSectionSchema.optional(),
    abilityQualityRhythmBridge: AbilityQualityRhythmBridgeSectionSchema.optional(),
    maskHandoffPeakBridge: MaskHandoffPeakBridgeSectionSchema.optional(),
    vestMotifPeakBridge: VestMotifPeakBridgeSectionSchema.optional(),
    foreshadowQualityLink: ForeshadowQualitySectionSchema.optional(),
    bondHandoffLink: BondHandoffSectionSchema.optional(),
    personaCliffLink: PersonaCliffSectionSchema.optional(),
    motifHandoffLink: MotifHandoffSectionSchema.optional(),
    abilityBondPeakBridge: AbilityBondPeakBridgeSectionSchema.optional(),
    foreshadowHandoffRhythmBridge: ForeshadowHandoffRhythmBridgeSectionSchema.optional(),
    personaMotifPeakBridge: PersonaMotifPeakBridgeSectionSchema.optional(),
    vestCliffLink: VestCliffSectionSchema.optional(),
    qualityFrequencyLink: QualityFrequencySectionSchema.optional(),
    amnesiaBondLink: AmnesiaBondSectionSchema.optional(),
    motifCliffLink: MotifCliffSectionSchema.optional(),
    conflictVestPeakBridge: ConflictVestPeakBridgeSectionSchema.optional(),
    allianceAmnesiaBondBridge: AllianceAmnesiaBondBridgeSectionSchema.optional(),
    qualityHandoffRhythmBridge: QualityHandoffRhythmBridgeSectionSchema.optional(),
    conflictCliffLink: ConflictCliffSectionSchema.optional(),
    personaHandoffLink: PersonaHandoffSectionSchema.optional(),
    foreshadowVestLink: ForeshadowVestSectionSchema.optional(),
    abilityVestLink: AbilityVestSectionSchema.optional(),
    allianceVestPeakBridge: AllianceVestPeakBridgeSectionSchema.optional(),
    amnesiaMaskPeakBridge: AmnesiaMaskPeakBridgeSectionSchema.optional(),
    foreshadowQualityRhythmBridge: ForeshadowQualityRhythmBridgeSectionSchema.optional(),
    allianceCliffLink: AllianceCliffSectionSchema.optional(),
    bondVestLink: BondVestSectionSchema.optional(),
    personaPeakLink: PersonaPeakSectionSchema.optional(),
    foreshadowCliffLink: ForeshadowCliffSectionSchema.optional(),
  })
  .strict();

export type StoryLedgerSuiteInput = z.infer<typeof StoryLedgerSuiteSchema>;

export type StoryLedgerChildReport =
  | BondFrequencyLinkReport
  | VestMaskPeakLinkReport
  | FrequencyPeakLinkReport
  | AmnesiaMotifLinkReport
  | EnsembleCastReport
  | FakeLedgerReconcileReport
  | CliffCascadeLinkReport
  | ForeshadowMotifLinkReport
  | AllianceBondLinkReport
  | PersonaVestLinkReport
  | StageGoalConflictLinkReport
  | ReactionPeakLinkReport
  | StageGoalReport
  | ConflictPayoffReport
  | PeakBeforePayoffReport
  | AbilityRuleReport
  | QualityLeapReport
  | ForeshadowLedgerReport
  | MotifCallbackReport
  | AllianceLedgerReport
  | BondContractReport
  | IdentityVestReport
  | FrequencyTippingReport
  | AbilityStageLinkReport
  | CountdownCliffLinkReport
  | DialogueReactionLinkReport
  | PersonaCardReport
  | PersonaMaskReport
  | AmnesiaArcReport
  | OpeningCascadeReport
  | CliffhangerHandoffReport
  | MaskVestLinkReport
  | FrequencyAbilityLinkReport
  | MotifQualityLinkReport
  | PersonaMaskLinkReport
  | HandoffCountdownLinkReport
  | QualityReactionLinkReport
  | ForeshadowHandoffLinkReport
  | PeakQualityLinkReport
  | AbilityMaskLinkReport
  | CliffHandoffLinkReport
  | QualityMaskLinkReport
  | AbilityCliffLinkReport
  | PeakHandoffLinkReport
  | MotifRhythmBridgeReport
  | QualityCliffLinkReport
  | MaskHandoffLinkReport
  | AbilityPeakLinkReport
  | ForeshadowRhythmBridgeReport
  | AmnesiaPeakLinkReport
  | QualityHandoffLinkReport
  | MotifMaskLinkReport
  | BondPeakLinkReport
  | CountdownMaskLinkReport
  | AllianceHandoffLinkReport
  | FrequencyMaskLinkReport
  | VestMaskRhythmBridgeReport
  | AmnesiaHandoffLinkReport
  | BondMaskLinkReport
  | ForeshadowPeakLinkReport
  | MotifForeshadowRhythmBridgeReport
  | QualityMaskPeakBridgeReport
  | AbilityMaskPeakBridgeReport
  | BondMaskPeakBridgeReport
  | MotifQualityRhythmBridgeReport
  | AbilityHandoffLinkReport
  | AlliancePeakLinkReport
  | VestQualityLinkReport
  | CountdownPeakLinkReport
  | ForeshadowMaskPeakBridgeReport
  | BondQualityRhythmBridgeReport
  | PersonaVestPeakBridgeReport
  | FrequencyHandoffLinkReport
  | MotifPeakLinkReport
  | AmnesiaQualityLinkReport
  | CliffMaskLinkReport
  | AbilityQualityRhythmBridgeReport
  | MaskHandoffPeakBridgeReport
  | VestMotifPeakBridgeReport
  | ForeshadowQualityLinkReport
  | BondHandoffLinkReport
  | PersonaCliffLinkReport
  | MotifHandoffLinkReport
  | AbilityBondPeakBridgeReport
  | ForeshadowHandoffRhythmBridgeReport
  | PersonaMotifPeakBridgeReport
  | VestCliffLinkReport
  | QualityFrequencyLinkReport
  | AmnesiaBondLinkReport
  | MotifCliffLinkReport
  | ConflictVestPeakBridgeReport
  | AllianceAmnesiaBondBridgeReport
  | QualityHandoffRhythmBridgeReport
  | ConflictCliffLinkReport
  | PersonaHandoffLinkReport
  | ForeshadowVestLinkReport
  | AbilityVestLinkReport
  | AllianceVestPeakBridgeReport
  | AmnesiaMaskPeakBridgeReport
  | ForeshadowQualityRhythmBridgeReport
  | AllianceCliffLinkReport
  | BondVestLinkReport
  | PersonaPeakLinkReport
  | ForeshadowCliffLinkReport;

export type StoryLedgerGateResult = {
  status: 'PASS' | 'FAIL' | 'SKIP';
  report?: StoryLedgerChildReport;
};

export type StoryLedgerSuiteFinding = {
  code: 'SCHEMA' | 'EMPTY_SUITE' | 'GATE_FAIL';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface StoryLedgerSuiteReport {
  schema: 'v12/StoryLedgerSuite/v1';
  verdict: 'PASS' | 'FAIL';
  metrics: {
    ran: number;
    passed: number;
    failed: number;
    skipped: number;
    latestEp: number;
  };
  results: Record<StoryLedgerGateId, StoryLedgerGateResult>;
  findings: StoryLedgerSuiteFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

function emptyResults(): Record<StoryLedgerGateId, StoryLedgerGateResult> {
  return Object.fromEntries(
    STORY_LEDGER_GATE_IDS.map((id) => [id, { status: 'SKIP' as const }]),
  ) as Record<StoryLedgerGateId, StoryLedgerGateResult>;
}

type Runner = (series: string, latestEp: number, section: unknown) => StoryLedgerChildReport;

const RUNNERS: Record<StoryLedgerGateId, Runner> = {
  bondFrequencyLink: (series, latestEp, section) =>
    evaluateBondFrequencyLink({ series, latestEp, ...(section as object) }),
  vestMaskPeakLink: (series, latestEp, section) =>
    evaluateVestMaskPeakLink({ series, latestEp, ...(section as object) }),
  frequencyPeakLink: (series, latestEp, section) =>
    evaluateFrequencyPeakLink({ series, latestEp, ...(section as object) }),
  amnesiaMotifLink: (series, latestEp, section) =>
    evaluateAmnesiaMotifLink({ series, latestEp, ...(section as object) }),
  ensembleCast: (series, latestEp, section) =>
    evaluateEnsembleCast({ series, latestEp, ...(section as object) }),
  fakeLedgerReconcile: (series, latestEp, section) =>
    evaluateFakeLedgerReconcile({ series, latestEp, ...(section as object) }),
  cliffCascadeLink: (series, latestEp, section) =>
    evaluateCliffCascadeLink({ series, latestEp, ...(section as object) }),
  foreshadowMotifLink: (series, latestEp, section) =>
    evaluateForeshadowMotifLink({ series, latestEp, ...(section as object) }),
  allianceBondLink: (series, latestEp, section) =>
    evaluateAllianceBondLink({ series, latestEp, ...(section as object) }),
  personaVestLink: (series, latestEp, section) =>
    evaluatePersonaVestLink({ series, latestEp, ...(section as object) }),
  stageGoalConflictLink: (series, latestEp, section) =>
    evaluateStageGoalConflictLink({ series, latestEp, ...(section as object) }),
  reactionPeakLink: (series, latestEp, section) =>
    evaluateReactionPeakLink({ series, latestEp, ...(section as object) }),
  stageGoal: (series, latestEp, section) =>
    evaluateStageGoals({ series, latestEp, ...(section as object) }),
  conflictPayoff: (series, latestEp, section) =>
    evaluateConflictPayoffGap({ series, latestEp, ...(section as object) }),
  peakBeforePayoff: (series, latestEp, section) =>
    evaluatePeakBeforePayoff({ series, latestEp, ...(section as object) }),
  abilityRule: (series, latestEp, section) =>
    evaluateAbilityRules({ series, latestEp, ...(section as object) }),
  qualityLeap: (_series, _latestEp, section) => evaluateQualityLeap(section),
  foreshadowLedger: (series, latestEp, section) =>
    evaluateForeshadowLedger({ series, latestEp, ...(section as object) }),
  motifCallback: (series, latestEp, section) =>
    evaluateMotifCallbacks({ series, latestEp, ...(section as object) }),
  allianceLedger: (series, latestEp, section) =>
    evaluateAllianceLedger({ series, latestEp, ...(section as object) }),
  bondContract: (series, latestEp, section) =>
    evaluateBondContract({ series, latestEp, ...(section as object) }),
  identityVest: (series, latestEp, section) =>
    evaluateIdentityVest({ series, latestEp, ...(section as object) }),
  frequencyTipping: (series, latestEp, section) =>
    evaluateFrequencyTipping({ series, latestEp, ...(section as object) }),
  abilityStageLink: (series, latestEp, section) =>
    evaluateAbilityStageLink({ series, latestEp, ...(section as object) }),
  countdownCliffLink: (series, latestEp, section) =>
    evaluateCountdownCliffLink({ series, latestEp, ...(section as object) }),
  dialogueReactionLink: (series, latestEp, section) =>
    evaluateDialogueReactionLink({ series, latestEp, ...(section as object) }),
  personaCard: (_series, _latestEp, section) => evaluatePersonaCard(section),
  personaMask: (series, latestEp, section) =>
    evaluatePersonaMask({ series, latestEp, ...(section as object) }),
  amnesiaArc: (series, latestEp, section) =>
    evaluateAmnesiaArc({ series, latestEp, ...(section as object) }),
  openingCascade: (_series, _latestEp, section) => evaluateOpeningCascade(section),
  cliffhangerHandoff: (_series, _latestEp, section) => {
    const s = section as { prev: unknown; next: unknown };
    return evaluateCliffhangerHandoff(s.prev, s.next);
  },
  maskVestLink: (series, latestEp, section) =>
    evaluateMaskVestLink({ series, latestEp, ...(section as object) }),
  frequencyAbilityLink: (series, latestEp, section) =>
    evaluateFrequencyAbilityLink({ series, latestEp, ...(section as object) }),
  motifQualityLink: (series, latestEp, section) =>
    evaluateMotifQualityLink({ series, latestEp, ...(section as object) }),
  personaMaskLink: (series, latestEp, section) =>
    evaluatePersonaMaskLink({ series, latestEp, ...(section as object) }),
  handoffCountdownLink: (series, latestEp, section) =>
    evaluateHandoffCountdownLink({ series, latestEp, ...(section as object) }),
  qualityReactionLink: (series, latestEp, section) =>
    evaluateQualityReactionLink({ series, latestEp, ...(section as object) }),
  foreshadowHandoffLink: (series, latestEp, section) =>
    evaluateForeshadowHandoffLink({ series, latestEp, ...(section as object) }),
  peakQualityLink: (series, latestEp, section) =>
    evaluatePeakQualityLink({ series, latestEp, ...(section as object) }),
  abilityMaskLink: (series, latestEp, section) =>
    evaluateAbilityMaskLink({ series, latestEp, ...(section as object) }),
  cliffHandoffLink: (series, latestEp, section) =>
    evaluateCliffHandoffLink({ series, latestEp, ...(section as object) }),
  qualityMaskLink: (series, latestEp, section) =>
    evaluateQualityMaskLink({ series, latestEp, ...(section as object) }),
  abilityCliffLink: (series, latestEp, section) =>
    evaluateAbilityCliffLink({ series, latestEp, ...(section as object) }),
  peakHandoffLink: (series, latestEp, section) =>
    evaluatePeakHandoffLink({ series, latestEp, ...(section as object) }),
  motifRhythmBridge: (series, latestEp, section) =>
    evaluateMotifRhythmBridge({ series, latestEp, ...(section as object) }),
  qualityCliffLink: (series, latestEp, section) =>
    evaluateQualityCliffLink({ series, latestEp, ...(section as object) }),
  maskHandoffLink: (series, latestEp, section) =>
    evaluateMaskHandoffLink({ series, latestEp, ...(section as object) }),
  abilityPeakLink: (series, latestEp, section) =>
    evaluateAbilityPeakLink({ series, latestEp, ...(section as object) }),
  foreshadowRhythmBridge: (series, latestEp, section) =>
    evaluateForeshadowRhythmBridge({ series, latestEp, ...(section as object) }),
  amnesiaPeakLink: (series, latestEp, section) =>
    evaluateAmnesiaPeakLink({ series, latestEp, ...(section as object) }),
  qualityHandoffLink: (series, latestEp, section) =>
    evaluateQualityHandoffLink({ series, latestEp, ...(section as object) }),
  motifMaskLink: (series, latestEp, section) =>
    evaluateMotifMaskLink({ series, latestEp, ...(section as object) }),
  bondPeakLink: (series, latestEp, section) =>
    evaluateBondPeakLink({ series, latestEp, ...(section as object) }),
  countdownMaskLink: (series, latestEp, section) =>
    evaluateCountdownMaskLink({ series, latestEp, ...(section as object) }),
  allianceHandoffLink: (series, latestEp, section) =>
    evaluateAllianceHandoffLink({ series, latestEp, ...(section as object) }),
  frequencyMaskLink: (series, latestEp, section) =>
    evaluateFrequencyMaskLink({ series, latestEp, ...(section as object) }),
  vestMaskRhythmBridge: (series, latestEp, section) =>
    evaluateVestMaskRhythmBridge({ series, latestEp, ...(section as object) }),
  amnesiaHandoffLink: (series, latestEp, section) =>
    evaluateAmnesiaHandoffLink({ series, latestEp, ...(section as object) }),
  bondMaskLink: (series, latestEp, section) =>
    evaluateBondMaskLink({ series, latestEp, ...(section as object) }),
  foreshadowPeakLink: (series, latestEp, section) =>
    evaluateForeshadowPeakLink({ series, latestEp, ...(section as object) }),
  motifForeshadowRhythmBridge: (series, latestEp, section) =>
    evaluateMotifForeshadowRhythmBridge({ series, latestEp, ...(section as object) }),
  qualityMaskPeakBridge: (series, latestEp, section) =>
    evaluateQualityMaskPeakBridge({ series, latestEp, ...(section as object) }),
  abilityMaskPeakBridge: (series, latestEp, section) =>
    evaluateAbilityMaskPeakBridge({ series, latestEp, ...(section as object) }),
  bondMaskPeakBridge: (series, latestEp, section) =>
    evaluateBondMaskPeakBridge({ series, latestEp, ...(section as object) }),
  motifQualityRhythmBridge: (series, latestEp, section) =>
    evaluateMotifQualityRhythmBridge({ series, latestEp, ...(section as object) }),
  abilityHandoffLink: (series, latestEp, section) =>
    evaluateAbilityHandoffLink({ series, latestEp, ...(section as object) }),
  alliancePeakLink: (series, latestEp, section) =>
    evaluateAlliancePeakLink({ series, latestEp, ...(section as object) }),
  vestQualityLink: (series, latestEp, section) =>
    evaluateVestQualityLink({ series, latestEp, ...(section as object) }),
  countdownPeakLink: (series, latestEp, section) =>
    evaluateCountdownPeakLink({ series, latestEp, ...(section as object) }),
  foreshadowMaskPeakBridge: (series, latestEp, section) =>
    evaluateForeshadowMaskPeakBridge({ series, latestEp, ...(section as object) }),
  bondQualityRhythmBridge: (series, latestEp, section) =>
    evaluateBondQualityRhythmBridge({ series, latestEp, ...(section as object) }),
  personaVestPeakBridge: (series, latestEp, section) =>
    evaluatePersonaVestPeakBridge({ series, latestEp, ...(section as object) }),
  frequencyHandoffLink: (series, latestEp, section) =>
    evaluateFrequencyHandoffLink({ series, latestEp, ...(section as object) }),
  motifPeakLink: (series, latestEp, section) =>
    evaluateMotifPeakLink({ series, latestEp, ...(section as object) }),
  amnesiaQualityLink: (series, latestEp, section) =>
    evaluateAmnesiaQualityLink({ series, latestEp, ...(section as object) }),
  cliffMaskLink: (series, latestEp, section) =>
    evaluateCliffMaskLink({ series, latestEp, ...(section as object) }),
  abilityQualityRhythmBridge: (series, latestEp, section) =>
    evaluateAbilityQualityRhythmBridge({ series, latestEp, ...(section as object) }),
  maskHandoffPeakBridge: (series, latestEp, section) =>
    evaluateMaskHandoffPeakBridge({ series, latestEp, ...(section as object) }),
  vestMotifPeakBridge: (series, latestEp, section) =>
    evaluateVestMotifPeakBridge({ series, latestEp, ...(section as object) }),
  foreshadowQualityLink: (series, latestEp, section) =>
    evaluateForeshadowQualityLink({ series, latestEp, ...(section as object) }),
  bondHandoffLink: (series, latestEp, section) =>
    evaluateBondHandoffLink({ series, latestEp, ...(section as object) }),
  personaCliffLink: (series, latestEp, section) =>
    evaluatePersonaCliffLink({ series, latestEp, ...(section as object) }),
  motifHandoffLink: (series, latestEp, section) =>
    evaluateMotifHandoffLink({ series, latestEp, ...(section as object) }),
  abilityBondPeakBridge: (series, latestEp, section) =>
    evaluateAbilityBondPeakBridge({ series, latestEp, ...(section as object) }),
  foreshadowHandoffRhythmBridge: (series, latestEp, section) =>
    evaluateForeshadowHandoffRhythmBridge({ series, latestEp, ...(section as object) }),
  personaMotifPeakBridge: (series, latestEp, section) =>
    evaluatePersonaMotifPeakBridge({ series, latestEp, ...(section as object) }),
  vestCliffLink: (series, latestEp, section) =>
    evaluateVestCliffLink({ series, latestEp, ...(section as object) }),
  qualityFrequencyLink: (series, latestEp, section) =>
    evaluateQualityFrequencyLink({ series, latestEp, ...(section as object) }),
  amnesiaBondLink: (series, latestEp, section) =>
    evaluateAmnesiaBondLink({ series, latestEp, ...(section as object) }),
  motifCliffLink: (series, latestEp, section) =>
    evaluateMotifCliffLink({ series, latestEp, ...(section as object) }),
  conflictVestPeakBridge: (series, latestEp, section) =>
    evaluateConflictVestPeakBridge({ series, latestEp, ...(section as object) }),
  allianceAmnesiaBondBridge: (series, latestEp, section) =>
    evaluateAllianceAmnesiaBondBridge({ series, latestEp, ...(section as object) }),
  qualityHandoffRhythmBridge: (series, latestEp, section) =>
    evaluateQualityHandoffRhythmBridge({ series, latestEp, ...(section as object) }),
  conflictCliffLink: (series, latestEp, section) =>
    evaluateConflictCliffLink({ series, latestEp, ...(section as object) }),
  personaHandoffLink: (series, latestEp, section) =>
    evaluatePersonaHandoffLink({ series, latestEp, ...(section as object) }),
  foreshadowVestLink: (series, latestEp, section) =>
    evaluateForeshadowVestLink({ series, latestEp, ...(section as object) }),
  abilityVestLink: (series, latestEp, section) =>
    evaluateAbilityVestLink({ series, latestEp, ...(section as object) }),
  allianceVestPeakBridge: (series, latestEp, section) =>
    evaluateAllianceVestPeakBridge({ series, latestEp, ...(section as object) }),
  amnesiaMaskPeakBridge: (series, latestEp, section) =>
    evaluateAmnesiaMaskPeakBridge({ series, latestEp, ...(section as object) }),
  foreshadowQualityRhythmBridge: (series, latestEp, section) =>
    evaluateForeshadowQualityRhythmBridge({ series, latestEp, ...(section as object) }),
  allianceCliffLink: (series, latestEp, section) =>
    evaluateAllianceCliffLink({ series, latestEp, ...(section as object) }),
  bondVestLink: (series, latestEp, section) =>
    evaluateBondVestLink({ series, latestEp, ...(section as object) }),
  personaPeakLink: (series, latestEp, section) =>
    evaluatePersonaPeakLink({ series, latestEp, ...(section as object) }),
  foreshadowCliffLink: (series, latestEp, section) =>
    evaluateForeshadowCliffLink({ series, latestEp, ...(section as object) }),
};

export function evaluateStoryLedgerSuite(input: unknown): StoryLedgerSuiteReport {
  const results = emptyResults();
  const findings: StoryLedgerSuiteFinding[] = [];

  const parsed = StoryLedgerSuiteSchema.safeParse(input);
  if (!parsed.success) {
    findings.push({
      code: 'SCHEMA',
      severity: 'FAIL',
      message: `StoryLedgerSuite schema: ${parsed.error.issues[0]?.message ?? 'invalid'}`,
      fix: '提供 series + latestEp，以及 0+ 已知 section（见 STORY_LEDGER_GATE_IDS）',
    });
    return {
      schema: 'v12/StoryLedgerSuite/v1',
      verdict: 'FAIL',
      metrics: { ran: 0, passed: 0, failed: 0, skipped: STORY_LEDGER_GATE_IDS.length, latestEp: 0 },
      results,
      findings,
      gates: GATES,
    };
  }

  const { series, latestEp, ...sections } = parsed.data;
  let ran = 0;
  let passed = 0;
  let failed = 0;

  for (const id of STORY_LEDGER_GATE_IDS) {
    const section = sections[id];
    if (section === undefined) continue;
    const report = RUNNERS[id](series, latestEp, section);
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
        fix: `修复 ${id} 子闸门后重跑 story-ledger-suite`,
      });
    }
  }

  const skipped = STORY_LEDGER_GATE_IDS.length - ran;
  if (ran === 0) {
    findings.push({
      code: 'EMPTY_SUITE',
      severity: 'FAIL',
      message: '未提供任何 story-ledger section',
      fix: `至少挂载一项：${STORY_LEDGER_GATE_IDS.join(' | ')}`,
    });
  }

  return {
    schema: 'v12/StoryLedgerSuite/v1',
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { ran, passed, failed, skipped, latestEp },
    results,
    findings,
    gates: GATES,
  };
}
