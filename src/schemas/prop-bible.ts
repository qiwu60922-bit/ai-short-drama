/**
 * PropBible — V11 permanent object #6 (first-class).
 */
import { z } from 'zod';
import {
  identifierSchema,
  sha256Schema,
  utcIsoSchema,
  revisionNoSchema,
} from './_primitives';

export const PropBibleSchema = z.object({
  id: identifierSchema,
  projectId: identifierSchema,
  propId: identifierSchema,
  revisionNo: revisionNoSchema,
  predecessorRevisionId: identifierSchema.nullable(),
  stateKey: identifierSchema,
  artifactRevisionId: identifierSchema.optional(),
  contentSha256: sha256Schema,
  createdAt: utcIsoSchema,
});

export type PropBible = z.infer<typeof PropBibleSchema>;
