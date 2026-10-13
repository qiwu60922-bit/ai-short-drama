/**
 * Take store port — memory or future Prisma adapter.
 */
import type {
  CreateTakeManifestCommand,
  GenerationResult,
  SelectTakeCommand,
} from './types';
import type { Take, TakeManifest, TakeSelection, TakeSelectionHead } from '@/schemas/take-manifest';

export interface TakeStore {
  createManifest(cmd: CreateTakeManifestCommand): Promise<GenerationResult<TakeManifest>>;
  getManifest(takeManifestId: string): Promise<TakeManifest | null>;
  appendTake(take: Take): Promise<GenerationResult<Take>>;
  listTakes(takeManifestId: string): Promise<readonly Take[]>;
  getHead(takeManifestId: string): Promise<TakeSelectionHead | null>;
  selectTake(cmd: SelectTakeCommand): Promise<
    GenerationResult<{ selection: TakeSelection; head: TakeSelectionHead }>
  >;
}
