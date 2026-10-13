/**
 * SceneBible — V11 permanent object #5 (not LocationBible). locationId field kept.
 */
import { z } from 'zod';
import {
  identifierSchema,
  sha256Schema,
  utcIsoSchema,
  revisionNoSchema,
} from './_primitives';

export const SceneBibleSchema = z.object({
  id: identifierSchema,
  projectId: identifierSchema,
  locationId: identifierSchema,
  revisionNo: revisionNoSchema,
  predecessorRevisionId: identifierSchema.nullable(),
  artifactRevisionId: identifierSchema.optional(),
  contentSha256: sha256Schema,
  createdAt: utcIsoSchema,
});

export type SceneBible = z.infer<typeof SceneBibleSchema>;
