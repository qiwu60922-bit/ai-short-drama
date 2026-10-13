/**
 * ProjectManifest — V11 permanent object #1 (Wave2 min fields).
 */
import { z } from 'zod';
import {
  identifierSchema,
  sha256Schema,
  utcIsoSchema,
  ProfileSchema,
} from './_primitives';

export const ProjectManifestSchema = z.object({
  id: identifierSchema,
  projectId: identifierSchema,
  schemaVersion: identifierSchema,
  profile: ProfileSchema,
  aspectRatio: z.string().min(1).max(32),
  lockPolicyVersion: identifierSchema,
  budgetEnvelopeRef: identifierSchema.optional(),
  contentSha256: sha256Schema,
  createdAt: utcIsoSchema,
});

export type ProjectManifest = z.infer<typeof ProjectManifestSchema>;
