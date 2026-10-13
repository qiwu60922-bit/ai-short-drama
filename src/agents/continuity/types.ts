/**
 * Continuity generate preflight types (Wave3).
 */
import type { HumanLock } from '@/schemas/human-lock';
import type { SceneState } from '@/schemas/scene-state';
import type { ShotContinuityLock } from '@/schemas/shot-continuity-lock';
import type { HumanLockService } from '@/core/lock/human-lock-service';
import type { HumanLockSubjectType, LockActor } from '@/core/lock/types';

export type GeneratePreflightFailureCode =
  | 'INVALID_INPUT'
  | 'PRIOR_SCENE_STATE_REQUIRED'
  | 'PRIOR_SCENE_STATE_HASH_REQUIRED'
  | 'PRIOR_SCENE_STATE_HASH_MISMATCH'
  | 'LOCK_REQUIRED'
  | 'LOCK_REVISION_MISMATCH'
  | 'LOCK_HASH_MISMATCH'
  | 'AGENT_CANNOT_OVERRIDE_LOCK'
  | 'ACTOR_NOT_TRUSTED'
  | 'CONTINUITY_LOCK_INVALID';

export interface RequiredHumanLockRef {
  readonly subjectType: HumanLockSubjectType;
  readonly subjectId: string;
  readonly revisionId: string;
  readonly contentSha256: string;
}

export interface GeneratePreflightFlags {
  /** Explicit first-shot / cold-open: allows priorSceneStateId === null. */
  readonly firstShot?: boolean;
  /** Force prior SceneState even when firstShot (policy override). */
  readonly requiresPriorSceneState?: boolean;
}

/** Minimal prior pair from RepairPlan.preserveLocks (Wave3 PF-R11). */
export interface RepairPreserveLocksPrior {
  readonly priorSceneStateId: string | null;
  readonly priorSceneStateContentSha256: string | null;
}

export interface GeneratePreflightInput {
  readonly continuityLock: unknown;
  /** Loaded SceneState for priorSceneStateId when present. */
  readonly priorState?: SceneState | null;
  /** Required human locks that must match store heads (shot_spec + bibles). */
  readonly requiredLocks: readonly RequiredHumanLockRef[];
  readonly actor: LockActor;
  readonly flags?: GeneratePreflightFlags;
  /** Optional carried locks for diagnostics (not authoritative vs store). */
  readonly presentedLocks?: readonly HumanLock[];
  /**
   * When present (SURGICAL_REGEN path), prior id/sha must match continuityLock
   * or preflight refuses enqueue (PF-R11 / RP-R02).
   */
  readonly repairPreserveLocks?: RepairPreserveLocksPrior;
}

export type GeneratePreflightResult =
  | {
      readonly ok: true;
      readonly continuityLock: ShotContinuityLock;
    }
  | { readonly ok: false; readonly code: GeneratePreflightFailureCode };

export interface GeneratePreflightDeps {
  readonly humanLockService: HumanLockService;
}
