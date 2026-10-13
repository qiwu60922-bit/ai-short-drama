/**
 * In-memory HumanLock store for unit tests (Wave3).
 */
import type { HumanLock } from '@/schemas/human-lock';
import type { HumanLockHeadKey, HumanLockStore } from './human-lock-store';

function headKey(key: HumanLockHeadKey): string {
  return `${key.subjectType}::${key.subjectId}`;
}

export class MemoryHumanLockStore implements HumanLockStore {
  private readonly heads = new Map<string, HumanLock>();
  private readonly history: HumanLock[] = [];

  async getHead(key: HumanLockHeadKey): Promise<HumanLock | null> {
    return this.heads.get(headKey(key)) ?? null;
  }

  async appendLock(lock: HumanLock): Promise<HumanLock> {
    const frozen = Object.freeze({ ...lock });
    this.history.push(frozen);
    this.heads.set(headKey({ subjectType: lock.subjectType as HumanLockHeadKey['subjectType'], subjectId: lock.subjectId }), frozen);
    return frozen;
  }

  async clearHead(key: HumanLockHeadKey): Promise<void> {
    this.heads.delete(headKey(key));
  }

  /** Test helper */
  listHistory(): readonly HumanLock[] {
    return this.history;
  }
}
