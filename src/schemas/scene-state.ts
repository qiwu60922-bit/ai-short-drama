/**
 * SceneState — Continuity runtime snapshot (not a top-level permanent object).
 * Aligns Continuity v2 / V6 SceneStateSnapshot fields + contentSha256.
 * Prisma: V11SceneStateSnapshot (stateJson); zod expands fail-closed fields.
 * Forbidden type names: StoryWorld / LocationBible.
 */
import { z } from 'zod';
import {
  identifierSchema,
  sha256Schema,
  utcIsoSchema,
  revisionNoSchema,
} from './_primitives';

export const SceneStateSchema = z.object({
  id: identifierSchema,
  projectId: identifierSchema,
  shotId: identifierSchema,
  version: revisionNoSchema,
  camera: z.string().min(1),
  pose: z.string().min(1),
  gaze: z.string().min(1),
  wardrobe: z.string().min(1),
  props: z.string().min(1),
  location: z.string().min(1),
  timeOfDay: z.string().min(1),
  lighting: z.string().min(1),
  emotion: z.string().min(1),
  spatialRelations: z.string().min(1),
  sourceArtifactRevisionId: identifierSchema,
  sourceCandidateSelectionId: identifierSchema,
  transitionReason: z.string().min(1),
  contentSha256: sha256Schema,
  createdAt: utcIsoSchema,
});

export type SceneState = z.infer<typeof SceneStateSchema>;
