/**
 * HumanLock pure kernel (Wave3).
 * Only trusted human actors may plan/commit/unlock/overwrite.
 * Agents may proposeRevision only — never write lock heads.
 */
import { HumanLockSchema, type HumanLock } from '@/schemas/human-lock';
import type { HumanLockStore } from './human-lock-store';
import {
  HUMAN_LOCK_SUBJECT_TYPES,
  type AssertLockCommand,
  type HumanLockFailureCode,
  type HumanLockSubjectType,
  type LockActor,
  type PlanLockCommand,
  type ProposeRevisionCommand,
  type UnlockCommand,
} from './types';

export type HumanLockResult<T = HumanLock> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly code: HumanLockFailureCode };

export type ProposeRevisionResult =
  | {
      readonly ok: true;
      readonly value: {
        readonly subjectType: HumanLockSubjectType;
        readonly subjectId: string;
        readonly proposedRevisionId: string;
        readonly proposedContentSha256: string;
        readonly rationale?: string;
        /** Explicit: proposal does not mutate lock store. */
        readonly wroteLock: false;
      };
    }
  | { readonly ok: false; readonly code: HumanLockFailureCode };

const identifierPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,191}$/;
const sha256Pattern = /^[a-f0-9]{64}$/;
const subjectTypeSet = new Set<string>(HUMAN_LOCK_SUBJECT_TYPES);

function failure(code: HumanLockFailureCode): Extract<HumanLockResult, { ok: false }> {
  return { ok: false, code };
}

function isIdentifier(value: unknown): value is string {
  return typeof value === 'string' && identifierPattern.test(value);
}

function isSha256(value: unknown): value is string {
  return typeof value === 'string' && sha256Pattern.test(value);
}

function isSubjectType(value: unknown): value is HumanLockSubjectType {
  return typeof value === 'string' && subjectTypeSet.has(value);
}

function isTrustedHuman(actor: LockActor): boolean {
  return actor.kind === 'human' && actor.trusted === true && isIdentifier(actor.id);
}

function rejectAgentOverride(actor: LockActor): HumanLockResult | null {
  if (actor.kind === 'agent') {
    return failure('AGENT_CANNOT_OVERRIDE_LOCK');
  }
  return null;
}

function requireTrustedHuman(actor: LockActor): HumanLockResult | null {
  const agent = rejectAgentOverride(actor);
  if (agent) return agent;
  if (!isTrustedHuman(actor)) {
    return failure('ACTOR_NOT_TRUSTED');
  }
  return null;
}

function parsePlanPayload(input: unknown): PlanLockCommand | undefined {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return undefined;
  const rec = input as Record<string, unknown>;
  if (!isSubjectType(rec.subjectType)) return undefined;
  if (!isIdentifier(rec.subjectId)) return undefined;
  if (!isIdentifier(rec.revisionId)) return undefined;
  if (!isSha256(rec.contentSha256)) return undefined;
  if (rec.id !== undefined && !isIdentifier(rec.id)) return undefined;
  return {
    subjectType: rec.subjectType,
    subjectId: rec.subjectId,
    revisionId: rec.revisionId,
    contentSha256: rec.contentSha256,
    ...(typeof rec.id === 'string' ? { id: rec.id } : {}),
  };
}

function utcNow(): string {
  return new Date().toISOString();
}

function mintLockId(cmd: PlanLockCommand): string {
  return cmd.id ?? `hl-${cmd.subjectType}-${cmd.subjectId}-${cmd.revisionId}`;
}

export interface HumanLockService {
  planLock(command: unknown, actor: LockActor): Promise<HumanLockResult>;
  commitLock(command: unknown, actor: LockActor): Promise<HumanLockResult>;
  assertLocked(command: unknown): Promise<HumanLockResult>;
  proposeRevision(command: unknown, actor: LockActor): Promise<ProposeRevisionResult>;
  unlock(command: unknown, actor: LockActor): Promise<HumanLockResult<{ cleared: true }>>;
  overwriteLock(command: unknown, actor: LockActor): Promise<HumanLockResult>;
}

export function createHumanLockService(store: HumanLockStore): HumanLockService {
  async function commitAsHuman(command: unknown, actor: LockActor): Promise<HumanLockResult> {
    const denied = requireTrustedHuman(actor);
    if (denied) return denied;

    const payload = parsePlanPayload(command);
    if (!payload) return failure('INVALID_INPUT');

    const draft: HumanLock = {
      id: mintLockId(payload),
      subjectType: payload.subjectType,
      subjectId: payload.subjectId,
      revisionId: payload.revisionId,
      contentSha256: payload.contentSha256,
      lockedBy: actor.id,
      lockedAt: utcNow(),
    };

    const parsed = HumanLockSchema.safeParse(draft);
    if (!parsed.success) return failure('INVALID_INPUT');

    const written = await store.appendLock(parsed.data);
    return { ok: true, value: written };
  }

  return {
    async planLock(command, actor) {
      // planLock validates + returns the would-be lock without writing (preview).
      const denied = requireTrustedHuman(actor);
      if (denied) return denied;
      const payload = parsePlanPayload(command);
      if (!payload) return failure('INVALID_INPUT');
      const draft: HumanLock = {
        id: mintLockId(payload),
        subjectType: payload.subjectType,
        subjectId: payload.subjectId,
        revisionId: payload.revisionId,
        contentSha256: payload.contentSha256,
        lockedBy: actor.id,
        lockedAt: utcNow(),
      };
      const parsed = HumanLockSchema.safeParse(draft);
      if (!parsed.success) return failure('INVALID_INPUT');
      return { ok: true, value: parsed.data };
    },

    async commitLock(command, actor) {
      return commitAsHuman(command, actor);
    },

    async overwriteLock(command, actor) {
      // Explicit overwrite still requires trusted human — agents fail closed.
      return commitAsHuman(command, actor);
    },

    async unlock(command, actor) {
      const denied = requireTrustedHuman(actor);
      if (denied) return denied as HumanLockResult<{ cleared: true }>;

      if (typeof command !== 'object' || command === null || Array.isArray(command)) {
        return failure('INVALID_INPUT');
      }
      const rec = command as UnlockCommand;
      if (!isSubjectType(rec.subjectType) || !isIdentifier(rec.subjectId)) {
        return failure('INVALID_INPUT');
      }

      const head = await store.getHead({
        subjectType: rec.subjectType,
        subjectId: rec.subjectId,
      });
      if (!head) return failure('LOCK_REQUIRED');

      await store.clearHead({
        subjectType: rec.subjectType,
        subjectId: rec.subjectId,
      });
      return { ok: true, value: { cleared: true } };
    },

    async assertLocked(command) {
      if (typeof command !== 'object' || command === null || Array.isArray(command)) {
        return failure('INVALID_INPUT');
      }
      const rec = command as AssertLockCommand;
      if (!isSubjectType(rec.subjectType) || !isIdentifier(rec.subjectId)) {
        return failure('INVALID_INPUT');
      }
      if (!isIdentifier(rec.revisionId) || !isSha256(rec.contentSha256)) {
        return failure('INVALID_INPUT');
      }

      const head = await store.getHead({
        subjectType: rec.subjectType,
        subjectId: rec.subjectId,
      });
      if (!head) return failure('LOCK_REQUIRED');
      if (head.revisionId !== rec.revisionId) return failure('LOCK_REVISION_MISMATCH');
      if (head.contentSha256 !== rec.contentSha256) return failure('LOCK_HASH_MISMATCH');
      return { ok: true, value: head };
    },

    async proposeRevision(command, actor) {
      // Agents may propose; humans may too. Never writes lock.
      if (!isIdentifier(actor.id)) {
        return { ok: false, code: 'INVALID_INPUT' };
      }
      if (typeof command !== 'object' || command === null || Array.isArray(command)) {
        return { ok: false, code: 'INVALID_INPUT' };
      }
      const rec = command as ProposeRevisionCommand;
      if (!isSubjectType(rec.subjectType) || !isIdentifier(rec.subjectId)) {
        return { ok: false, code: 'INVALID_INPUT' };
      }
      if (!isIdentifier(rec.proposedRevisionId) || !isSha256(rec.proposedContentSha256)) {
        return { ok: false, code: 'INVALID_INPUT' };
      }
      return {
        ok: true,
        value: {
          subjectType: rec.subjectType,
          subjectId: rec.subjectId,
          proposedRevisionId: rec.proposedRevisionId,
          proposedContentSha256: rec.proposedContentSha256,
          ...(rec.rationale !== undefined ? { rationale: rec.rationale } : {}),
          wroteLock: false,
        },
      };
    },
  };
}
