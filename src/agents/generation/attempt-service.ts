/**
 * Wave6 Take attempt state machine (memory).
 * Aligns V6 provider-attempt UNKNOWN rule: UNKNOWN ⇒ no auto-retry / no re-dispatch
 * for the same providerRequestKey.
 */
import {
  TAKE_ATTEMPT_STATUSES,
  type GenerationFailureCode,
  type GenerationResult,
  type TakeAttemptRecord,
  type TakeAttemptStatus,
} from './types';

export type AttemptEvent =
  | { readonly type: 'MARK_SUCCEEDED'; readonly at: string; readonly takeId: string; readonly contentSha256: string }
  | { readonly type: 'MARK_FAILED'; readonly at: string; readonly error: string }
  | { readonly type: 'MARK_UNKNOWN'; readonly at: string; readonly error?: string };

const identifierPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,191}$/;
const sha256Pattern = /^[a-f0-9]{64}$/;

function isIdentifier(value: unknown): value is string {
  return typeof value === 'string' && identifierPattern.test(value);
}

function isSha256(value: unknown): value is string {
  return typeof value === 'string' && sha256Pattern.test(value);
}

function isUtcTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
    return false;
  }
  try {
    return new Date(value).toISOString() === value;
  } catch {
    return false;
  }
}

function freezeAttempt(attempt: TakeAttemptRecord): TakeAttemptRecord {
  return Object.freeze({ ...attempt });
}

export interface CreateTakeAttemptCommand {
  readonly attemptId: string;
  readonly takeManifestId: string;
  readonly providerRequestKey: string;
  readonly generatorKey: string;
  readonly outputSlot: number;
  readonly createdAt: string;
}

export function createTakeAttempt(cmd: CreateTakeAttemptCommand): GenerationResult<TakeAttemptRecord> {
  if (
    !isIdentifier(cmd.attemptId)
    || !isIdentifier(cmd.takeManifestId)
    || !isIdentifier(cmd.providerRequestKey)
    || !isIdentifier(cmd.generatorKey)
    || !Number.isInteger(cmd.outputSlot)
    || cmd.outputSlot < 0
    || !isUtcTimestamp(cmd.createdAt)
  ) {
    return { ok: false, code: 'INVALID_INPUT' };
  }
  return {
    ok: true,
    value: freezeAttempt({
      attemptId: cmd.attemptId,
      takeManifestId: cmd.takeManifestId,
      providerRequestKey: cmd.providerRequestKey,
      generatorKey: cmd.generatorKey,
      outputSlot: cmd.outputSlot,
      status: 'PENDING',
      createdAt: cmd.createdAt,
      updatedAt: cmd.createdAt,
    }),
  };
}

export function reduceTakeAttempt(
  attempt: TakeAttemptRecord,
  event: AttemptEvent,
): GenerationResult<TakeAttemptRecord> {
  if (!(TAKE_ATTEMPT_STATUSES as readonly string[]).includes(attempt.status)) {
    return { ok: false, code: 'INVALID_INPUT' };
  }
  // UNKNOWN is sticky: no further automatic transitions (incl. retry dispatch).
  if (attempt.status === 'UNKNOWN') {
    return { ok: false, code: 'UNKNOWN_NO_AUTO_RETRY' };
  }
  if (attempt.status !== 'PENDING') {
    return { ok: false, code: 'ATTEMPT_INVALID_TRANSITION' };
  }

  switch (event.type) {
    case 'MARK_SUCCEEDED': {
      if (!isUtcTimestamp(event.at) || !isIdentifier(event.takeId) || !isSha256(event.contentSha256)) {
        return { ok: false, code: 'INVALID_INPUT' };
      }
      return {
        ok: true,
        value: freezeAttempt({
          ...attempt,
          status: 'SUCCEEDED',
          updatedAt: event.at,
          takeId: event.takeId,
          contentSha256: event.contentSha256,
        }),
      };
    }
    case 'MARK_FAILED': {
      if (!isUtcTimestamp(event.at) || typeof event.error !== 'string' || event.error.length < 1) {
        return { ok: false, code: 'INVALID_INPUT' };
      }
      return {
        ok: true,
        value: freezeAttempt({
          ...attempt,
          status: 'FAILED',
          updatedAt: event.at,
          error: event.error,
        }),
      };
    }
    case 'MARK_UNKNOWN': {
      if (!isUtcTimestamp(event.at)) {
        return { ok: false, code: 'INVALID_INPUT' };
      }
      return {
        ok: true,
        value: freezeAttempt({
          ...attempt,
          status: 'UNKNOWN',
          updatedAt: event.at,
          ...(event.error === undefined ? {} : { error: event.error }),
        }),
      };
    }
    default:
      return { ok: false, code: 'INVALID_INPUT' };
  }
}

/**
 * Auto-retry may only be planned after FAILED (terminal, known).
 * UNKNOWN retains the providerRequestKey slot — never auto-retry.
 */
export function canAutoRetry(attempt: Pick<TakeAttemptRecord, 'status'>): boolean {
  if (attempt.status === 'UNKNOWN') return false;
  if (attempt.status === 'PENDING' || attempt.status === 'SUCCEEDED') return false;
  return attempt.status === 'FAILED';
}

/**
 * Refuse a new dispatch for providerRequestKey if any attempt is UNKNOWN or still PENDING.
 */
export function canDispatchProviderRequestKey(
  providerRequestKey: string,
  attempts: readonly Pick<TakeAttemptRecord, 'providerRequestKey' | 'status'>[],
): boolean {
  for (const a of attempts) {
    if (a.providerRequestKey !== providerRequestKey) continue;
    if (a.status === 'UNKNOWN' || a.status === 'PENDING') return false;
  }
  return true;
}

export type { GenerationFailureCode, TakeAttemptStatus };
