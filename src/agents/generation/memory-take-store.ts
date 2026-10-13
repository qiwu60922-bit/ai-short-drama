/**
 * In-memory TakeManifest / Take / SelectionHead CAS store (Wave6).
 * No Prisma; no dual-write.
 */
import {
  TakeManifestSchema,
  TakeSchema,
  TakeSelectionSchema,
  TakeSelectionHeadSchema,
  type Take,
  type TakeManifest,
  type TakeSelection,
  type TakeSelectionHead,
} from '@/schemas/take-manifest';
import type { TakeStore } from './take-store';
import type {
  CreateTakeManifestCommand,
  GenerationResult,
  SelectTakeCommand,
} from './types';

export class MemoryTakeStore implements TakeStore {
  private readonly manifests = new Map<string, TakeManifest>();
  private readonly takesByManifest = new Map<string, Take[]>();
  private readonly heads = new Map<string, TakeSelectionHead>();
  private readonly selections: TakeSelection[] = [];

  async createManifest(cmd: CreateTakeManifestCommand): Promise<GenerationResult<TakeManifest>> {
    const parsed = TakeManifestSchema.safeParse(cmd);
    if (!parsed.success) {
      return { ok: false, code: 'INVALID_INPUT', message: parsed.error.message };
    }
    if (this.manifests.has(parsed.data.id)) {
      return { ok: false, code: 'INVALID_INPUT', message: 'manifest already exists' };
    }
    const frozen = Object.freeze({ ...parsed.data });
    this.manifests.set(frozen.id, frozen);
    this.takesByManifest.set(frozen.id, []);
    this.heads.set(
      frozen.id,
      Object.freeze({
        takeManifestId: frozen.id,
        version: 0,
        currentTakeId: null,
      }),
    );
    return { ok: true, value: frozen };
  }

  async getManifest(takeManifestId: string): Promise<TakeManifest | null> {
    return this.manifests.get(takeManifestId) ?? null;
  }

  async appendTake(take: Take): Promise<GenerationResult<Take>> {
    const parsed = TakeSchema.safeParse(take);
    if (!parsed.success) {
      return { ok: false, code: 'INVALID_INPUT', message: parsed.error.message };
    }
    if (!this.manifests.has(parsed.data.takeManifestId)) {
      return { ok: false, code: 'MANIFEST_NOT_FOUND' };
    }
    const list = this.takesByManifest.get(parsed.data.takeManifestId) ?? [];
    if (list.some((t) => t.id === parsed.data.id)) {
      return { ok: false, code: 'INVALID_INPUT', message: 'take id already exists' };
    }
    const frozen = Object.freeze({ ...parsed.data });
    list.push(frozen);
    this.takesByManifest.set(parsed.data.takeManifestId, list);
    return { ok: true, value: frozen };
  }

  async listTakes(takeManifestId: string): Promise<readonly Take[]> {
    return this.takesByManifest.get(takeManifestId) ?? [];
  }

  async getHead(takeManifestId: string): Promise<TakeSelectionHead | null> {
    return this.heads.get(takeManifestId) ?? null;
  }

  async selectTake(
    cmd: SelectTakeCommand,
  ): Promise<GenerationResult<{ selection: TakeSelection; head: TakeSelectionHead }>> {
    const manifest = this.manifests.get(cmd.takeManifestId);
    if (!manifest) return { ok: false, code: 'MANIFEST_NOT_FOUND' };

    const head = this.heads.get(cmd.takeManifestId);
    if (!head) return { ok: false, code: 'MANIFEST_NOT_FOUND' };

    if (head.version !== cmd.expectedVersion) {
      return { ok: false, code: 'CAS_CONFLICT', message: `expected version ${cmd.expectedVersion}, have ${head.version}` };
    }

    const takes = this.takesByManifest.get(cmd.takeManifestId) ?? [];
    if (!takes.some((t) => t.id === cmd.takeId)) {
      return { ok: false, code: 'TAKE_NOT_FOUND' };
    }

    const selectionParsed = TakeSelectionSchema.safeParse({
      id: cmd.selectionId,
      takeManifestId: cmd.takeManifestId,
      takeId: cmd.takeId,
      commandKey: cmd.commandKey,
      actorId: cmd.actorId,
      createdAt: cmd.createdAt,
    });
    if (!selectionParsed.success) {
      return { ok: false, code: 'INVALID_INPUT', message: selectionParsed.error.message };
    }

    const nextHeadParsed = TakeSelectionHeadSchema.safeParse({
      takeManifestId: cmd.takeManifestId,
      version: head.version + 1,
      currentTakeId: cmd.takeId,
    });
    if (!nextHeadParsed.success) {
      return { ok: false, code: 'INVALID_INPUT', message: nextHeadParsed.error.message };
    }

    const selection = Object.freeze({ ...selectionParsed.data });
    const nextHead = Object.freeze({ ...nextHeadParsed.data });
    this.selections.push(selection);
    this.heads.set(cmd.takeManifestId, nextHead);
    return { ok: true, value: { selection, head: nextHead } };
  }

  /** Test helper — history of selection events. */
  listSelections(): readonly TakeSelection[] {
    return this.selections;
  }
}
