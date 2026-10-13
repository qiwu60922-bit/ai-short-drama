/**
 * Wave6 generation types — mock/local Take pipeline (memory only).
 * No paid providers; no Prisma dual-write in this wave.
 */
import type { Take, TakeManifest, TakeSelection, TakeSelectionHead } from '@/schemas/take-manifest';
import type { ShotSpec } from '@/schemas/shot-spec';

export const MOCK_GENERATOR_KEYS = ['local.mock.image', 'local.mock.video'] as const;
export type MockGeneratorKey = (typeof MOCK_GENERATOR_KEYS)[number];

export const TAKE_ATTEMPT_STATUSES = ['PENDING', 'SUCCEEDED', 'FAILED', 'UNKNOWN'] as const;
export type TakeAttemptStatus = (typeof TAKE_ATTEMPT_STATUSES)[number];

export type GenerationFailureCode =
  | 'INVALID_SHOT_SPEC'
  | 'INVALID_COUNT'
  | 'PREFLIGHT_REQUIRED'
  | 'PAID_TIER_REFUSED'
  | 'UNKNOWN_GENERATOR'
  | 'INVALID_INPUT'
  | 'MANIFEST_NOT_FOUND'
  | 'TAKE_NOT_FOUND'
  | 'CAS_CONFLICT'
  | 'UNKNOWN_NO_AUTO_RETRY'
  | 'ATTEMPT_INVALID_TRANSITION'
  | 'ATTEMPT_NOT_FOUND';

export interface CreateTakeManifestCommand {
  readonly id: string;
  readonly projectId: string;
  readonly subjectKind: string;
  readonly subjectId: string;
  readonly purpose: string;
  readonly policyId: string;
  readonly policyVersion: string;
  readonly createdAt: string;
}

export interface StartMockTakesInput {
  readonly shotSpec: ShotSpec | unknown;
  readonly takeManifestId: string;
  readonly count: number;
  readonly generatorKey: string;
  /**
   * Fail-closed token: caller must have completed generate preflight
   * (continuity / previs) and set this to true. Missing/false ⇒ PREFLIGHT_REQUIRED.
   */
  readonly preflightOk: boolean;
  readonly seed?: string;
  readonly createdAt?: string;
}

export interface TakeAttemptRecord {
  readonly attemptId: string;
  readonly takeManifestId: string;
  readonly providerRequestKey: string;
  readonly generatorKey: string;
  readonly outputSlot: number;
  readonly status: TakeAttemptStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly takeId?: string;
  readonly contentSha256?: string;
  readonly error?: string;
}

export interface TakeAttemptEvent {
  readonly attemptId: string;
  readonly providerRequestKey: string;
  readonly status: TakeAttemptStatus;
  readonly take?: Take;
  readonly outputSlot?: number;
  readonly contentSha256?: string;
  readonly error?: string;
  readonly code?: GenerationFailureCode;
}

export interface SelectTakeCommand {
  readonly takeManifestId: string;
  readonly takeId: string;
  readonly actorId: string;
  readonly commandKey: string;
  readonly expectedVersion: number;
  readonly selectionId: string;
  readonly createdAt: string;
}

export type GenerationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly code: GenerationFailureCode; readonly message?: string };

export type { Take, TakeManifest, TakeSelection, TakeSelectionHead, ShotSpec };
