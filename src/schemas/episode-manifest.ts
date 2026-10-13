/**
 * EpisodeManifest — V11 permanent object #7.
 */
import { z } from 'zod';
import {
  identifierSchema,
  sha256Schema,
  utcIsoSchema,
  revisionNoSchema,
} from './_primitives';

export const EpisodeManifestSchema = z.object({
  id: identifierSchema,
  projectId: identifierSchema,
  episodeKey: identifierSchema,
  revisionNo: revisionNoSchema,
  shotSpecIds: z.array(identifierSchema),
  durationBudgetSec: z.number().positive().optional(),
  lockedStoryBibleRevisionId: identifierSchema,
  lockedVisualBibleRevisionId: identifierSchema,
  lockedCharacterDnaRevisionIds: z.array(identifierSchema),
  contentSha256: sha256Schema,
  createdAt: utcIsoSchema,
});

export type EpisodeManifest = z.infer<typeof EpisodeManifestSchema>;
