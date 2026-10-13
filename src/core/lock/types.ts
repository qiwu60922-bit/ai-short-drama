/**
 * V11 HumanLock control-plane types (Wave3).
 * Agent must never write/overwrite locks — fail closed.
 */

export const HUMAN_LOCK_SUBJECT_TYPES = [
  'story_bible',
  'visual_bible',
  'character_dna',
  'scene_bible',
  'prop_bible',
  'shot_spec',
  'episode_manifest',
] as const;

export type HumanLockSubjectType = (typeof HUMAN_LOCK_SUBJECT_TYPES)[number];

export type LockActorKind = 'human' | 'agent' | 'system';

export interface LockActor {
  readonly kind: LockActorKind;
  readonly id: string;
  /** Human actors must be trusted to mutate locks. */
  readonly trusted?: boolean;
}

export type HumanLockFailureCode =
  | 'INVALID_INPUT'
  | 'AGENT_CANNOT_OVERRIDE_LOCK'
  | 'LOCK_REQUIRED'
  | 'LOCK_REVISION_MISMATCH'
  | 'LOCK_HASH_MISMATCH'
  | 'ACTOR_NOT_TRUSTED';

export interface LockSubjectRef {
  readonly subjectType: HumanLockSubjectType;
  readonly subjectId: string;
}

export interface PlanLockCommand {
  readonly subjectType: HumanLockSubjectType;
  readonly subjectId: string;
  readonly revisionId: string;
  readonly contentSha256: string;
  /** Optional stable lock row id; store may mint if omitted. */
  readonly id?: string;
}

export interface AssertLockCommand {
  readonly subjectType: HumanLockSubjectType;
  readonly subjectId: string;
  readonly revisionId: string;
  readonly contentSha256: string;
}

export interface ProposeRevisionCommand {
  readonly subjectType: HumanLockSubjectType;
  readonly subjectId: string;
  readonly proposedRevisionId: string;
  readonly proposedContentSha256: string;
  readonly rationale?: string;
}

export interface UnlockCommand {
  readonly subjectType: HumanLockSubjectType;
  readonly subjectId: string;
}

export type LockCommand =
  | { readonly op: 'planLock'; readonly payload: PlanLockCommand }
  | { readonly op: 'commitLock'; readonly payload: PlanLockCommand }
  | { readonly op: 'assertLocked'; readonly payload: AssertLockCommand }
  | { readonly op: 'proposeRevision'; readonly payload: ProposeRevisionCommand }
  | { readonly op: 'unlock'; readonly payload: UnlockCommand }
  | { readonly op: 'overwriteLock'; readonly payload: PlanLockCommand };
