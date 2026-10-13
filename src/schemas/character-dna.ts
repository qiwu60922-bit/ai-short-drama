/**
 * CharacterDNA — appearanceRevisionId ≠ VisualBible (project style).
 * Voice is embedded; optional visualBibleRevisionId is project style only.
 */
import { z } from 'zod';
import {
  identifierSchema,
  sha256Schema,
  utcIsoSchema,
  revisionNoSchema,
  unitIntervalSchema,
  ReferenceBindingSchema,
} from './_primitives';

export const CharacterDNASchema = z
  .object({
    id: identifierSchema,
    projectId: identifierSchema,
    characterId: identifierSchema,
    revisionNo: revisionNoSchema,
    predecessorRevisionId: identifierSchema.nullable(),
    appearanceRevisionId: identifierSchema,
    appearanceContentSha256: sha256Schema,
    wardrobeKeys: z.array(identifierSchema),
    propKeys: z.array(identifierSchema),
    propBibleRevisionIds: z.array(identifierSchema),
    voiceRevisionId: identifierSchema,
    voiceKey: identifierSchema,
    voiceContentSha256: sha256Schema,
    visualBibleRevisionId: identifierSchema.optional(),
    visualBibleContentSha256: sha256Schema.optional(),
    identityPolicyId: identifierSchema,
    identityPolicyVersion: identifierSchema,
    minIdentityScore: unitIntervalSchema,
    poseTolerance: unitIntervalSchema,
    referenceBindings: z.array(ReferenceBindingSchema).min(1),
    lockedBy: identifierSchema.optional(),
    lockedAt: utcIsoSchema.nullable().optional(),
    contentSha256: sha256Schema,
    createdAt: utcIsoSchema,
  })
  .superRefine((dna, ctx) => {
    const hasVb = dna.visualBibleRevisionId !== undefined;
    const hasVbSha = dna.visualBibleContentSha256 !== undefined;
    if (hasVb !== hasVbSha) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'visualBibleRevisionId and visualBibleContentSha256 must both be set or both omitted',
      });
    }
  });

export type CharacterDNA = z.infer<typeof CharacterDNASchema>;
