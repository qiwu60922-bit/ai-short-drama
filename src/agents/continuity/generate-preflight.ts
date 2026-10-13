/**
 * Fail-closed generate / surgical-regen preflight (Wave3).
 * Refuses enqueue when prior SceneState hash or required HumanLocks are missing/mismatched.
 * Agents cannot satisfy locks by writing them here — only assert against store.
 */
import { ShotContinuityLockSchema, type ShotContinuityLock } from '@/schemas/shot-continuity-lock';
import type {
  GeneratePreflightDeps,
  GeneratePreflightFailureCode,
  GeneratePreflightInput,
  GeneratePreflightResult,
  RepairPreserveLocksPrior,
} from './types';


/**
 * PF-R07 dual insurance (CL-R05 companion): ContinuityLock prior id/sha must be a
 * null pair or both set. Pure — inspects raw JSON so preflight does not rely solely
 * on zod issue message matching when API/clients pass half-null objects.
 */
export function assertContinuityLockPriorNullPair(
  continuityLock: unknown,
): { ok: true } | { ok: false; code: GeneratePreflightFailureCode } {
  if (typeof continuityLock !== 'object' || continuityLock === null || Array.isArray(continuityLock)) {
    return { ok: true };
  }
  const rec = continuityLock as Record<string, unknown>;
  if (!('priorSceneStateId' in rec) || !('priorSceneStateContentSha256' in rec)) {
    return { ok: true };
  }
  const hasPrior = rec.priorSceneStateId !== null;
  const hasPriorSha = rec.priorSceneStateContentSha256 !== null;
  if (hasPrior !== hasPriorSha) {
    return { ok: false, code: 'PRIOR_SCENE_STATE_HASH_REQUIRED' };
  }
  return { ok: true };
}

/**
 * RP-R01: PreserveLocks prior must be a null pair or both set (equal-length / null-pair rule).
 * Pure — fail closed before enqueue when id is set and sha is null (or vice versa).
 */
export function assertPreserveLocksPriorNullPair(
  prior: RepairPreserveLocksPrior,
): { ok: true } | { ok: false; code: GeneratePreflightFailureCode } {
  const hasPrior = prior.priorSceneStateId !== null;
  const hasPriorSha = prior.priorSceneStateContentSha256 !== null;
  if (hasPrior !== hasPriorSha) {
    return { ok: false, code: 'PRIOR_SCENE_STATE_HASH_REQUIRED' };
  }
  return { ok: true };
}

/**
 * PF-R11 / RP-R02: RepairPlan.preserveLocks prior id/sha must equal ContinuityLock prior.
 * RP-R01: half-null prior pair is rejected first (null-pair rule).
 * Pure — no I/O. Used by assertGenerateAllowed when repairPreserveLocks is provided.
 */
export function assertRepairPreserveLocksAlign(
  continuityLock: {
    readonly priorSceneStateId: string | null;
    readonly priorSceneStateContentSha256: string | null;
  },
  repairPlanPreserveLocks: RepairPreserveLocksPrior,
): { ok: true } | { ok: false; code: GeneratePreflightFailureCode } {
  const pair = assertPreserveLocksPriorNullPair(repairPlanPreserveLocks);
  if (!pair.ok) {
    return pair;
  }
  if (
    repairPlanPreserveLocks.priorSceneStateId !== continuityLock.priorSceneStateId ||
    repairPlanPreserveLocks.priorSceneStateContentSha256 !==
      continuityLock.priorSceneStateContentSha256
  ) {
    return { ok: false, code: 'PRIOR_SCENE_STATE_HASH_MISMATCH' };
  }
  return { ok: true };
}

export async function assertGenerateAllowed(
  input: GeneratePreflightInput,
  deps: GeneratePreflightDeps,
): Promise<GeneratePreflightResult> {
  if (!input || typeof input !== 'object') {
    return { ok: false, code: 'INVALID_INPUT' };
  }
  if (!Array.isArray(input.requiredLocks)) {
    return { ok: false, code: 'INVALID_INPUT' };
  }
  if (!input.actor || typeof input.actor !== 'object' || typeof input.actor.id !== 'string') {
    return { ok: false, code: 'INVALID_INPUT' };
  }

  // PF-R07: raw half-null prior pair (id null + sha set, or inverse) — dual insurance vs CL-R05 zod
  const priorPair = assertContinuityLockPriorNullPair(input.continuityLock);
  if (!priorPair.ok) {
    return { ok: false, code: priorPair.code };
  }

  const parsed = ShotContinuityLockSchema.safeParse(input.continuityLock);
  if (!parsed.success) {
    const msgs = parsed.error.issues.map((i) => i.message).join('; ');
    if (
      msgs.includes('prior SceneState sha required') ||
      msgs.includes('prior SceneState id/sha null mismatch')
    ) {
      return { ok: false, code: 'PRIOR_SCENE_STATE_HASH_REQUIRED' };
    }
    return { ok: false, code: 'CONTINUITY_LOCK_INVALID' };
  }

  const lock: ShotContinuityLock = parsed.data;
  const flags = input.flags ?? {};

  // PF-R06: firstShot=true but prior id non-null → strategy conflict
  if (flags.firstShot === true && lock.priorSceneStateId !== null) {
    return { ok: false, code: 'INVALID_INPUT' };
  }

  const explicitFirstShot =
    flags.firstShot === true &&
    lock.priorSceneStateId === null &&
    lock.priorSceneStateContentSha256 === null;

  if (lock.priorSceneStateId !== null) {
    if (
      lock.priorSceneStateContentSha256 === null ||
      lock.priorSceneStateContentSha256 === undefined
    ) {
      return { ok: false, code: 'PRIOR_SCENE_STATE_HASH_REQUIRED' };
    }
    if (!input.priorState) {
      // PF-R10: missing prior row — fail closed (not PASS)
      return { ok: false, code: 'PRIOR_SCENE_STATE_REQUIRED' };
    }
    if (input.priorState.id !== lock.priorSceneStateId) {
      return { ok: false, code: 'PRIOR_SCENE_STATE_REQUIRED' };
    }
    if (input.priorState.contentSha256 !== lock.priorSceneStateContentSha256) {
      return { ok: false, code: 'PRIOR_SCENE_STATE_HASH_MISMATCH' };
    }
  } else {
    if (flags.requiresPriorSceneState === true) {
      return { ok: false, code: 'PRIOR_SCENE_STATE_REQUIRED' };
    }
    if (!explicitFirstShot) {
      return { ok: false, code: 'PRIOR_SCENE_STATE_REQUIRED' };
    }
  }

  // PF-R11 / RP-R02: optional RepairPlan.preserveLocks must align with ContinuityLock prior
  if (input.repairPreserveLocks !== undefined) {
    const align = assertRepairPreserveLocksAlign(lock, input.repairPreserveLocks);
    if (!align.ok) {
      return { ok: false, code: align.code };
    }
  }

  if (input.requiredLocks.length === 0) {
    return { ok: false, code: 'LOCK_REQUIRED' };
  }

  for (const req of input.requiredLocks) {
    const asserted = await deps.humanLockService.assertLocked({
      subjectType: req.subjectType,
      subjectId: req.subjectId,
      revisionId: req.revisionId,
      contentSha256: req.contentSha256,
    });
    if (!asserted.ok) {
      return { ok: false, code: asserted.code };
    }
  }

  return { ok: true, continuityLock: lock };
}

/** Thin helper for enqueue sites — throws Error with code in message (no queue change). */
export async function preflightOrThrow(
  input: GeneratePreflightInput,
  deps: GeneratePreflightDeps,
): Promise<ShotContinuityLock> {
  const result = await assertGenerateAllowed(input, deps);
  if (!result.ok) {
    throw new Error(`GENERATE_PREFLIGHT_REJECTED:${result.code}`);
  }
  return result.continuityLock;
}

/**
 * Run continuity preflight, then invoke `enqueue` only if it passes.
 * TG-6: real zero-call guard — enqueue is never invoked on preflight failure.
 */
export async function enqueueAfterPreflight<TResult>(
  input: GeneratePreflightInput,
  deps: GeneratePreflightDeps,
  enqueue: () => Promise<TResult> | TResult,
): Promise<TResult> {
  await preflightOrThrow(input, deps);
  return enqueue();
}
