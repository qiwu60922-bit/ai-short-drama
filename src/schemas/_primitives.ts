/**
 * V11 Wave2 shared zod primitives (fail-closed).
 * Source: /workspace/v11/wave2/ZOD_MIN_FIELDS.md
 */
import { z } from 'zod';

export const identifierSchema = z
  .string()
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,191}$/, 'invalid identifier');

export const sha256Schema = z
  .string()
  .regex(/^[a-f0-9]{64}$/, 'invalid sha256');

export const utcIsoSchema = z.string().refine((v) => {
  try {
    return new Date(v).toISOString() === v;
  } catch {
    return false;
  }
}, 'must be UTC ISO with ms');

export const revisionNoSchema = z.number().int().min(1);

/** Head version may be 0 before first selection. */
export const headVersionSchema = z.number().int().min(0);

export const unitIntervalSchema = z.number().finite().min(0).max(1);

export const ProfileSchema = z.enum(['DRAFT', 'PRO', 'CINEMA']);
export type Profile = z.infer<typeof ProfileSchema>;

export const GateIdSchema = z.enum([
  'V11_G1',
  'V11_G2',
  'V11_G3',
  'V11_G4',
  'V11_G5',
  'V11_G6',
  'V11_G7',
  'V11_G8',
]);
export type GateId = z.infer<typeof GateIdSchema>;

export const GateStatusSchema = z.enum(['PASS', 'NC', 'ERROR', 'OVERRIDE']);
export type GateStatus = z.infer<typeof GateStatusSchema>;

export const SubjectTypeSchema = z.enum(['shot', 'take', 'episode', 'script']);
export type SubjectType = z.infer<typeof SubjectTypeSchema>;

export const SubjectRefSchema = z.object({
  type: SubjectTypeSchema,
  id: identifierSchema,
});

export const RepairLayerSchema = z.enum([
  'canon_lock',
  'technical',
  'identity',
  'costume',
  'prop',
  'location',
  'continuity_state',
  'voice',
  'dialogue',
  'lipsync',
  'timeline_audio',
  'caption',
]);
export type RepairLayer = z.infer<typeof RepairLayerSchema>;

export const TimeWindowSchema = z
  .object({
    startMs: z.number().int().nonnegative(),
    endMs: z.number().int().positive(),
  })
  .refine((w) => w.endMs > w.startMs, { message: 'endMs must be > startMs' });

export const ReferenceBindingSchema = z.object({
  artifactRevisionId: identifierSchema,
  contentSha256: sha256Schema,
});
