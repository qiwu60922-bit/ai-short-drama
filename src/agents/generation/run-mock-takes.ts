/**
 * Orchestrate mock Takes: preflightOk gate → N attempts → append Takes (memory).
 * Caller must run generate preflight first and pass preflightOk: true.
 */
import { createHash } from 'node:crypto';
import { canDispatchProviderRequestKey, createTakeAttempt, reduceTakeAttempt } from './attempt-service';
import { generateTakes } from './mock-take-generator';
import type { TakeStore } from './take-store';
import type {
  CreateTakeManifestCommand,
  GenerationResult,
  StartMockTakesInput,
  TakeAttemptEvent,
  TakeAttemptRecord,
  TakeManifest,
} from './types';

export interface RunMockTakesDeps {
  readonly store: TakeStore;
  /** Optional injectable clock for tests. */
  readonly now?: () => string;
}

export interface RunMockTakesResult {
  readonly events: readonly TakeAttemptEvent[];
  readonly attempts: readonly TakeAttemptRecord[];
}

function defaultNow(): string {
  return new Date().toISOString();
}

function providerRequestKey(manifestId: string, generatorKey: string, slot: number, seed: string): string {
  const digest = createHash('sha256')
    .update([manifestId, generatorKey, String(slot), seed].join('|'), 'utf8')
    .digest('hex')
    .slice(0, 20);
  return `prk-${digest}`;
}

export async function createTakeManifest(
  cmd: CreateTakeManifestCommand,
  store: TakeStore,
): Promise<GenerationResult<TakeManifest>> {
  return store.createManifest(cmd);
}

/**
 * Start mock takes for a ShotSpec. Fail-closed without preflightOk === true.
 * Default count should be ≥2 for S/A policy; enforced by caller / tests.
 */
export async function startMockTakes(
  input: StartMockTakesInput,
  deps: RunMockTakesDeps,
  priorAttempts: readonly TakeAttemptRecord[] = [],
): Promise<GenerationResult<RunMockTakesResult>> {
  if (input.preflightOk !== true) {
    return { ok: false, code: 'PREFLIGHT_REQUIRED', message: 'preflightOk must be true' };
  }

  const manifest = await deps.store.getManifest(input.takeManifestId);
  if (!manifest) {
    return { ok: false, code: 'MANIFEST_NOT_FOUND' };
  }

  const existing = await deps.store.listTakes(input.takeManifestId);
  const ordinalStart = existing.length;
  const seed = input.seed ?? 'mock-seed-0';
  const createdAt = input.createdAt ?? (deps.now ?? defaultNow)();

  const generated = generateTakes({
    shotSpec: input.shotSpec,
    count: input.count,
    seed,
    takeManifestId: input.takeManifestId,
    generatorKey: input.generatorKey,
    createdAt,
    ordinalStart,
  });
  if (!generated.ok) {
    return generated;
  }

  const events: TakeAttemptEvent[] = [];
  const attempts: TakeAttemptRecord[] = [];
  const knownAttempts: TakeAttemptRecord[] = [...priorAttempts];

  for (let i = 0; i < generated.value.takes.length; i += 1) {
    const take = generated.value.takes[i]!;
    const contentSha256 = generated.value.contentSha256s[i]!;
    const prk = providerRequestKey(input.takeManifestId, input.generatorKey, take.ordinal, seed);

    if (!canDispatchProviderRequestKey(prk, knownAttempts)) {
      return {
        ok: false,
        code: 'UNKNOWN_NO_AUTO_RETRY',
        message: `cannot dispatch providerRequestKey=${prk}`,
      };
    }

    const attemptId = `atm-${createHash('sha256').update(`${prk}|attempt`, 'utf8').digest('hex').slice(0, 16)}`;
    const created = createTakeAttempt({
      attemptId,
      takeManifestId: input.takeManifestId,
      providerRequestKey: prk,
      generatorKey: input.generatorKey,
      outputSlot: take.ordinal,
      createdAt,
    });
    if (!created.ok) return created;

    events.push({
      attemptId,
      providerRequestKey: prk,
      status: 'PENDING',
      outputSlot: take.ordinal,
    });

    const appended = await deps.store.appendTake(take);
    if (!appended.ok) return appended;

    const succeeded = reduceTakeAttempt(created.value, {
      type: 'MARK_SUCCEEDED',
      at: createdAt,
      takeId: take.id,
      contentSha256,
    });
    if (!succeeded.ok) return succeeded;

    knownAttempts.push(succeeded.value);
    attempts.push(succeeded.value);
    events.push({
      attemptId,
      providerRequestKey: prk,
      status: 'SUCCEEDED',
      take: appended.value,
      outputSlot: take.ordinal,
      contentSha256,
    });
  }

  return { ok: true, value: { events, attempts } };
}

/**
 * Mark an attempt UNKNOWN (e.g. ambiguous mock outcome). Same providerRequestKey
 * must not be auto-retried afterward — use canAutoRetry / canDispatchProviderRequestKey.
 */
export function markAttemptUnknown(
  attempt: TakeAttemptRecord,
  at: string,
  error?: string,
): GenerationResult<TakeAttemptRecord> {
  return reduceTakeAttempt(attempt, { type: 'MARK_UNKNOWN', at, error });
}
