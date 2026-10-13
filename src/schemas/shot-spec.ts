/**
 * ShotSpec — V11 permanent object #8. Prompt is export-only, not stored as SoT.
 */
import { z } from 'zod';
import {
  identifierSchema,
  sha256Schema,
  utcIsoSchema,
  revisionNoSchema,
} from './_primitives';

export const ShotTierSchema = z.enum(['S', 'A', 'B', 'C']);

export const ShotCameraSchema = z.object({
  lensMm: z.number().positive().optional(),
  framing: z.string().min(1).max(64).optional(),
  heightM: z.number().optional(),
  movement: z.string().min(1).max(64).optional(),
});

export const ShotSpecSchema = z.object({
  id: identifierSchema,
  projectId: identifierSchema,
  episodeManifestId: identifierSchema,
  shotKey: identifierSchema,
  revisionNo: revisionNoSchema,
  tier: ShotTierSchema,
  durationSec: z.number().positive(),
  characterIds: z.array(identifierSchema),
  sceneBibleRevisionId: identifierSchema,
  camera: ShotCameraSchema,
  blocking: z.string().min(1).max(4000),
  performanceNotes: z.string().max(4000).optional(),
  dialogueRef: identifierSchema.optional(),
  continuityConstraints: z.array(z.string().min(1).max(500)),
  humanReviewRequired: z.boolean(),
  lockedBy: identifierSchema.optional(),
  lockedAt: utcIsoSchema.nullable().optional(),
  contentSha256: sha256Schema,
  createdAt: utcIsoSchema,
});

export type ShotSpec = z.infer<typeof ShotSpecSchema>;
