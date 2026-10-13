/**
 * HumanLock store port — Prisma adapter later; Wave3 uses memory store.
 */
import type { HumanLock } from '@/schemas/human-lock';
import type { HumanLockSubjectType } from './types';

export interface HumanLockHeadKey {
  readonly subjectType: HumanLockSubjectType;
  readonly subjectId: string;
}

export interface HumanLockStore {
  getHead(key: HumanLockHeadKey): Promise<HumanLock | null>;
  /** Append a new lock row and advance the head for (subjectType, subjectId). */
  appendLock(lock: HumanLock): Promise<HumanLock>;
  /** Clear head (unlock). History may remain in append-only impls. */
  clearHead(key: HumanLockHeadKey): Promise<void>;
}
