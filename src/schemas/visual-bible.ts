/**
 * VisualBible — project-level style bible (九类 #3). NOT character appearance.
 */
import { z } from 'zod';
import {
  identifierSchema,
  sha256Schema,
  utcIsoSchema,
  revisionNoSchema,
} from './_primitives';

export const VisualBibleSchema = z.object({
  id: identifierSchema,
  projectId: identifierSchema,
  revisionNo: revisionNoSchema,
  styleKey: identifierSchema,
  lensSet: z.array(identifierSchema),
  colorGradeKey: identifierSchema,
  lightingLogicKey: identifierSchema,
  frameRate: z.number().positive(),
  motionBanKeys: z.array(identifierSchema),
  contentSha256: sha256Schema,
  lockedBy: identifierSchema.optional(),
  lockedAt: utcIsoSchema.nullable().optional(),
  createdAt: utcIsoSchema,
});

export type VisualBible = z.infer<typeof VisualBibleSchema>;
