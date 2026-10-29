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
 *   · personaBondPeakBridge · abilityVestPeakBridge · allianceMaskPeakBridge
 *   · bondCliffLink · allianceMaskLink · amnesiaVestLink · conflictPeakLink
 *
 *   · conflictMaskPeakBridge · amnesiaBondPeakBridge · foreshadowVestPeakBridge
 *   · conflictMaskLink · amnesiaCliffLink · bondMotifLink · frequencyCliffLink
 *
 *   · allianceBondPeakBridge · bondVestPeakBridge · amnesiaVestPeakBridge
 *   · allianceVestLink · conflictVestLink · foreshadowMaskLink · abilityBondLink
 *
 *   · conflictBondPeakBridge · foreshadowBondPeakBridge · abilityConflictPeakBridge
 *   · conflictBondLink · amnesiaMaskLink · motifVestLink · abilityForeshadowLink
 *
 *   · motifBondPeakBridge · personaMaskPeakBridge · allianceForeshadowPeakBridge
 *   · foreshadowBondLink · abilityAllianceLink · conflictForeshadowLink · allianceAmnesiaLink
 *
 *   · conflictForeshadowPeakBridge · allianceAmnesiaPeakBridge · abilityMotifPeakBridge
 *   · allianceForeshadowLink · abilityMotifLink · conflictAllianceLink · personaBondLink
 *
 *   · conflictAlliancePeakBridge · conflictAmnesiaPeakBridge · foreshadowAmnesiaPeakBridge
 *   · conflictAmnesiaLink · foreshadowPersonaLink · allianceMotifLink · foreshadowAmnesiaLink
 *
 *   · allianceMotifPeakBridge · conflictMotifPeakBridge · foreshadowMotifPeakBridge
 *   · conflictMotifLink · foreshadowAllianceLink · conflictPersonaLink · alliancePersonaLink
 *
 *   · conflictPersonaPeakBridge · alliancePersonaPeakBridge · foreshadowPersonaPeakBridge
 *   · personaMotifLink · abilityPersonaLink · vestPersonaLink · maskPersonaLink
 *
 *   · abilityPersonaPeakBridge · vestPersonaPeakBridge · maskPersonaPeakBridge
 *   · amnesiaPersonaLink · motifPersonaLink · countdownPersonaLink · qualityPersonaLink
 *
 *   · amnesiaPersonaPeakBridge · motifPersonaPeakBridge · countdownPersonaPeakBridge · qualityPersonaPeakBridge
 *   · frequencyPersonaLink · handoffPersonaLink · cliffPersonaLink · bondPersonaLink
 *
 *   · frequencyPersonaPeakBridge · handoffPersonaPeakBridge · cliffPersonaPeakBridge · bondPersonaPeakBridge
 *   · abilityFrequencyLink · vestHandoffLink · maskCliffLink · maskFrequencyLink
 *
 *   · abilityFrequencyPeakBridge · vestHandoffPeakBridge · maskCliffPeakBridge · maskFrequencyPeakBridge
 *   · handoffVestLink · vestFrequencyLink · maskBondLink · handoffMaskLink
 *   · handoffVestPeakBridge · vestFrequencyPeakBridge · maskBondPeakBridge · handoffMaskPeakBridge
 *   · vestAbilityLink · handoffFrequencyLink · cliffBondLink · cliffFrequencyLink
 *   · vestAbilityPeakBridge · handoffFrequencyPeakBridge · cliffBondPeakBridge · cliffFrequencyPeakBridge
 *   · maskAbilityLink · cliffAbilityLink · handoffBondLink · handoffAbilityLink
 *   · maskAbilityPeakBridge · cliffAbilityPeakBridge · handoffBondPeakBridge · handoffAbilityPeakBridge
 *   · bondAbilityLink · handoffCliffLink · vestBondLink · frequencyBondLink
 *   · bondAbilityPeakBridge · handoffCliffPeakBridge · vestBondPeakBridge · frequencyBondPeakBridge
 *   · cliffVestLink · frequencyVestLink · vestMaskLink · personaFrequencyLink
 *   · cliffVestPeakBridge · frequencyVestPeakBridge · vestMaskPeakBridge · personaFrequencyPeakBridge
 *   · personaAbilityLink · cliffMotifLink · vestMotifLink · handoffMotifLink
 *   · motifCliffPeakBridge · motifVestPeakBridge · motifHandoffPeakBridge · vestCliffPeakBridge
 *   · motifAbilityLink · motifFrequencyLink · frequencyMotifLink · maskMotifLink
 *   · motifAbilityPeakBridge · motifFrequencyPeakBridge · frequencyMotifPeakBridge · abilityCliffPeakBridge
 *   · motifBondLink · motifAllianceLink · motifConflictLink · motifAmnesiaLink
 *   · frequencyAbilityPeakBridge · frequencyCliffPeakBridge · frequencyMaskPeakBridge · motifMaskPeakBridge
 *   · frequencyAmnesiaLink · amnesiaFrequencyLink · abilityAmnesiaLink · amnesiaAbilityLink
 *   · cliffMaskPeakBridge · maskAmnesiaPeakBridge · abilityAmnesiaPeakBridge · cliffAmnesiaPeakBridge
 *   · cliffAmnesiaLink · maskAmnesiaLink · bondAmnesiaLink · personaAmnesiaLink
 *   · amnesiaAbilityPeakBridge · amnesiaCliffPeakBridge · bondAmnesiaPeakBridge · personaAmnesiaPeakBridge
 *   · handoffAmnesiaLink · vestAmnesiaLink · qualityAmnesiaLink · amnesiaForeshadowLink
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
import {
  PersonaBondPeakBridgeLinkSchema,
  evaluatePersonaBondPeakBridge,
  type PersonaBondPeakBridgeReport,
} from './persona-bond-peak-bridge-gate';
import {
  AbilityVestPeakBridgeLinkSchema,
  evaluateAbilityVestPeakBridge,
  type AbilityVestPeakBridgeReport,
} from './ability-vest-peak-bridge-gate';
import {
  AllianceMaskPeakBridgeLinkSchema,
  evaluateAllianceMaskPeakBridge,
  type AllianceMaskPeakBridgeReport,
} from './alliance-mask-peak-bridge-gate';
import {
  BondCliffLinkEntrySchema,
  evaluateBondCliffLink,
  type BondCliffLinkReport,
} from './bond-cliff-link-gate';
import {
  AllianceMaskLinkEntrySchema,
  evaluateAllianceMaskLink,
  type AllianceMaskLinkReport,
} from './alliance-mask-link-gate';
import {
  AmnesiaVestLinkEntrySchema,
  evaluateAmnesiaVestLink,
  type AmnesiaVestLinkReport,
} from './amnesia-vest-link-gate';
import {
  ConflictPeakLinkEntrySchema,
  evaluateConflictPeakLink,
  type ConflictPeakLinkReport,
} from './conflict-peak-link-gate';
import {
  ConflictMaskPeakBridgeLinkSchema,
  evaluateConflictMaskPeakBridge,
  type ConflictMaskPeakBridgeReport,
} from './conflict-mask-peak-bridge-gate';
import {
  AmnesiaBondPeakBridgeLinkSchema,
  evaluateAmnesiaBondPeakBridge,
  type AmnesiaBondPeakBridgeReport,
} from './amnesia-bond-peak-bridge-gate';
import {
  ForeshadowVestPeakBridgeLinkSchema,
  evaluateForeshadowVestPeakBridge,
  type ForeshadowVestPeakBridgeReport,
} from './foreshadow-vest-peak-bridge-gate';
import {
  ConflictMaskLinkEntrySchema,
  evaluateConflictMaskLink,
  type ConflictMaskLinkReport,
} from './conflict-mask-link-gate';
import {
  AmnesiaCliffLinkEntrySchema,
  evaluateAmnesiaCliffLink,
  type AmnesiaCliffLinkReport,
} from './amnesia-cliff-link-gate';
import {
  BondMotifLinkEntrySchema,
  evaluateBondMotifLink,
  type BondMotifLinkReport,
} from './bond-motif-link-gate';
import {
  FrequencyCliffLinkEntrySchema,
  evaluateFrequencyCliffLink,
  type FrequencyCliffLinkReport,
} from './frequency-cliff-link-gate';
import {
  AllianceBondPeakBridgeLinkSchema,
  evaluateAllianceBondPeakBridge,
  type AllianceBondPeakBridgeReport,
} from './alliance-bond-peak-bridge-gate';
import {
  BondVestPeakBridgeLinkSchema,
  evaluateBondVestPeakBridge,
  type BondVestPeakBridgeReport,
} from './bond-vest-peak-bridge-gate';
import {
  AmnesiaVestPeakBridgeLinkSchema,
  evaluateAmnesiaVestPeakBridge,
  type AmnesiaVestPeakBridgeReport,
} from './amnesia-vest-peak-bridge-gate';
import {
  AllianceVestLinkEntrySchema,
  evaluateAllianceVestLink,
  type AllianceVestLinkReport,
} from './alliance-vest-link-gate';
import {
  ConflictVestLinkEntrySchema,
  evaluateConflictVestLink,
  type ConflictVestLinkReport,
} from './conflict-vest-link-gate';
import {
  ForeshadowMaskLinkEntrySchema,
  evaluateForeshadowMaskLink,
  type ForeshadowMaskLinkReport,
} from './foreshadow-mask-link-gate';
import {
  AbilityBondLinkEntrySchema,
  evaluateAbilityBondLink,
  type AbilityBondLinkReport,
} from './ability-bond-link-gate';
import {
  ConflictBondPeakBridgeLinkSchema,
  evaluateConflictBondPeakBridge,
  type ConflictBondPeakBridgeReport,
} from './conflict-bond-peak-bridge-gate';
import {
  ForeshadowBondPeakBridgeLinkSchema,
  evaluateForeshadowBondPeakBridge,
  type ForeshadowBondPeakBridgeReport,
} from './foreshadow-bond-peak-bridge-gate';
import {
  AbilityConflictPeakBridgeLinkSchema,
  evaluateAbilityConflictPeakBridge,
  type AbilityConflictPeakBridgeReport,
} from './ability-conflict-peak-bridge-gate';
import {
  ConflictBondLinkEntrySchema,
  evaluateConflictBondLink,
  type ConflictBondLinkReport,
} from './conflict-bond-link-gate';
import {
  AmnesiaMaskLinkEntrySchema,
  evaluateAmnesiaMaskLink,
  type AmnesiaMaskLinkReport,
} from './amnesia-mask-link-gate';
import {
  MotifVestLinkEntrySchema,
  evaluateMotifVestLink,
  type MotifVestLinkReport,
} from './motif-vest-link-gate';
import {
  AbilityForeshadowLinkEntrySchema,
  evaluateAbilityForeshadowLink,
  type AbilityForeshadowLinkReport,
} from './ability-foreshadow-link-gate';
import {
  MotifBondPeakBridgeLinkSchema,
  evaluateMotifBondPeakBridge,
  type MotifBondPeakBridgeReport,
} from './motif-bond-peak-bridge-gate';
import {
  PersonaMaskPeakBridgeLinkSchema,
  evaluatePersonaMaskPeakBridge,
  type PersonaMaskPeakBridgeReport,
} from './persona-mask-peak-bridge-gate';
import {
  AllianceForeshadowPeakBridgeLinkSchema,
  evaluateAllianceForeshadowPeakBridge,
  type AllianceForeshadowPeakBridgeReport,
} from './alliance-foreshadow-peak-bridge-gate';
import {
  ForeshadowBondLinkEntrySchema,
  evaluateForeshadowBondLink,
  type ForeshadowBondLinkReport,
} from './foreshadow-bond-link-gate';
import {
  AbilityAllianceLinkEntrySchema,
  evaluateAbilityAllianceLink,
  type AbilityAllianceLinkReport,
} from './ability-alliance-link-gate';
import {
  ConflictForeshadowLinkEntrySchema,
  evaluateConflictForeshadowLink,
  type ConflictForeshadowLinkReport,
} from './conflict-foreshadow-link-gate';
import {
  AllianceAmnesiaLinkEntrySchema,
  evaluateAllianceAmnesiaLink,
  type AllianceAmnesiaLinkReport,
} from './alliance-amnesia-link-gate';
import {
  ConflictForeshadowPeakBridgeLinkSchema,
  evaluateConflictForeshadowPeakBridge,
  type ConflictForeshadowPeakBridgeReport,
} from './conflict-foreshadow-peak-bridge-gate';
import {
  AllianceAmnesiaPeakBridgeLinkSchema,
  evaluateAllianceAmnesiaPeakBridge,
  type AllianceAmnesiaPeakBridgeReport,
} from './alliance-amnesia-peak-bridge-gate';
import {
  AbilityMotifPeakBridgeLinkSchema,
  evaluateAbilityMotifPeakBridge,
  type AbilityMotifPeakBridgeReport,
} from './ability-motif-peak-bridge-gate';
import {
  AllianceForeshadowLinkEntrySchema,
  evaluateAllianceForeshadowLink,
  type AllianceForeshadowLinkReport,
} from './alliance-foreshadow-link-gate';
import {
  AbilityMotifLinkEntrySchema,
  evaluateAbilityMotifLink,
  type AbilityMotifLinkReport,
} from './ability-motif-link-gate';
import {
  ConflictAllianceLinkEntrySchema,
  evaluateConflictAllianceLink,
  type ConflictAllianceLinkReport,
} from './conflict-alliance-link-gate';
import {
  PersonaBondLinkEntrySchema,
  evaluatePersonaBondLink,
  type PersonaBondLinkReport,
} from './persona-bond-link-gate';

import {
  ConflictAlliancePeakBridgeLinkSchema,
  evaluateConflictAlliancePeakBridge,
  type ConflictAlliancePeakBridgeReport,
} from './conflict-alliance-peak-bridge-gate';
import {
  ConflictAmnesiaPeakBridgeLinkSchema,
  evaluateConflictAmnesiaPeakBridge,
  type ConflictAmnesiaPeakBridgeReport,
} from './conflict-amnesia-peak-bridge-gate';
import {
  ForeshadowAmnesiaPeakBridgeLinkSchema,
  evaluateForeshadowAmnesiaPeakBridge,
  type ForeshadowAmnesiaPeakBridgeReport,
} from './foreshadow-amnesia-peak-bridge-gate';
import {
  ConflictAmnesiaLinkEntrySchema,
  evaluateConflictAmnesiaLink,
  type ConflictAmnesiaLinkReport,
} from './conflict-amnesia-link-gate';
import {
  ForeshadowPersonaLinkEntrySchema,
  evaluateForeshadowPersonaLink,
  type ForeshadowPersonaLinkReport,
} from './foreshadow-persona-link-gate';
import {
  AllianceMotifLinkEntrySchema,
  evaluateAllianceMotifLink,
  type AllianceMotifLinkReport,
} from './alliance-motif-link-gate';
import {
  ForeshadowAmnesiaLinkEntrySchema,
  evaluateForeshadowAmnesiaLink,
  type ForeshadowAmnesiaLinkReport,
} from './foreshadow-amnesia-link-gate';

import {
  AllianceMotifPeakBridgeLinkSchema,
  evaluateAllianceMotifPeakBridge,
  type AllianceMotifPeakBridgeReport,
} from './alliance-motif-peak-bridge-gate';
import {
  ConflictMotifPeakBridgeLinkSchema,
  evaluateConflictMotifPeakBridge,
  type ConflictMotifPeakBridgeReport,
} from './conflict-motif-peak-bridge-gate';
import {
  ForeshadowMotifPeakBridgeLinkSchema,
  evaluateForeshadowMotifPeakBridge,
  type ForeshadowMotifPeakBridgeReport,
} from './foreshadow-motif-peak-bridge-gate';
import {
  ConflictMotifLinkEntrySchema,
  evaluateConflictMotifLink,
  type ConflictMotifLinkReport,
} from './conflict-motif-link-gate';
import {
  ForeshadowAllianceLinkEntrySchema,
  evaluateForeshadowAllianceLink,
  type ForeshadowAllianceLinkReport,
} from './foreshadow-alliance-link-gate';
import {
  ConflictPersonaLinkEntrySchema,
  evaluateConflictPersonaLink,
  type ConflictPersonaLinkReport,
} from './conflict-persona-link-gate';
import {
  AlliancePersonaLinkEntrySchema,
  evaluateAlliancePersonaLink,
  type AlliancePersonaLinkReport,
} from './alliance-persona-link-gate';

import {
  ConflictPersonaPeakBridgeLinkSchema,
  evaluateConflictPersonaPeakBridge,
  type ConflictPersonaPeakBridgeReport,
} from './conflict-persona-peak-bridge-gate';
import {
  AlliancePersonaPeakBridgeLinkSchema,
  evaluateAlliancePersonaPeakBridge,
  type AlliancePersonaPeakBridgeReport,
} from './alliance-persona-peak-bridge-gate';
import {
  ForeshadowPersonaPeakBridgeLinkSchema,
  evaluateForeshadowPersonaPeakBridge,
  type ForeshadowPersonaPeakBridgeReport,
} from './foreshadow-persona-peak-bridge-gate';
import {
  PersonaMotifLinkEntrySchema,
  evaluatePersonaMotifLink,
  type PersonaMotifLinkReport,
} from './persona-motif-link-gate';
import {
  AbilityPersonaLinkEntrySchema,
  evaluateAbilityPersonaLink,
  type AbilityPersonaLinkReport,
} from './ability-persona-link-gate';
import {
  VestPersonaLinkEntrySchema,
  evaluateVestPersonaLink,
  type VestPersonaLinkReport,
} from './vest-persona-link-gate';
import {
  MaskPersonaLinkEntrySchema,
  evaluateMaskPersonaLink,
  type MaskPersonaLinkReport,
} from './mask-persona-link-gate';

import {
  AbilityPersonaPeakBridgeLinkSchema,
  evaluateAbilityPersonaPeakBridge,
  type AbilityPersonaPeakBridgeReport,
} from './ability-persona-peak-bridge-gate';
import {
  VestPersonaPeakBridgeLinkSchema,
  evaluateVestPersonaPeakBridge,
  type VestPersonaPeakBridgeReport,
} from './vest-persona-peak-bridge-gate';
import {
  MaskPersonaPeakBridgeLinkSchema,
  evaluateMaskPersonaPeakBridge,
  type MaskPersonaPeakBridgeReport,
} from './mask-persona-peak-bridge-gate';
import {
  AmnesiaPersonaLinkEntrySchema,
  evaluateAmnesiaPersonaLink,
  type AmnesiaPersonaLinkReport,
} from './amnesia-persona-link-gate';
import {
  MotifPersonaLinkEntrySchema,
  evaluateMotifPersonaLink,
  type MotifPersonaLinkReport,
} from './motif-persona-link-gate';
import {
  CountdownPersonaLinkEntrySchema,
  evaluateCountdownPersonaLink,
  type CountdownPersonaLinkReport,
} from './countdown-persona-link-gate';
import {
  QualityPersonaLinkEntrySchema,
  evaluateQualityPersonaLink,
  type QualityPersonaLinkReport,
} from './quality-persona-link-gate';

import {
  AmnesiaPersonaPeakBridgeLinkSchema,
  evaluateAmnesiaPersonaPeakBridge,
  type AmnesiaPersonaPeakBridgeReport,
} from './amnesia-persona-peak-bridge-gate';
import {
  MotifPersonaPeakBridgeLinkSchema,
  evaluateMotifPersonaPeakBridge,
  type MotifPersonaPeakBridgeReport,
} from './motif-persona-peak-bridge-gate';
import {
  CountdownPersonaPeakBridgeLinkSchema,
  evaluateCountdownPersonaPeakBridge,
  type CountdownPersonaPeakBridgeReport,
} from './countdown-persona-peak-bridge-gate';
import {
  QualityPersonaPeakBridgeLinkSchema,
  evaluateQualityPersonaPeakBridge,
  type QualityPersonaPeakBridgeReport,
} from './quality-persona-peak-bridge-gate';
import {
  FrequencyPersonaLinkEntrySchema,
  evaluateFrequencyPersonaLink,
  type FrequencyPersonaLinkReport,
} from './frequency-persona-link-gate';
import {
  HandoffPersonaLinkEntrySchema,
  HandoffPersonaEntrySchema,
  evaluateHandoffPersonaLink,
  type HandoffPersonaLinkReport,
} from './handoff-persona-link-gate';
import {
  CliffPersonaLinkEntrySchema,
  evaluateCliffPersonaLink,
  type CliffPersonaLinkReport,
} from './cliff-persona-link-gate';
import {
  BondPersonaLinkEntrySchema,
  evaluateBondPersonaLink,
  type BondPersonaLinkReport,
} from './bond-persona-link-gate';

import {
  FrequencyPersonaPeakBridgeLinkSchema,
  evaluateFrequencyPersonaPeakBridge,
  type FrequencyPersonaPeakBridgeReport,
} from './frequency-persona-peak-bridge-gate';
import {
  HandoffPersonaPeakBridgeLinkSchema,
  HandoffPersonaPeakHandoffEntrySchema,
  evaluateHandoffPersonaPeakBridge,
  type HandoffPersonaPeakBridgeReport,
} from './handoff-persona-peak-bridge-gate';
import {
  CliffPersonaPeakBridgeLinkSchema,
  evaluateCliffPersonaPeakBridge,
  type CliffPersonaPeakBridgeReport,
} from './cliff-persona-peak-bridge-gate';
import {
  BondPersonaPeakBridgeLinkSchema,
  evaluateBondPersonaPeakBridge,
  type BondPersonaPeakBridgeReport,
} from './bond-persona-peak-bridge-gate';
import {
  AbilityFrequencyLinkEntrySchema,
  evaluateAbilityFrequencyLink,
  type AbilityFrequencyLinkReport,
} from './ability-frequency-link-gate';
import {
  VestHandoffLinkEntrySchema,
  VestHandoffEntrySchema,
  evaluateVestHandoffLink,
  type VestHandoffLinkReport,
} from './vest-handoff-link-gate';
import {
  MaskCliffLinkEntrySchema,
  evaluateMaskCliffLink,
  type MaskCliffLinkReport,
} from './mask-cliff-link-gate';
import {
  MaskFrequencyLinkEntrySchema,
  evaluateMaskFrequencyLink,
  type MaskFrequencyLinkReport,
} from './mask-frequency-link-gate';

import {
  AbilityFrequencyPeakBridgeLinkSchema,
  evaluateAbilityFrequencyPeakBridge,
  type AbilityFrequencyPeakBridgeReport,
} from './ability-frequency-peak-bridge-gate';
import {
  VestHandoffPeakBridgeLinkSchema,
  VestHandoffPeakHandoffEntrySchema,
  evaluateVestHandoffPeakBridge,
  type VestHandoffPeakBridgeReport,
} from './vest-handoff-peak-bridge-gate';
import {
  MaskCliffPeakBridgeLinkSchema,
  evaluateMaskCliffPeakBridge,
  type MaskCliffPeakBridgeReport,
} from './mask-cliff-peak-bridge-gate';
import {
  MaskFrequencyPeakBridgeLinkSchema,
  evaluateMaskFrequencyPeakBridge,
  type MaskFrequencyPeakBridgeReport,
} from './mask-frequency-peak-bridge-gate';
import {
  HandoffVestLinkEntrySchema,
  HandoffVestEntrySchema,
  evaluateHandoffVestLink,
  type HandoffVestLinkReport,
} from './handoff-vest-link-gate';
import {
  VestFrequencyLinkEntrySchema,
  evaluateVestFrequencyLink,
  type VestFrequencyLinkReport,
} from './vest-frequency-link-gate';
import {
  MaskBondLinkEntrySchema,
  evaluateMaskBondLink,
  type MaskBondLinkReport,
} from './mask-bond-link-gate';
import {
  HandoffMaskLinkEntrySchema,
  HandoffMaskEntrySchema,
  evaluateHandoffMaskLink,
  type HandoffMaskLinkReport,
} from './handoff-mask-link-gate';

import {
  HandoffVestPeakBridgeLinkSchema,
  HandoffVestPeakHandoffEntrySchema,
  evaluateHandoffVestPeakBridge,
  type HandoffVestPeakBridgeReport,
} from './handoff-vest-peak-bridge-gate';
import {
  VestFrequencyPeakBridgeLinkSchema,
  evaluateVestFrequencyPeakBridge,
  type VestFrequencyPeakBridgeReport,
} from './vest-frequency-peak-bridge-gate';
import {
  MaskBondPeakBridgeLinkSchema,
  evaluateMaskBondPeakBridge,
  type MaskBondPeakBridgeReport,
} from './mask-bond-peak-bridge-gate';
import {
  HandoffMaskPeakBridgeLinkSchema,
  HandoffMaskPeakHandoffEntrySchema,
  evaluateHandoffMaskPeakBridge,
  type HandoffMaskPeakBridgeReport,
} from './handoff-mask-peak-bridge-gate';
import {
  VestAbilityLinkEntrySchema,
  evaluateVestAbilityLink,
  type VestAbilityLinkReport,
} from './vest-ability-link-gate';
import {
  HandoffFrequencyLinkEntrySchema,
  HandoffFrequencyEntrySchema,
  evaluateHandoffFrequencyLink,
  type HandoffFrequencyLinkReport,
} from './handoff-frequency-link-gate';
import {
  CliffBondLinkEntrySchema,
  evaluateCliffBondLink,
  type CliffBondLinkReport,
} from './cliff-bond-link-gate';
import {
  CliffFrequencyLinkEntrySchema,
  evaluateCliffFrequencyLink,
  type CliffFrequencyLinkReport,
} from './cliff-frequency-link-gate';

import {
  VestAbilityPeakBridgeLinkSchema,
  evaluateVestAbilityPeakBridge,
  type VestAbilityPeakBridgeReport,
} from './vest-ability-peak-bridge-gate';
import {
  HandoffFrequencyPeakBridgeLinkSchema,
  HandoffFrequencyPeakHandoffEntrySchema,
  evaluateHandoffFrequencyPeakBridge,
  type HandoffFrequencyPeakBridgeReport,
} from './handoff-frequency-peak-bridge-gate';
import {
  CliffBondPeakBridgeLinkSchema,
  evaluateCliffBondPeakBridge,
  type CliffBondPeakBridgeReport,
} from './cliff-bond-peak-bridge-gate';
import {
  CliffFrequencyPeakBridgeLinkSchema,
  evaluateCliffFrequencyPeakBridge,
  type CliffFrequencyPeakBridgeReport,
} from './cliff-frequency-peak-bridge-gate';
import {
  MaskAbilityLinkEntrySchema,
  evaluateMaskAbilityLink,
  type MaskAbilityLinkReport,
} from './mask-ability-link-gate';
import {
  CliffAbilityLinkEntrySchema,
  evaluateCliffAbilityLink,
  type CliffAbilityLinkReport,
} from './cliff-ability-link-gate';
import {
  HandoffBondLinkEntrySchema,
  HandoffBondEntrySchema,
  evaluateHandoffBondLink,
  type HandoffBondLinkReport,
} from './handoff-bond-link-gate';
import {
  HandoffAbilityLinkEntrySchema,
  HandoffAbilityEntrySchema,
  evaluateHandoffAbilityLink,
  type HandoffAbilityLinkReport,
} from './handoff-ability-link-gate';

import {
  MaskAbilityPeakBridgeLinkSchema,
  evaluateMaskAbilityPeakBridge,
  type MaskAbilityPeakBridgeReport,
} from './mask-ability-peak-bridge-gate';
import {
  CliffAbilityPeakBridgeLinkSchema,
  evaluateCliffAbilityPeakBridge,
  type CliffAbilityPeakBridgeReport,
} from './cliff-ability-peak-bridge-gate';
import {
  HandoffBondPeakBridgeLinkSchema,
  HandoffBondPeakHandoffEntrySchema,
  evaluateHandoffBondPeakBridge,
  type HandoffBondPeakBridgeReport,
} from './handoff-bond-peak-bridge-gate';
import {
  HandoffAbilityPeakBridgeLinkSchema,
  HandoffAbilityPeakHandoffEntrySchema,
  evaluateHandoffAbilityPeakBridge,
  type HandoffAbilityPeakBridgeReport,
} from './handoff-ability-peak-bridge-gate';
import {
  BondAbilityLinkEntrySchema,
  evaluateBondAbilityLink,
  type BondAbilityLinkReport,
} from './bond-ability-link-gate';
import {
  HandoffCliffLinkEntrySchema,
  HandoffCliffEntrySchema,
  evaluateHandoffCliffLink,
  type HandoffCliffLinkReport,
} from './handoff-cliff-link-gate';
import {
  VestBondLinkEntrySchema,
  evaluateVestBondLink,
  type VestBondLinkReport,
} from './vest-bond-link-gate';
import {
  FrequencyBondLinkEntrySchema,
  evaluateFrequencyBondLink,
  type FrequencyBondLinkReport,
} from './frequency-bond-link-gate';

import {
  BondAbilityPeakBridgeLinkSchema,
  evaluateBondAbilityPeakBridge,
  type BondAbilityPeakBridgeReport,
} from './bond-ability-peak-bridge-gate';
import {
  HandoffCliffPeakBridgeLinkSchema,
  HandoffCliffPeakHandoffEntrySchema,
  evaluateHandoffCliffPeakBridge,
  type HandoffCliffPeakBridgeReport,
} from './handoff-cliff-peak-bridge-gate';
import {
  VestBondPeakBridgeLinkSchema,
  evaluateVestBondPeakBridge,
  type VestBondPeakBridgeReport,
} from './vest-bond-peak-bridge-gate';
import {
  FrequencyBondPeakBridgeLinkSchema,
  evaluateFrequencyBondPeakBridge,
  type FrequencyBondPeakBridgeReport,
} from './frequency-bond-peak-bridge-gate';
import {
  CliffVestLinkEntrySchema,
  evaluateCliffVestLink,
  type CliffVestLinkReport,
} from './cliff-vest-link-gate';
import {
  FrequencyVestLinkEntrySchema,
  evaluateFrequencyVestLink,
  type FrequencyVestLinkReport,
} from './frequency-vest-link-gate';
import {
  VestMaskLinkEntrySchema,
  evaluateVestMaskLink,
  type VestMaskLinkReport,
} from './vest-mask-link-gate';
import {
  PersonaFrequencyLinkEntrySchema,
  evaluatePersonaFrequencyLink,
  type PersonaFrequencyLinkReport,
} from './persona-frequency-link-gate';

import {
  CliffVestPeakBridgeLinkSchema,
  evaluateCliffVestPeakBridge,
  type CliffVestPeakBridgeReport,
} from './cliff-vest-peak-bridge-gate';
import {
  FrequencyVestPeakBridgeLinkSchema,
  evaluateFrequencyVestPeakBridge,
  type FrequencyVestPeakBridgeReport,
} from './frequency-vest-peak-bridge-gate';
import {
  VestMaskPeakBridgeLinkSchema,
  evaluateVestMaskPeakBridge,
  type VestMaskPeakBridgeReport,
} from './vest-mask-peak-bridge-gate';
import {
  PersonaFrequencyPeakBridgeLinkSchema,
  evaluatePersonaFrequencyPeakBridge,
  type PersonaFrequencyPeakBridgeReport,
} from './persona-frequency-peak-bridge-gate';
import {
  PersonaAbilityLinkEntrySchema,
  evaluatePersonaAbilityLink,
  type PersonaAbilityLinkReport,
} from './persona-ability-link-gate';
import {
  CliffMotifLinkEntrySchema,
  evaluateCliffMotifLink,
  type CliffMotifLinkReport,
} from './cliff-motif-link-gate';
import {
  VestMotifLinkEntrySchema,
  evaluateVestMotifLink,
  type VestMotifLinkReport,
} from './vest-motif-link-gate';
import {
  HandoffMotifLinkEntrySchema,
  evaluateHandoffMotifLink,
  type HandoffMotifLinkReport,
} from './handoff-motif-link-gate';
import {
  MotifCliffPeakBridgeLinkSchema,
  evaluateMotifCliffPeakBridge,
  type MotifCliffPeakBridgeReport,
} from './motif-cliff-peak-bridge-gate';
import {
  MotifVestPeakBridgeLinkSchema,
  evaluateMotifVestPeakBridge,
  type MotifVestPeakBridgeReport,
} from './motif-vest-peak-bridge-gate';
import {
  MotifHandoffPeakBridgeLinkSchema,
  evaluateMotifHandoffPeakBridge,
  type MotifHandoffPeakBridgeReport,
} from './motif-handoff-peak-bridge-gate';
import {
  VestCliffPeakBridgeLinkSchema,
  evaluateVestCliffPeakBridge,
  type VestCliffPeakBridgeReport,
} from './vest-cliff-peak-bridge-gate';
import {
  MotifAbilityLinkEntrySchema,
  evaluateMotifAbilityLink,
  type MotifAbilityLinkReport,
} from './motif-ability-link-gate';
import {
  MotifFrequencyLinkEntrySchema,
  evaluateMotifFrequencyLink,
  type MotifFrequencyLinkReport,
} from './motif-frequency-link-gate';
import {
  FrequencyMotifLinkEntrySchema,
  evaluateFrequencyMotifLink,
  type FrequencyMotifLinkReport,
} from './frequency-motif-link-gate';
import {
  MaskMotifLinkEntrySchema,
  evaluateMaskMotifLink,
  type MaskMotifLinkReport,
} from './mask-motif-link-gate';
import {
  MotifAbilityPeakBridgeLinkSchema,
  evaluateMotifAbilityPeakBridge,
  type MotifAbilityPeakBridgeReport,
} from './motif-ability-peak-bridge-gate';
import {
  MotifFrequencyPeakBridgeLinkSchema,
  evaluateMotifFrequencyPeakBridge,
  type MotifFrequencyPeakBridgeReport,
} from './motif-frequency-peak-bridge-gate';
import {
  FrequencyMotifPeakBridgeLinkSchema,
  evaluateFrequencyMotifPeakBridge,
  type FrequencyMotifPeakBridgeReport,
} from './frequency-motif-peak-bridge-gate';
import {
  AbilityCliffPeakBridgeLinkSchema,
  evaluateAbilityCliffPeakBridge,
  type AbilityCliffPeakBridgeReport,
} from './ability-cliff-peak-bridge-gate';
import {
  MotifBondLinkEntrySchema,
  evaluateMotifBondLink,
  type MotifBondLinkReport,
} from './motif-bond-link-gate';
import {
  MotifAllianceLinkEntrySchema,
  evaluateMotifAllianceLink,
  type MotifAllianceLinkReport,
} from './motif-alliance-link-gate';
import {
  MotifConflictLinkEntrySchema,
  evaluateMotifConflictLink,
  type MotifConflictLinkReport,
} from './motif-conflict-link-gate';
import {
  MotifAmnesiaLinkEntrySchema,
  evaluateMotifAmnesiaLink,
  type MotifAmnesiaLinkReport,
} from './motif-amnesia-link-gate';

import {
  FrequencyAbilityPeakBridgeLinkSchema,
  evaluateFrequencyAbilityPeakBridge,
  type FrequencyAbilityPeakBridgeReport,
} from './frequency-ability-peak-bridge-gate';
import {
  FrequencyCliffPeakBridgeLinkSchema,
  evaluateFrequencyCliffPeakBridge,
  type FrequencyCliffPeakBridgeReport,
} from './frequency-cliff-peak-bridge-gate';
import {
  FrequencyMaskPeakBridgeLinkSchema,
  evaluateFrequencyMaskPeakBridge,
  type FrequencyMaskPeakBridgeReport,
} from './frequency-mask-peak-bridge-gate';
import {
  MotifMaskPeakBridgeLinkSchema,
  evaluateMotifMaskPeakBridge,
  type MotifMaskPeakBridgeReport,
} from './motif-mask-peak-bridge-gate';
import {
  FrequencyAmnesiaLinkEntrySchema,
  evaluateFrequencyAmnesiaLink,
  type FrequencyAmnesiaLinkReport,
} from './frequency-amnesia-link-gate';
import {
  AmnesiaFrequencyLinkEntrySchema,
  evaluateAmnesiaFrequencyLink,
  type AmnesiaFrequencyLinkReport,
} from './amnesia-frequency-link-gate';
import {
  AbilityAmnesiaLinkEntrySchema,
  evaluateAbilityAmnesiaLink,
  type AbilityAmnesiaLinkReport,
} from './ability-amnesia-link-gate';
import {
  AmnesiaAbilityLinkEntrySchema,
  evaluateAmnesiaAbilityLink,
  type AmnesiaAbilityLinkReport,
} from './amnesia-ability-link-gate';

import {
  CliffMaskPeakBridgeLinkSchema,
  evaluateCliffMaskPeakBridge,
  type CliffMaskPeakBridgeReport,
} from './cliff-mask-peak-bridge-gate';
import {
  MaskAmnesiaPeakBridgeLinkSchema,
  evaluateMaskAmnesiaPeakBridge,
  type MaskAmnesiaPeakBridgeReport,
} from './mask-amnesia-peak-bridge-gate';
import {
  AbilityAmnesiaPeakBridgeLinkSchema,
  evaluateAbilityAmnesiaPeakBridge,
  type AbilityAmnesiaPeakBridgeReport,
} from './ability-amnesia-peak-bridge-gate';
import {
  CliffAmnesiaPeakBridgeLinkSchema,
  evaluateCliffAmnesiaPeakBridge,
  type CliffAmnesiaPeakBridgeReport,
} from './cliff-amnesia-peak-bridge-gate';
import {
  CliffAmnesiaLinkEntrySchema,
  evaluateCliffAmnesiaLink,
  type CliffAmnesiaLinkReport,
} from './cliff-amnesia-link-gate';
import {
  MaskAmnesiaLinkEntrySchema,
  evaluateMaskAmnesiaLink,
  type MaskAmnesiaLinkReport,
} from './mask-amnesia-link-gate';
import {
  BondAmnesiaLinkEntrySchema,
  evaluateBondAmnesiaLink,
  type BondAmnesiaLinkReport,
} from './bond-amnesia-link-gate';
import {
  PersonaAmnesiaLinkEntrySchema,
  evaluatePersonaAmnesiaLink,
  type PersonaAmnesiaLinkReport,
} from './persona-amnesia-link-gate';


import {
  AmnesiaAbilityPeakBridgeLinkSchema,
  evaluateAmnesiaAbilityPeakBridge,
  type AmnesiaAbilityPeakBridgeReport,
} from './amnesia-ability-peak-bridge-gate';
import {
  AmnesiaCliffPeakBridgeLinkSchema,
  evaluateAmnesiaCliffPeakBridge,
  type AmnesiaCliffPeakBridgeReport,
} from './amnesia-cliff-peak-bridge-gate';
import {
  BondAmnesiaPeakBridgeLinkSchema,
  evaluateBondAmnesiaPeakBridge,
  type BondAmnesiaPeakBridgeReport,
} from './bond-amnesia-peak-bridge-gate';
import {
  PersonaAmnesiaPeakBridgeLinkSchema,
  evaluatePersonaAmnesiaPeakBridge,
  type PersonaAmnesiaPeakBridgeReport,
} from './persona-amnesia-peak-bridge-gate';
import {
  HandoffAmnesiaEntrySchema,
  HandoffAmnesiaLinkEntrySchema,
  evaluateHandoffAmnesiaLink,
  type HandoffAmnesiaLinkReport,
} from './handoff-amnesia-link-gate';
import {
  VestAmnesiaLinkEntrySchema,
  evaluateVestAmnesiaLink,
  type VestAmnesiaLinkReport,
} from './vest-amnesia-link-gate';
import {
  QualityAmnesiaLinkEntrySchema,
  evaluateQualityAmnesiaLink,
  type QualityAmnesiaLinkReport,
} from './quality-amnesia-link-gate';
import {
  AmnesiaForeshadowLinkEntrySchema,
  evaluateAmnesiaForeshadowLink,
  type AmnesiaForeshadowLinkReport,
} from './amnesia-foreshadow-link-gate';



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
  'personaBondPeakBridge',
  'abilityVestPeakBridge',
  'allianceMaskPeakBridge',
  'bondCliffLink',
  'allianceMaskLink',
  'amnesiaVestLink',
  'conflictPeakLink',
  'conflictMaskPeakBridge',
  'amnesiaBondPeakBridge',
  'foreshadowVestPeakBridge',
  'conflictMaskLink',
  'amnesiaCliffLink',
  'bondMotifLink',
  'frequencyCliffLink',
  'allianceBondPeakBridge',
  'bondVestPeakBridge',
  'amnesiaVestPeakBridge',
  'allianceVestLink',
  'conflictVestLink',
  'foreshadowMaskLink',
  'abilityBondLink',
  'conflictBondPeakBridge',
  'foreshadowBondPeakBridge',
  'abilityConflictPeakBridge',
  'conflictBondLink',
  'amnesiaMaskLink',
  'motifVestLink',
  'abilityForeshadowLink',
  'motifBondPeakBridge',
  'personaMaskPeakBridge',
  'allianceForeshadowPeakBridge',
  'foreshadowBondLink',
  'abilityAllianceLink',
  'conflictForeshadowLink',
  'allianceAmnesiaLink',
  'conflictForeshadowPeakBridge',
  'allianceAmnesiaPeakBridge',
  'abilityMotifPeakBridge',
  'allianceForeshadowLink',
  'abilityMotifLink',
  'conflictAllianceLink',
  'personaBondLink',
  'conflictAlliancePeakBridge',
  'conflictAmnesiaPeakBridge',
  'foreshadowAmnesiaPeakBridge',
  'conflictAmnesiaLink',
  'foreshadowPersonaLink',
  'allianceMotifLink',
  'foreshadowAmnesiaLink',
  'allianceMotifPeakBridge',
  'conflictMotifPeakBridge',
  'foreshadowMotifPeakBridge',
  'conflictMotifLink',
  'foreshadowAllianceLink',
  'conflictPersonaLink',
  'alliancePersonaLink',
  'conflictPersonaPeakBridge',
  'alliancePersonaPeakBridge',
  'foreshadowPersonaPeakBridge',
  'personaMotifLink',
  'abilityPersonaLink',
  'vestPersonaLink',
  'maskPersonaLink',
  'abilityPersonaPeakBridge',
  'vestPersonaPeakBridge',
  'maskPersonaPeakBridge',
  'amnesiaPersonaLink',
  'motifPersonaLink',
  'countdownPersonaLink',
  'qualityPersonaLink',
  'amnesiaPersonaPeakBridge',
  'motifPersonaPeakBridge',
  'countdownPersonaPeakBridge',
  'qualityPersonaPeakBridge',
  'frequencyPersonaLink',
  'handoffPersonaLink',
  'cliffPersonaLink',
  'bondPersonaLink',
  'frequencyPersonaPeakBridge',
  'handoffPersonaPeakBridge',
  'cliffPersonaPeakBridge',
  'bondPersonaPeakBridge',
  'abilityFrequencyLink',
  'vestHandoffLink',
  'maskCliffLink',
  'maskFrequencyLink',
  'abilityFrequencyPeakBridge',
  'vestHandoffPeakBridge',
  'maskCliffPeakBridge',
  'maskFrequencyPeakBridge',
  'handoffVestLink',
  'vestFrequencyLink',
  'maskBondLink',
  'handoffMaskLink',
  'handoffVestPeakBridge',
  'vestFrequencyPeakBridge',
  'maskBondPeakBridge',
  'handoffMaskPeakBridge',
  'vestAbilityLink',
  'handoffFrequencyLink',
  'cliffBondLink',
  'cliffFrequencyLink',
  'vestAbilityPeakBridge',
  'handoffFrequencyPeakBridge',
  'cliffBondPeakBridge',
  'cliffFrequencyPeakBridge',
  'maskAbilityLink',
  'cliffAbilityLink',
  'handoffBondLink',
  'handoffAbilityLink',
  'maskAbilityPeakBridge',
  'cliffAbilityPeakBridge',
  'handoffBondPeakBridge',
  'handoffAbilityPeakBridge',
  'bondAbilityLink',
  'handoffCliffLink',
  'vestBondLink',
  'frequencyBondLink',
  'bondAbilityPeakBridge',
  'handoffCliffPeakBridge',
  'vestBondPeakBridge',
  'frequencyBondPeakBridge',
  'cliffVestLink',
  'frequencyVestLink',
  'vestMaskLink',
  'personaFrequencyLink',
  'cliffVestPeakBridge',
  'frequencyVestPeakBridge',
  'vestMaskPeakBridge',
  'personaFrequencyPeakBridge',
  'personaAbilityLink',
  'cliffMotifLink',
  'vestMotifLink',
  'handoffMotifLink',
  'motifCliffPeakBridge',
  'motifVestPeakBridge',
  'motifHandoffPeakBridge',
  'vestCliffPeakBridge',
  'motifAbilityLink',
  'motifFrequencyLink',
  'frequencyMotifLink',
  'maskMotifLink',
  'motifAbilityPeakBridge',
  'motifFrequencyPeakBridge',
  'frequencyMotifPeakBridge',
  'abilityCliffPeakBridge',
  'motifBondLink',
  'motifAllianceLink',
  'motifConflictLink',
  'motifAmnesiaLink',
  'frequencyAbilityPeakBridge',
  'frequencyCliffPeakBridge',
  'frequencyMaskPeakBridge',
  'motifMaskPeakBridge',
  'frequencyAmnesiaLink',
  'amnesiaFrequencyLink',
  'abilityAmnesiaLink',
  'amnesiaAbilityLink',
  'cliffMaskPeakBridge',
  'maskAmnesiaPeakBridge',
  'abilityAmnesiaPeakBridge',
  'cliffAmnesiaPeakBridge',
  'cliffAmnesiaLink',
  'maskAmnesiaLink',
  'bondAmnesiaLink',
  'personaAmnesiaLink',
  'amnesiaAbilityPeakBridge',
  'amnesiaCliffPeakBridge',
  'bondAmnesiaPeakBridge',
  'personaAmnesiaPeakBridge',
  'handoffAmnesiaLink',
  'vestAmnesiaLink',
  'qualityAmnesiaLink',
  'amnesiaForeshadowLink',
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

const PersonaBondPeakBridgeSectionSchema = z.object({
  cards: z.array(PersonaCardSchema).min(1),
  bonds: z.array(BondContractEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(PersonaBondPeakBridgeLinkSchema),
});

const AbilityVestPeakBridgeSectionSchema = z.object({
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  vests: z.array(IdentityVestEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AbilityVestPeakBridgeLinkSchema),
});

const AllianceMaskPeakBridgeSectionSchema = z.object({
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  masks: z.array(PersonaMaskEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AllianceMaskPeakBridgeLinkSchema),
});

const BondCliffSectionSchema = z.object({
  bonds: z.array(BondContractEntrySchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  links: z.array(BondCliffLinkEntrySchema),
});

const AllianceMaskSectionSchema = z.object({
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  masks: z.array(PersonaMaskEntrySchema),
  links: z.array(AllianceMaskLinkEntrySchema),
});

const AmnesiaVestSectionSchema = z.object({
  amnesias: z.array(AmnesiaArcEntrySchema),
  vests: z.array(IdentityVestEntrySchema),
  links: z.array(AmnesiaVestLinkEntrySchema),
});

const ConflictPeakSectionSchema = z.object({
  conflicts: z.array(ConflictEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(ConflictPeakLinkEntrySchema),
});


const ConflictMaskPeakBridgeSectionSchema = z.object({
  conflicts: z.array(ConflictEntrySchema),
  masks: z.array(PersonaMaskEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(ConflictMaskPeakBridgeLinkSchema),
});

const AmnesiaBondPeakBridgeSectionSchema = z.object({
  amnesias: z.array(AmnesiaArcEntrySchema),
  bonds: z.array(BondContractEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AmnesiaBondPeakBridgeLinkSchema),
});

const ForeshadowVestPeakBridgeSectionSchema = z.object({
  items: z.array(ForeshadowItemSchema),
  vests: z.array(IdentityVestEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(ForeshadowVestPeakBridgeLinkSchema),
});

const ConflictMaskSectionSchema = z.object({
  conflicts: z.array(ConflictEntrySchema),
  masks: z.array(PersonaMaskEntrySchema),
  links: z.array(ConflictMaskLinkEntrySchema),
});

const AmnesiaCliffSectionSchema = z.object({
  amnesias: z.array(AmnesiaArcEntrySchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  links: z.array(AmnesiaCliffLinkEntrySchema),
});

const BondMotifSectionSchema = z.object({
  bonds: z.array(BondContractEntrySchema),
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  links: z.array(BondMotifLinkEntrySchema),
});

const FrequencyCliffSectionSchema = z.object({
  frequencies: z.array(FrequencyTippingEntrySchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  links: z.array(FrequencyCliffLinkEntrySchema),
});

const AllianceBondPeakBridgeSectionSchema = z.object({
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  bonds: z.array(BondContractEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AllianceBondPeakBridgeLinkSchema),
});

const BondVestPeakBridgeSectionSchema = z.object({
  bonds: z.array(BondContractEntrySchema),
  vests: z.array(IdentityVestEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(BondVestPeakBridgeLinkSchema),
});

const AmnesiaVestPeakBridgeSectionSchema = z.object({
  amnesias: z.array(AmnesiaArcEntrySchema),
  vests: z.array(IdentityVestEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AmnesiaVestPeakBridgeLinkSchema),
});

const AllianceVestSectionSchema = z.object({
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  vests: z.array(IdentityVestEntrySchema),
  links: z.array(AllianceVestLinkEntrySchema),
});

const ConflictVestSectionSchema = z.object({
  conflicts: z.array(ConflictEntrySchema),
  vests: z.array(IdentityVestEntrySchema),
  links: z.array(ConflictVestLinkEntrySchema),
});

const ForeshadowMaskSectionSchema = z.object({
  items: z.array(ForeshadowItemSchema),
  masks: z.array(PersonaMaskEntrySchema),
  links: z.array(ForeshadowMaskLinkEntrySchema),
});

const AbilityBondSectionSchema = z.object({
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  bonds: z.array(BondContractEntrySchema),
  links: z.array(AbilityBondLinkEntrySchema),
});

const ConflictBondPeakBridgeSectionSchema = z.object({
  conflicts: z.array(ConflictEntrySchema),
  bonds: z.array(BondContractEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(ConflictBondPeakBridgeLinkSchema),
});

const ForeshadowBondPeakBridgeSectionSchema = z.object({
  items: z.array(ForeshadowItemSchema),
  bonds: z.array(BondContractEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(ForeshadowBondPeakBridgeLinkSchema),
});

const AbilityConflictPeakBridgeSectionSchema = z.object({
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  conflicts: z.array(ConflictEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AbilityConflictPeakBridgeLinkSchema),
});

const ConflictBondSectionSchema = z.object({
  conflicts: z.array(ConflictEntrySchema),
  bonds: z.array(BondContractEntrySchema),
  links: z.array(ConflictBondLinkEntrySchema),
});

const AmnesiaMaskSectionSchema = z.object({
  amnesias: z.array(AmnesiaArcEntrySchema),
  masks: z.array(PersonaMaskEntrySchema),
  links: z.array(AmnesiaMaskLinkEntrySchema),
});

const MotifVestSectionSchema = z.object({
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  vests: z.array(IdentityVestEntrySchema),
  links: z.array(MotifVestLinkEntrySchema),
});

const AbilityForeshadowSectionSchema = z.object({
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  items: z.array(ForeshadowItemSchema),
  links: z.array(AbilityForeshadowLinkEntrySchema),
});

const MotifBondPeakBridgeSectionSchema = z.object({
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  bonds: z.array(BondContractEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(MotifBondPeakBridgeLinkSchema),
});

const PersonaMaskPeakBridgeSectionSchema = z.object({
  cards: z.array(PersonaCardSchema).min(1),
  masks: z.array(PersonaMaskEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(PersonaMaskPeakBridgeLinkSchema),
});

const AllianceForeshadowPeakBridgeSectionSchema = z.object({
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  items: z.array(ForeshadowItemSchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AllianceForeshadowPeakBridgeLinkSchema),
});

const ForeshadowBondSectionSchema = z.object({
  items: z.array(ForeshadowItemSchema),
  bonds: z.array(BondContractEntrySchema),
  links: z.array(ForeshadowBondLinkEntrySchema),
});

const AbilityAllianceSectionSchema = z.object({
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  links: z.array(AbilityAllianceLinkEntrySchema),
});

const ConflictForeshadowSectionSchema = z.object({
  conflicts: z.array(ConflictEntrySchema),
  items: z.array(ForeshadowItemSchema),
  links: z.array(ConflictForeshadowLinkEntrySchema),
});

const AllianceAmnesiaSectionSchema = z.object({
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  amnesias: z.array(AmnesiaArcEntrySchema),
  links: z.array(AllianceAmnesiaLinkEntrySchema),
});

const ConflictForeshadowPeakBridgeSectionSchema = z.object({
  conflicts: z.array(ConflictEntrySchema),
  items: z.array(ForeshadowItemSchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(ConflictForeshadowPeakBridgeLinkSchema),
});

const AllianceAmnesiaPeakBridgeSectionSchema = z.object({
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  amnesias: z.array(AmnesiaArcEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AllianceAmnesiaPeakBridgeLinkSchema),
});

const AbilityMotifPeakBridgeSectionSchema = z.object({
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AbilityMotifPeakBridgeLinkSchema),
});

const AllianceForeshadowSectionSchema = z.object({
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  items: z.array(ForeshadowItemSchema),
  links: z.array(AllianceForeshadowLinkEntrySchema),
});

const AbilityMotifSectionSchema = z.object({
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  links: z.array(AbilityMotifLinkEntrySchema),
});

const ConflictAllianceSectionSchema = z.object({
  conflicts: z.array(ConflictEntrySchema),
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  links: z.array(ConflictAllianceLinkEntrySchema),
});

const PersonaBondSectionSchema = z.object({
  cards: z.array(PersonaCardSchema).min(1),
  bonds: z.array(BondContractEntrySchema),
  links: z.array(PersonaBondLinkEntrySchema),
});

const ConflictAlliancePeakBridgeSectionSchema = z.object({
  conflicts: z.array(ConflictEntrySchema),
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(ConflictAlliancePeakBridgeLinkSchema),
});

const ConflictAmnesiaPeakBridgeSectionSchema = z.object({
  conflicts: z.array(ConflictEntrySchema),
  amnesias: z.array(AmnesiaArcEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(ConflictAmnesiaPeakBridgeLinkSchema),
});

const ForeshadowAmnesiaPeakBridgeSectionSchema = z.object({
  items: z.array(ForeshadowItemSchema),
  amnesias: z.array(AmnesiaArcEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(ForeshadowAmnesiaPeakBridgeLinkSchema),
});

const ConflictAmnesiaSectionSchema = z.object({
  conflicts: z.array(ConflictEntrySchema),
  amnesias: z.array(AmnesiaArcEntrySchema),
  links: z.array(ConflictAmnesiaLinkEntrySchema),
});

const ForeshadowPersonaSectionSchema = z.object({
  items: z.array(ForeshadowItemSchema),
  cards: z.array(PersonaCardSchema).min(1),
  links: z.array(ForeshadowPersonaLinkEntrySchema),
});

const AllianceMotifSectionSchema = z.object({
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  links: z.array(AllianceMotifLinkEntrySchema),
});

const ForeshadowAmnesiaSectionSchema = z.object({
  items: z.array(ForeshadowItemSchema),
  amnesias: z.array(AmnesiaArcEntrySchema),
  links: z.array(ForeshadowAmnesiaLinkEntrySchema),
});

const AllianceMotifPeakBridgeSectionSchema = z.object({
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AllianceMotifPeakBridgeLinkSchema),
});

const ConflictMotifPeakBridgeSectionSchema = z.object({
  conflicts: z.array(ConflictEntrySchema),
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(ConflictMotifPeakBridgeLinkSchema),
});

const ForeshadowMotifPeakBridgeSectionSchema = z.object({
  items: z.array(ForeshadowItemSchema),
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(ForeshadowMotifPeakBridgeLinkSchema),
});

const ConflictMotifSectionSchema = z.object({
  conflicts: z.array(ConflictEntrySchema),
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  links: z.array(ConflictMotifLinkEntrySchema),
});

const ForeshadowAllianceSectionSchema = z.object({
  items: z.array(ForeshadowItemSchema),
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  links: z.array(ForeshadowAllianceLinkEntrySchema),
});

const ConflictPersonaSectionSchema = z.object({
  conflicts: z.array(ConflictEntrySchema),
  cards: z.array(PersonaCardSchema).min(1),
  links: z.array(ConflictPersonaLinkEntrySchema),
});

const AlliancePersonaSectionSchema = z.object({
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  cards: z.array(PersonaCardSchema).min(1),
  links: z.array(AlliancePersonaLinkEntrySchema),
});

const ConflictPersonaPeakBridgeSectionSchema = z.object({
  conflicts: z.array(ConflictEntrySchema),
  cards: z.array(PersonaCardSchema).min(1),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(ConflictPersonaPeakBridgeLinkSchema),
});

const AlliancePersonaPeakBridgeSectionSchema = z.object({
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  cards: z.array(PersonaCardSchema).min(1),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AlliancePersonaPeakBridgeLinkSchema),
});

const ForeshadowPersonaPeakBridgeSectionSchema = z.object({
  items: z.array(ForeshadowItemSchema),
  cards: z.array(PersonaCardSchema).min(1),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(ForeshadowPersonaPeakBridgeLinkSchema),
});

const PersonaMotifSectionSchema = z.object({
  cards: z.array(PersonaCardSchema).min(1),
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  links: z.array(PersonaMotifLinkEntrySchema),
});

const AbilityPersonaSectionSchema = z.object({
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  cards: z.array(PersonaCardSchema).min(1),
  links: z.array(AbilityPersonaLinkEntrySchema),
});

const VestPersonaSectionSchema = z.object({
  vests: z.array(IdentityVestEntrySchema),
  cards: z.array(PersonaCardSchema).min(1),
  links: z.array(VestPersonaLinkEntrySchema),
});

const MaskPersonaSectionSchema = z.object({
  masks: z.array(PersonaMaskEntrySchema),
  cards: z.array(PersonaCardSchema).min(1),
  links: z.array(MaskPersonaLinkEntrySchema),
});

const AbilityPersonaPeakBridgeSectionSchema = z.object({
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  cards: z.array(PersonaCardSchema).min(1),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AbilityPersonaPeakBridgeLinkSchema),
});

const VestPersonaPeakBridgeSectionSchema = z.object({
  vests: z.array(IdentityVestEntrySchema),
  cards: z.array(PersonaCardSchema).min(1),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(VestPersonaPeakBridgeLinkSchema),
});

const MaskPersonaPeakBridgeSectionSchema = z.object({
  masks: z.array(PersonaMaskEntrySchema),
  cards: z.array(PersonaCardSchema).min(1),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(MaskPersonaPeakBridgeLinkSchema),
});

const AmnesiaPersonaSectionSchema = z.object({
  amnesias: z.array(AmnesiaArcEntrySchema),
  cards: z.array(PersonaCardSchema).min(1),
  links: z.array(AmnesiaPersonaLinkEntrySchema),
});

const MotifPersonaSectionSchema = z.object({
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  cards: z.array(PersonaCardSchema).min(1),
  links: z.array(MotifPersonaLinkEntrySchema),
});

const CountdownPersonaSectionSchema = z.object({
  countdowns: z.array(StageCountdownSchema),
  cards: z.array(PersonaCardSchema).min(1),
  links: z.array(CountdownPersonaLinkEntrySchema),
});

const QualityPersonaSectionSchema = z.object({
  minCardIntense: z.number().int().min(1).max(5).optional(),
  cards: z.array(PersonaCardSchema).min(1),
  links: z.array(QualityPersonaLinkEntrySchema),
});

const AmnesiaPersonaPeakBridgeSectionSchema = z.object({
  amnesias: z.array(AmnesiaArcEntrySchema),
  cards: z.array(PersonaCardSchema).min(1),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AmnesiaPersonaPeakBridgeLinkSchema),
});

const MotifPersonaPeakBridgeSectionSchema = z.object({
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  cards: z.array(PersonaCardSchema).min(1),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(MotifPersonaPeakBridgeLinkSchema),
});

const CountdownPersonaPeakBridgeSectionSchema = z.object({
  countdowns: z.array(StageCountdownSchema),
  cards: z.array(PersonaCardSchema).min(1),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(CountdownPersonaPeakBridgeLinkSchema),
});

const QualityPersonaPeakBridgeSectionSchema = z.object({
  minTernaryIntense: z.number().int().min(1).max(5).optional(),
  cards: z.array(PersonaCardSchema).min(1),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(QualityPersonaPeakBridgeLinkSchema),
});

const FrequencyPersonaSectionSchema = z.object({
  frequencies: z.array(FrequencyTippingEntrySchema),
  cards: z.array(PersonaCardSchema).min(1),
  links: z.array(FrequencyPersonaLinkEntrySchema),
});

const HandoffPersonaSectionSchema = z.object({
  handoffs: z.array(HandoffPersonaEntrySchema),
  cards: z.array(PersonaCardSchema).min(1),
  links: z.array(HandoffPersonaLinkEntrySchema),
});

const CliffPersonaSectionSchema = z.object({
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  cards: z.array(PersonaCardSchema).min(1),
  links: z.array(CliffPersonaLinkEntrySchema),
});

const BondPersonaSectionSchema = z.object({
  bonds: z.array(BondContractEntrySchema),
  cards: z.array(PersonaCardSchema).min(1),
  links: z.array(BondPersonaLinkEntrySchema),
});

const FrequencyPersonaPeakBridgeSectionSchema = z.object({
  frequencies: z.array(FrequencyTippingEntrySchema),
  cards: z.array(PersonaCardSchema).min(1),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(FrequencyPersonaPeakBridgeLinkSchema),
});

const HandoffPersonaPeakBridgeSectionSchema = z.object({
  handoffs: z.array(HandoffPersonaPeakHandoffEntrySchema),
  cards: z.array(PersonaCardSchema).min(1),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(HandoffPersonaPeakBridgeLinkSchema),
});

const CliffPersonaPeakBridgeSectionSchema = z.object({
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  cards: z.array(PersonaCardSchema).min(1),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(CliffPersonaPeakBridgeLinkSchema),
});

const BondPersonaPeakBridgeSectionSchema = z.object({
  bonds: z.array(BondContractEntrySchema),
  cards: z.array(PersonaCardSchema).min(1),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(BondPersonaPeakBridgeLinkSchema),
});

const AbilityFrequencySectionSchema = z.object({
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  frequencies: z.array(FrequencyTippingEntrySchema),
  links: z.array(AbilityFrequencyLinkEntrySchema),
});

const VestHandoffSectionSchema = z.object({
  vests: z.array(IdentityVestEntrySchema),
  handoffs: z.array(VestHandoffEntrySchema),
  links: z.array(VestHandoffLinkEntrySchema),
});

const MaskCliffSectionSchema = z.object({
  masks: z.array(PersonaMaskEntrySchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  links: z.array(MaskCliffLinkEntrySchema),
});

const MaskFrequencySectionSchema = z.object({
  masks: z.array(PersonaMaskEntrySchema),
  frequencies: z.array(FrequencyTippingEntrySchema),
  links: z.array(MaskFrequencyLinkEntrySchema),
});

const AbilityFrequencyPeakBridgeSectionSchema = z.object({
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  frequencies: z.array(FrequencyTippingEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AbilityFrequencyPeakBridgeLinkSchema),
});

const VestHandoffPeakBridgeSectionSchema = z.object({
  vests: z.array(IdentityVestEntrySchema),
  handoffs: z.array(VestHandoffPeakHandoffEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(VestHandoffPeakBridgeLinkSchema),
});

const MaskCliffPeakBridgeSectionSchema = z.object({
  masks: z.array(PersonaMaskEntrySchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(MaskCliffPeakBridgeLinkSchema),
});

const MaskFrequencyPeakBridgeSectionSchema = z.object({
  masks: z.array(PersonaMaskEntrySchema),
  frequencies: z.array(FrequencyTippingEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(MaskFrequencyPeakBridgeLinkSchema),
});

const HandoffVestSectionSchema = z.object({
  vests: z.array(IdentityVestEntrySchema),
  handoffs: z.array(HandoffVestEntrySchema),
  links: z.array(HandoffVestLinkEntrySchema),
});

const VestFrequencySectionSchema = z.object({
  vests: z.array(IdentityVestEntrySchema),
  frequencies: z.array(FrequencyTippingEntrySchema),
  links: z.array(VestFrequencyLinkEntrySchema),
});

const MaskBondSectionSchema = z.object({
  bonds: z.array(BondContractEntrySchema),
  masks: z.array(PersonaMaskEntrySchema),
  links: z.array(MaskBondLinkEntrySchema),
});

const HandoffMaskSectionSchema = z.object({
  masks: z.array(PersonaMaskEntrySchema),
  handoffs: z.array(HandoffMaskEntrySchema),
  links: z.array(HandoffMaskLinkEntrySchema),
});


const HandoffVestPeakBridgeSectionSchema = z.object({
  vests: z.array(IdentityVestEntrySchema),
  handoffs: z.array(HandoffVestPeakHandoffEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(HandoffVestPeakBridgeLinkSchema),
});

const VestFrequencyPeakBridgeSectionSchema = z.object({
  vests: z.array(IdentityVestEntrySchema),
  frequencies: z.array(FrequencyTippingEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(VestFrequencyPeakBridgeLinkSchema),
});

const MaskBondPeakBridgeSectionSchema = z.object({
  bonds: z.array(BondContractEntrySchema),
  masks: z.array(PersonaMaskEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(MaskBondPeakBridgeLinkSchema),
});

const HandoffMaskPeakBridgeSectionSchema = z.object({
  masks: z.array(PersonaMaskEntrySchema),
  handoffs: z.array(HandoffMaskPeakHandoffEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(HandoffMaskPeakBridgeLinkSchema),
});

const VestAbilitySectionSchema = z.object({
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  vests: z.array(IdentityVestEntrySchema),
  links: z.array(VestAbilityLinkEntrySchema),
});

const HandoffFrequencySectionSchema = z.object({
  frequencies: z.array(FrequencyTippingEntrySchema),
  handoffs: z.array(HandoffFrequencyEntrySchema),
  links: z.array(HandoffFrequencyLinkEntrySchema),
});

const CliffBondSectionSchema = z.object({
  bonds: z.array(BondContractEntrySchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  links: z.array(CliffBondLinkEntrySchema),
});

const CliffFrequencySectionSchema = z.object({
  frequencies: z.array(FrequencyTippingEntrySchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  links: z.array(CliffFrequencyLinkEntrySchema),
});


const VestAbilityPeakBridgeSectionSchema = z.object({
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  vests: z.array(IdentityVestEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(VestAbilityPeakBridgeLinkSchema),
});

const HandoffFrequencyPeakBridgeSectionSchema = z.object({
  frequencies: z.array(FrequencyTippingEntrySchema),
  handoffs: z.array(HandoffFrequencyPeakHandoffEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(HandoffFrequencyPeakBridgeLinkSchema),
});

const CliffBondPeakBridgeSectionSchema = z.object({
  bonds: z.array(BondContractEntrySchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(CliffBondPeakBridgeLinkSchema),
});

const CliffFrequencyPeakBridgeSectionSchema = z.object({
  frequencies: z.array(FrequencyTippingEntrySchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(CliffFrequencyPeakBridgeLinkSchema),
});

const MaskAbilitySectionSchema = z.object({
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  masks: z.array(PersonaMaskEntrySchema),
  links: z.array(MaskAbilityLinkEntrySchema),
});

const CliffAbilitySectionSchema = z.object({
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  links: z.array(CliffAbilityLinkEntrySchema),
});

const HandoffBondSectionSchema = z.object({
  bonds: z.array(BondContractEntrySchema),
  handoffs: z.array(HandoffBondEntrySchema),
  links: z.array(HandoffBondLinkEntrySchema),
});

const HandoffAbilitySectionSchema = z.object({
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  handoffs: z.array(HandoffAbilityEntrySchema),
  links: z.array(HandoffAbilityLinkEntrySchema),
});

const MaskAbilityPeakBridgeSectionSchema = z.object({
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  masks: z.array(PersonaMaskEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(MaskAbilityPeakBridgeLinkSchema),
});

const CliffAbilityPeakBridgeSectionSchema = z.object({
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(CliffAbilityPeakBridgeLinkSchema),
});

const HandoffBondPeakBridgeSectionSchema = z.object({
  bonds: z.array(BondContractEntrySchema),
  handoffs: z.array(HandoffBondPeakHandoffEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(HandoffBondPeakBridgeLinkSchema),
});

const HandoffAbilityPeakBridgeSectionSchema = z.object({
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  handoffs: z.array(HandoffAbilityPeakHandoffEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(HandoffAbilityPeakBridgeLinkSchema),
});

const BondAbilitySectionSchema = z.object({
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  bonds: z.array(BondContractEntrySchema),
  links: z.array(BondAbilityLinkEntrySchema),
});

const HandoffCliffSectionSchema = z.object({
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  handoffs: z.array(HandoffCliffEntrySchema),
  links: z.array(HandoffCliffLinkEntrySchema),
});

const VestBondSectionSchema = z.object({
  bonds: z.array(BondContractEntrySchema),
  vests: z.array(IdentityVestEntrySchema),
  links: z.array(VestBondLinkEntrySchema),
});

const FrequencyBondSectionSchema = z.object({
  bonds: z.array(BondContractEntrySchema),
  frequencies: z.array(FrequencyTippingEntrySchema),
  links: z.array(FrequencyBondLinkEntrySchema),
});

const BondAbilityPeakBridgeSectionSchema = z.object({
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  bonds: z.array(BondContractEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(BondAbilityPeakBridgeLinkSchema),
});

const HandoffCliffPeakBridgeSectionSchema = z.object({
  handoffs: z.array(HandoffCliffPeakHandoffEntrySchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(HandoffCliffPeakBridgeLinkSchema),
});

const VestBondPeakBridgeSectionSchema = z.object({
  bonds: z.array(BondContractEntrySchema),
  vests: z.array(IdentityVestEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(VestBondPeakBridgeLinkSchema),
});

const FrequencyBondPeakBridgeSectionSchema = z.object({
  frequencies: z.array(FrequencyTippingEntrySchema),
  bonds: z.array(BondContractEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(FrequencyBondPeakBridgeLinkSchema),
});

const CliffVestSectionSchema = z.object({
  vests: z.array(IdentityVestEntrySchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  links: z.array(CliffVestLinkEntrySchema),
});

const FrequencyVestSectionSchema = z.object({
  vests: z.array(IdentityVestEntrySchema),
  frequencies: z.array(FrequencyTippingEntrySchema),
  links: z.array(FrequencyVestLinkEntrySchema),
});

const VestMaskSectionSchema = z.object({
  masks: z.array(PersonaMaskEntrySchema),
  vests: z.array(IdentityVestEntrySchema),
  links: z.array(VestMaskLinkEntrySchema),
});

const PersonaFrequencySectionSchema = z.object({
  frequencies: z.array(FrequencyTippingEntrySchema),
  cards: z.array(PersonaCardSchema).min(1),
  links: z.array(PersonaFrequencyLinkEntrySchema),
});

const CliffVestPeakBridgeSectionSchema = z.object({
  vests: z.array(IdentityVestEntrySchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(CliffVestPeakBridgeLinkSchema),
});

const FrequencyVestPeakBridgeSectionSchema = z.object({
  frequencies: z.array(FrequencyTippingEntrySchema),
  vests: z.array(IdentityVestEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(FrequencyVestPeakBridgeLinkSchema),
});

const VestMaskPeakBridgeSectionSchema = z.object({
  vests: z.array(IdentityVestEntrySchema),
  masks: z.array(PersonaMaskEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(VestMaskPeakBridgeLinkSchema),
});

const PersonaFrequencyPeakBridgeSectionSchema = z.object({
  cards: z.array(PersonaCardSchema).min(1),
  frequencies: z.array(FrequencyTippingEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(PersonaFrequencyPeakBridgeLinkSchema),
});

const PersonaAbilitySectionSchema = z.object({
  cards: z.array(PersonaCardSchema).min(1),
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  links: z.array(PersonaAbilityLinkEntrySchema),
});

const CliffMotifSectionSchema = z.object({
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  links: z.array(CliffMotifLinkEntrySchema),
});

const VestMotifSectionSchema = z.object({
  vests: z.array(IdentityVestEntrySchema),
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  links: z.array(VestMotifLinkEntrySchema),
});

const HandoffMotifSectionSchema = z.object({
  handoffs: z.array(MotifHandoffEntrySchema),
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  links: z.array(HandoffMotifLinkEntrySchema),
});

const MotifCliffPeakBridgeSectionSchema = z.object({
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(MotifCliffPeakBridgeLinkSchema),
});

const MotifVestPeakBridgeSectionSchema = z.object({
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  vests: z.array(IdentityVestEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(MotifVestPeakBridgeLinkSchema),
});

const MotifHandoffPeakBridgeSectionSchema = z.object({
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  handoffs: z.array(MotifHandoffEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(MotifHandoffPeakBridgeLinkSchema),
});

const VestCliffPeakBridgeSectionSchema = z.object({
  vests: z.array(IdentityVestEntrySchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(VestCliffPeakBridgeLinkSchema),
});

const MotifAbilitySectionSchema = z.object({
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  links: z.array(MotifAbilityLinkEntrySchema),
});

const MotifFrequencySectionSchema = z.object({
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  frequencies: z.array(FrequencyTippingEntrySchema),
  links: z.array(MotifFrequencyLinkEntrySchema),
});

const FrequencyMotifSectionSchema = z.object({
  frequencies: z.array(FrequencyTippingEntrySchema),
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  links: z.array(FrequencyMotifLinkEntrySchema),
});

const MaskMotifSectionSchema = z.object({
  masks: z.array(PersonaMaskEntrySchema),
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  links: z.array(MaskMotifLinkEntrySchema),
});

const MotifAbilityPeakBridgeSectionSchema = z.object({
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(MotifAbilityPeakBridgeLinkSchema),
});

const MotifFrequencyPeakBridgeSectionSchema = z.object({
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  frequencies: z.array(FrequencyTippingEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(MotifFrequencyPeakBridgeLinkSchema),
});

const FrequencyMotifPeakBridgeSectionSchema = z.object({
  frequencies: z.array(FrequencyTippingEntrySchema),
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(FrequencyMotifPeakBridgeLinkSchema),
});

const AbilityCliffPeakBridgeSectionSchema = z.object({
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AbilityCliffPeakBridgeLinkSchema),
});

const MotifBondSectionSchema = z.object({
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  bonds: z.array(BondContractEntrySchema),
  links: z.array(MotifBondLinkEntrySchema),
});

const MotifAllianceSectionSchema = z.object({
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  alliances: z.array(AllianceEntrySchema),
  events: z.array(AllianceEventSchema),
  links: z.array(MotifAllianceLinkEntrySchema),
});

const MotifConflictSectionSchema = z.object({
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  conflicts: z.array(ConflictEntrySchema),
  links: z.array(MotifConflictLinkEntrySchema),
});

const MotifAmnesiaSectionSchema = z.object({
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  amnesias: z.array(AmnesiaArcEntrySchema),
  links: z.array(MotifAmnesiaLinkEntrySchema),
});


const FrequencyAbilityPeakBridgeSectionSchema = z.object({
  frequencies: z.array(FrequencyTippingEntrySchema),
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(FrequencyAbilityPeakBridgeLinkSchema),
});

const FrequencyCliffPeakBridgeSectionSchema = z.object({
  frequencies: z.array(FrequencyTippingEntrySchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(FrequencyCliffPeakBridgeLinkSchema),
});

const FrequencyMaskPeakBridgeSectionSchema = z.object({
  frequencies: z.array(FrequencyTippingEntrySchema),
  masks: z.array(PersonaMaskEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(FrequencyMaskPeakBridgeLinkSchema),
});

const MotifMaskPeakBridgeSectionSchema = z.object({
  motifs: z.array(MotifEntrySchema),
  appearances: z.array(MotifAppearanceSchema),
  masks: z.array(PersonaMaskEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(MotifMaskPeakBridgeLinkSchema),
});

const FrequencyAmnesiaSectionSchema = z.object({
  frequencies: z.array(FrequencyTippingEntrySchema),
  amnesias: z.array(AmnesiaArcEntrySchema),
  links: z.array(FrequencyAmnesiaLinkEntrySchema),
});

const AmnesiaFrequencySectionSchema = z.object({
  amnesias: z.array(AmnesiaArcEntrySchema),
  frequencies: z.array(FrequencyTippingEntrySchema),
  links: z.array(AmnesiaFrequencyLinkEntrySchema),
});

const AbilityAmnesiaSectionSchema = z.object({
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  amnesias: z.array(AmnesiaArcEntrySchema),
  links: z.array(AbilityAmnesiaLinkEntrySchema),
});

const AmnesiaAbilitySectionSchema = z.object({
  amnesias: z.array(AmnesiaArcEntrySchema),
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  links: z.array(AmnesiaAbilityLinkEntrySchema),
});


const CliffMaskPeakBridgeSectionSchema = z.object({
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  masks: z.array(PersonaMaskEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(CliffMaskPeakBridgeLinkSchema),
});

const MaskAmnesiaPeakBridgeSectionSchema = z.object({
  masks: z.array(PersonaMaskEntrySchema),
  amnesias: z.array(AmnesiaArcEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(MaskAmnesiaPeakBridgeLinkSchema),
});

const AbilityAmnesiaPeakBridgeSectionSchema = z.object({
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  amnesias: z.array(AmnesiaArcEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AbilityAmnesiaPeakBridgeLinkSchema),
});

const CliffAmnesiaPeakBridgeSectionSchema = z.object({
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  amnesias: z.array(AmnesiaArcEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(CliffAmnesiaPeakBridgeLinkSchema),
});

const CliffAmnesiaSectionSchema = z.object({
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  amnesias: z.array(AmnesiaArcEntrySchema),
  links: z.array(CliffAmnesiaLinkEntrySchema),
});

const MaskAmnesiaSectionSchema = z.object({
  masks: z.array(PersonaMaskEntrySchema),
  amnesias: z.array(AmnesiaArcEntrySchema),
  links: z.array(MaskAmnesiaLinkEntrySchema),
});

const BondAmnesiaSectionSchema = z.object({
  bonds: z.array(BondContractEntrySchema),
  amnesias: z.array(AmnesiaArcEntrySchema),
  links: z.array(BondAmnesiaLinkEntrySchema),
});

const PersonaAmnesiaSectionSchema = z.object({
  cards: z.array(PersonaCardSchema).min(1),
  amnesias: z.array(AmnesiaArcEntrySchema),
  links: z.array(PersonaAmnesiaLinkEntrySchema),
});


const AmnesiaAbilityPeakBridgeSectionSchema = z.object({
  amnesias: z.array(AmnesiaArcEntrySchema),
  abilities: z.array(AbilityEntrySchema),
  uses: z.array(AbilityUseSchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AmnesiaAbilityPeakBridgeLinkSchema),
});

const AmnesiaCliffPeakBridgeSectionSchema = z.object({
  amnesias: z.array(AmnesiaArcEntrySchema),
  cliffLinks: z.array(CliffCascadeLinkEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(AmnesiaCliffPeakBridgeLinkSchema),
});

const BondAmnesiaPeakBridgeSectionSchema = z.object({
  bonds: z.array(BondContractEntrySchema),
  amnesias: z.array(AmnesiaArcEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(BondAmnesiaPeakBridgeLinkSchema),
});

const PersonaAmnesiaPeakBridgeSectionSchema = z.object({
  cards: z.array(PersonaCardSchema).min(1),
  amnesias: z.array(AmnesiaArcEntrySchema),
  peaks: z.array(PeakBeforePayoffEntrySchema),
  links: z.array(PersonaAmnesiaPeakBridgeLinkSchema),
});

const HandoffAmnesiaSectionSchema = z.object({
  handoffs: z.array(HandoffAmnesiaEntrySchema),
  amnesias: z.array(AmnesiaArcEntrySchema),
  links: z.array(HandoffAmnesiaLinkEntrySchema),
});

const VestAmnesiaSectionSchema = z.object({
  vests: z.array(IdentityVestEntrySchema),
  amnesias: z.array(AmnesiaArcEntrySchema),
  links: z.array(VestAmnesiaLinkEntrySchema),
});

const QualityAmnesiaSectionSchema = z.object({
  minRecoverIntense: z.number().int().min(1).max(5).optional(),
  amnesias: z.array(AmnesiaArcEntrySchema),
  links: z.array(QualityAmnesiaLinkEntrySchema),
});

const AmnesiaForeshadowSectionSchema = z.object({
  amnesias: z.array(AmnesiaArcEntrySchema),
  items: z.array(ForeshadowItemSchema),
  links: z.array(AmnesiaForeshadowLinkEntrySchema),
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
    personaBondPeakBridge: PersonaBondPeakBridgeSectionSchema.optional(),
    abilityVestPeakBridge: AbilityVestPeakBridgeSectionSchema.optional(),
    allianceMaskPeakBridge: AllianceMaskPeakBridgeSectionSchema.optional(),
    bondCliffLink: BondCliffSectionSchema.optional(),
    allianceMaskLink: AllianceMaskSectionSchema.optional(),
    amnesiaVestLink: AmnesiaVestSectionSchema.optional(),
    conflictPeakLink: ConflictPeakSectionSchema.optional(),
    conflictMaskPeakBridge: ConflictMaskPeakBridgeSectionSchema.optional(),
    amnesiaBondPeakBridge: AmnesiaBondPeakBridgeSectionSchema.optional(),
    foreshadowVestPeakBridge: ForeshadowVestPeakBridgeSectionSchema.optional(),
    conflictMaskLink: ConflictMaskSectionSchema.optional(),
    amnesiaCliffLink: AmnesiaCliffSectionSchema.optional(),
    bondMotifLink: BondMotifSectionSchema.optional(),
    frequencyCliffLink: FrequencyCliffSectionSchema.optional(),
    allianceBondPeakBridge: AllianceBondPeakBridgeSectionSchema.optional(),
    bondVestPeakBridge: BondVestPeakBridgeSectionSchema.optional(),
    amnesiaVestPeakBridge: AmnesiaVestPeakBridgeSectionSchema.optional(),
    allianceVestLink: AllianceVestSectionSchema.optional(),
    conflictVestLink: ConflictVestSectionSchema.optional(),
    foreshadowMaskLink: ForeshadowMaskSectionSchema.optional(),
    abilityBondLink: AbilityBondSectionSchema.optional(),
    conflictBondPeakBridge: ConflictBondPeakBridgeSectionSchema.optional(),
    foreshadowBondPeakBridge: ForeshadowBondPeakBridgeSectionSchema.optional(),
    abilityConflictPeakBridge: AbilityConflictPeakBridgeSectionSchema.optional(),
    conflictBondLink: ConflictBondSectionSchema.optional(),
    amnesiaMaskLink: AmnesiaMaskSectionSchema.optional(),
    motifVestLink: MotifVestSectionSchema.optional(),
    abilityForeshadowLink: AbilityForeshadowSectionSchema.optional(),
    motifBondPeakBridge: MotifBondPeakBridgeSectionSchema.optional(),
    personaMaskPeakBridge: PersonaMaskPeakBridgeSectionSchema.optional(),
    allianceForeshadowPeakBridge: AllianceForeshadowPeakBridgeSectionSchema.optional(),
    foreshadowBondLink: ForeshadowBondSectionSchema.optional(),
    abilityAllianceLink: AbilityAllianceSectionSchema.optional(),
    conflictForeshadowLink: ConflictForeshadowSectionSchema.optional(),
    allianceAmnesiaLink: AllianceAmnesiaSectionSchema.optional(),
    conflictForeshadowPeakBridge: ConflictForeshadowPeakBridgeSectionSchema.optional(),
    allianceAmnesiaPeakBridge: AllianceAmnesiaPeakBridgeSectionSchema.optional(),
    abilityMotifPeakBridge: AbilityMotifPeakBridgeSectionSchema.optional(),
    allianceForeshadowLink: AllianceForeshadowSectionSchema.optional(),
    abilityMotifLink: AbilityMotifSectionSchema.optional(),
    conflictAllianceLink: ConflictAllianceSectionSchema.optional(),
    personaBondLink: PersonaBondSectionSchema.optional(),
    conflictAlliancePeakBridge: ConflictAlliancePeakBridgeSectionSchema.optional(),
    conflictAmnesiaPeakBridge: ConflictAmnesiaPeakBridgeSectionSchema.optional(),
    foreshadowAmnesiaPeakBridge: ForeshadowAmnesiaPeakBridgeSectionSchema.optional(),
    conflictAmnesiaLink: ConflictAmnesiaSectionSchema.optional(),
    foreshadowPersonaLink: ForeshadowPersonaSectionSchema.optional(),
    allianceMotifLink: AllianceMotifSectionSchema.optional(),
    foreshadowAmnesiaLink: ForeshadowAmnesiaSectionSchema.optional(),
    allianceMotifPeakBridge: AllianceMotifPeakBridgeSectionSchema.optional(),
    conflictMotifPeakBridge: ConflictMotifPeakBridgeSectionSchema.optional(),
    foreshadowMotifPeakBridge: ForeshadowMotifPeakBridgeSectionSchema.optional(),
    conflictMotifLink: ConflictMotifSectionSchema.optional(),
    foreshadowAllianceLink: ForeshadowAllianceSectionSchema.optional(),
    conflictPersonaLink: ConflictPersonaSectionSchema.optional(),
    alliancePersonaLink: AlliancePersonaSectionSchema.optional(),
    conflictPersonaPeakBridge: ConflictPersonaPeakBridgeSectionSchema.optional(),
    alliancePersonaPeakBridge: AlliancePersonaPeakBridgeSectionSchema.optional(),
    foreshadowPersonaPeakBridge: ForeshadowPersonaPeakBridgeSectionSchema.optional(),
    personaMotifLink: PersonaMotifSectionSchema.optional(),
    abilityPersonaLink: AbilityPersonaSectionSchema.optional(),
    vestPersonaLink: VestPersonaSectionSchema.optional(),
    maskPersonaLink: MaskPersonaSectionSchema.optional(),
    abilityPersonaPeakBridge: AbilityPersonaPeakBridgeSectionSchema.optional(),
    vestPersonaPeakBridge: VestPersonaPeakBridgeSectionSchema.optional(),
    maskPersonaPeakBridge: MaskPersonaPeakBridgeSectionSchema.optional(),
    amnesiaPersonaLink: AmnesiaPersonaSectionSchema.optional(),
    motifPersonaLink: MotifPersonaSectionSchema.optional(),
    countdownPersonaLink: CountdownPersonaSectionSchema.optional(),
    qualityPersonaLink: QualityPersonaSectionSchema.optional(),
    amnesiaPersonaPeakBridge: AmnesiaPersonaPeakBridgeSectionSchema.optional(),
    motifPersonaPeakBridge: MotifPersonaPeakBridgeSectionSchema.optional(),
    countdownPersonaPeakBridge: CountdownPersonaPeakBridgeSectionSchema.optional(),
    qualityPersonaPeakBridge: QualityPersonaPeakBridgeSectionSchema.optional(),
    frequencyPersonaLink: FrequencyPersonaSectionSchema.optional(),
    handoffPersonaLink: HandoffPersonaSectionSchema.optional(),
    cliffPersonaLink: CliffPersonaSectionSchema.optional(),
    bondPersonaLink: BondPersonaSectionSchema.optional(),
    frequencyPersonaPeakBridge: FrequencyPersonaPeakBridgeSectionSchema.optional(),
    handoffPersonaPeakBridge: HandoffPersonaPeakBridgeSectionSchema.optional(),
    cliffPersonaPeakBridge: CliffPersonaPeakBridgeSectionSchema.optional(),
    bondPersonaPeakBridge: BondPersonaPeakBridgeSectionSchema.optional(),
    abilityFrequencyLink: AbilityFrequencySectionSchema.optional(),
    vestHandoffLink: VestHandoffSectionSchema.optional(),
    maskCliffLink: MaskCliffSectionSchema.optional(),
    maskFrequencyLink: MaskFrequencySectionSchema.optional(),
    abilityFrequencyPeakBridge: AbilityFrequencyPeakBridgeSectionSchema.optional(),
    vestHandoffPeakBridge: VestHandoffPeakBridgeSectionSchema.optional(),
    maskCliffPeakBridge: MaskCliffPeakBridgeSectionSchema.optional(),
    maskFrequencyPeakBridge: MaskFrequencyPeakBridgeSectionSchema.optional(),
    handoffVestLink: HandoffVestSectionSchema.optional(),
    vestFrequencyLink: VestFrequencySectionSchema.optional(),
    maskBondLink: MaskBondSectionSchema.optional(),
    handoffMaskLink: HandoffMaskSectionSchema.optional(),
    handoffVestPeakBridge: HandoffVestPeakBridgeSectionSchema.optional(),
    vestFrequencyPeakBridge: VestFrequencyPeakBridgeSectionSchema.optional(),
    maskBondPeakBridge: MaskBondPeakBridgeSectionSchema.optional(),
    handoffMaskPeakBridge: HandoffMaskPeakBridgeSectionSchema.optional(),
    vestAbilityLink: VestAbilitySectionSchema.optional(),
    handoffFrequencyLink: HandoffFrequencySectionSchema.optional(),
    cliffBondLink: CliffBondSectionSchema.optional(),
    cliffFrequencyLink: CliffFrequencySectionSchema.optional(),
    vestAbilityPeakBridge: VestAbilityPeakBridgeSectionSchema.optional(),
    handoffFrequencyPeakBridge: HandoffFrequencyPeakBridgeSectionSchema.optional(),
    cliffBondPeakBridge: CliffBondPeakBridgeSectionSchema.optional(),
    cliffFrequencyPeakBridge: CliffFrequencyPeakBridgeSectionSchema.optional(),
    maskAbilityLink: MaskAbilitySectionSchema.optional(),
    cliffAbilityLink: CliffAbilitySectionSchema.optional(),
    handoffBondLink: HandoffBondSectionSchema.optional(),
    handoffAbilityLink: HandoffAbilitySectionSchema.optional(),
    maskAbilityPeakBridge: MaskAbilityPeakBridgeSectionSchema.optional(),
    cliffAbilityPeakBridge: CliffAbilityPeakBridgeSectionSchema.optional(),
    handoffBondPeakBridge: HandoffBondPeakBridgeSectionSchema.optional(),
    handoffAbilityPeakBridge: HandoffAbilityPeakBridgeSectionSchema.optional(),
    bondAbilityLink: BondAbilitySectionSchema.optional(),
    handoffCliffLink: HandoffCliffSectionSchema.optional(),
    vestBondLink: VestBondSectionSchema.optional(),
    frequencyBondLink: FrequencyBondSectionSchema.optional(),
    bondAbilityPeakBridge: BondAbilityPeakBridgeSectionSchema.optional(),
    handoffCliffPeakBridge: HandoffCliffPeakBridgeSectionSchema.optional(),
    vestBondPeakBridge: VestBondPeakBridgeSectionSchema.optional(),
    frequencyBondPeakBridge: FrequencyBondPeakBridgeSectionSchema.optional(),
    cliffVestLink: CliffVestSectionSchema.optional(),
    frequencyVestLink: FrequencyVestSectionSchema.optional(),
    vestMaskLink: VestMaskSectionSchema.optional(),
    personaFrequencyLink: PersonaFrequencySectionSchema.optional(),
    cliffVestPeakBridge: CliffVestPeakBridgeSectionSchema.optional(),
    frequencyVestPeakBridge: FrequencyVestPeakBridgeSectionSchema.optional(),
    vestMaskPeakBridge: VestMaskPeakBridgeSectionSchema.optional(),
    personaFrequencyPeakBridge: PersonaFrequencyPeakBridgeSectionSchema.optional(),
    personaAbilityLink: PersonaAbilitySectionSchema.optional(),
    cliffMotifLink: CliffMotifSectionSchema.optional(),
    vestMotifLink: VestMotifSectionSchema.optional(),
    handoffMotifLink: HandoffMotifSectionSchema.optional(),
    motifCliffPeakBridge: MotifCliffPeakBridgeSectionSchema.optional(),
    motifVestPeakBridge: MotifVestPeakBridgeSectionSchema.optional(),
    motifHandoffPeakBridge: MotifHandoffPeakBridgeSectionSchema.optional(),
    vestCliffPeakBridge: VestCliffPeakBridgeSectionSchema.optional(),
    motifAbilityLink: MotifAbilitySectionSchema.optional(),
    motifFrequencyLink: MotifFrequencySectionSchema.optional(),
    frequencyMotifLink: FrequencyMotifSectionSchema.optional(),
    maskMotifLink: MaskMotifSectionSchema.optional(),
    motifAbilityPeakBridge: MotifAbilityPeakBridgeSectionSchema.optional(),
    motifFrequencyPeakBridge: MotifFrequencyPeakBridgeSectionSchema.optional(),
    frequencyMotifPeakBridge: FrequencyMotifPeakBridgeSectionSchema.optional(),
    abilityCliffPeakBridge: AbilityCliffPeakBridgeSectionSchema.optional(),
    motifBondLink: MotifBondSectionSchema.optional(),
    motifAllianceLink: MotifAllianceSectionSchema.optional(),
    motifConflictLink: MotifConflictSectionSchema.optional(),
    motifAmnesiaLink: MotifAmnesiaSectionSchema.optional(),
    frequencyAbilityPeakBridge: FrequencyAbilityPeakBridgeSectionSchema.optional(),
    frequencyCliffPeakBridge: FrequencyCliffPeakBridgeSectionSchema.optional(),
    frequencyMaskPeakBridge: FrequencyMaskPeakBridgeSectionSchema.optional(),
    motifMaskPeakBridge: MotifMaskPeakBridgeSectionSchema.optional(),
    frequencyAmnesiaLink: FrequencyAmnesiaSectionSchema.optional(),
    amnesiaFrequencyLink: AmnesiaFrequencySectionSchema.optional(),
    abilityAmnesiaLink: AbilityAmnesiaSectionSchema.optional(),
    amnesiaAbilityLink: AmnesiaAbilitySectionSchema.optional(),
    cliffMaskPeakBridge: CliffMaskPeakBridgeSectionSchema.optional(),
    maskAmnesiaPeakBridge: MaskAmnesiaPeakBridgeSectionSchema.optional(),
    abilityAmnesiaPeakBridge: AbilityAmnesiaPeakBridgeSectionSchema.optional(),
    cliffAmnesiaPeakBridge: CliffAmnesiaPeakBridgeSectionSchema.optional(),
    cliffAmnesiaLink: CliffAmnesiaSectionSchema.optional(),
    maskAmnesiaLink: MaskAmnesiaSectionSchema.optional(),
    bondAmnesiaLink: BondAmnesiaSectionSchema.optional(),
    personaAmnesiaLink: PersonaAmnesiaSectionSchema.optional(),
    amnesiaAbilityPeakBridge: AmnesiaAbilityPeakBridgeSectionSchema.optional(),
    amnesiaCliffPeakBridge: AmnesiaCliffPeakBridgeSectionSchema.optional(),
    bondAmnesiaPeakBridge: BondAmnesiaPeakBridgeSectionSchema.optional(),
    personaAmnesiaPeakBridge: PersonaAmnesiaPeakBridgeSectionSchema.optional(),
    handoffAmnesiaLink: HandoffAmnesiaSectionSchema.optional(),
    vestAmnesiaLink: VestAmnesiaSectionSchema.optional(),
    qualityAmnesiaLink: QualityAmnesiaSectionSchema.optional(),
    amnesiaForeshadowLink: AmnesiaForeshadowSectionSchema.optional(),
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
  | ForeshadowCliffLinkReport
  | PersonaBondPeakBridgeReport
  | AbilityVestPeakBridgeReport
  | AllianceMaskPeakBridgeReport
  | BondCliffLinkReport
  | AllianceMaskLinkReport
  | AmnesiaVestLinkReport
  | ConflictPeakLinkReport
  | ConflictMaskPeakBridgeReport
  | AmnesiaBondPeakBridgeReport
  | ForeshadowVestPeakBridgeReport
  | ConflictMaskLinkReport
  | AmnesiaCliffLinkReport
  | BondMotifLinkReport
  | FrequencyCliffLinkReport
  | AllianceBondPeakBridgeReport
  | BondVestPeakBridgeReport
  | AmnesiaVestPeakBridgeReport
  | AllianceVestLinkReport
  | ConflictVestLinkReport
  | ForeshadowMaskLinkReport
  | AbilityBondLinkReport
  | ConflictBondPeakBridgeReport
  | ForeshadowBondPeakBridgeReport
  | AbilityConflictPeakBridgeReport
  | ConflictBondLinkReport
  | AmnesiaMaskLinkReport
  | MotifVestLinkReport
  | AbilityForeshadowLinkReport
  | MotifBondPeakBridgeReport
  | PersonaMaskPeakBridgeReport
  | AllianceForeshadowPeakBridgeReport
  | ForeshadowBondLinkReport
  | AbilityAllianceLinkReport
  | ConflictForeshadowLinkReport
  | AllianceAmnesiaLinkReport
  | ConflictForeshadowPeakBridgeReport
  | AllianceAmnesiaPeakBridgeReport
  | AbilityMotifPeakBridgeReport
  | AllianceForeshadowLinkReport
  | AbilityMotifLinkReport
  | ConflictAllianceLinkReport
  | PersonaBondLinkReport
  | ConflictAlliancePeakBridgeReport
  | ConflictAmnesiaPeakBridgeReport
  | ForeshadowAmnesiaPeakBridgeReport
  | ConflictAmnesiaLinkReport
  | ForeshadowPersonaLinkReport
  | AllianceMotifLinkReport
  | ForeshadowAmnesiaLinkReport
  | AllianceMotifPeakBridgeReport
  | ConflictMotifPeakBridgeReport
  | ForeshadowMotifPeakBridgeReport
  | ConflictMotifLinkReport
  | ForeshadowAllianceLinkReport
  | ConflictPersonaLinkReport
  | AlliancePersonaLinkReport
  | ConflictPersonaPeakBridgeReport
  | AlliancePersonaPeakBridgeReport
  | ForeshadowPersonaPeakBridgeReport
  | PersonaMotifLinkReport
  | AbilityPersonaLinkReport
  | VestPersonaLinkReport
  | MaskPersonaLinkReport
  | AbilityPersonaPeakBridgeReport
  | VestPersonaPeakBridgeReport
  | MaskPersonaPeakBridgeReport
  | AmnesiaPersonaLinkReport
  | MotifPersonaLinkReport
  | CountdownPersonaLinkReport
  | QualityPersonaLinkReport
  | AmnesiaPersonaPeakBridgeReport
  | MotifPersonaPeakBridgeReport
  | CountdownPersonaPeakBridgeReport
  | QualityPersonaPeakBridgeReport
  | FrequencyPersonaLinkReport
  | HandoffPersonaLinkReport
  | CliffPersonaLinkReport
  | BondPersonaLinkReport
  | FrequencyPersonaPeakBridgeReport
  | HandoffPersonaPeakBridgeReport
  | CliffPersonaPeakBridgeReport
  | BondPersonaPeakBridgeReport
  | AbilityFrequencyLinkReport
  | VestHandoffLinkReport
  | MaskCliffLinkReport
  | MaskFrequencyLinkReport
  | AbilityFrequencyPeakBridgeReport
  | VestHandoffPeakBridgeReport
  | MaskCliffPeakBridgeReport
  | MaskFrequencyPeakBridgeReport
  | HandoffVestLinkReport
  | VestFrequencyLinkReport
  | MaskBondLinkReport
  | HandoffMaskLinkReport
  | HandoffVestPeakBridgeReport
  | VestFrequencyPeakBridgeReport
  | MaskBondPeakBridgeReport
  | HandoffMaskPeakBridgeReport
  | VestAbilityLinkReport
  | HandoffFrequencyLinkReport
  | CliffBondLinkReport
  | CliffFrequencyLinkReport
  | VestAbilityPeakBridgeReport
  | HandoffFrequencyPeakBridgeReport
  | CliffBondPeakBridgeReport
  | CliffFrequencyPeakBridgeReport
  | MaskAbilityLinkReport
  | CliffAbilityLinkReport
  | HandoffBondLinkReport
  | HandoffAbilityLinkReport
  | MaskAbilityPeakBridgeReport
  | CliffAbilityPeakBridgeReport
  | HandoffBondPeakBridgeReport
  | HandoffAbilityPeakBridgeReport
  | BondAbilityLinkReport
  | HandoffCliffLinkReport
  | VestBondLinkReport
  | FrequencyBondLinkReport
  | BondAbilityPeakBridgeReport
  | HandoffCliffPeakBridgeReport
  | VestBondPeakBridgeReport
  | FrequencyBondPeakBridgeReport
  | CliffVestLinkReport
  | FrequencyVestLinkReport
  | VestMaskLinkReport
  | PersonaFrequencyLinkReport
  | CliffVestPeakBridgeReport
  | FrequencyVestPeakBridgeReport
  | VestMaskPeakBridgeReport
  | PersonaFrequencyPeakBridgeReport
  | PersonaAbilityLinkReport
  | CliffMotifLinkReport
  | VestMotifLinkReport
  | HandoffMotifLinkReport
  | MotifCliffPeakBridgeReport
  | MotifVestPeakBridgeReport
  | MotifHandoffPeakBridgeReport
  | VestCliffPeakBridgeReport
  | MotifAbilityLinkReport
  | MotifFrequencyLinkReport
  | FrequencyMotifLinkReport
  | MaskMotifLinkReport
  | MotifAbilityPeakBridgeReport
  | MotifFrequencyPeakBridgeReport
  | FrequencyMotifPeakBridgeReport
  | AbilityCliffPeakBridgeReport
  | MotifBondLinkReport
  | MotifAllianceLinkReport
  | MotifConflictLinkReport
  | MotifAmnesiaLinkReport
  | FrequencyAbilityPeakBridgeReport
  | FrequencyCliffPeakBridgeReport
  | FrequencyMaskPeakBridgeReport
  | MotifMaskPeakBridgeReport
  | FrequencyAmnesiaLinkReport
  | AmnesiaFrequencyLinkReport
  | AbilityAmnesiaLinkReport
  | AmnesiaAbilityLinkReport
  | CliffMaskPeakBridgeReport
  | MaskAmnesiaPeakBridgeReport
  | AbilityAmnesiaPeakBridgeReport
  | CliffAmnesiaPeakBridgeReport
  | CliffAmnesiaLinkReport
  | MaskAmnesiaLinkReport
  | BondAmnesiaLinkReport
  | PersonaAmnesiaLinkReport
  | AmnesiaAbilityPeakBridgeReport
  | AmnesiaCliffPeakBridgeReport
  | BondAmnesiaPeakBridgeReport
  | PersonaAmnesiaPeakBridgeReport
  | HandoffAmnesiaLinkReport
  | VestAmnesiaLinkReport
  | QualityAmnesiaLinkReport
  | AmnesiaForeshadowLinkReport;

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
  personaBondPeakBridge: (series, latestEp, section) =>
    evaluatePersonaBondPeakBridge({ series, latestEp, ...(section as object) }),
  abilityVestPeakBridge: (series, latestEp, section) =>
    evaluateAbilityVestPeakBridge({ series, latestEp, ...(section as object) }),
  allianceMaskPeakBridge: (series, latestEp, section) =>
    evaluateAllianceMaskPeakBridge({ series, latestEp, ...(section as object) }),
  bondCliffLink: (series, latestEp, section) =>
    evaluateBondCliffLink({ series, latestEp, ...(section as object) }),
  allianceMaskLink: (series, latestEp, section) =>
    evaluateAllianceMaskLink({ series, latestEp, ...(section as object) }),
  amnesiaVestLink: (series, latestEp, section) =>
    evaluateAmnesiaVestLink({ series, latestEp, ...(section as object) }),
  conflictPeakLink: (series, latestEp, section) =>
    evaluateConflictPeakLink({ series, latestEp, ...(section as object) }),
  conflictMaskPeakBridge: (series, latestEp, section) =>
    evaluateConflictMaskPeakBridge({ series, latestEp, ...(section as object) }),
  amnesiaBondPeakBridge: (series, latestEp, section) =>
    evaluateAmnesiaBondPeakBridge({ series, latestEp, ...(section as object) }),
  foreshadowVestPeakBridge: (series, latestEp, section) =>
    evaluateForeshadowVestPeakBridge({ series, latestEp, ...(section as object) }),
  conflictMaskLink: (series, latestEp, section) =>
    evaluateConflictMaskLink({ series, latestEp, ...(section as object) }),
  amnesiaCliffLink: (series, latestEp, section) =>
    evaluateAmnesiaCliffLink({ series, latestEp, ...(section as object) }),
  bondMotifLink: (series, latestEp, section) =>
    evaluateBondMotifLink({ series, latestEp, ...(section as object) }),
  frequencyCliffLink: (series, latestEp, section) =>
    evaluateFrequencyCliffLink({ series, latestEp, ...(section as object) }),
  allianceBondPeakBridge: (series, latestEp, section) =>
    evaluateAllianceBondPeakBridge({ series, latestEp, ...(section as object) }),
  bondVestPeakBridge: (series, latestEp, section) =>
    evaluateBondVestPeakBridge({ series, latestEp, ...(section as object) }),
  amnesiaVestPeakBridge: (series, latestEp, section) =>
    evaluateAmnesiaVestPeakBridge({ series, latestEp, ...(section as object) }),
  allianceVestLink: (series, latestEp, section) =>
    evaluateAllianceVestLink({ series, latestEp, ...(section as object) }),
  conflictVestLink: (series, latestEp, section) =>
    evaluateConflictVestLink({ series, latestEp, ...(section as object) }),
  foreshadowMaskLink: (series, latestEp, section) =>
    evaluateForeshadowMaskLink({ series, latestEp, ...(section as object) }),
  abilityBondLink: (series, latestEp, section) =>
    evaluateAbilityBondLink({ series, latestEp, ...(section as object) }),
  conflictBondPeakBridge: (series, latestEp, section) =>
    evaluateConflictBondPeakBridge({ series, latestEp, ...(section as object) }),
  foreshadowBondPeakBridge: (series, latestEp, section) =>
    evaluateForeshadowBondPeakBridge({ series, latestEp, ...(section as object) }),
  abilityConflictPeakBridge: (series, latestEp, section) =>
    evaluateAbilityConflictPeakBridge({ series, latestEp, ...(section as object) }),
  conflictBondLink: (series, latestEp, section) =>
    evaluateConflictBondLink({ series, latestEp, ...(section as object) }),
  amnesiaMaskLink: (series, latestEp, section) =>
    evaluateAmnesiaMaskLink({ series, latestEp, ...(section as object) }),
  motifVestLink: (series, latestEp, section) =>
    evaluateMotifVestLink({ series, latestEp, ...(section as object) }),
  abilityForeshadowLink: (series, latestEp, section) =>
    evaluateAbilityForeshadowLink({ series, latestEp, ...(section as object) }),
  motifBondPeakBridge: (series, latestEp, section) =>
    evaluateMotifBondPeakBridge({ series, latestEp, ...(section as object) }),
  personaMaskPeakBridge: (series, latestEp, section) =>
    evaluatePersonaMaskPeakBridge({ series, latestEp, ...(section as object) }),
  allianceForeshadowPeakBridge: (series, latestEp, section) =>
    evaluateAllianceForeshadowPeakBridge({ series, latestEp, ...(section as object) }),
  foreshadowBondLink: (series, latestEp, section) =>
    evaluateForeshadowBondLink({ series, latestEp, ...(section as object) }),
  abilityAllianceLink: (series, latestEp, section) =>
    evaluateAbilityAllianceLink({ series, latestEp, ...(section as object) }),
  conflictForeshadowLink: (series, latestEp, section) =>
    evaluateConflictForeshadowLink({ series, latestEp, ...(section as object) }),
  allianceAmnesiaLink: (series, latestEp, section) =>
    evaluateAllianceAmnesiaLink({ series, latestEp, ...(section as object) }),
  conflictForeshadowPeakBridge: (series, latestEp, section) =>
    evaluateConflictForeshadowPeakBridge({ series, latestEp, ...(section as object) }),
  allianceAmnesiaPeakBridge: (series, latestEp, section) =>
    evaluateAllianceAmnesiaPeakBridge({ series, latestEp, ...(section as object) }),
  abilityMotifPeakBridge: (series, latestEp, section) =>
    evaluateAbilityMotifPeakBridge({ series, latestEp, ...(section as object) }),
  allianceForeshadowLink: (series, latestEp, section) =>
    evaluateAllianceForeshadowLink({ series, latestEp, ...(section as object) }),
  abilityMotifLink: (series, latestEp, section) =>
    evaluateAbilityMotifLink({ series, latestEp, ...(section as object) }),
  conflictAllianceLink: (series, latestEp, section) =>
    evaluateConflictAllianceLink({ series, latestEp, ...(section as object) }),
  personaBondLink: (series, latestEp, section) =>
    evaluatePersonaBondLink({ series, latestEp, ...(section as object) }),
  conflictAlliancePeakBridge: (series, latestEp, section) =>
    evaluateConflictAlliancePeakBridge({ series, latestEp, ...(section as object) }),
  conflictAmnesiaPeakBridge: (series, latestEp, section) =>
    evaluateConflictAmnesiaPeakBridge({ series, latestEp, ...(section as object) }),
  foreshadowAmnesiaPeakBridge: (series, latestEp, section) =>
    evaluateForeshadowAmnesiaPeakBridge({ series, latestEp, ...(section as object) }),
  conflictAmnesiaLink: (series, latestEp, section) =>
    evaluateConflictAmnesiaLink({ series, latestEp, ...(section as object) }),
  foreshadowPersonaLink: (series, latestEp, section) =>
    evaluateForeshadowPersonaLink({ series, latestEp, ...(section as object) }),
  allianceMotifLink: (series, latestEp, section) =>
    evaluateAllianceMotifLink({ series, latestEp, ...(section as object) }),
  foreshadowAmnesiaLink: (series, latestEp, section) =>
    evaluateForeshadowAmnesiaLink({ series, latestEp, ...(section as object) }),
  allianceMotifPeakBridge: (series, latestEp, section) =>
    evaluateAllianceMotifPeakBridge({ series, latestEp, ...(section as object) }),
  conflictMotifPeakBridge: (series, latestEp, section) =>
    evaluateConflictMotifPeakBridge({ series, latestEp, ...(section as object) }),
  foreshadowMotifPeakBridge: (series, latestEp, section) =>
    evaluateForeshadowMotifPeakBridge({ series, latestEp, ...(section as object) }),
  conflictMotifLink: (series, latestEp, section) =>
    evaluateConflictMotifLink({ series, latestEp, ...(section as object) }),
  foreshadowAllianceLink: (series, latestEp, section) =>
    evaluateForeshadowAllianceLink({ series, latestEp, ...(section as object) }),
  conflictPersonaLink: (series, latestEp, section) =>
    evaluateConflictPersonaLink({ series, latestEp, ...(section as object) }),
  alliancePersonaLink: (series, latestEp, section) =>
    evaluateAlliancePersonaLink({ series, latestEp, ...(section as object) }),
  conflictPersonaPeakBridge: (series, latestEp, section) =>
    evaluateConflictPersonaPeakBridge({ series, latestEp, ...(section as object) }),
  alliancePersonaPeakBridge: (series, latestEp, section) =>
    evaluateAlliancePersonaPeakBridge({ series, latestEp, ...(section as object) }),
  foreshadowPersonaPeakBridge: (series, latestEp, section) =>
    evaluateForeshadowPersonaPeakBridge({ series, latestEp, ...(section as object) }),
  personaMotifLink: (series, latestEp, section) =>
    evaluatePersonaMotifLink({ series, latestEp, ...(section as object) }),
  abilityPersonaLink: (series, latestEp, section) =>
    evaluateAbilityPersonaLink({ series, latestEp, ...(section as object) }),
  vestPersonaLink: (series, latestEp, section) =>
    evaluateVestPersonaLink({ series, latestEp, ...(section as object) }),
  maskPersonaLink: (series, latestEp, section) =>
    evaluateMaskPersonaLink({ series, latestEp, ...(section as object) }),
  abilityPersonaPeakBridge: (series, latestEp, section) =>
    evaluateAbilityPersonaPeakBridge({ series, latestEp, ...(section as object) }),
  vestPersonaPeakBridge: (series, latestEp, section) =>
    evaluateVestPersonaPeakBridge({ series, latestEp, ...(section as object) }),
  maskPersonaPeakBridge: (series, latestEp, section) =>
    evaluateMaskPersonaPeakBridge({ series, latestEp, ...(section as object) }),
  amnesiaPersonaLink: (series, latestEp, section) =>
    evaluateAmnesiaPersonaLink({ series, latestEp, ...(section as object) }),
  motifPersonaLink: (series, latestEp, section) =>
    evaluateMotifPersonaLink({ series, latestEp, ...(section as object) }),
  countdownPersonaLink: (series, latestEp, section) =>
    evaluateCountdownPersonaLink({ series, latestEp, ...(section as object) }),
  qualityPersonaLink: (series, latestEp, section) =>
    evaluateQualityPersonaLink({ series, latestEp, ...(section as object) }),
  amnesiaPersonaPeakBridge: (series, latestEp, section) =>
    evaluateAmnesiaPersonaPeakBridge({ series, latestEp, ...(section as object) }),
  motifPersonaPeakBridge: (series, latestEp, section) =>
    evaluateMotifPersonaPeakBridge({ series, latestEp, ...(section as object) }),
  countdownPersonaPeakBridge: (series, latestEp, section) =>
    evaluateCountdownPersonaPeakBridge({ series, latestEp, ...(section as object) }),
  qualityPersonaPeakBridge: (series, latestEp, section) =>
    evaluateQualityPersonaPeakBridge({ series, latestEp, ...(section as object) }),
  frequencyPersonaLink: (series, latestEp, section) =>
    evaluateFrequencyPersonaLink({ series, latestEp, ...(section as object) }),
  handoffPersonaLink: (series, latestEp, section) =>
    evaluateHandoffPersonaLink({ series, latestEp, ...(section as object) }),
  cliffPersonaLink: (series, latestEp, section) =>
    evaluateCliffPersonaLink({ series, latestEp, ...(section as object) }),
  bondPersonaLink: (series, latestEp, section) =>
    evaluateBondPersonaLink({ series, latestEp, ...(section as object) }),
  frequencyPersonaPeakBridge: (series, latestEp, section) =>
    evaluateFrequencyPersonaPeakBridge({ series, latestEp, ...(section as object) }),
  handoffPersonaPeakBridge: (series, latestEp, section) =>
    evaluateHandoffPersonaPeakBridge({ series, latestEp, ...(section as object) }),
  cliffPersonaPeakBridge: (series, latestEp, section) =>
    evaluateCliffPersonaPeakBridge({ series, latestEp, ...(section as object) }),
  bondPersonaPeakBridge: (series, latestEp, section) =>
    evaluateBondPersonaPeakBridge({ series, latestEp, ...(section as object) }),
  abilityFrequencyLink: (series, latestEp, section) =>
    evaluateAbilityFrequencyLink({ series, latestEp, ...(section as object) }),
  vestHandoffLink: (series, latestEp, section) =>
    evaluateVestHandoffLink({ series, latestEp, ...(section as object) }),
  maskCliffLink: (series, latestEp, section) =>
    evaluateMaskCliffLink({ series, latestEp, ...(section as object) }),
  maskFrequencyLink: (series, latestEp, section) =>
    evaluateMaskFrequencyLink({ series, latestEp, ...(section as object) }),
  abilityFrequencyPeakBridge: (series, latestEp, section) =>
    evaluateAbilityFrequencyPeakBridge({ series, latestEp, ...(section as object) }),
  vestHandoffPeakBridge: (series, latestEp, section) =>
    evaluateVestHandoffPeakBridge({ series, latestEp, ...(section as object) }),
  maskCliffPeakBridge: (series, latestEp, section) =>
    evaluateMaskCliffPeakBridge({ series, latestEp, ...(section as object) }),
  maskFrequencyPeakBridge: (series, latestEp, section) =>
    evaluateMaskFrequencyPeakBridge({ series, latestEp, ...(section as object) }),
  handoffVestLink: (series, latestEp, section) =>
    evaluateHandoffVestLink({ series, latestEp, ...(section as object) }),
  vestFrequencyLink: (series, latestEp, section) =>
    evaluateVestFrequencyLink({ series, latestEp, ...(section as object) }),
  maskBondLink: (series, latestEp, section) =>
    evaluateMaskBondLink({ series, latestEp, ...(section as object) }),
  handoffMaskLink: (series, latestEp, section) =>
    evaluateHandoffMaskLink({ series, latestEp, ...(section as object) }),
  handoffVestPeakBridge: (series, latestEp, section) =>
    evaluateHandoffVestPeakBridge({ series, latestEp, ...(section as object) }),
  vestFrequencyPeakBridge: (series, latestEp, section) =>
    evaluateVestFrequencyPeakBridge({ series, latestEp, ...(section as object) }),
  maskBondPeakBridge: (series, latestEp, section) =>
    evaluateMaskBondPeakBridge({ series, latestEp, ...(section as object) }),
  handoffMaskPeakBridge: (series, latestEp, section) =>
    evaluateHandoffMaskPeakBridge({ series, latestEp, ...(section as object) }),
  vestAbilityLink: (series, latestEp, section) =>
    evaluateVestAbilityLink({ series, latestEp, ...(section as object) }),
  handoffFrequencyLink: (series, latestEp, section) =>
    evaluateHandoffFrequencyLink({ series, latestEp, ...(section as object) }),
  cliffBondLink: (series, latestEp, section) =>
    evaluateCliffBondLink({ series, latestEp, ...(section as object) }),
  cliffFrequencyLink: (series, latestEp, section) =>
    evaluateCliffFrequencyLink({ series, latestEp, ...(section as object) }),
  vestAbilityPeakBridge: (series, latestEp, section) =>
    evaluateVestAbilityPeakBridge({ series, latestEp, ...(section as object) }),
  handoffFrequencyPeakBridge: (series, latestEp, section) =>
    evaluateHandoffFrequencyPeakBridge({ series, latestEp, ...(section as object) }),
  cliffBondPeakBridge: (series, latestEp, section) =>
    evaluateCliffBondPeakBridge({ series, latestEp, ...(section as object) }),
  cliffFrequencyPeakBridge: (series, latestEp, section) =>
    evaluateCliffFrequencyPeakBridge({ series, latestEp, ...(section as object) }),
  maskAbilityLink: (series, latestEp, section) =>
    evaluateMaskAbilityLink({ series, latestEp, ...(section as object) }),
  cliffAbilityLink: (series, latestEp, section) =>
    evaluateCliffAbilityLink({ series, latestEp, ...(section as object) }),
  handoffBondLink: (series, latestEp, section) =>
    evaluateHandoffBondLink({ series, latestEp, ...(section as object) }),
  handoffAbilityLink: (series, latestEp, section) =>
    evaluateHandoffAbilityLink({ series, latestEp, ...(section as object) }),
  maskAbilityPeakBridge: (series, latestEp, section) =>
    evaluateMaskAbilityPeakBridge({ series, latestEp, ...(section as object) }),
  cliffAbilityPeakBridge: (series, latestEp, section) =>
    evaluateCliffAbilityPeakBridge({ series, latestEp, ...(section as object) }),
  handoffBondPeakBridge: (series, latestEp, section) =>
    evaluateHandoffBondPeakBridge({ series, latestEp, ...(section as object) }),
  handoffAbilityPeakBridge: (series, latestEp, section) =>
    evaluateHandoffAbilityPeakBridge({ series, latestEp, ...(section as object) }),
  bondAbilityLink: (series, latestEp, section) =>
    evaluateBondAbilityLink({ series, latestEp, ...(section as object) }),
  handoffCliffLink: (series, latestEp, section) =>
    evaluateHandoffCliffLink({ series, latestEp, ...(section as object) }),
  vestBondLink: (series, latestEp, section) =>
    evaluateVestBondLink({ series, latestEp, ...(section as object) }),
  frequencyBondLink: (series, latestEp, section) =>
    evaluateFrequencyBondLink({ series, latestEp, ...(section as object) }),
  bondAbilityPeakBridge: (series, latestEp, section) =>
    evaluateBondAbilityPeakBridge({ series, latestEp, ...(section as object) }),
  handoffCliffPeakBridge: (series, latestEp, section) =>
    evaluateHandoffCliffPeakBridge({ series, latestEp, ...(section as object) }),
  vestBondPeakBridge: (series, latestEp, section) =>
    evaluateVestBondPeakBridge({ series, latestEp, ...(section as object) }),
  frequencyBondPeakBridge: (series, latestEp, section) =>
    evaluateFrequencyBondPeakBridge({ series, latestEp, ...(section as object) }),
  cliffVestLink: (series, latestEp, section) =>
    evaluateCliffVestLink({ series, latestEp, ...(section as object) }),
  frequencyVestLink: (series, latestEp, section) =>
    evaluateFrequencyVestLink({ series, latestEp, ...(section as object) }),
  vestMaskLink: (series, latestEp, section) =>
    evaluateVestMaskLink({ series, latestEp, ...(section as object) }),
  personaFrequencyLink: (series, latestEp, section) =>
    evaluatePersonaFrequencyLink({ series, latestEp, ...(section as object) }),
  cliffVestPeakBridge: (series, latestEp, section) =>
    evaluateCliffVestPeakBridge({ series, latestEp, ...(section as object) }),
  frequencyVestPeakBridge: (series, latestEp, section) =>
    evaluateFrequencyVestPeakBridge({ series, latestEp, ...(section as object) }),
  vestMaskPeakBridge: (series, latestEp, section) =>
    evaluateVestMaskPeakBridge({ series, latestEp, ...(section as object) }),
  personaFrequencyPeakBridge: (series, latestEp, section) =>
    evaluatePersonaFrequencyPeakBridge({ series, latestEp, ...(section as object) }),
  personaAbilityLink: (series, latestEp, section) =>
    evaluatePersonaAbilityLink({ series, latestEp, ...(section as object) }),
  cliffMotifLink: (series, latestEp, section) =>
    evaluateCliffMotifLink({ series, latestEp, ...(section as object) }),
  vestMotifLink: (series, latestEp, section) =>
    evaluateVestMotifLink({ series, latestEp, ...(section as object) }),
  handoffMotifLink: (series, latestEp, section) =>
    evaluateHandoffMotifLink({ series, latestEp, ...(section as object) }),
  motifCliffPeakBridge: (series, latestEp, section) =>
    evaluateMotifCliffPeakBridge({ series, latestEp, ...(section as object) }),
  motifVestPeakBridge: (series, latestEp, section) =>
    evaluateMotifVestPeakBridge({ series, latestEp, ...(section as object) }),
  motifHandoffPeakBridge: (series, latestEp, section) =>
    evaluateMotifHandoffPeakBridge({ series, latestEp, ...(section as object) }),
  vestCliffPeakBridge: (series, latestEp, section) =>
    evaluateVestCliffPeakBridge({ series, latestEp, ...(section as object) }),
  motifAbilityLink: (series, latestEp, section) =>
    evaluateMotifAbilityLink({ series, latestEp, ...(section as object) }),
  motifFrequencyLink: (series, latestEp, section) =>
    evaluateMotifFrequencyLink({ series, latestEp, ...(section as object) }),
  frequencyMotifLink: (series, latestEp, section) =>
    evaluateFrequencyMotifLink({ series, latestEp, ...(section as object) }),
  maskMotifLink: (series, latestEp, section) =>
    evaluateMaskMotifLink({ series, latestEp, ...(section as object) }),
  motifAbilityPeakBridge: (series, latestEp, section) =>
    evaluateMotifAbilityPeakBridge({ series, latestEp, ...(section as object) }),
  motifFrequencyPeakBridge: (series, latestEp, section) =>
    evaluateMotifFrequencyPeakBridge({ series, latestEp, ...(section as object) }),
  frequencyMotifPeakBridge: (series, latestEp, section) =>
    evaluateFrequencyMotifPeakBridge({ series, latestEp, ...(section as object) }),
  abilityCliffPeakBridge: (series, latestEp, section) =>
    evaluateAbilityCliffPeakBridge({ series, latestEp, ...(section as object) }),
  motifBondLink: (series, latestEp, section) =>
    evaluateMotifBondLink({ series, latestEp, ...(section as object) }),
  motifAllianceLink: (series, latestEp, section) =>
    evaluateMotifAllianceLink({ series, latestEp, ...(section as object) }),
  motifConflictLink: (series, latestEp, section) =>
    evaluateMotifConflictLink({ series, latestEp, ...(section as object) }),
  motifAmnesiaLink: (series, latestEp, section) =>
    evaluateMotifAmnesiaLink({ series, latestEp, ...(section as object) }),
  frequencyAbilityPeakBridge: (series, latestEp, section) =>
    evaluateFrequencyAbilityPeakBridge({ series, latestEp, ...(section as object) }),
  frequencyCliffPeakBridge: (series, latestEp, section) =>
    evaluateFrequencyCliffPeakBridge({ series, latestEp, ...(section as object) }),
  frequencyMaskPeakBridge: (series, latestEp, section) =>
    evaluateFrequencyMaskPeakBridge({ series, latestEp, ...(section as object) }),
  motifMaskPeakBridge: (series, latestEp, section) =>
    evaluateMotifMaskPeakBridge({ series, latestEp, ...(section as object) }),
  frequencyAmnesiaLink: (series, latestEp, section) =>
    evaluateFrequencyAmnesiaLink({ series, latestEp, ...(section as object) }),
  amnesiaFrequencyLink: (series, latestEp, section) =>
    evaluateAmnesiaFrequencyLink({ series, latestEp, ...(section as object) }),
  abilityAmnesiaLink: (series, latestEp, section) =>
    evaluateAbilityAmnesiaLink({ series, latestEp, ...(section as object) }),
  amnesiaAbilityLink: (series, latestEp, section) =>
    evaluateAmnesiaAbilityLink({ series, latestEp, ...(section as object) }),
  cliffMaskPeakBridge: (series, latestEp, section) =>
    evaluateCliffMaskPeakBridge({ series, latestEp, ...(section as object) }),
  maskAmnesiaPeakBridge: (series, latestEp, section) =>
    evaluateMaskAmnesiaPeakBridge({ series, latestEp, ...(section as object) }),
  abilityAmnesiaPeakBridge: (series, latestEp, section) =>
    evaluateAbilityAmnesiaPeakBridge({ series, latestEp, ...(section as object) }),
  cliffAmnesiaPeakBridge: (series, latestEp, section) =>
    evaluateCliffAmnesiaPeakBridge({ series, latestEp, ...(section as object) }),
  cliffAmnesiaLink: (series, latestEp, section) =>
    evaluateCliffAmnesiaLink({ series, latestEp, ...(section as object) }),
  maskAmnesiaLink: (series, latestEp, section) =>
    evaluateMaskAmnesiaLink({ series, latestEp, ...(section as object) }),
  bondAmnesiaLink: (series, latestEp, section) =>
    evaluateBondAmnesiaLink({ series, latestEp, ...(section as object) }),
  personaAmnesiaLink: (series, latestEp, section) =>
    evaluatePersonaAmnesiaLink({ series, latestEp, ...(section as object) }),
  amnesiaAbilityPeakBridge: (series, latestEp, section) =>
    evaluateAmnesiaAbilityPeakBridge({ series, latestEp, ...(section as object) }),
  amnesiaCliffPeakBridge: (series, latestEp, section) =>
    evaluateAmnesiaCliffPeakBridge({ series, latestEp, ...(section as object) }),
  bondAmnesiaPeakBridge: (series, latestEp, section) =>
    evaluateBondAmnesiaPeakBridge({ series, latestEp, ...(section as object) }),
  personaAmnesiaPeakBridge: (series, latestEp, section) =>
    evaluatePersonaAmnesiaPeakBridge({ series, latestEp, ...(section as object) }),
  handoffAmnesiaLink: (series, latestEp, section) =>
    evaluateHandoffAmnesiaLink({ series, latestEp, ...(section as object) }),
  vestAmnesiaLink: (series, latestEp, section) =>
    evaluateVestAmnesiaLink({ series, latestEp, ...(section as object) }),
  qualityAmnesiaLink: (series, latestEp, section) =>
    evaluateQualityAmnesiaLink({ series, latestEp, ...(section as object) }),
  amnesiaForeshadowLink: (series, latestEp, section) =>
    evaluateAmnesiaForeshadowLink({ series, latestEp, ...(section as object) }),
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
