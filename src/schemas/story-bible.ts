/**
 * StoryBible — V11 permanent object #2 (not StoryWorld).
 */
import { z } from 'zod';
import {
  identifierSchema,
  sha256Schema,
  utcIsoSchema,
  revisionNoSchema,
} from './_primitives';

export const StoryBibleSchema = z.object({
  id: identifierSchema,
  projectId: identifierSchema,
  revisionNo: revisionNoSchema,
  predecessorRevisionId: identifierSchema.nullable(),
  contentSha256: sha256Schema,
  factIds: z.array(identifierSchema),
  createdAt: utcIsoSchema,
});

export type StoryBible = z.infer<typeof StoryBibleSchema>;
