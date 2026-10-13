/**
 * TakeManifest + Take + Selection + SelectionHead — V11 permanent object #9.
 * TakeSelection aligns Prisma V11TakeSelection (+ commandKey/actorId min fields).
 */
import { z } from 'zod';
import {
  identifierSchema,
  utcIsoSchema,
  headVersionSchema,
} from './_primitives';

export const TakeManifestSchema = z.object({
  id: identifierSchema,
  projectId: identifierSchema,
  subjectKind: identifierSchema,
  subjectId: identifierSchema,
  purpose: identifierSchema,
  policyId: identifierSchema,
  policyVersion: identifierSchema,
  createdAt: utcIsoSchema,
});

export const TakeSchema = z.object({
  id: identifierSchema,
  takeManifestId: identifierSchema,
  ordinal: z.number().int().min(0),
  artifactRevisionId: identifierSchema,
  createdAt: utcIsoSchema,
});

/** Selection event row — aligns V11TakeSelection; commandKey/actorId required (fail-closed). */
export const TakeSelectionSchema = z.object({
  id: identifierSchema,
  takeManifestId: identifierSchema,
  takeId: identifierSchema,
  commandKey: identifierSchema,
  actorId: identifierSchema,
  createdAt: utcIsoSchema,
});

export const TakeSelectionHeadSchema = z.object({
  takeManifestId: identifierSchema,
  version: headVersionSchema,
  currentTakeId: identifierSchema.nullable(),
});

export type TakeManifest = z.infer<typeof TakeManifestSchema>;
export type Take = z.infer<typeof TakeSchema>;
export type TakeSelection = z.infer<typeof TakeSelectionSchema>;
export type TakeSelectionHead = z.infer<typeof TakeSelectionHeadSchema>;
