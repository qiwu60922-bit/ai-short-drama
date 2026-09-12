/**
 * Wave12-B · I2V RefBinding (IR-20…22).
 * Appearance ≠ VisualBible. Do not use visualBibleRevisionId as appearance.
 * Unlock U1–U9 still ≠ G3 / ≠ publish.
 */
import { z } from 'zod';

export const RefOperatorKindSchema = z.enum([
  'hero_portrait',
  'dna_locked_export',
]);
export type RefOperatorKind = z.infer<typeof RefOperatorKindSchema>;

export const ApprovedTemporarySchema = z.object({
  actor: z.string().min(1),
  reason: z.string().min(1),
});
export type ApprovedTemporary = z.infer<typeof ApprovedTemporarySchema>;

export const RefBindingSchema = z
  .object({
    characterId: z.string().min(1),
    appearanceRevisionId: z.string().min(1),
    /** Actual first_frame / uploaded ref content sha256 (64 hex). */
    refContentSha256: z.string().regex(/^[a-f0-9]{64}$/i),
    /** Locked appearance artifact sha when known (IR-21 match target). */
    appearanceContentSha256: z.string().regex(/^[a-f0-9]{64}$/i).optional(),
    artifactRevisionId: z.string().min(1).optional(),
    operatorKind: RefOperatorKindSchema,
    approvedTemporary: ApprovedTemporarySchema.optional(),
  })
  .strict();

export type RefBinding = z.infer<typeof RefBindingSchema>;

export const RefDnaGateInputSchema = z.object({
  bindings: z.array(RefBindingSchema).min(1),
  /** When true, only lead/first binding is required (IR-22). */
  leadOnly: z.boolean().optional(),
  /** Visible character ids for the shot (IR-22 coverage). */
  visibleCharacterIds: z.array(z.string().min(1)).optional(),
});
export type RefDnaGateInput = z.infer<typeof RefDnaGateInputSchema>;
